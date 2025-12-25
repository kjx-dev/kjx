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
      '  post_type TEXT DEFAULT \'ad\'\n'+
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
      if (e.message && !e.message.includes('duplicate column')) {
        console.log('Error adding featured column (may already exist):', e.message)
      }
    }
    // Add views column if it doesn't exist
    try {
      await prisma.$executeRawUnsafe('ALTER TABLE posts ADD COLUMN views INTEGER DEFAULT 0')
      console.log('Added views column to posts table')
    } catch (e) {
      if (e.message && !e.message.includes('duplicate column')) {
        console.log('Error adding views column (may already exist):', e.message)
      }
    }
    // Add phone_clicks column if it doesn't exist
    try {
      await prisma.$executeRawUnsafe('ALTER TABLE posts ADD COLUMN phone_clicks INTEGER DEFAULT 0')
      console.log('Added phone_clicks column to posts table')
    } catch (e) {
      if (e.message && !e.message.includes('duplicate column')) {
        console.log('Error adding phone_clicks column (may already exist):', e.message)
      }
    }
    // Add chat_clicks column if it doesn't exist
    try {
      await prisma.$executeRawUnsafe('ALTER TABLE posts ADD COLUMN chat_clicks INTEGER DEFAULT 0')
      console.log('Added chat_clicks column to posts table')
    } catch (e) {
      if (e.message && !e.message.includes('duplicate column')) {
        console.log('Error adding chat_clicks column (may already exist):', e.message)
      }
    }
    await prisma.$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS post_images (\n'+
      '  image_id INTEGER PRIMARY KEY AUTOINCREMENT,\n'+
      '  post_id INTEGER NOT NULL,\n'+
      '  url TEXT NOT NULL,\n'+
      '  mime TEXT NOT NULL,\n'+
      '  size INTEGER NOT NULL,\n'+
      '  "order" INTEGER DEFAULT 0\n'+
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
  }catch(_){ }
}

