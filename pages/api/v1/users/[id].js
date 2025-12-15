import { randomUUID } from 'crypto'
import { getPrisma } from '../../../../db/client'

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
      const item = await prisma.user.findUnique({ where: { user_id: id } })
      if (!item){ res.status(404).json({ status:'error', message:'Not found', data:null, request_id:reqId }); return }
      res.setHeader('Content-Type','application/json')
      res.status(200).json({ data: item, request_id: reqId })
      return
    }
    if (req.method === 'PATCH'){
      const patch = req.body || {}
      const prisma = getPrisma()
      if (!prisma){ res.setHeader('Content-Type','application/json'); res.status(503).json({ status:'error', message:'Database unavailable', data:null, request_id:reqId }); return }
      const data = {}
      if (typeof patch.username === 'string') data.username = patch.username
      if (typeof patch.name === 'string') data.name = patch.name
      if (typeof patch.email === 'string') data.email = patch.email
      if (typeof patch.phone === 'string') data.phone = patch.phone
      if (typeof patch.gender === 'string') data.gender = patch.gender
      if (typeof patch.password_hash === 'string') data.password_hash = patch.password_hash
      const updated = await prisma.user.update({ where: { user_id: id }, data })
      res.setHeader('Content-Type','application/json')
      res.status(200).json({ data: updated, request_id: reqId })
      return
    }
    if (req.method === 'DELETE'){
      const prisma = getPrisma()
      if (!prisma){ res.setHeader('Content-Type','application/json'); res.status(503).json({ status:'error', message:'Database unavailable', data:null, request_id:reqId }); return }
      await prisma.user.delete({ where: { user_id: id } })
      const ok = true
      res.setHeader('Content-Type','application/json')
      res.status(ok?200:404).json({ data: ok?{ deleted:true }:null, status: ok?undefined:'error', message: ok?undefined:'Not found', request_id:reqId })
      return
    }
    res.setHeader('Allow',['GET','PATCH','DELETE'])
    res.status(405).json({ status:'error', message:'Method Not Allowed', data:null, request_id:reqId })
  }catch(e){ res.setHeader('Content-Type','application/json'); res.status(500).json({ status:'error', message:'Internal Server Error', data:null, request_id:reqId }) }
}