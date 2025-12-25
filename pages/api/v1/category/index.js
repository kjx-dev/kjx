import { randomUUID } from 'crypto'
import { getPrisma } from '../../../../db/client'

function slugify(str){ return String(str||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'') }

export default async function handler(req, res){
  const reqId = req.headers['x-request-id'] || randomUUID()
  try{
    const prisma = getPrisma()
    if (!prisma){ res.status(503).json({ status:'error', message:'Database unavailable', data:null, request_id:reqId }); return }
    const cats = await prisma.category.findMany({ orderBy: { name:'asc' } })
    const parents = cats.filter(c => c.parent_id == null)
    const groups = parents.map(p => {
      const children = cats.filter(c => c.parent_id === p.category_id)
      return {
        parent: p,
        children: children.map(child => ({
          ...child,
          subchildren: cats.filter(sc => sc.parent_id === child.category_id)
        }))
      }
    })
    const tiles = [
      { k:'Mobile Phones', label:'Mobiles', icon:'fa-mobile-screen', shortLabel:'Mobiles' },
      { k:'Cars', label:'Vehicles', icon:'fa-car', shortLabel:'Vehicles' },
      { k:'Motercycles', label:'Bikes', icon:'fa-motorcycle', shortLabel:'Bikes' },
      { k:'Property for Sale', label:'Property for Sale', icon:'fa-house', shortLabel:'Property for Sale' },
      { k:'Property for Rent', label:'Property for Rent', icon:'fa-key', shortLabel:'Property for Rent' },
      { k:'Tv - Video - Audio', label:'Electronics', icon:'fa-tv', shortLabel:'Electronics' },
      { k:'Tablets', label:'Tablets', icon:'fa-tablet-screen-button', shortLabel:'Tablets' },
      { k:'Jobs', label:'Jobs', icon:'fa-briefcase', shortLabel:'Jobs' },
      { k:'Services', label:'Services', icon:'fa-paint-roller', shortLabel:'Services' },
      { k:'Furniture', label:'Furniture', icon:'fa-chair', shortLabel:'Furniture' }
    ]
    const seen = new Set()
    const uniqTiles = []
    for (const t of tiles){ const key = slugify(t.k); if (!seen.has(key)){ seen.add(key); uniqTiles.push(t) } }
    res.setHeader('Content-Type','application/json')
    res.status(200).json({ data: { categories: cats, tiles: uniqTiles, groups: groups }, request_id:reqId })
  }catch(e){ res.setHeader('Content-Type','application/json'); res.status(500).json({ status:'error', message:'Internal Server Error', data:null, request_id:reqId }) }
}