import { getPrisma } from '../../../../db/client'
import logger from '../../../../lib/logger'
import { setNoCacheHeaders } from '../../../../lib/api-helpers'

function generateOrderNumber() {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `ORD-${timestamp}-${random}`
}

async function ensureTables(prisma) {
  try {
    // Create orders table
    await prisma.$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS orders (\n' +
      '  order_id INTEGER PRIMARY KEY AUTOINCREMENT,\n' +
      '  order_number TEXT UNIQUE NOT NULL,\n' +
      '  buyer_id INTEGER NULL,\n' +
      '  buyer_email TEXT NOT NULL,\n' +
      '  buyer_name TEXT NOT NULL,\n' +
      '  buyer_phone TEXT NOT NULL,\n' +
      '  shipping_full_name TEXT NOT NULL,\n' +
      '  shipping_email TEXT NOT NULL,\n' +
      '  shipping_phone TEXT NOT NULL,\n' +
      '  shipping_address TEXT NOT NULL,\n' +
      '  shipping_city TEXT NOT NULL,\n' +
      '  shipping_postal_code TEXT NOT NULL,\n' +
      '  payment_method TEXT DEFAULT \'cash_on_delivery\',\n' +
      '  status TEXT DEFAULT \'pending\',\n' +
      '  subtotal INTEGER NOT NULL,\n' +
      '  shipping_cost INTEGER NOT NULL,\n' +
      '  total INTEGER NOT NULL,\n' +
      '  notes TEXT NULL,\n' +
      '  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n' +
      '  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n' +
      '  FOREIGN KEY(buyer_id) REFERENCES users(user_id) ON DELETE SET NULL\n' +
      ')'
    )
    
    // Create indexes
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS orders_buyer_id_idx ON orders(buyer_id)')
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS orders_order_number_idx ON orders(order_number)')
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status)')
    
    // Create order_items table
    await prisma.$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS order_items (\n' +
      '  order_item_id INTEGER PRIMARY KEY AUTOINCREMENT,\n' +
      '  order_id INTEGER NOT NULL,\n' +
      '  post_id INTEGER NULL,\n' +
      '  title TEXT NOT NULL,\n' +
      '  price INTEGER NOT NULL,\n' +
      '  image_url TEXT NULL,\n' +
      '  location TEXT NULL,\n' +
      '  FOREIGN KEY(order_id) REFERENCES orders(order_id) ON DELETE CASCADE\n' +
      ')'
    )
    
    // Create indexes for order_items
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items(order_id)')
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS order_items_post_id_idx ON order_items(post_id)')
  } catch (e) {
    logger.error('Error ensuring orders tables:', e)
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

    // Ensure tables exist
    await ensureTables(prisma)

    if (req.method === 'GET') {
      // Get user ID from token if authenticated
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
        // Not authenticated, continue as guest
      }

      // Get query parameters
      const { order_number, email } = req.query

      // If order_number is provided, get specific order
      if (order_number) {
        const order = await prisma.$queryRaw`
          SELECT 
            o.order_id,
            o.order_number,
            o.buyer_id,
            o.buyer_email,
            o.buyer_name,
            o.buyer_phone,
            o.shipping_full_name,
            o.shipping_email,
            o.shipping_phone,
            o.shipping_address,
            o.shipping_city,
            o.shipping_postal_code,
            o.payment_method,
            o.status,
            o.subtotal,
            o.shipping_cost,
            o.total,
            o.notes,
            o.created_at,
            o.updated_at
          FROM orders o
          WHERE o.order_number = ${order_number}
        `
        
        if (!order || order.length === 0) {
          res.setHeader('Content-Type', 'application/json')
          setNoCacheHeaders(res)
          res.status(404).json({ status: 'error', message: 'Order not found', data: null, request_id: reqId })
          return
        }

        const orderData = order[0]
        
        // Verify access: must be the buyer (by user_id or email)
        if (userId && orderData.buyer_id && orderData.buyer_id !== userId) {
          res.setHeader('Content-Type', 'application/json')
          setNoCacheHeaders(res)
          res.status(403).json({ status: 'error', message: 'Access denied', data: null, request_id: reqId })
          return
        }
        
        // For guest access, verify email matches buyer_email or shipping_email (case-insensitive)
        if (!userId) {
          const providedEmail = (email || queryEmail || '').trim().toLowerCase()
          if (providedEmail) {
            const orderBuyerEmail = (orderData.buyer_email || '').trim().toLowerCase()
            const orderShippingEmail = (orderData.shipping_email || '').trim().toLowerCase()
            if (orderBuyerEmail !== providedEmail && orderShippingEmail !== providedEmail) {
              res.setHeader('Content-Type', 'application/json')
              setNoCacheHeaders(res)
              res.status(403).json({ status: 'error', message: 'Access denied', data: null, request_id: reqId })
              return
            }
          }
        }

        // Get order items
        const items = await prisma.$queryRaw`
          SELECT 
            oi.order_item_id,
            oi.order_id,
            oi.post_id,
            oi.title,
            oi.price,
            oi.image_url,
            oi.location
          FROM order_items oi
          WHERE oi.order_id = ${orderData.order_id}
          ORDER BY oi.order_item_id ASC
        `

        res.setHeader('Content-Type', 'application/json')
        setNoCacheHeaders(res)
        res.status(200).json({
          status: 'success',
          data: {
            ...orderData,
            items: items || []
          },
          request_id: reqId
        })
        return
      }

      // List orders - for authenticated users OR guests by email OR store orders (seller's orders)
      const { email: queryEmail, seller: isSeller } = req.query
      
      // Check if this is a request for store orders (seller's orders)
      if (isSeller === 'true' || isSeller === '1') {
        if (!userId) {
          res.setHeader('Content-Type', 'application/json')
          setNoCacheHeaders(res)
          res.status(401).json({ status: 'error', message: 'Authentication required for store orders', data: null, request_id: reqId })
          return
        }
        
        // Get orders where order items belong to seller's posts
        const storeOrdersQuery = `
          SELECT DISTINCT
            o.order_id,
            o.order_number,
            o.buyer_id,
            o.buyer_email,
            o.buyer_name,
            o.payment_method,
            o.status,
            o.total,
            o.created_at
          FROM orders o
          INNER JOIN order_items oi ON oi.order_id = o.order_id
          INNER JOIN posts p ON p.post_id = oi.post_id
          WHERE p.user_id = ${userId}
          ORDER BY o.created_at DESC
        `
        
        const storeOrders = await prisma.$queryRawUnsafe(storeOrdersQuery)
        
        res.setHeader('Content-Type', 'application/json')
        setNoCacheHeaders(res)
        res.status(200).json({
          status: 'success',
          data: storeOrders || [],
          request_id: reqId
        })
        return
      }
      
      // Get user email to match guest orders
      let userEmail = null
      if (userId) {
        try {
          const userRow = await prisma.$queryRawUnsafe(`SELECT email FROM users WHERE user_id = ${userId} LIMIT 1`)
          if (userRow && userRow.length > 0) {
            userEmail = userRow[0].email
          }
        } catch (e) {
          logger.error('Error fetching user email:', e)
        }
      } else if (queryEmail) {
        // Guest access by email
        userEmail = queryEmail
      } else {
        // No userId and no email - require authentication
        res.setHeader('Content-Type', 'application/json')
        setNoCacheHeaders(res)
        res.status(401).json({ status: 'error', message: 'Authentication required or email must be provided', data: null, request_id: reqId })
        return
      }

      // Get orders where buyer_id matches OR buyer_email/shipping_email matches (for guest orders)
      let ordersQuery = ''
      if (userId && userEmail) {
        // Authenticated user - get orders by user_id OR email (for guest orders with same email, case-insensitive)
        const normalizedEmail = userEmail.trim().toLowerCase().replace(/'/g, "''")
        ordersQuery = `
          SELECT 
            o.order_id,
            o.order_number,
            o.buyer_id,
            o.buyer_email,
            o.buyer_name,
            o.payment_method,
            o.status,
            o.total,
            o.created_at
          FROM orders o
          WHERE o.buyer_id = ${userId} OR LOWER(TRIM(o.buyer_email)) = '${normalizedEmail}' OR LOWER(TRIM(o.shipping_email)) = '${normalizedEmail}'
          ORDER BY o.created_at DESC
        `
      } else if (userEmail) {
        // Guest user - get orders by email only (case-insensitive)
        const normalizedEmail = userEmail.trim().toLowerCase().replace(/'/g, "''")
        ordersQuery = `
          SELECT 
            o.order_id,
            o.order_number,
            o.buyer_id,
            o.buyer_email,
            o.buyer_name,
            o.payment_method,
            o.status,
            o.total,
            o.created_at
          FROM orders o
          WHERE LOWER(TRIM(o.buyer_email)) = '${normalizedEmail}' OR LOWER(TRIM(o.shipping_email)) = '${normalizedEmail}'
          ORDER BY o.created_at DESC
        `
      } else {
        // Fallback - only by user_id
        ordersQuery = `
          SELECT 
            o.order_id,
            o.order_number,
            o.buyer_id,
            o.buyer_email,
            o.buyer_name,
            o.payment_method,
            o.status,
            o.total,
            o.created_at
          FROM orders o
          WHERE o.buyer_id = ${userId}
          ORDER BY o.created_at DESC
        `
      }

      const orders = await prisma.$queryRawUnsafe(ordersQuery)

      res.setHeader('Content-Type', 'application/json')
      setNoCacheHeaders(res)
      res.status(200).json({
        status: 'success',
        data: orders || [],
        request_id: reqId
      })
      return
    }

    if (req.method === 'POST') {
      // Ensure tables exist
      await ensureTables(prisma)
      const {
        items,
        buyer_id,
        shipping,
        paymentMethod,
        notes,
        subtotal,
        shipping_cost,
        total
      } = req.body

      // Validate required fields
      if (!items || !Array.isArray(items) || items.length === 0) {
        res.setHeader('Content-Type', 'application/json')
        setNoCacheHeaders(res)
        res.status(400).json({ status: 'error', message: 'Items are required', data: null, request_id: reqId })
        return
      }

      if (!shipping || !shipping.fullName || !shipping.email || !shipping.phone || !shipping.address || !shipping.city || !shipping.postalCode) {
        res.setHeader('Content-Type', 'application/json')
        setNoCacheHeaders(res)
        res.status(400).json({ status: 'error', message: 'Shipping information is required', data: null, request_id: reqId })
        return
      }

      // Get buyer info if authenticated
      // Normalize email to lowercase and trim for consistent matching
      let buyerEmail = (shipping.email || '').trim().toLowerCase()
      let buyerName = (shipping.fullName || '').trim()
      let buyerPhone = (shipping.phone || '').trim()

      if (buyer_id) {
        try {
          const user = await prisma.$queryRaw`
            SELECT email, name, phone FROM users WHERE user_id = ${buyer_id}
          `
          if (user && user.length > 0) {
            buyerEmail = (user[0].email || shipping.email || '').trim().toLowerCase()
            buyerName = (user[0].name || shipping.fullName || '').trim()
            buyerPhone = (user[0].phone || shipping.phone || '').trim()
          }
        } catch (e) {
          logger.error('Error fetching buyer info:', e)
        }
      }
      
      // Also normalize shipping email
      const shippingEmail = (shipping.email || '').trim().toLowerCase()

      // Generate order number
      const orderNumber = generateOrderNumber()

      // Create order
      try {
        await prisma.$executeRaw`
          INSERT INTO orders (
            order_number,
            buyer_id,
            buyer_email,
            buyer_name,
            buyer_phone,
            shipping_full_name,
            shipping_email,
            shipping_phone,
            shipping_address,
            shipping_city,
            shipping_postal_code,
            payment_method,
            status,
            subtotal,
            shipping_cost,
            total,
            notes,
            created_at,
            updated_at
          ) VALUES (
            ${orderNumber},
            ${buyer_id || null},
            ${buyerEmail},
            ${buyerName},
            ${buyerPhone},
            ${shipping.fullName},
            ${shippingEmail},
            ${shipping.phone},
            ${shipping.address},
            ${shipping.city},
            ${shipping.postalCode},
            ${paymentMethod || 'cash_on_delivery'},
            'pending',
            ${subtotal || 0},
            ${shipping_cost || 0},
            ${total || 0},
            ${notes || null},
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
          )
        `

        // Get the created order
        const createdOrder = await prisma.$queryRaw`
          SELECT order_id FROM orders WHERE order_number = ${orderNumber}
        `
        const orderId = createdOrder && createdOrder.length > 0 ? createdOrder[0].order_id : null

        if (!orderId) {
          throw new Error('Failed to retrieve created order')
        }

        // Create order items
        for (const item of items) {
          await prisma.$executeRaw`
            INSERT INTO order_items (
              order_id,
              post_id,
              title,
              price,
              image_url,
              location
            ) VALUES (
              ${orderId},
              ${item.post_id || null},
              ${item.title || 'Untitled'},
              ${item.price || 0},
              ${item.image || null},
              ${item.location || null}
            )
          `
        }

        // Get the complete order with items
        const order = await prisma.$queryRaw`
          SELECT 
            o.order_id,
            o.order_number,
            o.buyer_id,
            o.buyer_email,
            o.buyer_name,
            o.buyer_phone,
            o.shipping_full_name,
            o.shipping_email,
            o.shipping_phone,
            o.shipping_address,
            o.shipping_city,
            o.shipping_postal_code,
            o.payment_method,
            o.status,
            o.subtotal,
            o.shipping_cost,
            o.total,
            o.notes,
            o.created_at,
            o.updated_at
          FROM orders o
          WHERE o.order_id = ${orderId}
        `

        const itemsData = await prisma.$queryRaw`
          SELECT 
            oi.order_item_id,
            oi.order_id,
            oi.post_id,
            oi.title,
            oi.price,
            oi.image_url,
            oi.location
          FROM order_items oi
          WHERE oi.order_id = ${orderId}
          ORDER BY oi.order_item_id ASC
        `

        res.setHeader('Content-Type', 'application/json')
        setNoCacheHeaders(res)
        res.status(201).json({
          status: 'success',
          data: {
            ...order[0],
            items: itemsData || []
          },
          request_id: reqId
        })
      } catch (e) {
        logger.error('Error creating order:', e)
        res.setHeader('Content-Type', 'application/json')
        setNoCacheHeaders(res)
        res.status(500).json({ status: 'error', message: 'Failed to create order', data: null, request_id: reqId })
      }
      return
    }

    res.setHeader('Content-Type', 'application/json')
    setNoCacheHeaders(res)
    res.status(405).json({ status: 'error', message: 'Method not allowed', data: null, request_id: reqId })
  } catch (e) {
    logger.error('Orders API error:', e)
    res.setHeader('Content-Type', 'application/json')
    setNoCacheHeaders(res)
    res.status(500).json({ status: 'error', message: 'Internal server error', data: null, request_id: reqId })
  }
}
