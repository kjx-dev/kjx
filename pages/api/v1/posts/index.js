import { randomUUID, createHmac } from 'crypto'
import { getPrisma } from '../../../../db/client'

async function ensureTables(prisma){
  try{
    await prisma.$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS posts (\n'+
      '  post_id INTEGER PRIMARY KEY AUTOINCREMENT,\n'+
      '  title TEXT NOT NULL,\n'+
      '  content TEXT NOT NULL,\n'+
      '  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n'+
      '  user_id INTEGER NOT NULL,\n'+
      '  category_id INTEGER NOT NULL,\n'+
      '  price INTEGER NULL,\n'+
      '  location TEXT NULL\n'+
      ')'
    )
    await prisma.$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS post_images (\n'+
      '  image_id INTEGER PRIMARY KEY AUTOINCREMENT,\n'+
      '  post_id INTEGER NOT NULL,\n'+
      '  url TEXT NOT NULL,\n'+
      '  mime TEXT NOT NULL,\n'+
      '  size INTEGER NOT NULL,\n'+
      '  order INTEGER DEFAULT 0\n'+
      ')'
    )
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS post_images_post_id_idx ON post_images(post_id)')
    await prisma.$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS categories (\n'+
      '  category_id INTEGER PRIMARY KEY AUTOINCREMENT,\n'+
      '  name TEXT NOT NULL,\n'+
      '  description TEXT NULL,\n'+
      '  icon TEXT NULL\n'+
      ')'
    )
    await prisma.$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS users (\n'+
      '  user_id INTEGER PRIMARY KEY AUTOINCREMENT,\n'+
      '  username TEXT,\n'+
      '  email TEXT UNIQUE,\n'+
      '  password_hash TEXT\n'+
      ')'
    )
    await prisma.$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS post_reports (\n'+
      '  post_id INTEGER PRIMARY KEY,\n'+
      '  bids_count INTEGER DEFAULT 0,\n'+
      '  top_bid_amount INTEGER NULL,\n'+
      '  reviews_count INTEGER DEFAULT 0,\n'+
      '  avg_rating REAL DEFAULT 0,\n'+
      '  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,\n'+
      '  FOREIGN KEY(post_id) REFERENCES posts(post_id) ON DELETE CASCADE\n'+
      ')'
    )
  }catch(_){ }
}

