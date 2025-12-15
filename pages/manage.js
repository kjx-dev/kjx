import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import Header from '../components/Header'

export default function Manage(){
  const router = useRouter()
  const [auth, setAuth] = useState({ email:'', isAuthenticated:false, name:'' })
  const [products, setProducts] = useState([])
  const [userId, setUserId] = useState(null)
  const [tab, setTab] = useState('all')
  const [q, setQ] = useState('')
  const searchTimerRef = useRef(null)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState([])
  const [catTiles, setCatTiles] = useState([])
  const [catGroups, setCatGroups] = useState([])
  const [hydrated, setHydrated] = useState(false)
  const [allCatOpen, setAllCatOpen] = useState(false)
  const allCatWrapRef = useRef(null)
  const allCatBtnRef = useRef(null)
  const allCatMenuRef = useRef(null)
  function getTokenUserId(){
    try{
      const tok = localStorage.getItem('auth_token')||''
      const parts = String(tok||'').split('.')
      if (parts.length>=3){
        const data = parts[1]
        const pad = data.length%4===2 ? '==' : data.length%4===3 ? '=' : ''
        const norm = data.replace(/-/g,'+').replace(/_/g,'/') + pad
        const json = JSON.parse(atob(norm))
        if (json && json.sub) return json.sub
      }
    }catch(_){ }
    return null
  }
  useEffect(() => {
    const email = localStorage.getItem('email') || ''
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
    const name = localStorage.getItem('name') || ''
    setAuth({ email, isAuthenticated, name })
    if (!isAuthenticated || !email) { router.push('/login'); return }
    try{
      const tok = localStorage.getItem('auth_token')||''
      const parts = String(tok||'').split('.')
      if (parts.length>=3){
        const data = parts[1]
        const pad = data.length%4===2 ? '==' : data.length%4===3 ? '=' : ''
        const norm = data.replace(/-/g,'+').replace(/_/g,'/') + pad
        const json = JSON.parse(atob(norm))
        if (json && json.sub) setUserId(json.sub)
      }
    }catch(_){ }
    function getOverlayStatus(key){
      try{ const raw = localStorage.getItem('post_statuses') || '{}'; const map = JSON.parse(raw); return map[key] || null }catch(_){ return null }
    }
    function setOverlayStatus(key, val){
      try{ const raw = localStorage.getItem('post_statuses') || '{}'; const map = JSON.parse(raw); map[key] = val; localStorage.setItem('post_statuses', JSON.stringify(map)) }catch(_){ }
    }
    function getLastUpdate(key){
      try{ const raw = localStorage.getItem('last_updates') || '{}'; const map = JSON.parse(raw); const v = map[key]; return v ? Number(v) : null }catch(_){ return null }
    }
    async function loadMyAds(){
      try{
        const res = await fetch('/api/v1/posts')
        const js = await res.json()
        if (res.ok && Array.isArray(js.data)){
          const uid = getTokenUserId() || userId
          const rows = js.data.filter(r => uid ? r.user_id===uid : false)
          const mapped = rows.map(r => ({
              id: r.post_id,
              name: r.title,
              description: r.content,
              image: (Array.isArray(r.images) && r.images.length ? r.images[0].url : 'https://picsum.photos/seed/product/300/200'),
              price: r.price || '',
              location: r.location || '',
              category: '',
              status: getOverlayStatus('db:'+r.post_id) || 'active',
              views: 0,
              source: 'db',
              updatedAt: getLastUpdate('db:'+r.post_id) || r.updated_at || r.created_at || null
            }))
          setProducts(mapped)
          return
        }
      }catch(_){ }
      setProducts([])
    }
    loadMyAds()
    ;(async ()=>{
      try{
        const res = await fetch('/api/v1/category')
        const data = await res.json()
        const payload = data.data || {}
        setCategories(payload.categories || [])
        setCatTiles(payload.tiles || [])
        try{
          const rg = await fetch('/api/v1/categories')
          const dg = await rg.json()
          setCatGroups((dg && dg.data && dg.data.groups) || [])
        }catch(_){ setCatGroups([]) }
      }catch(e){ setCategories([]); setCatTiles([]); setCatGroups([]) }
    })()
  }, [])
  useEffect(() => { setHydrated(true) }, [])
  useEffect(() => {
    function onKey(e){ if (e.key === 'Escape') setAllCatOpen(false) }
    function onOutside(e){ const el = allCatWrapRef.current; if (!el) return; if (!el.contains(e.target)) setAllCatOpen(false) }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onOutside)
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onOutside) }
  }, [])
  function applySearch(val){ setQ(val ? String(val) : '') }
  function clearSearch(){ setQ('') }
  function onSearchChange(e){ const v = e.target.value || ''; if (searchTimerRef.current){ clearTimeout(searchTimerRef.current) } searchTimerRef.current = setTimeout(()=>applySearch(v), 400) }
  
  function filtered(){
    let list = products.slice()
    if (tab==='active') list = list.filter(p => p.status==='active')
    if (tab==='inactive') list = list.filter(p => p.status==='inactive')
    if (q) {
      const qq = q.toLowerCase()
      list = list.filter(p => {
        const nm = (p.name||'').toLowerCase()
        const cat = (p.category||'').toLowerCase()
        const catMatch = (
          cat.includes(qq)
          || ((qq.includes('motor')||qq.includes('bike')) && (cat.includes('motor')||cat.includes('moter')||cat.includes('bike')))
          || (qq.includes('property') && (cat.includes('property')||cat.includes('house')||cat.includes('land')||cat.includes('plot')))
        )
        return nm.includes(qq) || catMatch
      })
    }
    return list
  }
  function formatRelative(ts){
    try{
      if (!ts) return ''
      const d = typeof ts==='string' ? new Date(ts) : new Date(Number(ts))
      const now = Date.now()
      const diff = Math.max(0, now - d.getTime())
      const sec = Math.floor(diff/1000)
      const min = Math.floor(sec/60)
      const hr = Math.floor(min/60)
      const day = Math.floor(hr/24)
      if (day>0) return day+"d"
      if (hr>0) return hr+"h"
      if (min>0) return min+"m"
      return sec+"s"
    }catch(_){ return '' }
  }
  function toggleStatus(idx){
    const item = products[idx]
    const nextStatus = item.status==='active' ? 'inactive' : 'active'
    async function apply(){
      try{ const raw = localStorage.getItem('post_statuses') || '{}'; const map = JSON.parse(raw); map['db:'+item.id] = nextStatus; localStorage.setItem('post_statuses', JSON.stringify(map)) }catch(_){ }
      const next = products.slice(); next[idx].status = nextStatus; setProducts(next)
      try{ const raw = localStorage.getItem('last_updates') || '{}'; const map = JSON.parse(raw); map['db:'+item.id] = Date.now(); localStorage.setItem('last_updates', JSON.stringify(map)) }catch(_){ }
      try{ if (typeof window !== 'undefined' && window.swal){ await window.swal('Success', 'Status updated successfully', 'success') } }catch(_){ }
    }
    try{
      if (typeof window !== 'undefined' && window.swal){
        window.swal({ title:'Confirm', text:'Change status to '+(nextStatus==='active'?'Active':'Inactive')+'?', icon:'warning', buttons:['Cancel','Yes'] }).then(ok => { if (ok) apply() })
      } else {
        const ok = typeof window !== 'undefined' ? window.confirm('Change status to '+(nextStatus==='active'?'Active':'Inactive')+'?') : true
        if (ok) apply()
      }
    }catch(_){ apply() }
  }
  function removeAd(idx){
    const item = products[idx]
    async function apply(){
      try{
        const res = await fetch('/api/v1/posts/'+encodeURIComponent(String(item.id)), { method:'DELETE' })
        if (!res.ok){ const js = await res.json().catch(()=>null); alert((js && (js.message || js.error?.message)) || 'Failed to delete'); return }
      }catch(_){ alert('Network error deleting'); return }
      const next = products.slice(); next.splice(idx,1); setProducts(next)
      try{ if (typeof window !== 'undefined' && window.swal){ await window.swal('Deleted', 'Ad deleted successfully', 'success') } }catch(_){ }
    }
    try{
      if (typeof window !== 'undefined' && window.swal){
        window.swal({ title:'Delete Ad?', text:'Are you sure you want to delete this ad?', icon:'warning', buttons:['Cancel','Delete'] }).then(ok => { if (ok) apply() })
      } else {
        const ok = typeof window !== 'undefined' ? window.confirm('Are you sure you want to delete this ad?') : true
        if (ok) apply()
      }
    }catch(_){ apply() }
  }
  
  function editAd(idx){
    const item = products[idx]
    const src = String(item.source||'db')
    if (src==='local'){
      window.location.href = '/sell?editIndex='+encodeURIComponent(String(idx))+'&source=local'
    } else {
      window.location.href = '/sell?editId='+encodeURIComponent(String(item.id))+'&source=db'
    }
  }
  const list = filtered()
  const cAll = products.length
  const cActive = products.filter(p=>p.status==='active').length
  const cInactive = products.filter(p=>p.status==='inactive').length
  return (
    <>
      <Header />
        <div className="third__navbar" ref={allCatWrapRef} style={{position:'relative'}}>
          <div className="select__itself"><a href="" onClick={(e)=>{ e.preventDefault(); setAllCatOpen(v=>!v) }} ref={allCatBtnRef} aria-expanded={allCatOpen}>All Categories</a></div>
          <div className="links" id="links" style={{display:'flex', flexWrap:'wrap', gap:16}}>
            {(() => {
              const order = ['mobile-phones','cars','motercycles','house','tv-video-audio','tablets','land-plots','jobs','services','furniture']
              function slug(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'') }
              const tiles = order.map(sl => catTiles.find(t => slug(t.k)===sl)).filter(Boolean)
              return tiles.map(c => (
                <a key={c.k} href={'/category/' + slug(c.k)} onClick={(e)=>{ e.preventDefault(); router.push('/category/'+slug(c.k)) }}>{c.label}</a>
              ))
            })()}
          </div>
          {(() => {
            const groups = Array.isArray(catGroups) ? catGroups : []
            function byName(n){ const g = groups.find(x => String(x.parent?.name||'')===n); return g ? g : { parent:{ name:n, category_id: 'missing:'+n }, children: [] } }
            const layout = [
              [byName('Mobiles'), byName('Vehicles')],
              [byName('Bikes'), byName('Business, Industrial & Agriculture')],
              [byName('Jobs')],
              [byName('Furniture & Home Decor')]
            ]
            return (
              <div ref={allCatMenuRef} style={{display: allCatOpen ? 'block':'none', position:'absolute', zIndex:30, top:48, left:0, right:0, margin:'0 auto', maxWidth:1100, background:'#fff', border:'1px solid rgba(1,47,52,.2)', boxShadow:'0 6px 18px rgba(0,0,0,.08)', borderRadius:12}}>
                <div style={{maxHeight:360, overflow:'auto', padding:16}}>
                  <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:24}}>
                    {layout.map((list,ci)=> (
                      <div key={'col:'+ci}>
                        {list.map(gr => (
                          <div key={gr.parent.category_id} style={{marginBottom:12}}>
                            <div style={{fontWeight:700, color:'#012f34', marginBottom:8}}>{gr.parent.name}</div>
                            <ul style={{listStyle:'none', padding:0, margin:0}}>
                              {gr.children.map(ch => {
                                const s = String(ch.name||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')
                                return (
                                  <li key={ch.category_id} style={{margin:'6px 0'}}>
                                    <a href={'/category/'+s} style={{textDecoration:'none', color:'rgba(0,47,52,.84)'}} onClick={(e)=>{ e.preventDefault(); setAllCatOpen(false); router.push('/category/'+s) }}>{ch.name}</a>
                                  </li>
                                )
                              })}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
    <div style={{width:'100%', margin:'24px 0', padding:'0 16px', textAlign:'left'}}>
      <h1 style={{fontWeight:500, textAlign:'left', margin:'0 0 12px'}}>Manage and view your Ads</h1>
      <div style={{maxWidth:1100, margin:'0 auto', padding:'0 16px'}}>
        {error && (<div style={{color:'#b00020', marginBottom:12}}>{error}</div>)}
      <div style={{display:'flex', gap:8, alignItems:'center', justifyContent:'flex-start', flexWrap:'wrap', marginBottom:8}}>
        {['all','active','inactive'].map(kind => {
          const count = kind==='all'?cAll:kind==='active'?cActive:cInactive
          const isActive = tab===kind
          const base = { border:'2px solid #012f34', padding:'8px 16px', borderRadius:8, fontWeight:600, background:isActive?'#012f34':'transparent', color:isActive?'#fff':'#012f34' }
          return (
            <button key={kind} className="load__more-btn" onClick={()=>setTab(kind)} aria-pressed={isActive} aria-current={isActive? 'page': undefined} style={base}>
              {kind==='all'?'View all':(kind.charAt(0).toUpperCase()+kind.slice(1))} (<span suppressHydrationWarning={true}>{hydrated ? count : 0}</span>)
            </button>
          )
        })}
      </div>
      <div id="adsList" style={{display:'flex', flexDirection:'column', gap:12}}>
        {list.length===0 && (
          <div style={{textAlign:'center', color:'rgba(0,47,52,.64)'}}>No ads found</div>
        )}
        {list.map((p, i) => {
          let imgSrc = p.image
          if (imgSrc === './images/img1.jpg') imgSrc = '/images/products/img1.jpg'
          const idx = products.indexOf(p)
          const statusBadge = p.status==='active' ? (
            <span style={{background:'#3a77ff',color:'#fff',padding:'4px 8px',borderRadius:4,fontSize:12}}>Active</span>
          ) : (
            <span style={{background:'#999',color:'#fff',padding:'4px 8px',borderRadius:4,fontSize:12}}>Inactive</span>
          )
          return (
            <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',border:'1px solid #012f34',borderRadius:6,padding:12}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <img src={imgSrc} alt="" loading="lazy" decoding="async" style={{width:100,height:80,objectFit:'cover',borderRadius:4}} />
                <div>
                  <h3 style={{fontWeight:500}}>{p.name}</h3>
                  <p style={{color:'rgba(0,47,52,.64)'}}>{p.category || ''}</p>
                  <div style={{display:'flex',alignItems:'center',gap:12,marginTop:6, flexWrap:'wrap'}}>
                    {statusBadge}
                    <span style={{color:'rgba(0,47,52,.64)', fontSize:12}}>Views {p.views || 0}</span>
                    <span style={{color:'rgba(0,47,52,.64)', fontSize:12}}>Phone {(p.phoneShow||'').toLowerCase()==='yes' ? 1 : 0}</span>
                    <span style={{color:'rgba(0,47,52,.64)', fontSize:12}}>Chats 0</span>
                    {p.updatedAt ? (
                      <span style={{color:'rgba(0,47,52,.8)', fontSize:12, display:'inline-flex', alignItems:'center', gap:6}}>
                        <i className="fa-regular fa-clock" aria-hidden="true"></i>
                        <span>Updated {formatRelative(p.updatedAt)}</span>
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                {(() => (
                  <>
                    <button className="btn btn--secondary" onClick={()=>editAd(idx)} title="Edit">
                      <i className="fa-solid fa-pen" aria-hidden="true"></i>
                      <span>Edit</span>
                    </button>
                    <button className="btn btn--secondary" onClick={()=>router.push('/chat?post_id='+encodeURIComponent(String(p.id)))} title="Chat">
                      <i className="fa-regular fa-message" aria-hidden="true"></i>
                      <span>Chat</span>
                    </button>
                    <button className="btn btn--primary" onClick={()=>toggleStatus(idx)} title={p.status==='active' ? 'Mark Inactive' : 'Mark Active'}>
                      <i className="fa-solid fa-power-off" aria-hidden="true"></i>
                      <span>{p.status==='active' ? 'Mark Inactive' : 'Mark Active'}</span>
                    </button>
                    <button className="btn btn--danger" onClick={()=>removeAd(idx)} title="Delete">
                      <i className="fa-solid fa-trash" aria-hidden="true"></i>
                      <span>Delete</span>
                    </button>
                  </>
                ))()}
              </div>
            </div>
          )
        })}
      </div>
      </div>
    </div>
    </>
  )
}