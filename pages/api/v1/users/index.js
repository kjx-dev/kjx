import { randomUUID } from 'crypto'
import { getPrisma } from '../../../../db/client'

export default async function handler(req, res){
  const reqId = req.headers['x-request-id'] || randomUUID()
  try{
    res.setHeader('Access-Control-Allow-Origin','*')
    res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers','Content-Type, X-Requested-With, X-Request-Id')
    if (req.method === 'OPTIONS'){ res.status(204).end(); return }
      if (req.method === 'GET'){
        const prisma = getPrisma()
        if (!prisma){ res.setHeader('Content-Type','application/json'); res.status(200).json({ data: [], status:'degraded', message:'Database unavailable', request_id:reqId }); return }
        
        // Use raw SQL to ensure we get role and status fields
        try {
          const sql = `SELECT 
            user_id, 
            username, 
            name, 
            email, 
            phone, 
            gender, 
            password_hash, 
            COALESCE(status, 'active') as status, 
            COALESCE(role, 'user') as role, 
            created_at 
          FROM users ORDER BY user_id DESC`
          const rows = await prisma.$queryRawUnsafe(sql)
          res.setHeader('Content-Type','application/json')
          res.status(200).json({ data: rows || [], request_id: reqId })
        } catch (sqlError) {
          // Fallback to Prisma if SQL fails
          console.log('Falling back to Prisma for user list:', sqlError.message)
          const items = await prisma.user.findMany()
          res.setHeader('Content-Type','application/json')
          res.status(200).json({ data: items, request_id: reqId })
        }
        return
      }
    if (req.method === 'POST'){
      if (req.headers['content-type'] && !String(req.headers['content-type']).includes('application/json')){ res.status(415).json({ status:'error', message:'Content-Type must be application/json', data:null, request_id:reqId }); return }
      const body = req.body || {}
      if (!body.username || !body.email || !body.password_hash){ res.status(400).json({ status:'error', message:'Missing required fields', data:null, request_id:reqId }); return }
      try{
        const prisma = getPrisma()
        if (!prisma){ res.status(503).json({ status:'error', message:'Database unavailable', data:null, request_id:reqId }); return }
        const created = await prisma.user.create({ data: { username: body.username, email: body.email, password_hash: body.password_hash } })
        res.setHeader('Content-Type','application/json')
        res.status(201).json({ data: created, request_id: reqId })
      }catch(err){ res.setHeader('Content-Type','application/json'); res.status(409).json({ status:'error', message:'Conflict', data:null, request_id:reqId }) }
      return
    }
    res.setHeader('Allow',['GET','POST'])
    res.status(405).json({ status:'error', message:'Method Not Allowed', data:null, request_id:reqId })
  }catch(e){ res.setHeader('Content-Type','application/json'); res.status(500).json({ status:'error', message:'Internal Server Error', data:null, request_id:reqId }) }
}