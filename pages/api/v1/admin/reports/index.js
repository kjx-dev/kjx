import { getPrisma } from '../../../../../db/client'
import logger from '../../../../../lib/logger'
import { setNoCacheHeaders } from '../../../../../lib/api-helpers'

async function ensureTables(prisma) {
  try {
    // Ensure post_flags table exists
    await prisma.$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS post_flags (\n' +
      '  flag_id INTEGER PRIMARY KEY AUTOINCREMENT,\n' +
      '  post_id INTEGER NOT NULL,\n' +
      '  author TEXT,\n' +
      '  reason TEXT NOT NULL,\n' +
      '  details TEXT,\n' +
      '  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n' +
      '  FOREIGN KEY(post_id) REFERENCES posts(post_id) ON DELETE CASCADE\n' +
      ')'
    )
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS post_flags_post_id_idx ON post_flags(post_id)')
  } catch (e) {
    logger.error('Error ensuring tables:', e)
  }
}

export default async function handler(req, res) {
  const reqId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  try {
    const prisma = getPrisma()
    if (!prisma) {
      res.setHeader('Content-Type', 'application/json')
      setNoCacheHeaders(res)
      res.status(503).json({ status: 'error', message: 'Database unavailable', data: null, request_id: reqId })
      return
    }

    await ensureTables(prisma)

    // Check authentication and admin status
    let userId = null
    try {
      const authHeader = req.headers.authorization
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const parts = String(token || '').split('.')
        if (parts.length >= 3) {
          const data = parts[1]
          const pad = data.length % 4 === 2 ? '==' : data.length % 4 === 3 ? '=' : ''
          const norm = data.replace(/-/g, '+').replace(/_/g, '/') + pad
          const json = JSON.parse(Buffer.from(norm, 'base64').toString())
          userId = json && json.sub ? parseInt(json.sub) : null
        }
      }
    } catch (_) {
      // Not authenticated
    }

    if (!userId) {
      res.setHeader('Content-Type', 'application/json')
      setNoCacheHeaders(res)
      res.status(401).json({ status: 'error', message: 'Unauthorized', data: null, request_id: reqId })
      return
    }

    // Check if user is admin by querying database
    try {
      const userRow = await prisma.$queryRawUnsafe(`SELECT user_id, role FROM users WHERE user_id = ${userId} LIMIT 1`)
      if (!userRow || !Array.isArray(userRow) || userRow.length === 0 || userRow[0].role !== 'admin') {
        res.setHeader('Content-Type', 'application/json')
        setNoCacheHeaders(res)
        res.status(403).json({ status: 'error', message: 'Admin access required', data: null, request_id: reqId })
        return
      }
    } catch (e) {
      logger.error('Error checking admin status:', e)
      res.setHeader('Content-Type', 'application/json')
      setNoCacheHeaders(res)
      res.status(403).json({ status: 'error', message: 'Admin access required', data: null, request_id: reqId })
      return
    }

    if (req.method === 'GET') {
      const { minReports = 1, reason = 'spam' } = req.query
      const minReportsNum = parseInt(minReports, 10) || 1

      // Get posts with multiple spam reports
      // Match spam-related reasons (case-insensitive, includes "Spam or misleading")
      const reportedPosts = await prisma.$queryRawUnsafe(`
        SELECT 
          p.post_id,
          p.title,
          p.content,
          p.price,
          p.location,
          p.status,
          p.created_at,
          p.user_id,
          COUNT(pf.flag_id) as report_count,
          MAX(pf.created_at) as last_report_date
        FROM posts p
        INNER JOIN post_flags pf ON p.post_id = pf.post_id
        WHERE LOWER(pf.reason) LIKE '%spam%' OR pf.reason = '${reason.replace(/'/g, "''")}'
        GROUP BY p.post_id
        HAVING COUNT(pf.flag_id) >= ${minReportsNum}
        ORDER BY report_count DESC, last_report_date DESC
      `)

      // Get user information for each post
      const postsWithUsers = await Promise.all(
        (reportedPosts || []).map(async (post) => {
          let user = null
          if (post.user_id) {
            try {
              const userData = await prisma.$queryRaw`
                SELECT user_id, username, email, name, phone, role, status
                FROM users
                WHERE user_id = ${post.user_id}
              `
              if (userData && userData.length > 0) {
                user = userData[0]
              }
            } catch (e) {
              logger.error('Error fetching user:', e)
            }
          }

          // Get all flags for this post (spam-related)
          let flags = []
          try {
            flags = await prisma.$queryRawUnsafe(`
              SELECT flag_id, author, reason, details, created_at
              FROM post_flags
              WHERE post_id = ${post.post_id} AND (LOWER(reason) LIKE '%spam%' OR reason = '${reason.replace(/'/g, "''")}')
              ORDER BY created_at DESC
            `)
          } catch (e) {
            logger.error('Error fetching flags:', e)
          }

          return {
            ...post,
            report_count: Number(post.report_count || 0),
            user: user,
            flags: flags || []
          }
        })
      )

      res.setHeader('Content-Type', 'application/json')
      setNoCacheHeaders(res)
      res.status(200).json({
        status: 'success',
        data: postsWithUsers,
        request_id: reqId
      })
      return
    }

    if (req.method === 'POST') {
      // Take action on reported post
      const { action, post_id, user_id, reason } = req.body

      if (!action || !post_id) {
        res.setHeader('Content-Type', 'application/json')
        setNoCacheHeaders(res)
        res.status(400).json({ status: 'error', message: 'Action and post_id are required', data: null, request_id: reqId })
        return
      }

      try {
        if (action === 'delete_post') {
          // Delete the post (cascade will delete flags)
          await prisma.$executeRaw`DELETE FROM posts WHERE post_id = ${post_id}`
          logger.info(`Admin ${userId} deleted post ${post_id} due to spam reports`)
        } else if (action === 'ban_user' && user_id) {
          // Ban the user
          await prisma.$executeRaw`UPDATE users SET status = 'banned' WHERE user_id = ${user_id}`
          logger.info(`Admin ${userId} banned user ${user_id} due to spam reports`)
        } else if (action === 'delete_and_ban' && user_id) {
          // Delete post and ban user
          await prisma.$executeRaw`DELETE FROM posts WHERE post_id = ${post_id}`
          await prisma.$executeRaw`UPDATE users SET status = 'banned' WHERE user_id = ${user_id}`
          logger.info(`Admin ${userId} deleted post ${post_id} and banned user ${user_id} due to spam reports`)
        } else if (action === 'dismiss_reports') {
          // Delete all spam reports for this post (spam-related reasons)
          await prisma.$executeRawUnsafe(`DELETE FROM post_flags WHERE post_id = ${post_id} AND (LOWER(reason) LIKE '%spam%' OR reason = '${(reason || 'spam').replace(/'/g, "''")}')`)
          logger.info(`Admin ${userId} dismissed spam reports for post ${post_id}`)
        } else if (action === 'change_status') {
          // Change post status (e.g., to 'pending' or 'rejected')
          const newStatus = req.body.new_status || 'pending'
          await prisma.$executeRaw`UPDATE posts SET status = ${newStatus} WHERE post_id = ${post_id}`
          logger.info(`Admin ${userId} changed post ${post_id} status to ${newStatus}`)
        } else {
          res.setHeader('Content-Type', 'application/json')
          setNoCacheHeaders(res)
          res.status(400).json({ status: 'error', message: 'Invalid action', data: null, request_id: reqId })
          return
        }

        res.setHeader('Content-Type', 'application/json')
        setNoCacheHeaders(res)
        res.status(200).json({
          status: 'success',
          message: 'Action completed successfully',
          data: { action, post_id, user_id },
          request_id: reqId
        })
      } catch (e) {
        logger.error('Error taking action on reported post:', e)
        res.setHeader('Content-Type', 'application/json')
        setNoCacheHeaders(res)
        res.status(500).json({ status: 'error', message: 'Failed to execute action', data: null, request_id: reqId })
      }
      return
    }

    res.setHeader('Content-Type', 'application/json')
    setNoCacheHeaders(res)
    res.status(405).json({ status: 'error', message: 'Method not allowed', data: null, request_id: reqId })
  } catch (e) {
    logger.error('Reports API error:', e)
    res.setHeader('Content-Type', 'application/json')
    setNoCacheHeaders(res)
    res.status(500).json({ status: 'error', message: 'Internal server error', data: null, request_id: reqId })
  }
}
