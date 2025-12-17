import { getPrisma } from '../../../../db/client'
import { verifyPassword } from '../../../../db/auth'
import { createHmac } from 'crypto'

function sign(payload){
  const secret = process.env.AUTH_SECRET || 'dev-secret'
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', secret).update(data).digest('hex')
  return `v1.${data}.${sig}`
}

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

export default async function handler(req, res){
  const prisma = getPrisma()
  if (!prisma) return res.status(500).json({ error: 'Database not available' })
  if (req.method === 'POST'){
    const { email, password } = req.body || {}
    if (!email || !password) return res.status(400).json({ error: 'email and password required' })
    try{
      const user = await prisma.user.findUnique({ where: { email } })
      if (!user) return res.status(401).json({ error: 'Invalid credentials' })
      // Check if user is OAuth user (no password or placeholder)
      if (!user.password_hash || user.password_hash === 'OAUTH_USER_NO_PASSWORD') {
        return res.status(401).json({ error: 'This account uses Google sign-in. Please sign in with Google.' })
      }
      const ok = verifyPassword(password, user.password_hash)
      if (!ok) return res.status(401).json({ error: 'Invalid credentials' })
      const token = sign({ sub: user.user_id, email: user.email, exp: Date.now() + 1000*60*60*12 })
      return res.status(200).json({ token, user: { user_id: user.user_id, username: user.username, name: user.name || '', phone: user.phone || '', gender: user.gender || '', email: user.email } })
    }catch(e){
      return res.status(500).json({ error: 'Login failed' })
    }
  } else if (req.method === 'GET'){
    const auth = req.headers.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    const payload = verify(token)
    if (!payload) return res.status(401).json({ error: 'Unauthorized' })
    try{
      const user = await prisma.user.findUnique({ where: { user_id: payload.sub } })
      if (!user) return res.status(401).json({ error: 'Unauthorized' })
      return res.status(200).json({ user: { user_id: user.user_id, username: user.username, name: user.name || '', phone: user.phone || '', gender: user.gender || '', email: user.email } })
    }catch(e){
      return res.status(500).json({ error: 'Failed' })
    }
  } else {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }
}