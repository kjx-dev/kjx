import { getPrisma } from '../../../../../db/client'

async function ensureTable(prisma){
  try{
    await prisma.$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS post_reviews (\n'+
      '  review_id INTEGER PRIMARY KEY AUTOINCREMENT,\n'+
      '  post_id INTEGER NOT NULL,\n'+
      '  author TEXT NOT NULL,\n'+
      '  rating INTEGER NOT NULL,\n'+
      '  comment TEXT NOT NULL,\n'+
      '  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n'+
      '  FOREIGN KEY(post_id) REFERENCES posts(post_id) ON DELETE CASCADE\n'+
      ')'
    )
    await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS post_reviews_unique ON post_reviews(post_id, author)')
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS post_reviews_post_id_idx ON post_reviews(post_id)')
  }catch(_){ }
}

async function ensureReportTable(prisma){
  try{
    await prisma.$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS post_reports (\n'+
      '  post_id INTEGER PRIMARY KEY,\n'+
      '  bids_count INTEGER DEFAULT 0,\n'+
      '  top_bid_amount INTEGER NULL,\n'+
      '  reviews_count INTEGER DEFAULT 0,\n'+
      '  avg_rating REAL DEFAULT 0,\n'+
      '  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,\n'+
      '  FOREIGN KEY(post_id) REFERENCES posts(post_id) ON DELETE CASCADE\n'+
      ')'
    )
  }catch(_){ }
}

async function updatePostReport(prisma, id){
  try{
    const bidStat = await prisma.$queryRaw`SELECT COUNT(1) as c, MAX(amount) as m FROM post_bids WHERE post_id=${id}`
    const bidsCount = Array.isArray(bidStat) && bidStat.length ? Number(bidStat[0].c||0) : 0
    const topBid = Array.isArray(bidStat) && bidStat.length ? Number(bidStat[0].m||0) || null : null
    const revStat = await prisma.$queryRaw`SELECT COUNT(1) as c, AVG(rating) as a FROM post_reviews WHERE post_id=${id}`
    const reviewsCount = Array.isArray(revStat) && revStat.length ? Number(revStat[0].c||0) : 0
    const avgRating = Array.isArray(revStat) && revStat.length ? Number(revStat[0].a||0) : 0
    await ensureReportTable(prisma)
    await prisma.$executeRawUnsafe(
      `INSERT INTO post_reports (post_id, bids_count, top_bid_amount, reviews_count, avg_rating, last_updated)
       VALUES (${id}, ${bidsCount}, ${topBid==null?'NULL':topBid}, ${reviewsCount}, ${avgRating}, CURRENT_TIMESTAMP)
       ON CONFLICT(post_id) DO UPDATE SET bids_count=excluded.bids_count, top_bid_amount=excluded.top_bid_amount, reviews_count=excluded.reviews_count, avg_rating=excluded.avg_rating, last_updated=excluded.last_updated`
    )
  }catch(_){ }
}

