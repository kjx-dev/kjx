import { randomUUID } from 'crypto'
import { getPrisma } from '../../../../db/client'

async function ensureFavoritesTable(prisma){
  try{
    await prisma.$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS favorites (\n'+
      '  fav_id INTEGER PRIMARY KEY AUTOINCREMENT,\n'+
      '  user_id INTEGER NOT NULL,\n'+
      '  post_id INTEGER NOT NULL,\n'+
      '  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n'+
      '  FOREIGN KEY(post_id) REFERENCES posts(post_id) ON DELETE CASCADE\n'+
      ')'
    )
    await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS favorites_unique ON favorites(user_id, post_id)')
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS favorites_user_idx ON favorites(user_id)')
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS favorites_post_idx ON favorites(post_id)')
  }catch(_){ }
}

export default async function handler(req, res){
  const reqId = req.headers['x-request-id'] || randomUUID()
  try{
    const prisma = getPrisma()
    if (!prisma){ res.setHeader('Content-Type','application/json'); res.status(503).json({ status:'error', message:'Database unavailable', data:null, request_id:reqId }); return }
    await ensureFavoritesTable(prisma)
    if (req.method === 'GET'){
      const userId = req.query.user_id==null ? null : parseInt(String(req.query.user_id),10)
      if (!userId){ res.setHeader('Content-Type','application/json'); res.status(400).json({ status:'error', message:'user_id required', data:null, request_id:reqId }); return }
      try{
        const rows = await prisma.$queryRaw`SELECT p.post_id, p.title, p.price, p.location, p.created_at FROM favorites f JOIN posts p ON p.post_id=f.post_id WHERE f.user_id=${userId} ORDER BY f.created_at DESC`
        res.setHeader('Content-Type','application/json')
        res.status(200).json({ data: rows, request_id:reqId })
        return
      }catch(e){ res.setHeader('Content-Type','application/json'); res.status(500).json({ status:'error', message:String(e&&e.message||'Failed to load favorites'), data:null, request_id:reqId }); return }
    }
    if (req.method === 'POST'){
      const body = req.body || {}
      const userId = body.user_id==null ? null : parseInt(String(body.user_id),10)
      const postId = body.post_id==null ? null : parseInt(String(body.post_id),10)
      if (!userId || !postId){ res.setHeader('Content-Type','application/json'); res.status(400).json({ status:'error', message:'user_id and post_id required', data:null, request_id:reqId }); return }
      try{
        await prisma.$executeRaw`INSERT INTO favorites (user_id, post_id) VALUES (${userId}, ${postId})`
        const row = await prisma.$queryRaw`SELECT fav_id, user_id, post_id, created_at FROM favorites WHERE user_id=${userId} AND post_id=${postId}`
        const fav = Array.isArray(row) && row.length ? row[0] : { user_id:userId, post_id:postId }
        res.setHeader('Content-Type','application/json')
        res.status(201).json({ data: fav, request_id:reqId })
        return
      }catch(e){
        const msg = String(e&&e.message||'Failed to favorite')
        if (msg.toLowerCase().includes('unique')){ res.setHeader('Content-Type','application/json'); res.status(200).json({ data: { ok:true, duplicate:true }, request_id:reqId }); return }
        res.setHeader('Content-Type','application/json')
        res.status(500).json({ status:'error', message: msg, data:null, request_id:reqId })
        return
      }
    }
    if (req.method === 'DELETE'){
      const body = req.body || {}
      const userId = body.user_id==null ? null : parseInt(String(body.user_id),10)
      const postId = body.post_id==null ? null : parseInt(String(body.post_id),10)
      if (!userId || !postId){ res.setHeader('Content-Type','application/json'); res.status(400).json({ status:'error', message:'user_id and post_id required', data:null, request_id:reqId }); return }
      try{
        await prisma.$executeRaw`DELETE FROM favorites WHERE user_id=${userId} AND post_id=${postId}`
        res.setHeader('Content-Type','application/json')
        res.status(200).json({ data: { deleted:true }, request_id:reqId })
        return
      }catch(e){ res.setHeader('Content-Type','application/json'); res.status(500).json({ status:'error', message:'Failed to remove favorite', data:null, request_id:reqId }); return }
    }
    res.setHeader('Allow',['GET','POST','DELETE'])
    res.status(405).json({ status:'error', message:'Method Not Allowed', data:null, request_id:reqId })
  }catch(e){ res.setHeader('Content-Type','application/json'); res.status(500).json({ status:'error', message:'Internal Server Error', data:null, request_id:reqId }) }
}

export const config = { api: { bodyParser: { sizeLimit: '1mb' } } }