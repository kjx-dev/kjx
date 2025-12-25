import { randomUUID } from 'crypto'
import { getPrisma } from '../../../../../db/client'

export default async function handler(req, res) {
  const reqId = req.headers['x-request-id'] || randomUUID()
  
  try {
    const prisma = getPrisma()
    if (!prisma) {
      res.setHeader('Content-Type', 'application/json')
      res.status(503).json({ status: 'error', message: 'Database unavailable', data: null, request_id: reqId })
      return
    }

    if (req.method === 'POST') {
      if (req.headers['content-type'] && !String(req.headers['content-type']).includes('application/json')) {
        res.status(415).json({ status: 'error', message: 'Content-Type must be application/json', data: null, request_id: reqId })
        return
      }

      const body = req.body || {}
      const { name, description, icon, parent_id } = body

      // Validate required fields
      if (!name || !String(name).trim()) {
        res.setHeader('Content-Type', 'application/json')
        res.status(400).json({ status: 'error', message: 'Category name is required', data: null, request_id: reqId })
        return
      }

      // Check if category with same name already exists
      const existing = await prisma.category.findUnique({
        where: { name: String(name).trim() }
      })

      if (existing) {
        res.setHeader('Content-Type', 'application/json')
        res.status(409).json({ status: 'error', message: 'Category with this name already exists', data: null, request_id: reqId })
        return
      }

      // Validate parent_id if provided
      if (parent_id !== null && parent_id !== undefined) {
        const parentId = parseInt(String(parent_id), 10)
        if (isNaN(parentId)) {
          res.setHeader('Content-Type', 'application/json')
          res.status(400).json({ status: 'error', message: 'Invalid parent_id', data: null, request_id: reqId })
          return
        }

        const parent = await prisma.category.findUnique({
          where: { category_id: parentId }
        })

        if (!parent) {
          res.setHeader('Content-Type', 'application/json')
          res.status(404).json({ status: 'error', message: 'Parent category not found', data: null, request_id: reqId })
          return
        }
      }

      // Create category
      const categoryData = {
        name: String(name).trim(),
        description: description ? String(description).trim() : null,
        icon: icon ? String(icon).trim() : 'fa-tags',
        parent_id: parent_id !== null && parent_id !== undefined ? parseInt(String(parent_id), 10) : null
      }

      const created = await prisma.category.create({
        data: categoryData
      })

      res.setHeader('Content-Type', 'application/json')
      res.status(201).json({ data: created, request_id: reqId })
      return
    }

    res.setHeader('Allow', ['POST'])
    res.status(405).json({ status: 'error', message: 'Method Not Allowed', data: null, request_id: reqId })
  } catch (e) {
    console.error('Error in admin categories API:', e)
    res.setHeader('Content-Type', 'application/json')
    res.status(500).json({ status: 'error', message: 'Internal Server Error', data: null, request_id: reqId })
  }
}

