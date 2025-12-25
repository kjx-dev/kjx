import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import Header from '../components/Header'

export default function Favorites(){
  const router = useRouter()
  const [auth, setAuth] = useState({ email:'', isAuthenticated:false, name:'' })
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [headerCatOpen, setHeaderCatOpen] = useState(false)
  const catWrapRef = useRef(null)
  const catBtnRef = useRef(null)
  const catMenuRef = useRef(null)
  const profileWrapRef = useRef(null)
  const profileBtnRef = useRef(null)
  const profileMenuRef = useRef(null)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [profileMenuPos, setProfileMenuPos] = useState({ top: 100, left: 16 })
  const [cards, setCards] = useState([])
  useEffect(() => {
    try{
      const email = localStorage.getItem('email') || ''
      const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
      const name = localStorage.getItem('name') || ''
      setAuth({ email, isAuthenticated, name })
      if (!isAuthenticated || !email){ router.push('/login'); return }
    }catch(_){ router.push('/login') }
  }, [])
  function getUserId(){
    try{
      const tok = localStorage.getItem('auth_token')||''
      const parts = String(tok||'').split('.')
      if (parts.length<3) return null
      const data = parts[1]
      const pad = data.length%4===2 ? '==' : data.length%4===3 ? '=' : ''
      const norm = data.replace(/-/g,'+').replace(/_/g,'/') + pad
      const json = JSON.parse(atob(norm))
      return json && json.sub ? json.sub : null
    }catch(_){ return null }
  }
  useEffect(() => {
    async function load(){
      setLoading(true)
      setError('')
      try{
        const uid = getUserId()
        if (!uid){ setError('Unauthorized'); setLoading(false); return }
        const res = await fetch('/api/v1/favorites?user_id='+encodeURIComponent(String(uid)))
        const js = await res.json().catch(()=>({}))
        const list = Array.isArray(js.data) ? js.data : []
        setItems(list)
        setCards(list.map(p => ({ ...p, title: p.title||'Item', price: p.price||0, location: p.location||'', image: '/images/products/img1.jpg', category: '' })))
      }catch(_){ setItems([]); setError('Failed to load favorites') }
      setLoading(false)
    }
    load()
  }, [])
  useEffect(() => {
    async function enrich(){
      for (const it of items){
        try{
          const r = await fetch('/api/v1/posts/'+encodeURIComponent(String(it.post_id)))
          const j = await r.json()
          const d = j?.data||{}
          const img = (Array.isArray(d.images) && d.images.length) ? d.images[0].url : ''
          const cat = (d.category && d.category.name) || ''
          const title = d.title || it.title || 'Item'
          const price = d.price || it.price || 0
          const location = d.location || it.location || ''
          setCards(prev => prev.map(c => (c.post_id===it.post_id ? { ...c, image: img || c.image, category: cat, title, price, location } : c)))
        }catch(_){ }
      }
    }
    if (items.length) enrich()
  }, [items])
  function toggleProfileMenu(){
    setProfileMenuOpen(v => {
      const next = !v
      if (next && profileBtnRef.current){
        const rect = profileBtnRef.current.getBoundingClientRect()
        const menuW = 300
        const top = Math.round(rect.bottom + 8)
        const left = Math.min(Math.max(16, Math.round(rect.right - menuW)), Math.round(window.innerWidth - 16 - menuW))
        setProfileMenuPos({ top, left })
      }
      return next
    })
  }
  function manage(){ router.push('/manage') }
  function sell(){ if (auth.email && auth.isAuthenticated) router.push('/sell'); else router.push('/login') }
  function logout(){ try{ localStorage.removeItem('auth_token'); localStorage.removeItem('email'); localStorage.removeItem('username'); localStorage.removeItem('name'); localStorage.removeItem('phone'); localStorage.removeItem('gender'); localStorage.removeItem('isAuthenticated'); }catch(_){ } router.replace('/') }
  function formatPrice(p){ try{ const n = Number(p||0); if (!n) return 'Rs 0'; return 'Rs '+n.toLocaleString('en-PK') }catch(_){ return 'Rs '+String(p||0) } }
  function timeAgo(ts){ try{ const d = typeof ts==='string' ? new Date(ts) : new Date(Number(ts||Date.now())); const diff = Math.max(0, Date.now() - d.getTime()); const s = Math.floor(diff/1000); const m = Math.floor(s/60); const h = Math.floor(m/60); const d2 = Math.floor(h/24); const w = Math.floor(d2/7); if (w>=1) return w===1?'1 week ago':(w+' weeks ago'); if (d2>=1) return d2===1?'1 day ago':(d2+' days ago'); if (h>=1) return h===1?'1 hour ago':(h+' hours ago'); if (m>=1) return m===1?'1 minute ago':(m+' minutes ago'); return 'Just now' }catch(_){ return '' } }
  async function removeFavorite(postId){
    try{
      const uid = getUserId()
      if (!uid) return
      setCards(prev => prev.filter(c => c.post_id !== postId))
      setItems(prev => prev.filter(c => c.post_id !== postId))
      const res = await fetch('/api/v1/favorites', { method:'DELETE', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ user_id: uid, post_id: postId }) })
      if (!res.ok){ throw new Error('Failed') }
    }catch(_){ }
  }
  return (
    <div style={{width:'100%'}}>
      <Header />
      <div style={{width:'100%', padding:'0 16px'}}>
      <h1 style={{ fontSize:'22px', margin:'12px 0 16px', fontWeight:600}}>Favorites</h1>
      {loading ? (
        <div>Loading favorites...</div>
      ) : error ? (
        <div style={{color:'crimson'}}>{error}</div>
      ) : (
        <div>
          {cards.length===0 && (<div style={{color:'rgba(0,47,52,.64)'}}>No favorite posts yet</div>)}
          {cards.length>0 && (
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(520px, 1fr))', gap:16}}>
              {cards.map((p,i) => (
                <article key={i} style={{display:'grid', gridTemplateColumns:'200px 1fr', gap:16, alignItems:'center', background:'#fff', border:'1px solid rgba(1,47,52,.16)', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,.04)', padding:12}}>
                  <div style={{position:'relative', width:200, height:150}}>
                    <Image src={p.image||'/images/products/img1.jpg'} alt={p.title||'Item'} width={200} height={150} loading="lazy" sizes="(max-width: 768px) 100vw, 200px" unoptimized style={{borderRadius:10, width:'100%', height:'100%', objectFit:'cover', display:'block'}} />
                  </div>
                  <div>
                    <a href={'/product/'+encodeURIComponent(String(p.post_id))} style={{textDecoration:'none'}}>
                      <h4 style={{margin:0, fontSize:16, color:'#012f34', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden'}}>{p.title}</h4>
                    </a>
                    <h2 aria-label={'Price ' + p.price} style={{margin:'6px 0', fontSize:18, color:'#012f34'}}>{formatPrice(p.price)}</h2>
                    <div style={{display:'flex', alignItems:'center', gap:8, color:'rgba(0,47,52,.72)'}}>
                      <i className="fa-solid fa-location-dot" aria-hidden="true"></i>
                      <span>{p.location}</span>
                      {p.category ? (<><span style={{margin:'0 4px'}}>•</span><span style={{whiteSpace:'nowrap'}}>{p.category}</span></>) : null}
                    </div>
                    <div className="muted" style={{display:'flex', alignItems:'center', gap:6, marginTop:8}}><i className="fa-regular fa-clock" aria-hidden="true"></i><span>Added {timeAgo(p.created_at)}</span></div>
                    <div style={{display:'flex', alignItems:'center', gap:10, marginTop:10}}>
                      <a className="btn btn--secondary btn--md" href={'/product/'+encodeURIComponent(String(p.post_id))}><i className="fa-regular fa-eye" aria-hidden="true"></i><span>View</span></a>
                      <a className="btn btn--primary btn--md" href={'/chat?post_id='+encodeURIComponent(String(p.post_id))}><i className="fa-regular fa-message" aria-hidden="true"></i><span>Chat</span></a>
                      <button className="btn btn--ghost btn--icon btn--md" onClick={()=>removeFavorite(p.post_id)} title="Remove from favorites" aria-label="Remove from favorites" style={{marginLeft:'auto'}}>
                        <i className="fa-solid fa-heart" style={{color:'#d11a2a'}} aria-hidden="true"></i>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  )
}