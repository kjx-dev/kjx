import { randomUUID } from 'crypto'
import { getPrisma } from '../../../../../db/client'

function verifyAdmin(req) {
  try {
    const auth = req.headers['authorization'] || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) return null
    
    const parts = String(token).split('.')
    if (parts.length < 3) return null
    
    const data = parts[1]
    const pad = data.length % 4 === 2 ? '==' : data.length % 4 === 3 ? '=' : ''
    const norm = data.replace(/-/g, '+').replace(/_/g, '/') + pad
    const payload = JSON.parse(Buffer.from(norm, 'base64').toString('utf8'))
    
    return payload
  } catch (_) {
    return null
  }
}

export default async function handler(req, res) {
  const reqId = req.headers['x-request-id'] || randomUUID()
  
  try {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    
    if (req.method === 'OPTIONS') {
      res.status(204).end()
      return
    }
    
    const prisma = getPrisma()
    if (!prisma) {
      res.status(503).json({ status: 'error', message: 'Database unavailable', request_id: reqId })
      return
    }
    
    // Verify admin
    const payload = verifyAdmin(req)
    if (!payload || !payload.sub) {
      res.status(401).json({ status: 'error', message: 'Unauthorized', request_id: reqId })
      return
    }
    
    // Check if user is admin
    try {
      const userRow = await prisma.$queryRawUnsafe(`SELECT user_id, role FROM users WHERE user_id = ${payload.sub} LIMIT 1`)
      if (!userRow || !Array.isArray(userRow) || userRow.length === 0 || userRow[0].role !== 'admin') {
        res.status(403).json({ status: 'error', message: 'Forbidden - Admin access required', request_id: reqId })
        return
      }
    } catch (e) {
      res.status(403).json({ status: 'error', message: 'Forbidden - Admin access required', request_id: reqId })
      return
    }
    
    // Ensure settings table exists
    try {
      await prisma.$executeRawUnsafe(
        'CREATE TABLE IF NOT EXISTS settings (\n'+
        '  setting_key TEXT PRIMARY KEY,\n'+
        '  setting_value TEXT NOT NULL,\n'+
        '  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP\n'+
        ')'
      )
    } catch (e) {
      console.log('Error ensuring settings table:', e.message)
    }
    
    if (req.method === 'GET') {
      try {
        const settings = await prisma.$queryRawUnsafe("SELECT setting_key, setting_value FROM settings")
        const settingsObj = {}
        if (Array.isArray(settings)) {
          settings.forEach(s => {
            settingsObj[s.setting_key] = s.setting_value
          })
        }
        res.status(200).json({ status: 'success', data: settingsObj, request_id: reqId })
      } catch (e) {
        res.status(500).json({ status: 'error', message: String(e.message || 'Failed to get settings'), request_id: reqId })
      }
      return
    }
    
    if (req.method === 'POST' || req.method === 'PUT') {
      const body = req.body || {}
      const expirationDays = parseInt(String(body.ad_expiration_days || '30'), 10)
      
      if (isNaN(expirationDays) || expirationDays < 1 || expirationDays > 365) {
        res.status(400).json({ status: 'error', message: 'Expiration days must be between 1 and 365', request_id: reqId })
        return
      }
      
      try {
        // Update or insert expiration days setting (SQLite syntax)
        const existing = await prisma.$queryRawUnsafe("SELECT setting_key FROM settings WHERE setting_key = 'ad_expiration_days' LIMIT 1")
        const expirationDaysStr = String(expirationDays)
        if (existing && Array.isArray(existing) && existing.length > 0) {
          await prisma.$executeRawUnsafe(`UPDATE settings SET setting_value = '${expirationDaysStr}', updated_at = CURRENT_TIMESTAMP WHERE setting_key = 'ad_expiration_days'`)
        } else {
          await prisma.$executeRawUnsafe(`INSERT INTO settings (setting_key, setting_value, updated_at) VALUES ('ad_expiration_days', '${expirationDaysStr}', CURRENT_TIMESTAMP)`)
        }
        
        res.status(200).json({ 
          status: 'success', 
          message: 'Settings updated successfully',
          data: { ad_expiration_days: expirationDays },
          request_id: reqId 
        })
      } catch (e) {
        res.status(500).json({ status: 'error', message: String(e.message || 'Failed to update settings'), request_id: reqId })
      }
      return
    }
    
    res.setHeader('Allow', ['GET', 'POST', 'PUT'])
    res.status(405).json({ status: 'error', message: 'Method Not Allowed', request_id: reqId })
  } catch (e) {
    res.status(500).json({ status: 'error', message: 'Internal Server Error', request_id: reqId })
  }
}
