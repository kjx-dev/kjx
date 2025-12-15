function originFromReq(req){
  const proto = (req.headers['x-forwarded-proto'] && String(req.headers['x-forwarded-proto']).split(',')[0]) || 'http'
  const host = req.headers.host || 'localhost:3001'
  return proto + '://' + host
}

export async function getServerSideProps({ req, res }){
  const origin = originFromReq(req)
  const now = new Date().toISOString().slice(0,10)
  const staticUrls = ['/', '/about', '/contact', '/faq', '/login', '/register', '/sell', '/manage', '/terms', '/privacy']
  const products = []
  const categories = []
  const urls = [
    ...staticUrls.map(u => ({ loc: origin + u, changefreq: 'weekly', priority: u==='/' ? '1.0' : '0.6', lastmod: now })),
    ...products.map(p => ({ loc: origin + '/product/' + p.slug, changefreq: 'daily', priority: '0.8', lastmod: now })),
    ...categories.map(cs => ({ loc: origin + '/category/' + cs, changefreq: 'weekly', priority: '0.7', lastmod: now }))
  ]
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(u => `<url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`).join('') +
    `</urlset>`
  res.setHeader('Content-Type','application/xml')
  res.write(xml)
  res.end()
  return { props: {} }
}

export default function SiteMap(){ return null }