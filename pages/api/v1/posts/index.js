import { randomUUID, createHmac } from 'crypto'
import { getPrisma } from '../../../../db/client'

// Helper function to convert BigInt values to numbers for JSON serialization
function convertBigIntToNumber(obj) {
  if (obj === null || obj === undefined) return obj
  if (typeof obj === 'bigint') return Number(obj)
  if (Array.isArray(obj)) return obj.map(convertBigIntToNumber)
  if (typeof obj === 'object') {
    const converted = {}
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertBigIntToNumber(value)
    }
    return converted
  }
  return obj
}

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
      '  location TEXT NULL,\n'+
      '  status TEXT DEFAULT \'pending\',\n'+
      '  post_type TEXT DEFAULT \'ad\',\n'+
      '  featured INTEGER DEFAULT 0\n'+
      ')'
    )
    // Add status column if it doesn't exist
    try {
      await prisma.$executeRawUnsafe('ALTER TABLE posts ADD COLUMN status TEXT DEFAULT \'pending\'')
    } catch (_) {
      // Column already exists, ignore
    }
    // Add post_type column if it doesn't exist
    try {
      await prisma.$executeRawUnsafe('ALTER TABLE posts ADD COLUMN post_type TEXT DEFAULT \'ad\'')
      console.log('Added post_type column to posts table')
    } catch (e) {
      // Column already exists, ignore
      if (e.message && !e.message.includes('duplicate column')) {
        console.log('Error adding post_type column (may already exist):', e.message)
      }
    }
    // Add featured column if it doesn't exist
    try {
      await prisma.$executeRawUnsafe('ALTER TABLE posts ADD COLUMN featured INTEGER DEFAULT 0')
      console.log('Added featured column to posts table')
    } catch (e) {
      // Column already exists, ignore
      if (e.message && !e.message.includes('duplicate column')) {
        console.log('Error adding featured column (may already exist):', e.message)
      }
    }
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
        // Check if this is an admin request - show all posts including pending
        const showAll = req.query.showAll === 'true' || req.query.admin === 'true'
        const searchQuery = String(req.query.q || req.query.search || '').trim()
        
        // Build WHERE clause for status filtering
        const statusFilter = showAll ? '' : "WHERE COALESCE(status, 'pending') = 'active'"
        
        // Build search filter
        let searchFilter = ''
        if (searchQuery) {
          const searchEscaped = searchQuery.replace(/'/g, "''") // Escape single quotes for SQL
          const searchCondition = `(title LIKE '%${searchEscaped}%' OR content LIKE '%${searchEscaped}%' OR location LIKE '%${searchEscaped}%')`
          if (statusFilter) {
            searchFilter = ` AND ${searchCondition}`
          } else {
            searchFilter = `WHERE ${searchCondition}`
          }
        }
        
        // Build complete WHERE clause
        const whereClause = statusFilter + searchFilter
        
        // Count total matching posts
        const totalRowsQuery = `SELECT COUNT(1) as c FROM posts ${whereClause}`
        const totalRows = await prisma.$queryRawUnsafe(totalRowsQuery)
        const total = (Array.isArray(totalRows) && totalRows.length) ? Number(totalRows[0].c||0) : 0
        const skip = (page-1) * limit
        
        // Fetch posts with search and status filters
        // Try with featured column first, fallback if column doesn't exist
        let rows = []
        try {
          // Try query with featured column
          const rowsQuery = `SELECT post_id, title, content, created_at, user_id, category_id, price, location, COALESCE(status, ${showAll ? "'pending'" : "'active'"}) as status, COALESCE(post_type, 'ad') as post_type, COALESCE(featured, 0) as featured FROM posts ${whereClause} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${skip}`
          rows = await prisma.$queryRawUnsafe(rowsQuery)
        } catch (e) {
          // If query fails (e.g., featured column doesn't exist), try without it
          console.log('Featured column may not exist, trying query without it:', e.message)
          try {
            const rowsQuery = `SELECT post_id, title, content, created_at, user_id, category_id, price, location, COALESCE(status, ${showAll ? "'pending'" : "'active'"}) as status, COALESCE(post_type, 'ad') as post_type FROM posts ${whereClause} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${skip}`
            rows = await prisma.$queryRawUnsafe(rowsQuery)
            // Add featured: 0 to each row
            rows = rows.map(r => ({ ...r, featured: 0 }))
          } catch (e2) {
            console.error('Error fetching posts:', e2)
            throw e2
          }
        }
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
        // Convert BigInt values to numbers before JSON serialization
        const convertedOut = convertBigIntToNumber(out)
        const convertedTotal = typeof total === 'bigint' ? Number(total) : total
        res.setHeader('Content-Type','application/json')
        res.status(200).json({ data: convertedOut, page, limit, total: convertedTotal, has_more: hasMore, request_id: reqId })
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
      const postType = body.post_type || 'ad'
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
        await prisma.$executeRaw`INSERT INTO posts (title, content, user_id, category_id, price, location, status, post_type, created_at) VALUES (${title}, ${content}, ${userId}, ${catId}, ${price || null}, ${location || null}, 'pending', ${postType}, CURRENT_TIMESTAMP)`
        const createdRows = await prisma.$queryRaw`SELECT post_id, title, content, created_at, user_id, category_id, price, location, COALESCE(status, 'pending') as status, COALESCE(post_type, 'ad') as post_type, COALESCE(featured, 0) as featured FROM posts WHERE user_id=${userId} ORDER BY post_id DESC LIMIT 1`
        const created = Array.isArray(createdRows) && createdRows.length ? createdRows[0] : null
        if (!created){ res.setHeader('Content-Type','application/json'); res.status(500).json({ status:'error', message:'Failed to create post', data:null, request_id:reqId }); return }
        // Convert BigInt values to numbers
        const convertedCreated = convertBigIntToNumber(created)
        for(let i=0;i<images.length;i++){
          const im = images[i]||{}
          const postId = typeof convertedCreated.post_id === 'bigint' ? Number(convertedCreated.post_id) : convertedCreated.post_id
          await prisma.$executeRaw`INSERT INTO post_images (post_id, url, mime, size, "order") VALUES (${postId}, ${String(im.url||'')}, ${String(im.mime||'')}, ${Number(im.size||0)}, ${i})`
        }
        const postId = typeof convertedCreated.post_id === 'bigint' ? Number(convertedCreated.post_id) : convertedCreated.post_id
        const ims = await prisma.$queryRaw`SELECT image_id, post_id, url, mime, size, "order" FROM post_images WHERE post_id=${postId} ORDER BY "order" ASC`
        // Convert BigInt values in images array
        const convertedImages = convertBigIntToNumber(ims)
        res.setHeader('Content-Type','application/json')
        res.status(201).json({ data: { ...convertedCreated, images: convertedImages }, request_id: reqId })
        return
      }catch(e){ res.setHeader('Content-Type','application/json'); res.status(500).json({ status:'error', message: String(e&&e.message||'Failed to create'), data:null, request_id:reqId }); return }
    }
    res.setHeader('Allow',['GET','POST'])
    res.status(405).json({ status:'error', message:'Method Not Allowed', data:null, request_id:reqId })
  }catch(e){ res.setHeader('Content-Type','application/json'); res.status(500).json({ status:'error', message:'Internal Server Error', data:null, request_id:reqId }) }
}
export const config = { api: { bodyParser: { sizeLimit: '50mb' } } }