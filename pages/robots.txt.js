function originFromReq(req){
  const proto = (req.headers['x-forwarded-proto'] && String(req.headers['x-forwarded-proto']).split(',')[0]) || 'http'
  const host = req.headers.host || 'localhost:3001'
  return proto + '://' + host
}

export async function getServerSideProps({ req, res }){
  const origin = originFromReq(req)
  const txt = `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${origin}/sitemap.xml\n`
  res.setHeader('Content-Type','text/plain')
  res.write(txt)
  res.end()
  return { props: {} }
}

export default function Robots(){ return null }