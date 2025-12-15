export async function getServerSideProps({ params }){
  const slug = String(params?.slug||'')
  const norm = slug.toLowerCase()
  const isProduct = /-\d+$/.test(norm) || /^\d+$/.test(norm)
  const destination = isProduct ? ('/product/' + slug) : ('/category/' + slug)
  return { redirect: { destination, permanent: true } }
}

export default function RootSlug(){
  return null
}