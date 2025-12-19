import { randomUUID } from 'crypto'
import { getPrisma } from '../../../../../db/client'

export default async function handler(req, res){
  const reqId = req.headers['x-request-id'] || randomUUID()
  try{
    res.setHeader('Access-Control-Allow-Origin','*')
    res.setHeader('Access-Control-Allow-Methods','GET, POST, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers','Content-Type, X-Requested-With, X-Request-Id')
    if (req.method === 'OPTIONS'){ res.status(204).end(); return }
    
    const prisma = getPrisma()
    if (!prisma){ 
      res.setHeader('Content-Type','application/json')
      res.status(503).json({ status:'error', message:'Database unavailable', data:null, request_id:reqId })
      return 
    }

    if (req.method === 'GET'){
      const { role } = req.query || {}
      
      try {
        // Check if rolePermission model exists, if not use raw SQL
        if (!prisma.rolePermission) {
          throw new Error('Model not available, using raw SQL')
        }
        
        if (role) {
          // Get permissions for a specific role
          const permissions = await prisma.rolePermission.findMany({
            where: { role: String(role) }
          })
          res.setHeader('Content-Type','application/json')
          res.status(200).json({ data: permissions, request_id: reqId })
          return
        } else {
          // Get all permissions grouped by role
          const allPermissions = await prisma.rolePermission.findMany({
            orderBy: [{ role: 'asc' }, { resource: 'asc' }, { action: 'asc' }]
          })
          
          // Group by role
          const grouped = {}
          for (const perm of allPermissions) {
            if (!grouped[perm.role]) {
              grouped[perm.role] = []
            }
            grouped[perm.role].push(perm)
          }
          
          res.setHeader('Content-Type','application/json')
          res.status(200).json({ data: grouped, request_id: reqId })
          return
        }
      } catch (prismaError) {
        // Fallback to raw SQL if Prisma Client doesn't recognize the model
        try {
          const sql = role 
            ? `SELECT permission_id, role, resource, action, created_at FROM role_permissions WHERE role = ? ORDER BY role, resource, action`
            : `SELECT permission_id, role, resource, action, created_at FROM role_permissions ORDER BY role, resource, action`
          
          const params = role ? [String(role)] : []
          const rows = await prisma.$queryRawUnsafe(sql, ...params)
          
          if (role) {
            res.setHeader('Content-Type','application/json')
            res.status(200).json({ data: rows || [], request_id: reqId })
          } else {
            const grouped = {}
            for (const perm of (rows || [])) {
              const r = String(perm.role || '')
              if (!grouped[r]) grouped[r] = []
              grouped[r].push(perm)
            }
            res.setHeader('Content-Type','application/json')
            res.status(200).json({ data: grouped, request_id: reqId })
          }
          return
        } catch (sqlError) {
          console.error('SQL fallback also failed:', sqlError)
          res.setHeader('Content-Type','application/json')
          res.status(500).json({ 
            status:'error', 
            message: sqlError?.message || 'Failed to fetch permissions', 
            data:null, 
            request_id:reqId 
          })
          return
        }
      }
    }

    if (req.method === 'POST'){
      const { role, resource, action } = req.body || {}
      if (!role || !resource || !action) {
        res.status(400).json({ status:'error', message:'role, resource, and action are required', data:null, request_id:reqId })
        return
      }

      try {
        // Check if permission already exists using raw SQL (more reliable)
        let existing = null
        try {
          if (prisma.rolePermission) {
            existing = await prisma.rolePermission.findFirst({
              where: {
                role: String(role),
                resource: String(resource),
                action: String(action)
              }
            })
          }
        } catch (_) {
          // Ignore, will use SQL fallback
        }
        
        if (!existing) {
          // Try raw SQL to check
          try {
            const sql = `SELECT permission_id, role, resource, action, created_at FROM role_permissions WHERE role = ? AND resource = ? AND action = ? LIMIT 1`
            const rows = await prisma.$queryRawUnsafe(sql, String(role), String(resource), String(action))
            existing = Array.isArray(rows) && rows.length > 0 ? rows[0] : null
          } catch (_) {
            // Table might not exist yet, that's okay
          }
        }
        
        let permission
        if (existing) {
          permission = existing
        } else {
          // Create new permission using raw SQL
          try {
            const sql = `INSERT INTO role_permissions (role, resource, action, created_at) VALUES (?, ?, ?, datetime('now'))`
            await prisma.$executeRawUnsafe(sql, String(role), String(resource), String(action))
            // Fetch the created record
            const fetchSql = `SELECT permission_id, role, resource, action, created_at FROM role_permissions WHERE role = ? AND resource = ? AND action = ? LIMIT 1`
            const rows = await prisma.$queryRawUnsafe(fetchSql, String(role), String(resource), String(action))
            permission = Array.isArray(rows) && rows.length > 0 ? rows[0] : { 
              permission_id: null,
              role: String(role), 
              resource: String(resource), 
              action: String(action),
              created_at: new Date().toISOString()
            }
          } catch (createError) {
            // If table doesn't exist, try to create it first
            if (createError.message && createError.message.includes('no such table')) {
              try {
                await prisma.$executeRawUnsafe(`
                  CREATE TABLE IF NOT EXISTS role_permissions (
                    permission_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    role TEXT NOT NULL,
                    resource TEXT NOT NULL,
                    action TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(role, resource, action)
                  )
                `)
                // Retry insert
                const sql = `INSERT INTO role_permissions (role, resource, action, created_at) VALUES (?, ?, ?, datetime('now'))`
                await prisma.$executeRawUnsafe(sql, String(role), String(resource), String(action))
                const fetchSql = `SELECT permission_id, role, resource, action, created_at FROM role_permissions WHERE role = ? AND resource = ? AND action = ? LIMIT 1`
                const rows = await prisma.$queryRawUnsafe(fetchSql, String(role), String(resource), String(action))
                permission = Array.isArray(rows) && rows.length > 0 ? rows[0] : { 
                  permission_id: null,
                  role: String(role), 
                  resource: String(resource), 
                  action: String(action),
                  created_at: new Date().toISOString()
                }
              } catch (retryError) {
                throw createError
              }
            } else {
              throw createError
            }
          }
        }
        res.setHeader('Content-Type','application/json')
        res.status(200).json({ data: permission, request_id: reqId })
      } catch (err) {
        console.error('Error creating permission:', err)
        res.setHeader('Content-Type','application/json')
        res.status(500).json({ status:'error', message: err?.message || 'Failed to create permission', data:null, request_id:reqId })
      }
      return
    }

    if (req.method === 'DELETE'){
      const { role, resource, action } = req.query || {}
      if (!role || !resource || !action) {
        res.status(400).json({ status:'error', message:'role, resource, and action are required', data:null, request_id:reqId })
        return
      }

      try {
        // Use raw SQL directly (more reliable)
        const sql = `DELETE FROM role_permissions WHERE role = ? AND resource = ? AND action = ?`
        await prisma.$executeRawUnsafe(sql, String(role), String(resource), String(action))
        res.setHeader('Content-Type','application/json')
        res.status(200).json({ data: { deleted: true }, request_id: reqId })
      } catch (err) {
        console.error('Error deleting permission:', err)
        res.setHeader('Content-Type','application/json')
        res.status(500).json({ status:'error', message: err?.message || 'Failed to delete permission', data:null, request_id:reqId })
      }
      return
    }

    res.setHeader('Allow',['GET','POST','DELETE'])
    res.status(405).json({ status:'error', message:'Method Not Allowed', data:null, request_id:reqId })
  }catch(e){ 
    console.error('Error in permissions API:', e)
    res.setHeader('Content-Type','application/json')
    res.status(500).json({ 
      status:'error', 
      message: e?.message || 'Internal Server Error', 
      data:null, 
      request_id:reqId,
      error: String(e)
    }) 
  }
}

