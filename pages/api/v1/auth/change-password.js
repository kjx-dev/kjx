import { getPrisma } from '../../../../db/client'
import { verifyPassword, hashPassword } from '../../../../db/auth'
import { createHmac } from 'crypto'
import { passwordComplexity } from '../../../../lib/passwordStrength'

function verify(token){
  try{
    const [v, data, sig] = String(token||'').split('.')
    if (v !== 'v1' || !data || !sig) return null
    const secret = process.env.AUTH_SECRET || 'dev-secret'
    const check = createHmac('sha256', secret).update(data).digest('hex')
    if (check !== sig) return null
    const payload = JSON.parse(Buffer.from(data,'base64url').toString('utf8'))
    if (payload.exp && Date.now() > payload.exp) return null
    return payload
  }catch(_){ return null }
}

const attempts = new Map()
function parseCookies(req){
  const raw = req.headers.cookie || ''
  const out = {}
  raw.split(';').forEach(kv => { const i = kv.indexOf('='); if (i>0){ const k = kv.slice(0,i).trim(); const v = kv.slice(i+1).trim(); out[k]=decodeURIComponent(v) } })
  return out
}
export default async function handler(req, res){
  const prisma = getPrisma()
  if (!prisma) return res.status(503).json({ error: 'Database unavailable' })
  if (req.method !== 'POST'){ res.setHeader('Allow',['POST']); return res.status(405).json({ error:'Method Not Allowed' }) }
  if (req.headers['content-type'] && !String(req.headers['content-type']).includes('application/json')){ return res.status(415).json({ error:'Content-Type must be application/json' }) }
  const proto = (req.headers['x-forwarded-proto']||'').toString()
  if (proto && proto !== 'https' && process.env.NODE_ENV === 'production'){ return res.status(400).json({ error:'HTTPS required' }) }
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  const payload = verify(token)
  if (!payload) return res.status(401).json({ error:'Unauthorized' })
  const cookies = parseCookies(req)
  const headerToken = String(req.headers['x-csrf-token']||'')
  if (!cookies.csrf_token || !headerToken || cookies.csrf_token !== headerToken){ return res.status(403).json({ error:'Invalid CSRF token' }) }
  const { current_password, new_password } = req.body || {}
  if (!current_password || !new_password) return res.status(400).json({ error:'current_password and new_password required' })
  if (!passwordComplexity(new_password)) return res.status(400).json({ error:'Password must be 8+ chars and include upper, lower, digit, special' })
  const key = 'u:'+String(payload.sub)
  const now = Date.now()
  const windowMs = 15*60*1000
  const maxAttempts = 5
  const row = attempts.get(key) || { count:0, resetAt: now + windowMs }
  if (row.resetAt < now){ row.count = 0; row.resetAt = now + windowMs }
  if (row.count >= maxAttempts){ return res.status(429).json({ error:'Too many attempts. Try again later' }) }
  try{
    const user = await prisma.user.findUnique({ where: { user_id: payload.sub } })
    if (!user) return res.status(401).json({ error:'Unauthorized' })
    const ok = verifyPassword(current_password, user.password_hash)
    if (!ok){ row.count++; attempts.set(key,row); return res.status(401).json({ error:'Invalid current password' }) }
    const next = hashPassword(new_password)
    await prisma.user.update({ where: { user_id: user.user_id }, data: { password_hash: next } })
    attempts.delete(key)
    console.log('[audit] password_changed', { user_id: user.user_id, at: new Date().toISOString() })
    return res.status(200).json({ status:'ok' })
  }catch(e){ return res.status(500).json({ error:'Failed to change password' }) }
}