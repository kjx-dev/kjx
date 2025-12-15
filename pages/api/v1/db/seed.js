import { randomUUID } from 'crypto'
import { getPrisma } from '../../../../db/client'
import { resetCategories, seedDemo } from '../../../../db/seed'

function slugify(str){ return String(str||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'') }

export default function handler(req, res){
  const reqId = req.headers['x-request-id'] || randomUUID()
  try{
    ;(async () => {
      const prisma = getPrisma()
      if (!prisma){ res.status(503).json({ status:'error', message:'Database unavailable', data:null, request_id:reqId }); return }
      if (req.query.reset_categories === '1' || req.query.reset_categories === 'true'){
        const cats = await resetCategories(prisma)
        res.setHeader('Content-Type','application/json')
        res.status(200).json({ data: { categories: cats }, request_id:reqId })
        return
      }
      const result = await seedDemo(prisma)
      res.setHeader('Content-Type','application/json')
      res.status(200).json({ data: result, request_id:reqId })
    })()
  }catch(e){ res.setHeader('Content-Type','application/json'); res.status(500).json({ status:'error', message:'Seed failed', data:null, request_id:reqId }) }
}