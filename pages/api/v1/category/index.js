import { randomUUID } from 'crypto'
import { getPrisma } from '../../../../db/client'

function slugify(str){ return String(str||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'') }

export default async function handler(req, res){
  const reqId = req.headers['x-request-id'] || randomUUID()
  try{
    const prisma = getPrisma()
    if (!prisma){ res.status(503).json({ status:'error', message:'Database unavailable', data:null, request_id:reqId }); return }
    const cats = await prisma.category.findMany({ orderBy: { name:'asc' } })
    const tiles = [
      { k:'Mobile Phones', label:'Mobiles', icon:'fa-mobile-screen', shortLabel:'Mobiles' },
      { k:'Cars', label:'Vehicles', icon:'fa-car', shortLabel:'Vehicles' },
      { k:'Motercycles', label:'Bikes', icon:'fa-motorcycle', shortLabel:'Bikes' },
      { k:'House', label:'Property', icon:'fa-house', shortLabel:'Property' },
      { k:'Tv - Video - Audio', label:'Electronics', icon:'fa-tv', shortLabel:'Electronics' },
      { k:'Tablets', label:'Tablets', icon:'fa-tablet-screen-button', shortLabel:'Tablets' },
      { k:'Land & Plots', label:'Land & Plots', icon:'fa-map-location-dot', shortLabel:'Land' },
      { k:'Jobs', label:'Jobs', icon:'fa-briefcase', shortLabel:'Jobs' },
      { k:'Services', label:'Services', icon:'fa-paint-roller', shortLabel:'Services' },
      { k:'Furniture', label:'Furniture', icon:'fa-chair', shortLabel:'Furniture' }
    ]
    const seen = new Set()
    const uniqTiles = []
    for (const t of tiles){ const key = slugify(t.k); if (!seen.has(key)){ seen.add(key); uniqTiles.push(t) } }
    res.setHeader('Content-Type','application/json')
    res.status(200).json({ data: { categories: cats, tiles: uniqTiles }, request_id:reqId })
  }catch(e){ res.setHeader('Content-Type','application/json'); res.status(500).json({ status:'error', message:'Internal Server Error', data:null, request_id:reqId }) }
}