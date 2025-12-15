import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

export default function handler(req, res){
  const reqId = req.headers['x-request-id'] || randomUUID()
  try{
    const rel = process.env.DATABASE_URL?.replace('file:','') || 'db/dev.db'
    const abs = path.isAbsolute(rel) ? rel : path.resolve(process.cwd(), rel)
    let exists = fs.existsSync(abs)
    if (!exists && (req.query.create === '1' || req.query.create === 'true')){
      try{
        fs.mkdirSync(path.dirname(abs), { recursive: true })
        fs.closeSync(fs.openSync(abs, 'a'))
        exists = fs.existsSync(abs)
      }catch(_){ }
    }
    let size = null
    try{ if (exists){ size = fs.statSync(abs)?.size || null } }catch(_){ size = null }
    res.setHeader('Content-Type','application/json')
    res.status(200).json({ data: { path: rel, abs_path: abs, exists, size }, request_id: reqId })
  }catch(e){ res.setHeader('Content-Type','application/json'); res.status(500).json({ status:'error', message:'Internal Server Error', data:null, request_id:reqId }) }
}