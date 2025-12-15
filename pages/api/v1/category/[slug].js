import { randomUUID } from 'crypto'
import { getPrisma } from '../../../../db/client'

function slugify(str){ return String(str||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'') }

export default async function handler(req, res){
  const reqId = req.headers['x-request-id'] || randomUUID()
  try{
    const prisma = getPrisma()
    if (!prisma){ res.status(503).json({ status:'error', message:'Database unavailable', data:null, request_id:reqId }); return }
    const slug = slugify(req.query.slug||'')
    const cats = await prisma.category.findMany()
    const bySlug = (name)=> slugify(name)===slug
    const match = cats.find(c => bySlug(c.name))
    let list = []
    if (match){
      const posts = await prisma.post.findMany({ where: { category_id: match.category_id }, include: { images:true } })
      list = posts.map(p => ({
        id: p.post_id,
        post_id: p.post_id,
        title: p.title,
        content: p.content,
        images: (p.images||[]).map(im => ({ url: im.url })),
        price: p.price||0,
        location: p.location||''
      }))
    } else {
      const parents = cats.filter(c => c.parent_id == null)
      const parent = parents.find(c => bySlug(c.name))
      if (parent){
        const children = cats.filter(c => c.parent_id === parent.category_id)
        const ids = children.map(c => c.category_id)
        const posts = await prisma.post.findMany({ where: { category_id: { in: ids } }, include: { images:true } })
        list = posts.map(p => ({
          id: p.post_id,
          post_id: p.post_id,
          title: p.title,
          content: p.content,
          images: (p.images||[]).map(im => ({ url: im.url })),
          price: p.price||0,
          location: p.location||''
        }))
      }
    }
    res.setHeader('Content-Type','application/json')
    res.status(200).json({ data: { products: list }, request_id:reqId })
  }catch(e){ res.setHeader('Content-Type','application/json'); res.status(500).json({ status:'error', message:'Internal Server Error', data:null, request_id:reqId }) }
}