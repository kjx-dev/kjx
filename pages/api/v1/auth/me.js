import { getPrisma } from '../../../../db/client'
import { createHmac } from 'crypto'

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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const prisma = getPrisma()
  if (!prisma) return res.status(500).json({ error: 'Database not available' })

  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  const payload = verify(token)
  
  if (!payload) return res.status(401).json({ error: 'Unauthorized' })
  
  try{
    // Use raw SQL to ensure we get role field
    const sql = `SELECT 
      user_id, 
      username, 
      name, 
      email, 
      phone, 
      gender, 
      COALESCE(status, 'active') as status, 
      COALESCE(role, 'user') as role, 
      created_at 
    FROM users WHERE user_id = ? LIMIT 1`
    const rows = await prisma.$queryRawUnsafe(sql, payload.sub)
    
    if (!rows || rows.length === 0) {
      return res.status(401).json({ error: 'User not found' })
    }
    
    const user = rows[0]
    return res.status(200).json({ 
      user: { 
        user_id: user.user_id, 
        username: user.username, 
        name: user.name || '', 
        phone: user.phone || '', 
        gender: user.gender || '', 
        email: user.email,
        role: user.role || 'user',
        status: user.status || 'active'
      } 
    })
  }catch(e){
    console.error('Error fetching user:', e)
    return res.status(500).json({ error: 'Failed to fetch user' })
  }
}

