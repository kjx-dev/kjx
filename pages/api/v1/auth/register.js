import { getPrisma } from '../../../../db/client'
import { hashPassword } from '../../../../db/auth'

export default async function handler(req, res){
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })
  const prisma = getPrisma()
  if (!prisma) return res.status(500).json({ error: 'Database not available' })
  const { phone, email, password } = req.body || {}
  if (!phone || !email || !password) return res.status(400).json({ error: 'phone, email, password required' })
  try{
    const baseUsername = String(phone).trim()
    const existingEmail = await prisma.user.findUnique({ where: { email } })
    if (existingEmail) return res.status(409).json({ error: 'Email already in use', field: 'email' })
    const existingUserByUsername = await prisma.user.findUnique({ where: { username: baseUsername } })
    if (existingUserByUsername) return res.status(409).json({ error: 'Phone already in use', field: 'phone' })
    const username = baseUsername
    const password_hash = hashPassword(password)
    const user = await prisma.user.create({ data: { username, email, password_hash } })
    return res.status(201).json({ user: { user_id: user.user_id, username: user.username, name: '', phone: '', gender: '', email: user.email, created_at: user.created_at } })
  }catch(e){
    return res.status(500).json({ error: 'Failed to register', details: String(e && e.message || e) })
  }
}