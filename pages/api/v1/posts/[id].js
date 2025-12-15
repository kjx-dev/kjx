import { randomUUID } from 'crypto'
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
      const item = await prisma.post.findUnique({ where: { post_id: id }, include: { images: true, category: true } })
      if (!item){ res.status(404).json({ status:'error', message:'Not found', data:null, request_id:reqId }); return }
      res.setHeader('Content-Type','application/json')
      res.status(200).json({ data: item, request_id: reqId })
      return
    }
    if (req.method === 'PATCH'){
      const patch = req.body || {}
      const prisma = getPrisma()
      if (!prisma){ res.setHeader('Content-Type','application/json'); res.status(503).json({ status:'error', message:'Database unavailable', data:null, request_id:reqId }); return }
      await ensureTables(prisma)
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
        await prisma.$executeRaw`UPDATE posts SET title=${patch.title||null}, content=${patch.content||null}, category_id=${catId||null}, price=${patch.price ?? null}, location=${patch.location ?? null} WHERE post_id=${id}`
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
        const updatedRows = await prisma.$queryRaw`SELECT post_id, title, content, created_at, user_id, category_id, price, location FROM posts WHERE post_id=${id}`
        const item = Array.isArray(updatedRows) && updatedRows.length ? updatedRows[0] : null
        const ims = await prisma.$queryRaw`SELECT image_id, post_id, url, mime, size, "order" FROM post_images WHERE post_id=${id} ORDER BY "order" ASC`
        if (!item){ res.setHeader('Content-Type','application/json'); res.status(404).json({ status:'error', message:'Not found', data:null, request_id:reqId }); return }
        res.setHeader('Content-Type','application/json')
        res.status(200).json({ data: { ...item, images: ims }, request_id: reqId })
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