export default async function handler(req, res){
  const reqId = req.headers['x-request-id'] || randomUUID()
  try{
    res.setHeader('Access-Control-Allow-Origin','*')
    res.setHeader('Access-Control-Allow-Methods','GET, PATCH, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers','Content-Type, X-Requested-With, X-Request-Id')
    if (req.method === 'OPTIONS'){ res.status(204).end(); return }
    const id = parseInt(String(req.query.id||''),10)
    if (Number.isNaN(id)){ res.status(400).json({ status:'error', message:'Invalid id', data:null, request_id:reqId }); return }
    if (req.method === 'GET'){
      const prisma = getPrisma()
      if (!prisma){ res.setHeader('Content-Type','application/json'); res.status(503).json({ status:'error', message:'Database unavailable', data:null, request_id:reqId }); return }
      const showAll = req.query.showAll === 'true' || req.query.admin === 'true'
      const rowsQuery = showAll
        ? `SELECT post_id, title, content, created_at, user_id, category_id, price, location, COALESCE(status, 'pending') as status, COALESCE(post_type, 'ad') as post_type, COALESCE(featured, 0) as featured, COALESCE(views, 0) as views, COALESCE(phone_clicks, 0) as phone_clicks, COALESCE(chat_clicks, 0) as chat_clicks FROM posts WHERE post_id=${id}`
        : `SELECT post_id, title, content, created_at, user_id, category_id, price, location, COALESCE(status, 'pending') as status, COALESCE(post_type, 'ad') as post_type, COALESCE(featured, 0) as featured, COALESCE(views, 0) as views, COALESCE(phone_clicks, 0) as phone_clicks, COALESCE(chat_clicks, 0) as chat_clicks FROM posts WHERE post_id=${id} AND COALESCE(status, 'pending') = 'active'`
      const rows = await prisma.$queryRawUnsafe(rowsQuery)
      const item = Array.isArray(rows) && rows.length ? rows[0] : null
      if (!item){ res.status(404).json({ status:'error', message:'Not found', data:null, request_id:reqId }); return }
      const ims = await prisma.$queryRaw`SELECT image_id, post_id, url, mime, size, "order" FROM post_images WHERE post_id=${id} ORDER BY "order" ASC`
      const catRows = await prisma.$queryRaw`SELECT category_id, name, description, icon FROM categories WHERE category_id=${item.category_id} LIMIT 1`
      const category = Array.isArray(catRows) && catRows.length ? catRows[0] : null
      // Convert BigInt values to numbers before JSON serialization
      const convertedItem = convertBigIntToNumber(item)
      const convertedImages = convertBigIntToNumber(ims)
      const convertedCategory = convertBigIntToNumber(category)
      res.setHeader('Content-Type','application/json')
      res.status(200).json({ data: { ...convertedItem, images: convertedImages, category: convertedCategory }, request_id: reqId })
      return
    }
    if (req.method === 'PATCH'){
      const patch = req.body || {}
      const prisma = getPrisma()
      if (!prisma){ res.setHeader('Content-Type','application/json'); res.status(503).json({ status:'error', message:'Database unavailable', data:null, request_id:reqId }); return }
      await ensureTables(prisma)
      
      // Check if user is admin
      let isAdmin = false
      try {
        const auth = req.headers['authorization'] || ''
        const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
        if (token) {
          const [v, data, sig] = String(token||'').split('.')
          if (v === 'v1' && data && sig) {
            const secret = process.env.AUTH_SECRET || 'dev-secret'
            const check = createHmac('sha256', secret).update(data).digest('hex')
            if (check === sig) {
              const payload = JSON.parse(Buffer.from(data,'base64url').toString('utf8'))
              if (payload.exp && Date.now() > payload.exp) {
                // Token expired
              } else if (payload.sub) {
                const userRows = await prisma.$queryRaw`SELECT role FROM users WHERE user_id=${payload.sub} LIMIT 1`
                if (Array.isArray(userRows) && userRows.length && userRows[0].role === 'admin') {
                  isAdmin = true
                }
              }
            }
          }
        }
        // Also check query parameter for admin requests
        if (req.query.admin === 'true' || req.query.showAll === 'true') {
          isAdmin = true
        }
      } catch (e) {
        // If we can't verify admin status, assume not admin
        console.log('Error checking admin status:', e.message)
      }
      
      let catId = patch.category_id || null
      const categoryName = patch.category || null
      if (!catId && categoryName){
        const rows = await prisma.$queryRaw`SELECT category_id FROM categories WHERE name=${categoryName} LIMIT 1`
        if (Array.isArray(rows) && rows.length){ catId = rows[0].category_id }
        else {
          try{ await prisma.$executeRaw`INSERT INTO categories (name, description, icon) VALUES (${categoryName}, '', 'fa-tags')`; const rows2 = await prisma.$queryRaw`SELECT category_id FROM categories WHERE name=${categoryName} LIMIT 1`; if (Array.isArray(rows2) && rows2.length){ catId = rows2[0].category_id } }catch(_){ }
        }
      }
      try{
        // Check if user is editing content (not just status)
        const isEditingContent = patch.title !== undefined || 
                                  patch.content !== undefined || 
                                  patch.price !== undefined || 
                                  patch.location !== undefined || 
                                  patch.category_id !== undefined || 
                                  patch.category !== undefined ||
                                  patch.post_type !== undefined ||
                                  Array.isArray(patch.images)
        
        // Handle status updates
        let statusValue = patch.status || null
        
        // If admin is only updating status (approving/rejecting), allow it
        if (isAdmin && !isEditingContent && statusValue !== null) {
          // Admin is only changing status - allow it
          // statusValue stays as provided
        } else if (!isAdmin && isEditingContent) {
          // Non-admin editing content - force status to pending
          statusValue = 'pending'
        } else if (!isAdmin && statusValue === 'active') {
          // Non-admin trying to set status to active - not allowed
          statusValue = null // Don't update status
        } else if (isAdmin && isEditingContent) {
          // Admin editing content - allow status change if provided, otherwise keep current
          // If status is not provided, don't change it
          if (statusValue === null) {
            // Don't update status if admin is editing content and didn't specify status
            statusValue = null
          }
        }
        
        const updates = []
        const values = []
        
        if (patch.title !== undefined) {
          updates.push('title = ?')
          values.push(patch.title || null)
        }
        if (patch.content !== undefined) {
          updates.push('content = ?')
          values.push(patch.content || null)
        }
        if (catId !== null) {
          updates.push('category_id = ?')
          values.push(catId)
        }
        if (patch.price !== undefined) {
          updates.push('price = ?')
          values.push(patch.price ?? null)
        }
        if (patch.location !== undefined) {
          updates.push('location = ?')
          values.push(patch.location ?? null)
        }
        if (statusValue !== null) {
          updates.push('status = ?')
          values.push(statusValue)
        }
        if (patch.post_type !== undefined) {
          updates.push('post_type = ?')
          values.push(patch.post_type || 'ad')
        }
        if (patch.featured !== undefined) {
          updates.push('featured = ?')
          values.push(patch.featured ? 1 : 0)
        }
        
        if (updates.length > 0) {
          values.push(id)
          const sql = `UPDATE posts SET ${updates.join(', ')} WHERE post_id = ?`
          await prisma.$executeRawUnsafe(sql, ...values)
        }
        if (Array.isArray(patch.images)){
          for(let i=0;i<patch.images.length;i++){
            const im = patch.images[i] || {}
            const size = im.size||0
            const mime = String(im.mime||'')
            if (!mime.startsWith('image/')){ res.setHeader('Content-Type','application/json'); res.status(400).json({ status:'error', message:'Invalid image type', field:'images', data:null, request_id:reqId }); return }
            if (size > 10*1024*1024){ res.setHeader('Content-Type','application/json'); res.status(400).json({ status:'error', message:'Image must be <= 10MB', field:'images', data:null, request_id:reqId }); return }
          }
          await prisma.$executeRaw`DELETE FROM post_images WHERE post_id=${id}`
          for(let i=0;i<patch.images.length;i++){
            const im = patch.images[i]||{}
            await prisma.$executeRaw`INSERT INTO post_images (post_id, url, mime, size, "order") VALUES (${id}, ${String(im.url||'')}, ${String(im.mime||'')}, ${Number(im.size||0)}, ${i})`
          }
        }
        const updatedRows = await prisma.$queryRaw`SELECT post_id, title, content, created_at, user_id, category_id, price, location, COALESCE(status, 'pending') as status, COALESCE(post_type, 'ad') as post_type, COALESCE(featured, 0) as featured, COALESCE(views, 0) as views, COALESCE(phone_clicks, 0) as phone_clicks, COALESCE(chat_clicks, 0) as chat_clicks FROM posts WHERE post_id=${id}`
        const item = Array.isArray(updatedRows) && updatedRows.length ? updatedRows[0] : null
        const ims = await prisma.$queryRaw`SELECT image_id, post_id, url, mime, size, "order" FROM post_images WHERE post_id=${id} ORDER BY "order" ASC`
        if (!item){ res.setHeader('Content-Type','application/json'); res.status(404).json({ status:'error', message:'Not found', data:null, request_id:reqId }); return }
        // Convert BigInt values to numbers before JSON serialization
        const convertedItem = convertBigIntToNumber(item)
        const convertedImages = convertBigIntToNumber(ims)
        res.setHeader('Content-Type','application/json')
        res.status(200).json({ data: { ...convertedItem, images: convertedImages }, request_id: reqId })
        return
      }catch(e){ res.setHeader('Content-Type','application/json'); res.status(500).json({ status:'error', message:String(e&&e.message||'Failed to update'), data:null, request_id:reqId }); return }
    }
    if (req.method === 'DELETE'){
      const prisma = getPrisma()
      if (!prisma){ res.setHeader('Content-Type','application/json'); res.status(503).json({ status:'error', message:'Database unavailable', data:null, request_id:reqId }); return }
      const found = await prisma.post.findUnique({ where: { post_id: id } })
      if (!found){ res.setHeader('Content-Type','application/json'); res.status(404).json({ status:'error', message:'Not found', data:null, request_id:reqId }); return }
      try{
        await prisma.post.update({ where: { post_id: id }, data: { images: { deleteMany: {} } } })
        await prisma.post.delete({ where: { post_id: id } })
        res.setHeader('Content-Type','application/json')
        res.status(200).json({ data: { deleted:true }, request_id:reqId })
        return
      }catch(e){
        res.setHeader('Content-Type','application/json')
        res.status(500).json({ status:'error', message:'Failed to delete post', data:null, request_id:reqId })
        return
      }
    }
    res.setHeader('Allow',['GET','PATCH','DELETE'])
    res.status(405).json({ status:'error', message:'Method Not Allowed', data:null, request_id:reqId })
  }catch(e){ res.setHeader('Content-Type','application/json'); res.status(500).json({ status:'error', message:'Internal Server Error', data:null, request_id:reqId }) }
}
export const config = { api: { bodyParser: { sizeLimit: '50mb' } } }