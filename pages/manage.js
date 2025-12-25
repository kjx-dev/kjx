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
  const [storeOrders, setStoreOrders] = useState([])
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
    
    // Load store orders (orders for seller's products)
    function loadStoreOrders(){
      try{
        const ordersData = JSON.parse(localStorage.getItem('orders') || '[]')
        const currentUserId = getTokenUserId()
        if (!currentUserId) { setStoreOrders([]); return }
        
        // Filter orders where any item belongs to this seller
        const sellerOrders = ordersData.filter(order => {
          if (!order.items || !Array.isArray(order.items)) return false
          return order.items.some(item => item.seller_id === currentUserId)
        })
        
        // Sort by order date (newest first)
        const sortedOrders = sellerOrders.sort((a, b) => {
          const dateA = new Date(a.orderDate || 0)
          const dateB = new Date(b.orderDate || 0)
          return dateB - dateA
        })
        setStoreOrders(sortedOrders)
      }catch(_){
        setStoreOrders([])
      }
    }
    loadStoreOrders()
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
  
  function updateOrderStatus(orderId, newStatus){
    try{
      const orders = JSON.parse(localStorage.getItem('orders') || '[]')
      const updatedOrders = orders.map(order => {
        if (order.orderId === orderId) {
          return { ...order, status: newStatus }
        }
        return order
      })
      localStorage.setItem('orders', JSON.stringify(updatedOrders))
      
      // Update local state
      setStoreOrders(prev => prev.map(order => 
        order.orderId === orderId ? { ...order, status: newStatus } : order
      ))
      
      try{ 
        if (typeof window !== 'undefined' && window.swal){ 
          window.swal('Success', 'Order status updated successfully', 'success') 
        } 
      }catch(_){ }
    }catch(_){
      try{ 
        if (typeof window !== 'undefined' && window.swal){ 
          window.swal('Error', 'Failed to update order status', 'error') 
        } 
      }catch(_){ }
    }
  }
  const list = filtered()
  const productsArray = Array.isArray(products) ? products : []
  const allPostsArray = Array.isArray(allPosts) ? allPosts : []
  const cAll = productsArray.length || 0
  const cActive = productsArray.filter(p=>p.status==='active').length || 0
  const cInactive = productsArray.filter(p=>p.status==='inactive').length || 0
  const cPending = allPostsArray.length || 0
  
  function formatPrice(val){
    try{
      if (val == null) return ''
      const num = Number(String(val).replace(/[^0-9.-]/g,''))
      if (isNaN(num)) return String(val)
      return 'Rs ' + num.toLocaleString('en-PK')
    }catch(e){ return String(val||'') }
  }
  
  function formatDate(dateString){
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }
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
        {['all','active','inactive','moderator','store-orders'].map(kind => {
          const count = kind==='all'?cAll:kind==='active'?cActive:kind==='inactive'?cInactive:kind==='moderator'?cPending:kind==='store-orders'?storeOrders.length:0
          const isActive = tab===kind
          return (
            <button key={kind} className="manage-tab-btn" onClick={()=>setTab(kind)} aria-pressed={isActive} aria-current={isActive? 'page': undefined}>
              {kind==='all'?'View all':kind==='moderator'?'Moderator':kind==='store-orders'?'Store Orders':(kind.charAt(0).toUpperCase()+kind.slice(1))} 
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
        {tab === 'store-orders' ? (
          storeOrders.length === 0 ? (
            <div style={{textAlign:'center', color:'rgba(0,47,52,.64)', padding:'40px'}}>
              <div style={{fontSize:'18px', marginBottom:'8px'}}>No store orders yet</div>
              <div style={{fontSize:'14px'}}>Orders for your products will appear here</div>
            </div>
          ) : (
            storeOrders.map((order, orderIndex) => {
              // Filter items that belong to this seller
              const sellerItems = order.items.filter(item => item.seller_id === getTokenUserId())
              const sellerTotal = sellerItems.reduce((sum, item) => {
                const price = Number(String(item.price||'0').replace(/[^0-9.-]/g,'')) || 0
                return sum + price
              }, 0)
              
              return (
                <div key={order.orderId || orderIndex} style={{
                  border:'1px solid #012f34',
                  borderRadius:6,
                  padding:16,
                  background:'#fff'
                }}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12}}>
                    <div>
                      <div style={{fontSize:'18px', fontWeight:600, marginBottom:4}}>
                        Order #{order.orderId}
                      </div>
                      <div style={{fontSize:'14px', color:'rgba(0,47,52,.64)'}}>
                        {formatDate(order.orderDate)}
                      </div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:'20px', fontWeight:700, color:'#f55100'}}>
                        {formatPrice(sellerTotal)}
                      </div>
                      <div style={{fontSize:'12px', color:'rgba(0,47,52,.64)'}}>
                        {sellerItems.length} {sellerItems.length === 1 ? 'item' : 'items'}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{marginBottom:12, padding:12, background:'rgba(1,47,52,.05)', borderRadius:6}}>
                    <div style={{fontSize:'12px', fontWeight:600, marginBottom:8, color:'rgba(0,47,52,.64)'}}>CUSTOMER INFO</div>
                    <div style={{fontSize:'14px', color:'#012f34'}}>
                      <div style={{fontWeight:600, marginBottom:4}}>{order.shipping?.fullName}</div>
                      <div>{order.shipping?.email}</div>
                      <div>{order.shipping?.phone}</div>
                      <div style={{marginTop:4}}>{order.shipping?.address}, {order.shipping?.city}</div>
                    </div>
                  </div>
                  
                  <div>
                    <div style={{fontSize:'12px', fontWeight:600, marginBottom:8, color:'rgba(0,47,52,.64)'}}>YOUR ITEMS IN THIS ORDER</div>
                    <div style={{display:'flex', flexDirection:'column', gap:8}}>
                      {sellerItems.map((item, idx) => (
                        <div key={idx} style={{
                          display:'flex',
                          gap:12,
                          padding:12,
                          background:'#f9f9f9',
                          borderRadius:6
                        }}>
                          <img 
                            src={item.image || '/images/products/img1.jpg'} 
                            alt={item.title}
                            style={{
                              width:80,
                              height:80,
                              borderRadius:6,
                              objectFit:'cover'
                            }}
                          />
                          <div style={{flex:1}}>
                            <div style={{fontWeight:500, marginBottom:4}}>{item.title}</div>
                            <div style={{fontSize:'16px', fontWeight:700, color:'#f55100'}}>
                              {formatPrice(item.price)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div style={{
                    marginTop:12,
                    padding:12,
                    borderTop:'1px solid rgba(1,47,52,.1)',
                    display:'flex',
                    flexDirection:'column',
                    gap:12
                  }}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <div style={{fontSize:'14px', color:'rgba(0,47,52,.64)'}}>
                        Payment: {order.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 'Bank Transfer'}
                      </div>
                      <div style={{
                        padding:'6px 12px',
                        borderRadius:12,
                        background: (order.status || 'pending') === 'completed' ? 'rgba(37,211,102,.1)' : 
                                   (order.status || 'pending') === 'cancelled' ? 'rgba(176,0,32,.1)' : 
                                   'rgba(245,81,0,.1)',
                        color: (order.status || 'pending') === 'completed' ? '#25D366' : 
                               (order.status || 'pending') === 'cancelled' ? '#b00020' : 
                               '#f55100',
                        fontSize:'12px',
                        fontWeight:600
                      }}>
                        {(order.status || 'pending').charAt(0).toUpperCase() + (order.status || 'pending').slice(1)}
                      </div>
                    </div>
                    
                    <div style={{
                      display:'flex',
                      alignItems:'center',
                      gap:8,
                      paddingTop:8,
                      borderTop:'1px solid rgba(1,47,52,.1)'
                    }}>
                      <label style={{fontSize:'14px', fontWeight:600, color:'#012f34'}}>
                        Update Status:
                      </label>
                      <select
                        value={order.status || 'pending'}
                        onChange={(e) => {
                          const newStatus = e.target.value
                          if (newStatus !== (order.status || 'pending')) {
                            try{
                              if (typeof window !== 'undefined' && window.swal){
                                window.swal({
                                  title: 'Update Order Status?',
                                  text: `Change order status to "${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}"?`,
                                  icon: 'warning',
                                  buttons: ['Cancel', 'Update']
                                }).then(ok => {
                                  if (ok) updateOrderStatus(order.orderId, newStatus)
                                })
                              } else {
                                const confirm = window.confirm(`Change order status to "${newStatus}"?`)
                                if (confirm) updateOrderStatus(order.orderId, newStatus)
                              }
                            }catch(_){
                              updateOrderStatus(order.orderId, newStatus)
                            }
                          }
                        }}
                        style={{
                          padding:'8px 12px',
                          borderRadius:6,
                          border:'1px solid rgba(1,47,52,.2)',
                          fontSize:'14px',
                          fontWeight:500,
                          color:'#012f34',
                          background:'#fff',
                          cursor:'pointer',
                          outline:'none'
                        }}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>
              )
            })
          )
        ) : list.length===0 ? (
          <div style={{textAlign:'center', color:'rgba(0,47,52,.64)'}}>No ads found</div>
        ) : (
          list.map((p, i) => {
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
                    {!(tab === 'all' && postStatus === 'pending') && (
                      <button className="btn btn--primary" onClick={()=>toggleStatus(idx)} title={p.status==='active' ? 'Mark Inactive' : 'Mark Active'}>
                        <i className="fa-solid fa-power-off" aria-hidden="true"></i>
                        <span>{p.status==='active' ? 'Mark Inactive' : 'Mark Active'}</span>
                      </button>
                    )}
                    <button className="btn btn--danger" onClick={()=>removeAd(idx)} title="Delete">
                      <i className="fa-solid fa-trash" aria-hidden="true"></i>
                      <span>Delete</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        }))}
      </div>
      </div>
    </div>
    </>
  )
}