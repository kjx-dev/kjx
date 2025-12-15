export async function getServerSideProps({ res }){
  try{
    res.setHeader('Content-Type','image/x-icon')
    res.statusCode = 204
    res.end('')
  }catch(_){ }
  return { props: {} }
}

export default function Favicon(){ return null }