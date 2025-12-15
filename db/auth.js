import { randomBytes, pbkdf2Sync } from 'crypto'

export function hashPassword(password){
  const iterations = 310000
  const salt = randomBytes(16)
  const hash = pbkdf2Sync(String(password||''), salt, iterations, 32, 'sha256')
  return `pbkdf2$${iterations}$${salt.toString('base64')}$${hash.toString('base64')}`
}

export function verifyPassword(password, stored){
  try{
    const parts = String(stored||'').split('$')
    if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false
    const iterations = parseInt(parts[1],10)
    const salt = Buffer.from(parts[2],'base64')
    const expected = parts[3]
    const hash = pbkdf2Sync(String(password||''), salt, iterations, 32, 'sha256').toString('base64')
    return hash === expected
  }catch(_){ return false }
}