export default async function handler(req, res){
  const reqId = req.headers['x-request-id'] || randomUUID()
  try{
    res.setHeader('Access-Control-Allow-Origin','*')
    res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers','Content-Type, X-Requested-With, X-Request-Id')
    if (req.method === 'OPTIONS'){ res.status(204).end(); return }
    if (req.method === 'GET'){
      const prisma = getPrisma()
      const page = Math.max(1, parseInt(String(req.query.page||'1'),10) || 1)
      const limit = Math.max(1, Math.min(50, parseInt(String(req.query.limit||'10'),10) || 10))
      if (!prisma){ res.setHeader('Content-Type','application/json'); res.status(200).json({ data: [], status:'degraded', message:'Database unavailable', page, limit, total: 0, has_more: false, request_id: reqId }); return }
      try{
        await ensureTables(prisma)
        const totalRows = await prisma.$queryRaw`SELECT COUNT(1) as c FROM posts`
        const total = (Array.isArray(totalRows) && totalRows.length) ? Number(totalRows[0].c||0) : 0
        const skip = (page-1) * limit
        const rows = await prisma.$queryRaw`SELECT post_id, title, content, created_at, user_id, category_id, price, location FROM posts ORDER BY created_at DESC LIMIT ${limit} OFFSET ${skip}`
        const ids = Array.isArray(rows) ? rows.map(r=>Number(r.post_id)).filter(n=>!isNaN(n)) : []
        let images = []
        if (ids.length){
          const inList = ids.join(',')
          const sql = `SELECT image_id, post_id, url, mime, size, "order" FROM post_images WHERE post_id IN (${inList})`
          images = await prisma.$queryRawUnsafe(sql)
        }
        const byPost = {}
        for (const im of images){ const k = im.post_id; if (!byPost[k]) byPost[k] = []; byPost[k].push(im) }
        const out = (rows||[]).map(r=>({ ...r, images: (byPost[r.post_id]||[]) }))
        const hasMore = (skip + out.length) < total
        res.setHeader('Content-Type','application/json')
        res.status(200).json({ data: out, page, limit, total, has_more: hasMore, request_id: reqId })
        return
      }catch(e){ res.setHeader('Content-Type','application/json'); res.status(500).json({ status:'error', message:String(e&&e.message||'Failed to load posts'), data:null, page, limit, request_id:reqId }); return }
    }
    if (req.method === 'POST'){
      const prisma = getPrisma()
      if (!prisma){ res.status(503).json({ status:'error', message:'Database unavailable', data:null, request_id:reqId }); return }
      await ensureTables(prisma)

      const body = req.body || {}
      const auth = req.headers['authorization'] || ''
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : null

      function verify(tok){
        try{
          const [v, data, sig] = String(tok||'').split('.')
          if (v !== 'v1' || !data || !sig) return null
          const secret = process.env.AUTH_SECRET || 'dev-secret'
          const check = createHmac('sha256', secret).update(data).digest('hex')
          if (check !== sig) return null
          const payload = JSON.parse(Buffer.from(data,'base64url').toString('utf8'))
          if (payload.exp && Date.now() > payload.exp) return null
          return payload
        }catch(_){ return null }
      }

      let userId = body.user_id || null
      const payload = token ? verify(token) : null
      if (payload && payload.sub) userId = payload.sub

      const title = body.title
      const content = body.content || body.description
      const categoryName = body.category || null
      const categoryId = body.category_id || null
      const price = typeof body.price === 'string' ? parseInt(body.price,10) : body.price
      const location = body.location || null
      const images = Array.isArray(body.images) ? body.images : []

      if (!title || !content){ res.status(400).json({ status:'error', message:'Missing title/content', data:null, request_id:reqId }); return }
      try{
        let rowUser = null
        if (userId!=null){
          const uu = await prisma.$queryRaw`SELECT user_id, email FROM users WHERE user_id=${userId} LIMIT 1`
          if (Array.isArray(uu) && uu.length) rowUser = uu[0]
        }
        if (!rowUser && payload && payload.email){
          const byEmail = await prisma.$queryRaw`SELECT user_id, email FROM users WHERE email=${payload.email} LIMIT 1`
          if (Array.isArray(byEmail) && byEmail.length){ rowUser = byEmail[0]; userId = rowUser.user_id }
          else {
            const uname = String(payload.email||'user').split('@')[0]
            await prisma.$executeRaw`INSERT INTO users (username, email, password_hash) VALUES (${uname}, ${payload.email}, ${''})`
            const createdUser = await prisma.$queryRaw`SELECT user_id, email FROM users WHERE email=${payload.email} LIMIT 1`
            if (Array.isArray(createdUser) && createdUser.length){ rowUser = createdUser[0]; userId = rowUser.user_id }
          }
        }
        if (!rowUser){ res.status(401).json({ status:'error', message:'Unauthorized', data:null, request_id:reqId }); return }
      }catch(e){ res.status(500).json({ status:'error', message:'Failed to resolve user', data:null, request_id:reqId }); return }

      let catId = categoryId
      if (!catId && categoryName){
        const rows = await prisma.$queryRaw`SELECT category_id FROM categories WHERE name=${categoryName} LIMIT 1`
        if (Array.isArray(rows) && rows.length){ catId = rows[0].category_id }
        else {
          try{ await prisma.$executeRaw`INSERT INTO categories (name, description, icon) VALUES (${categoryName}, '', 'fa-tags')`; const rows2 = await prisma.$queryRaw`SELECT category_id FROM categories WHERE name=${categoryName} LIMIT 1`; if (Array.isArray(rows2) && rows2.length){ catId = rows2[0].category_id } }catch(_){ }
        }
      }
      if (!catId){ res.status(400).json({ status:'error', message:'Missing category', data:null, request_id:reqId }); return }

      if (images.length < 1){ res.status(400).json({ status:'error', message:'At least one image required', data:null, request_id:reqId }); return }
      for(let i=0;i<images.length;i++){
        const im = images[i] || {}
        const size = im.size||0
        const mime = String(im.mime||'')
        if (!mime.startsWith('image/')){ res.status(400).json({ status:'error', message:'Invalid image type', field:'images', data:null, request_id:reqId }); return }
        if (size > 10*1024*1024){ res.status(400).json({ status:'error', message:'Image must be <= 10MB', field:'images', data:null, request_id:reqId }); return }
      }

      try{
        await prisma.$executeRaw`INSERT INTO posts (title, content, user_id, category_id, price, location, created_at) VALUES (${title}, ${content}, ${userId}, ${catId}, ${price || null}, ${location || null}, CURRENT_TIMESTAMP)`
        const createdRows = await prisma.$queryRaw`SELECT post_id, title, content, created_at, user_id, category_id, price, location FROM posts WHERE user_id=${userId} ORDER BY post_id DESC LIMIT 1`
        const created = Array.isArray(createdRows) && createdRows.length ? createdRows[0] : null
        if (!created){ res.setHeader('Content-Type','application/json'); res.status(500).json({ status:'error', message:'Failed to create post', data:null, request_id:reqId }); return }
        for(let i=0;i<images.length;i++){
          const im = images[i]||{}
          await prisma.$executeRaw`INSERT INTO post_images (post_id, url, mime, size, "order") VALUES (${created.post_id}, ${String(im.url||'')}, ${String(im.mime||'')}, ${Number(im.size||0)}, ${i})`
        }
        const ims = await prisma.$queryRaw`SELECT image_id, post_id, url, mime, size, "order" FROM post_images WHERE post_id=${created.post_id} ORDER BY "order" ASC`
        res.setHeader('Content-Type','application/json')
        res.status(201).json({ data: { ...created, images: ims }, request_id: reqId })
        return
      }catch(e){ res.setHeader('Content-Type','application/json'); res.status(500).json({ status:'error', message: String(e&&e.message||'Failed to create'), data:null, request_id:reqId }); return }
    }
    res.setHeader('Allow',['GET','POST'])
    res.status(405).json({ status:'error', message:'Method Not Allowed', data:null, request_id:reqId })
  }catch(e){ res.setHeader('Content-Type','application/json'); res.status(500).json({ status:'error', message:'Internal Server Error', data:null, request_id:reqId }) }
}
export const config = { api: { bodyParser: { sizeLimit: '50mb' } } }