import { getPrisma } from '../../../../../db/client'

async function ensureTable(prisma){
  try{
    await prisma.$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS chat_messages (\n'+
      '  message_id INTEGER PRIMARY KEY AUTOINCREMENT,\n'+
      '  post_id INTEGER NOT NULL,\n'+
      '  author TEXT,\n'+
      '  recipient TEXT,\n'+
      '  text TEXT NOT NULL,\n'+
      '  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n'+
      '  FOREIGN KEY(post_id) REFERENCES posts(post_id) ON DELETE CASCADE\n'+
      ')'
    )
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS chat_messages_post_idx ON chat_messages(post_id)')
  }catch(_){ }
}

export default async function handler(req, res){
  try{
    const reqId = req.headers['x-request-id'] || ''
    const id = parseInt(String(req.query.id||''),10)
    if (Number.isNaN(id)){ res.setHeader('Content-Type','application/json'); res.status(400).json({ status:'error', message:'Invalid id', data:null, request_id:reqId }); return }
    const prisma = getPrisma()
    if (!prisma){ res.setHeader('Content-Type','application/json'); res.status(503).json({ status:'error', message:'Database unavailable', data:null, request_id:reqId }); return }
    await ensureTable(prisma)
    if (req.method === 'GET'){
      try{
        const list = await prisma.$queryRaw`SELECT message_id, post_id, author, recipient, text, created_at FROM chat_messages WHERE post_id=${id} ORDER BY created_at ASC`
        res.setHeader('Content-Type','application/json')
        res.status(200).json({ data: list, request_id: reqId })
        return
      }catch(e){ res.setHeader('Content-Type','application/json'); res.status(500).json({ status:'error', message:String(e&&e.message||'Failed to load messages'), data:null, request_id:reqId }); return }
    }
    if (req.method === 'POST'){
      const body = req.body||{}
      const author = String(body.author||'').trim()
      const recipient = String(body.recipient||'').trim()
      const text = String(body.text||'').trim()
      if (!text){ res.setHeader('Content-Type','application/json'); res.status(400).json({ status:'error', message:'Text required', field:'text', data:null, request_id:reqId }); return }
      const post = await prisma.$queryRaw`SELECT post_id FROM posts WHERE post_id=${id}`
      if (!Array.isArray(post) || post.length===0){ res.setHeader('Content-Type','application/json'); res.status(404).json({ status:'error', message:'Post not found', data:null, request_id:reqId }); return }
      try{
        await prisma.$executeRaw`INSERT INTO chat_messages (post_id, author, recipient, text, created_at) VALUES (${id}, ${author||null}, ${recipient||null}, ${text}, CURRENT_TIMESTAMP)`
        const created = await prisma.$queryRaw`SELECT message_id, post_id, author, recipient, text, created_at FROM chat_messages WHERE post_id=${id} ORDER BY message_id DESC LIMIT 1`
        const row = Array.isArray(created) && created.length ? created[0] : { post_id:id, author, recipient, text, created_at: Date.now() }
        res.setHeader('Content-Type','application/json')
        res.status(201).json({ data: row, request_id: reqId })
        return
      }catch(e){ const msg = String(e&&e.message||'Failed to send message'); res.setHeader('Content-Type','application/json'); res.status(500).json({ status:'error', message:msg, data:null, request_id:reqId }); return }
    }
    res.setHeader('Allow',['GET','POST'])
    res.status(405).json({ status:'error', message:'Method Not Allowed', data:null, request_id:reqId })
  }catch(e){ res.setHeader('Content-Type','application/json'); res.status(500).json({ status:'error', message:'Internal Server Error', data:null }) }
}

export const config = { api: { bodyParser: { sizeLimit: '1mb' } } }