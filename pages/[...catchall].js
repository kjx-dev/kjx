import { randomUUID } from 'crypto'

export async function getServerSideProps({ req, res }){
  const reqId = req.headers['x-request-id'] || randomUUID()
  const accept = String(req.headers['accept']||'')
  if (accept.includes('application/json')){
    res.statusCode = 404
    res.setHeader('Content-Type','application/json')
    res.write(JSON.stringify({ status:'error', message:'404 - Page not found', suggested_actions:['Check the URL','Visit our homepage'], request_id: reqId }))
    res.end()
    return { props: {} }
  }
  return { notFound: true }
}

export default function CatchAll(){ return null }