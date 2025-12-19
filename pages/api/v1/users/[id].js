import { randomUUID } from 'crypto'
import { getPrisma } from '../../../../db/client'

export default async function handler(req, res){
  const reqId = req.headers['x-request-id'] || randomUUID()
  try{
    res.setHeader('Access-Control-Allow-Origin','*')
    res.setHeader('Access-Control-Allow-Methods','GET, PATCH, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers','Content-Type, X-Requested-With, X-Request-Id')
    if (req.method === 'OPTIONS'){ res.status(204).end(); return }
    const id = parseInt(String(req.query.id||''),10)
    if (Number.isNaN(id)){ res.status(400).json({ status:'error', message:'Invalid id', data:null, request_id:reqId }); return }
    if (req.method === 'GET'){
      const prisma = getPrisma()
      if (!prisma){ res.setHeader('Content-Type','application/json'); res.status(503).json({ status:'error', message:'Database unavailable', data:null, request_id:reqId }); return }
      const item = await prisma.user.findUnique({ where: { user_id: id } })
      if (!item){ res.status(404).json({ status:'error', message:'Not found', data:null, request_id:reqId }); return }
      res.setHeader('Content-Type','application/json')
      res.status(200).json({ data: item, request_id: reqId })
      return
    }
    if (req.method === 'PATCH'){
      const patch = req.body || {}
      console.log('PATCH request received:', { id, body: patch })
      const prisma = getPrisma()
      if (!prisma){ res.setHeader('Content-Type','application/json'); res.status(503).json({ status:'error', message:'Database unavailable', data:null, request_id:reqId }); return }
      const data = {}
      if (typeof patch.username === 'string') data.username = patch.username
      if (typeof patch.name === 'string') data.name = patch.name
      if (typeof patch.email === 'string') data.email = patch.email
      if (typeof patch.phone === 'string') data.phone = patch.phone
      if (typeof patch.gender === 'string') data.gender = patch.gender
      if (typeof patch.password_hash === 'string') data.password_hash = patch.password_hash
      if (typeof patch.status === 'string') data.status = patch.status
      if (typeof patch.role === 'string') data.role = patch.role
      console.log('Processed data object:', data)
      
      if (Object.keys(data).length === 0) {
        res.setHeader('Content-Type','application/json')
        res.status(400).json({ status:'error', message:'No valid fields to update', data:null, request_id:reqId })
        return
      }
      
      try {
        // Use raw SQL directly for more reliability (especially for role/status fields)
        const updates = []
        const values = []
        
        if (data.username) {
          updates.push(`username = ?`)
          values.push(data.username)
        }
        if (data.name !== undefined) {
          updates.push(`name = ?`)
          values.push(data.name === null ? null : data.name)
        }
        if (data.email) {
          updates.push(`email = ?`)
          values.push(data.email)
        }
        if (data.phone !== undefined) {
          updates.push(`phone = ?`)
          values.push(data.phone === null ? null : data.phone)
        }
        if (data.gender !== undefined) {
          updates.push(`gender = ?`)
          values.push(data.gender === null ? null : data.gender)
        }
        if (data.password_hash) {
          updates.push(`password_hash = ?`)
          values.push(data.password_hash)
        }
        if (data.status) {
          updates.push(`status = ?`)
          values.push(data.status)
        }
        if (data.role) {
          updates.push(`role = ?`)
          values.push(data.role)
        }
        
        if (updates.length === 0) {
          res.setHeader('Content-Type','application/json')
          res.status(400).json({ status:'error', message:'No valid fields to update', data:null, request_id:reqId })
          return
        }
        
        // Ensure role and status columns exist before updating
        try {
          // Try to add role column if it doesn't exist (SQLite will ignore if it exists)
          await prisma.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'`)
          console.log('Role column added or already exists')
        } catch (alterError) {
          // Column already exists or other error - that's okay, continue
          if (alterError.message && !alterError.message.includes('duplicate column name') && !alterError.message.includes('duplicate')) {
            console.log('Note: role column check:', alterError.message)
          }
        }
        
        try {
          // Try to add status column if it doesn't exist
          await prisma.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'`)
          console.log('Status column added or already exists')
        } catch (alterError) {
          // Column already exists or other error - that's okay, continue
          if (alterError.message && !alterError.message.includes('duplicate column name') && !alterError.message.includes('duplicate')) {
            console.log('Note: status column check:', alterError.message)
          }
        }
        
        // Use raw SQL for SQLite - more reliable
        const sql = `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`
        values.push(id)
        
        console.log('Updating user with SQL:', sql)
        console.log('SQL Values:', values)
        console.log('User ID:', id)
        console.log('Data to update:', data)
        
        try {
          const result = await prisma.$executeRawUnsafe(sql, ...values)
          console.log('Update result (rows affected):', result)
        } catch (sqlError) {
          console.error('SQL Update Error:', sqlError)
          throw sqlError
        }
        
        // Fetch updated user using raw SQL to ensure we get all fields including role/status
        // Use COALESCE to handle NULL values and ensure we get defaults
        const fetchSql = `SELECT 
          user_id, 
          username, 
          name, 
          email, 
          phone, 
          gender, 
          password_hash, 
          COALESCE(status, 'active') as status, 
          COALESCE(role, 'user') as role, 
          created_at 
        FROM users WHERE user_id = ?`
        
        const rows = await prisma.$queryRawUnsafe(fetchSql, id)
        const updated = Array.isArray(rows) && rows.length > 0 ? rows[0] : null
        console.log('Fetched updated user:', updated)
        console.log('Updated user role:', updated?.role)
        console.log('Updated user status:', updated?.status)
        
        if (!updated) {
          res.setHeader('Content-Type','application/json')
          res.status(404).json({ status:'error', message:'User not found after update', data:null, request_id:reqId })
          return
        }
        
        res.setHeader('Content-Type','application/json')
        res.status(200).json({ data: updated, request_id: reqId })
      } catch (updateError) {
        console.error('Error updating user:', updateError)
        res.setHeader('Content-Type','application/json')
        res.status(500).json({ 
          status:'error', 
          message: updateError?.message || 'Failed to update user', 
          data:null, 
          request_id:reqId,
          error: String(updateError)
        })
      }
      return
    }
    if (req.method === 'DELETE'){
      const prisma = getPrisma()
      if (!prisma){ res.setHeader('Content-Type','application/json'); res.status(503).json({ status:'error', message:'Database unavailable', data:null, request_id:reqId }); return }
      await prisma.user.delete({ where: { user_id: id } })
      const ok = true
      res.setHeader('Content-Type','application/json')
      res.status(ok?200:404).json({ data: ok?{ deleted:true }:null, status: ok?undefined:'error', message: ok?undefined:'Not found', request_id:reqId })
      return
    }
    res.setHeader('Allow',['GET','PATCH','DELETE'])
    res.status(405).json({ status:'error', message:'Method Not Allowed', data:null, request_id:reqId })
  }catch(e){ 
    console.error('Error in users/[id] API:', e)
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