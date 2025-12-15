import { randomUUID } from 'crypto'
import { getPrisma } from '../../../../db/client'

export default async function handler(req, res){
  const reqId = req.headers['x-request-id'] || randomUUID()
  try{
    const idRaw = (req.query.id||'').toString()
    const id = parseInt(idRaw, 10)
    if (Number.isNaN(id)){ res.setHeader('Content-Type','application/json'); res.status(400).json({ status:'error', message:'Invalid category id', data:null, request_id:reqId }); return }
    if (req.method === 'GET'){
      const prisma = getPrisma()
      if (!prisma){ res.setHeader('Content-Type','application/json'); res.status(503).json({ status:'error', message:'Database unavailable', data:null, request_id:reqId }); return }
      const item = await prisma.category.findUnique({ where: { category_id: id } })
      if (!item){ res.setHeader('Content-Type','application/json'); res.status(404).json({ status:'error', message:'Not Found', data:null, request_id:reqId }); return }
      res.setHeader('Content-Type','application/json')
      res.status(200).json({ data: item, request_id: reqId })
      return
    }
    if (req.method === 'PATCH'){
      if (req.headers['content-type'] && !String(req.headers['content-type']).includes('application/json')){ res.status(415).json({ status:'error', message:'Content-Type must be application/json', data:null, request_id:reqId }); return }
      const body = req.body || {}
      const prisma = getPrisma()
      if (!prisma){ res.setHeader('Content-Type','application/json'); res.status(503).json({ status:'error', message:'Database unavailable', data:null, request_id:reqId }); return }
      const updated = await prisma.category.update({ where: { category_id: id }, data: { name: body.name, description: body.description, icon: body.icon } })
      res.setHeader('Content-Type','application/json')
      res.status(200).json({ data: updated, request_id: reqId })
      return
    }
    if (req.method === 'DELETE'){
      const prisma = getPrisma()
      if (!prisma){ res.status(503).json({ status:'error', message:'Database unavailable', data:null, request_id:reqId }); return }
      await prisma.category.delete({ where: { category_id: id } })
      res.status(204).end()
      return
    }
    res.setHeader('Allow',['GET','PATCH','DELETE'])
    res.status(405).json({ status:'error', message:'Method Not Allowed', data:null, request_id:reqId })
  }catch(e){ res.setHeader('Content-Type','application/json'); res.status(500).json({ status:'error', message:'Internal Server Error', data:null, request_id:reqId }) }
}