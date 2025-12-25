import { randomUUID } from 'crypto'
import { getPrisma } from '../../../../../db/client'

export default async function handler(req, res) {
  const reqId = req.headers['x-request-id'] || randomUUID()
  try {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With, X-Request-Id')
    if (req.method === 'OPTIONS') {
      res.status(204).end()
      return
    }
    
    if (req.method !== 'POST') {
      res.status(405).json({ status: 'error', message: 'Method Not Allowed', data: null, request_id: reqId })
      return
    }
    
    const id = parseInt(String(req.query.id || ''), 10)
    if (Number.isNaN(id)) {
      res.status(400).json({ status: 'error', message: 'Invalid id', data: null, request_id: reqId })
      return
    }
    
    const { action } = req.body || {}
    if (!action || !['view', 'phone', 'chat'].includes(action)) {
      res.status(400).json({ status: 'error', message: 'Invalid action. Must be "view", "phone", or "chat"', data: null, request_id: reqId })
      return
    }
    
    const prisma = getPrisma()
    if (!prisma) {
      res.status(503).json({ status: 'error', message: 'Database unavailable', data: null, request_id: reqId })
      return
    }
    
    // Ensure columns exist
    try {
      await prisma.$executeRawUnsafe('ALTER TABLE posts ADD COLUMN views INTEGER DEFAULT 0')
    } catch (_) {}
    try {
      await prisma.$executeRawUnsafe('ALTER TABLE posts ADD COLUMN phone_clicks INTEGER DEFAULT 0')
    } catch (_) {}
    try {
      await prisma.$executeRawUnsafe('ALTER TABLE posts ADD COLUMN chat_clicks INTEGER DEFAULT 0')
    } catch (_) {}
    
    // Increment the appropriate counter
    let updateQuery = ''
    if (action === 'view') {
      updateQuery = `UPDATE posts SET views = COALESCE(views, 0) + 1 WHERE post_id = ${id}`
    } else if (action === 'phone') {
      updateQuery = `UPDATE posts SET phone_clicks = COALESCE(phone_clicks, 0) + 1 WHERE post_id = ${id}`
    } else if (action === 'chat') {
      updateQuery = `UPDATE posts SET chat_clicks = COALESCE(chat_clicks, 0) + 1 WHERE post_id = ${id}`
    }
    
    await prisma.$executeRawUnsafe(updateQuery)
    
    // Fetch updated counts
    const rows = await prisma.$queryRawUnsafe(
      `SELECT COALESCE(views, 0) as views, COALESCE(phone_clicks, 0) as phone_clicks, COALESCE(chat_clicks, 0) as chat_clicks FROM posts WHERE post_id = ${id}`
    )
    const counts = Array.isArray(rows) && rows.length ? rows[0] : { views: 0, phone_clicks: 0, chat_clicks: 0 }
    
    res.setHeader('Content-Type', 'application/json')
    res.status(200).json({
      status: 'success',
      message: `${action} tracked successfully`,
      data: {
        views: Number(counts.views || 0),
        phone_clicks: Number(counts.phone_clicks || 0),
        chat_clicks: Number(counts.chat_clicks || 0)
      },
      request_id: reqId
    })
  } catch (e) {
    res.setHeader('Content-Type', 'application/json')
    res.status(500).json({ status: 'error', message: String(e && e.message || 'Internal Server Error'), data: null, request_id: reqId })
  }
}