export default async function handler(req, res){
  try{
    const reqId = req.headers['x-request-id'] || ''
    const id = parseInt(String(req.query.id||''),10)
    if (Number.isNaN(id)){ res.setHeader('Content-Type','application/json'); res.status(400).json({ status:'error', message:'Invalid id', data:null, request_id:reqId }); return }
    if (req.method === 'GET'){
      const prisma = getPrisma()
      if (!prisma){ res.setHeader('Content-Type','application/json'); res.status(503).json({ status:'error', message:'Database unavailable', data:null, request_id:reqId }); return }
      await ensureTable(prisma)
      try{
        const list = await prisma.$queryRaw`SELECT review_id, post_id, author, rating, comment, created_at FROM post_reviews WHERE post_id=${id} ORDER BY created_at DESC`
        res.setHeader('Content-Type','application/json')
        res.status(200).json({ data: list, request_id: reqId })
        return
      }catch(e){ res.setHeader('Content-Type','application/json'); res.status(500).json({ status:'error', message:String(e&&e.message||'Failed to load reviews'), data:null, request_id:reqId }); return }
    }
    if (req.method === 'POST'){
      const prisma = getPrisma()
      if (!prisma){ res.setHeader('Content-Type','application/json'); res.status(503).json({ status:'error', message:'Database unavailable', data:null, request_id:reqId }); return }
      await ensureTable(prisma)
      const body = req.body||{}
      const rating = parseInt(String(body.rating||''),10)
      const author = String(body.author||'').trim()
      const comment = String(body.comment||'').trim()
      if (!author){ res.setHeader('Content-Type','application/json'); res.status(400).json({ status:'error', message:'Author required', field:'author', data:null, request_id:reqId }); return }
      if (Number.isNaN(rating) || rating<1 || rating>5){ res.setHeader('Content-Type','application/json'); res.status(400).json({ status:'error', message:'Invalid rating', field:'rating', data:null, request_id:reqId }); return }
      if (!comment){ res.setHeader('Content-Type','application/json'); res.status(400).json({ status:'error', message:'Comment required', field:'comment', data:null, request_id:reqId }); return }
      const post = await prisma.$queryRaw`SELECT post_id FROM posts WHERE post_id=${id}`
      if (!Array.isArray(post) || post.length===0){ res.setHeader('Content-Type','application/json'); res.status(404).json({ status:'error', message:'Post not found', data:null, request_id:reqId }); return }
      const exists = await prisma.$queryRaw`SELECT review_id FROM post_reviews WHERE post_id=${id} AND author=${author} LIMIT 1`
      if (Array.isArray(exists) && exists.length){ res.setHeader('Content-Type','application/json'); res.status(409).json({ status:'error', message:'Already reviewed', data:null, request_id:reqId }); return }
      try{
        await prisma.$executeRaw`INSERT INTO post_reviews (post_id, author, rating, comment, created_at) VALUES (${id}, ${author}, ${rating}, ${comment}, CURRENT_TIMESTAMP)`
        const created = await prisma.$queryRaw`SELECT review_id, post_id, author, rating, comment, created_at FROM post_reviews WHERE post_id=${id} AND author=${author} ORDER BY review_id DESC LIMIT 1`
        const row = Array.isArray(created) && created.length ? created[0] : { post_id:id, author, rating, comment, created_at: Date.now() }
        try{ await updatePostReport(prisma, id) }catch(_){ }
        res.setHeader('Content-Type','application/json')
        res.status(201).json({ data: row, request_id: reqId })
        return
      }catch(_){ res.setHeader('Content-Type','application/json'); res.status(500).json({ status:'error', message:'Failed to create review', data:null, request_id:reqId }); return }
    }
    if (req.method === 'DELETE'){
      const prisma = getPrisma()
      if (!prisma){ res.setHeader('Content-Type','application/json'); res.status(503).json({ status:'error', message:'Database unavailable', data:null, request_id:reqId }); return }
      await ensureTable(prisma)
      const body = req.body||{}
      const author = String(body.author||'').trim()
      const post = await prisma.$queryRaw`SELECT post_id FROM posts WHERE post_id=${id}`
      if (!Array.isArray(post) || post.length===0){ res.setHeader('Content-Type','application/json'); res.status(404).json({ status:'error', message:'Post not found', data:null, request_id:reqId }); return }
      if (!author){ res.setHeader('Content-Type','application/json'); res.status(400).json({ status:'error', message:'Author required', data:null, request_id:reqId }); return }
      try{
        await prisma.$executeRaw`DELETE FROM post_reviews WHERE post_id=${id} AND author=${author}`
        try{ await updatePostReport(prisma, id) }catch(_){ }
        res.setHeader('Content-Type','application/json')
        res.status(200).json({ data: { deleted:true }, request_id: reqId })
        return
      }catch(_){ res.setHeader('Content-Type','application/json'); res.status(500).json({ status:'error', message:'Failed to remove review', data:null, request_id:reqId }); return }
    }
    res.setHeader('Allow',['GET','POST','DELETE'])
    res.status(405).json({ status:'error', message:'Method Not Allowed', data:null, request_id:reqId })
  }catch(e){ res.setHeader('Content-Type','application/json'); res.status(500).json({ status:'error', message:'Internal Server Error', data:null }) }
}

export const config = { api: { bodyParser: { sizeLimit: '1mb' } } }