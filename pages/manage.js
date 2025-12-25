import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import Header from '../components/Header'

export default function Manage(){
  const router = useRouter()
  const [auth, setAuth] = useState({ email:'', isAuthenticated:false, name:'' })
  const [products, setProducts] = useState([])
  const [allPosts, setAllPosts] = useState([]) // All posts including pending for moderator
  const [userId, setUserId] = useState(null)
  const [tab, setTab] = useState('all')
  const [q, setQ] = useState('')
  const searchTimerRef = useRef(null)
  const [error, setError] = useState('')
  const [approvingPost, setApprovingPost] = useState(null)
  const [hydrated, setHydrated] = useState(false)
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
        // Use showAll=true to get all posts (including pending, inactive, active) so users can see all their own ads
        const res = await fetch('/api/v1/posts?showAll=true&limit=100')
        const js = await res.json()
        if (res.ok && Array.isArray(js.data)){
          const uid = getTokenUserId() || userId
          if (!uid) { setProducts([]); return }
          // Filter to get only this user's posts
          const rows = js.data.filter(r => r.user_id === uid)
          const mapped = rows.map(r => ({
              id: r.post_id,
              name: r.title,
              description: r.content,
              image: (Array.isArray(r.images) && r.images.length ? r.images[0].url : 'https://picsum.photos/seed/product/300/200'),
              price: r.price || '',
              location: r.location || '',
              category: '',
              status: r.status || 'pending', // Use actual status from database, not localStorage override
              views: 0,
              source: 'db',
              updatedAt: getLastUpdate('db:'+r.post_id) || r.updated_at || r.created_at || null
            }))
          setProducts(mapped)
        } else {
          setProducts([])
        }
      }catch(_){ 
      setProducts([])
      }
      
      // Load all posts for moderator tab
      try{
        const allRes = await fetch('/api/v1/posts?showAll=true&limit=100')
        const allJs = await allRes.json()
        if (allRes.ok && Array.isArray(allJs.data)){
          const pendingRows = allJs.data.filter(r => (r.status || 'pending') === 'pending')
          const mappedPending = pendingRows.map(r => ({
              id: r.post_id,
              name: r.title,
              description: r.content,
              image: (Array.isArray(r.images) && r.images.length ? r.images[0].url : 'https://picsum.photos/seed/product/300/200'),
              price: r.price || '',
              location: r.location || '',
              category: '',
              status: r.status || 'pending',
              views: 0,
              source: 'db',
              user_id: r.user_id,
              updatedAt: r.updated_at || r.created_at || null
            }))
          setAllPosts(mappedPending)
        }
      }catch(_){ setAllPosts([]) }
    }
    loadMyAds()
  }, [])
  useEffect(() => { setHydrated(true) }, [])
  function applySearch(val){ setQ(val ? String(val) : '') }
  function clearSearch(){ setQ('') }
  function onSearchChange(e){ const v = e.target.value || ''; if (searchTimerRef.current){ clearTimeout(searchTimerRef.current) } searchTimerRef.current = setTimeout(()=>applySearch(v), 400) }
  
  function filtered(){
    // Use allPosts for moderator tab, products for user's own ads
    let list = tab === 'moderator' ? allPosts.slice() : products.slice()
    if (tab==='active') list = list.filter(p => p.status==='active')
    if (tab==='inactive') list = list.filter(p => p.status==='inactive')
    if (tab==='moderator') list = list.filter(p => (p.status || 'pending') === 'pending')
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
  
  async function approvePost(postId){
    try {
      setApprovingPost(postId)
      const res = await fetch(`/api/v1/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' })
      })
      if (!res.ok) {
        const js = await res.json().catch(()=>null)
        alert((js && (js.message || js.error?.message)) || 'Failed to approve')
        return
      }
      // Remove from pending list and refresh
      setAllPosts(prev => prev.filter(p => p.id !== postId))
      if (typeof window !== 'undefined' && window.swal){
        await window.swal('Approved', 'Ad approved successfully', 'success')
      }
      // Reload to refresh the list
      const allRes = await fetch('/api/v1/posts?showAll=true&limit=100')
      const allJs = await allRes.json()
      if (allRes.ok && Array.isArray(allJs.data)){
        const pendingRows = allJs.data.filter(r => (r.status || 'pending') === 'pending')
        const mappedPending = pendingRows.map(r => ({
            id: r.post_id,
            name: r.title,
            description: r.content,
            image: (Array.isArray(r.images) && r.images.length ? r.images[0].url : 'https://picsum.photos/seed/product/300/200'),
            price: r.price || '',
            location: r.location || '',
            category: '',
            status: r.status || 'pending',
            views: 0,
            source: 'db',
            user_id: r.user_id,
            updatedAt: r.updated_at || r.created_at || null
          }))
        setAllPosts(mappedPending)
      }
    } catch(err) {
      alert('Network error: ' + (err.message || 'Failed to approve'))
    } finally {
      setApprovingPost(null)
    }
  }
  
  async function rejectPost(postId){
    try {
      setApprovingPost(postId)
      const res = await fetch(`/api/v1/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'inactive' })
      })
      if (!res.ok) {
        const js = await res.json().catch(()=>null)
        alert((js && (js.message || js.error?.message)) || 'Failed to reject')
        return
      }
      // Remove from pending list
      setAllPosts(prev => prev.filter(p => p.id !== postId))
      if (typeof window !== 'undefined' && window.swal){
        await window.swal('Rejected', 'Ad rejected successfully', 'success')
      }
    } catch(err) {
      alert('Network error: ' + (err.message || 'Failed to reject'))
    } finally {
      setApprovingPost(null)
    }
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
  const productsArray = Array.isArray(products) ? products : []
  const allPostsArray = Array.isArray(allPosts) ? allPosts : []
  const cAll = productsArray.length || 0
  const cActive = productsArray.filter(p=>p.status==='active').length || 0
  const cInactive = productsArray.filter(p=>p.status==='inactive').length || 0
  const cPending = allPostsArray.length || 0
  return (
    <>
      <Header />
    <div style={{width:'100%', margin:'24px 0', padding:'0 16px', textAlign:'left'}}>
      <h1 style={{fontSize:'22px', fontWeight:500, textAlign:'left', margin:'0 0 12px'}}>Manage and view your Ads</h1>
      <div style={{
        // maxWidth:1100,
         margin:'0 auto', 
        //  padding:'0 16px'
         }}>
        {error && (<div style={{color:'#b00020', marginBottom:12}}>{error}</div>)}
      <div style={{display:'flex', gap:8, alignItems:'center', justifyContent:'flex-start', flexWrap:'wrap', marginBottom:8}}>
        {['all','active','inactive','moderator'].map(kind => {
          const count = kind==='all'?cAll:kind==='active'?cActive:kind==='inactive'?cInactive:kind==='moderator'?cPending:0
          const isActive = tab===kind
          return (
            <button key={kind} className="manage-tab-btn" onClick={()=>setTab(kind)} aria-pressed={isActive} aria-current={isActive? 'page': undefined}>
              {kind==='all'?'View all':kind==='moderator'?'Moderator':(kind.charAt(0).toUpperCase()+kind.slice(1))} 
              {kind==='moderator' && cPending > 0 && (
                <span style={{
                  marginLeft: '6px',
                  background: '#ff9800',
                  color: '#fff',
                  borderRadius: '10px',
                  padding: '2px 6px',
                  fontSize: '10px',
                  fontWeight: '600'
                }}>
                  {hydrated ? count : 0}
                </span>
              )}
              {kind !== 'moderator' && (
                <span suppressHydrationWarning={true}> ({hydrated ? count : 0})</span>
              )}
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
          const idx = tab === 'moderator' ? -1 : products.indexOf(p)
          const postStatus = p.status || 'pending'
          const statusBadge = postStatus==='active' ? (
            <span style={{background:'#248f3c',color:'#fff',padding:'4px 8px',borderRadius:4,fontSize:12}}>Active</span>
          ) : postStatus==='pending' ? (
            <span style={{background:'#ff9800',color:'#fff',padding:'4px 8px',borderRadius:4,fontSize:12}}>Pending</span>
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
                 {tab === 'moderator' ? (
                   <button className="btn btn--outline" onClick={()=>router.push('/product/'+p.id)} title="View">
                     <i className="fa-solid fa-eye" aria-hidden="true"></i>
                     <span>View</span>
                   </button>
                 ) : (
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
                )}
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