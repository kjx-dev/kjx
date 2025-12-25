import { randomUUID } from 'crypto'
import { getPrisma } from '../../../../../db/client'

export default async function handler(req, res) {
  const reqId = req.headers['x-request-id'] || randomUUID()
  
  try {
    const idRaw = (req.query.id || '').toString()
    const id = parseInt(idRaw, 10)
    
    if (isNaN(id)) {
      res.setHeader('Content-Type', 'application/json')
      res.status(400).json({ status: 'error', message: 'Invalid category id', data: null, request_id: reqId })
      return
    }

    const prisma = getPrisma()
    if (!prisma) {
      res.setHeader('Content-Type', 'application/json')
      res.status(503).json({ status: 'error', message: 'Database unavailable', data: null, request_id: reqId })
      return
    }

    // Check if category exists
    const existing = await prisma.category.findUnique({
      where: { category_id: id }
    })

    if (!existing) {
      res.setHeader('Content-Type', 'application/json')
      res.status(404).json({ status: 'error', message: 'Category not found', data: null, request_id: reqId })
      return
    }

    if (req.method === 'PATCH') {
      if (req.headers['content-type'] && !String(req.headers['content-type']).includes('application/json')) {
        res.status(415).json({ status: 'error', message: 'Content-Type must be application/json', data: null, request_id: reqId })
        return
      }

      const body = req.body || {}
      const { name, description, icon, parent_id } = body

      // Build update data object
      const updateData = {}

      if (name !== undefined) {
        const trimmedName = String(name).trim()
        if (!trimmedName) {
          res.setHeader('Content-Type', 'application/json')
          res.status(400).json({ status: 'error', message: 'Category name cannot be empty', data: null, request_id: reqId })
          return
        }

        // Check if another category with this name exists
        const nameConflict = await prisma.category.findFirst({
          where: {
            name: trimmedName,
            category_id: { not: id }
          }
        })

        if (nameConflict) {
          res.setHeader('Content-Type', 'application/json')
          res.status(409).json({ status: 'error', message: 'Category with this name already exists', data: null, request_id: reqId })
          return
        }

        updateData.name = trimmedName
      }

      if (description !== undefined) {
        updateData.description = description ? String(description).trim() : null
      }

      if (icon !== undefined) {
        updateData.icon = icon ? String(icon).trim() : 'fa-tags'
      }

      if (parent_id !== undefined) {
        if (parent_id === null || parent_id === '') {
          updateData.parent_id = null
        } else {
          const parentId = parseInt(String(parent_id), 10)
          if (isNaN(parentId)) {
            res.setHeader('Content-Type', 'application/json')
            res.status(400).json({ status: 'error', message: 'Invalid parent_id', data: null, request_id: reqId })
            return
          }

          // Prevent setting itself as parent
          if (parentId === id) {
            res.setHeader('Content-Type', 'application/json')
            res.status(400).json({ status: 'error', message: 'Category cannot be its own parent', data: null, request_id: reqId })
            return
          }

          // Check if parent exists
          const parent = await prisma.category.findUnique({
            where: { category_id: parentId }
          })

          if (!parent) {
            res.setHeader('Content-Type', 'application/json')
            res.status(404).json({ status: 'error', message: 'Parent category not found', data: null, request_id: reqId })
            return
          }

          // Prevent circular references (check if the parent is a descendant of this category)
          const checkCircular = async (categoryId, targetId) => {
            const category = await prisma.category.findUnique({
              where: { category_id: categoryId },
              include: { children: true }
            })
            if (!category) return false
            if (category.category_id === targetId) return true
            for (const child of category.children || []) {
              if (await checkCircular(child.category_id, targetId)) return true
            }
            return false
          }

          if (await checkCircular(parentId, id)) {
            res.setHeader('Content-Type', 'application/json')
            res.status(400).json({ status: 'error', message: 'Circular reference detected: cannot set a descendant as parent', data: null, request_id: reqId })
            return
          }

          updateData.parent_id = parentId
        }
      }

      // Update category
      const updated = await prisma.category.update({
        where: { category_id: id },
        data: updateData
      })

      res.setHeader('Content-Type', 'application/json')
      res.status(200).json({ data: updated, request_id: reqId })
      return
    }

    if (req.method === 'DELETE') {
      // Check if category has children
      const children = await prisma.category.findMany({
        where: { parent_id: id }
      })

      if (children.length > 0) {
        res.setHeader('Content-Type', 'application/json')
        res.status(400).json({ 
          status: 'error', 
          message: `Cannot delete category: it has ${children.length} child categor${children.length === 1 ? 'y' : 'ies'}. Please delete or reassign them first.`, 
          data: null, 
          request_id: reqId 
        })
        return
      }

      // Check if category has posts
      const posts = await prisma.post.findMany({
        where: { category_id: id }
      })

      if (posts.length > 0) {
        res.setHeader('Content-Type', 'application/json')
        res.status(400).json({ 
          status: 'error', 
          message: `Cannot delete category: it has ${posts.length} post${posts.length === 1 ? '' : 's'}. Please reassign or delete them first.`, 
          data: null, 
          request_id: reqId 
        })
        return
      }

      // Delete category
      await prisma.category.delete({
        where: { category_id: id }
      })

      res.status(204).end()
      return
    }

    res.setHeader('Allow', ['PATCH', 'DELETE'])
    res.status(405).json({ status: 'error', message: 'Method Not Allowed', data: null, request_id: reqId })
  } catch (e) {
    console.error('Error in admin categories API:', e)
    res.setHeader('Content-Type', 'application/json')
    res.status(500).json({ status: 'error', message: 'Internal Server Error', data: null, request_id: reqId })
  }
}

