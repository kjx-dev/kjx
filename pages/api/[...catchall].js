import { randomUUID } from 'crypto'

export default function handler(req, res){
  const reqId = req.headers['x-request-id'] || randomUUID()
  res.setHeader('Access-Control-Allow-Origin','*')
  res.setHeader('Access-Control-Allow-Methods','GET, POST, PUT, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers','Content-Type, X-Requested-With, X-Request-Id')
  if (req.method === 'OPTIONS'){ res.status(204).end(); return }
  res.setHeader('Content-Type','application/json')
  console.warn('Invalid API request', { method: req.method, url: req.url, request_id: reqId })
  res.status(404).json({
    status: 'error',
    message: '404 - Page not found',
    suggested_actions: ['Check the URL','Visit our homepage'],
    request_id: reqId
  })
}