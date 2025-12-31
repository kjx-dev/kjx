try{ require('dotenv').config({ path: ['.env.local', '.env'] }) }catch(_){ try{ require('dotenv').config() }catch(__){} }
const { WebSocketServer } = require('ws')
const { getPrisma } = require('../db/client')

const PORT = process.env.CHAT_WS_PORT ? parseInt(process.env.CHAT_WS_PORT,10) : 3002
const prisma = getPrisma()

async function ensureTable(p){
  try{
    await p.$executeRawUnsafe(
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
    await p.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS chat_messages_post_idx ON chat_messages(post_id)')
  }catch(_){ }
}
const wss = new WebSocketServer({ port: PORT })

const subs = new Map()

function send(ws, msg){ try{ ws.send(JSON.stringify(msg)) }catch(_){ } }

function broadcast(postId, payload){
  for (const [ws, set] of subs.entries()){
    if (set.has(postId)) send(ws, payload)
  }
}

wss.on('connection', (ws) => {
  subs.set(ws, new Set())
  ws.isAlive = true
  ws.on('pong', () => { ws.isAlive = true })
  send(ws, { type:'hello', data:{ port: PORT } })

  ws.on('message', async (raw) => {
    let msg
    try{ msg = JSON.parse(String(raw)) }catch(_){ return }
    const t = String(msg.type||'')
    if (t === 'ping'){ send(ws, { type:'pong' }); return }
    if (t === 'join'){
      const pid = parseInt(String(msg.post_id||''),10)
      if (!Number.isNaN(pid) && pid>0){ subs.get(ws).add(pid); send(ws, { type:'joined', post_id: pid }); try{ console.log('[chat-ws] join', pid) }catch(_){ } }
      return
    }
    if (t === 'leave'){
      const pid = parseInt(String(msg.post_id||''),10)
      if (!Number.isNaN(pid) && pid>0){ subs.get(ws).delete(pid); send(ws, { type:'left', post_id: pid }); try{ console.log('[chat-ws] leave', pid) }catch(_){ } }
      return
    }
    if (t === 'message'){
      const post_id = parseInt(String(msg.post_id||''),10)
      const author = String(msg.author||'').trim() || null
      const recipient = String(msg.recipient||'').trim() || null
      const text = String(msg.text||'').trim()
      if (!post_id || !text){ send(ws, { type:'error', error:'post_id and text required' }); return }
      if (!prisma){ send(ws, { type:'error', error:'db unavailable' }); return }
      try{
        await ensureTable(prisma)
        await prisma.$executeRaw`INSERT INTO chat_messages (post_id, author, recipient, text, created_at) VALUES (${post_id}, ${author}, ${recipient}, ${text}, CURRENT_TIMESTAMP)`
        const created = await prisma.$queryRaw`SELECT message_id, post_id, author, recipient, text, created_at FROM chat_messages WHERE post_id=${post_id} ORDER BY message_id DESC LIMIT 1`
        const row = Array.isArray(created) && created.length ? created[0] : null
        if (row){
          broadcast(post_id, { type:'new_message', data: row })
          try{ console.log('[chat-ws] sent', row.message_id, 'post', post_id) }catch(_){ }
        }
      }catch(e){ send(ws, { type:'error', error: String(e && e.message || 'failed') }); try{ console.error('[chat-ws] error', e && e.message) }catch(_){ } }
      return
    }
    if (t === 'broadcast'){
      const post_id = parseInt(String(msg.post_id||''),10)
      if (!post_id){ send(ws, { type:'error', error:'post_id required' }); return }
      const row = {
        message_id: null,
        post_id,
        author: String(msg.author||'').trim() || null,
        recipient: String(msg.recipient||'').trim() || null,
        text: String(msg.text||'').trim(),
        created_at: new Date().toISOString()
      }
      broadcast(post_id, { type:'new_message', data: row })
      try{ console.log('[chat-ws] broadcast post', post_id) }catch(_){ }
      return
    }
  })

  ws.on('close', () => { subs.delete(ws) })
})

// disabled heartbeat to support browser WebSocket clients

console.log(`[chat-ws] listening on ws://localhost:${PORT}`)