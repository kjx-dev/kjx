import { getPrisma } from '../../../../db/client'

export default async function handler(req, res){
  try{
    const prisma = getPrisma()
    if (!prisma){ res.setHeader('Content-Type','application/json'); res.status(503).json({ status:'error', message:'Database unavailable', data:null }); return }
    if (req.method === 'GET'){
      const participant = String(req.query.participant||'').trim()
      const postId = parseInt(String(req.query.post_id||''),10)
      if (!participant && Number.isNaN(postId)){
        res.setHeader('Content-Type','application/json');
        res.status(400).json({ status:'error', message:'participant or post_id required', data:null });
        return
      }
      let rows = []
      if (!Number.isNaN(postId) && postId>0){
        rows = await prisma.$queryRaw`
          SELECT c.message_id, c.post_id, c.author, c.recipient, c.text, c.created_at, p.title
          FROM chat_messages c
          JOIN posts p ON p.post_id=c.post_id
          WHERE c.post_id=${postId}
          ORDER BY c.created_at ASC
        `
      } else {
        rows = await prisma.$queryRaw`
          SELECT c.message_id, c.post_id, c.author, c.recipient, c.text, c.created_at, p.title
          FROM chat_messages c
          JOIN posts p ON p.post_id=c.post_id
          WHERE c.post_id IN (
            SELECT post_id FROM chat_messages WHERE author=${participant} OR recipient=${participant}
          )
          ORDER BY c.post_id ASC, c.created_at ASC
        `
      }
      res.setHeader('Content-Type','application/json')
      res.status(200).json({ data: rows })
      return
    }
    if (req.method === 'POST'){
      const body = req.body||{}
      const post_id = parseInt(String(body.post_id||''),10)
      const author = String(body.author||'').trim()
      const recipient = String(body.recipient||'').trim()
      const text = String(body.text||'').trim()
      if (!post_id || !text){ res.setHeader('Content-Type','application/json'); res.status(400).json({ status:'error', message:'post_id and text required', data:null }); return }
      const post = await prisma.$queryRaw`SELECT post_id FROM posts WHERE post_id=${post_id}`
      if (!Array.isArray(post) || post.length===0){ res.setHeader('Content-Type','application/json'); res.status(404).json({ status:'error', message:'Post not found', data:null }); return }
      await prisma.$executeRaw`INSERT INTO chat_messages (post_id, author, recipient, text, created_at) VALUES (${post_id}, ${author||null}, ${recipient||null}, ${text}, CURRENT_TIMESTAMP)`
      const created = await prisma.$queryRaw`SELECT message_id, post_id, author, recipient, text, created_at FROM chat_messages WHERE post_id=${post_id} ORDER BY message_id DESC LIMIT 1`
      const row = Array.isArray(created) && created.length ? created[0] : null
      res.setHeader('Content-Type','application/json')
      res.status(201).json({ data: row })
      return
    }
    res.setHeader('Allow',['GET','POST'])
    res.status(405).json({ status:'error', message:'Method Not Allowed', data:null })
  }catch(e){ res.setHeader('Content-Type','application/json'); res.status(500).json({ status:'error', message:'Internal Server Error', data:null }) }
}

export const config = { api: { bodyParser: { sizeLimit: '1mb' } } }