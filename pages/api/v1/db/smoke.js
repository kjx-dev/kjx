import { randomUUID } from 'crypto'
import { getPrisma } from '../../../../db/client'

export default async function handler(req, res){
  const reqId = req.headers['x-request-id'] || randomUUID()
  try{
    const prisma = getPrisma()
    if (!prisma){ res.setHeader('Content-Type','application/json'); res.status(503).json({ status:'error', message:'Database unavailable', data:null, request_id:reqId }); return }
    await prisma.$connect()
    res.setHeader('Content-Type','application/json')
    res.status(200).json({ data: { ok:true }, request_id: reqId })
  }catch(e){ res.setHeader('Content-Type','application/json'); res.status(500).json({ status:'error', message:String(e && e.message || e), data:null, request_id:reqId }) }
}