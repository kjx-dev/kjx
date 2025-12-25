import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { FaBars, FaUser, FaList, FaHeart, FaComment, FaKey, FaSignOutAlt, FaChevronDown, FaChevronUp, FaTags, FaPlus, FaTimes, FaArrowLeft, FaArrowUp, FaCog, FaMobileAlt, FaCar, FaMotorcycle, FaHome, FaTv, FaTabletAlt, FaMapMarkerAlt, FaBriefcase, FaPaintRoller, FaChair, FaCamera, FaChevronRight } from 'react-icons/fa'

export default function Sell(){
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [headerCatOpen, setHeaderCatOpen] = useState(false)
  const catWrapRef = useRef(null)
  const catBtnRef = useRef(null)
  const catMenuRef = useRef(null)
  const profileWrapRef = useRef(null)
  const profileBtnRef = useRef(null)
  const profileMenuRef = useRef(null)
  const [profileMenuPos, setProfileMenuPos] = useState({ top: 100, left: 16 })
  const editIndex = typeof router.query.editIndex !== 'undefined' ? parseInt(String(router.query.editIndex||''),10) : null
  const [form, setForm] = useState({
    title:'', description:'', price:'', location:'', profileName:'', profilePhone:'', phoneShow:true, category:''
  })
  const [categories, setCategories] = useState([])
  const [tiles, setTiles] = useState([])
  const [groups, setGroups] = useState([])
  const [selectedParentCategory, setSelectedParentCategory] = useState(null)
  const [selectedSubCategory, setSelectedSubCategory] = useState(null)
  const [showCategoryColumns, setShowCategoryColumns] = useState(false)
  const [images, setImages] = useState(new Array(9).fill(null))
  const [imgError, setImgError] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editingSource, setEditingSource] = useState('')
  const [step, setStep] = useState(1)
  function getCategoryIcon(category) {
    if (!category) return FaTags
    const iconName = String(category.icon || '').toLowerCase()
    const label = String(category.label || '').toLowerCase()
    const key = String(category.k || '').toLowerCase()
    
    // Check icon name first
    if (iconName.includes('mobile') || iconName.includes('phone')) return FaMobileAlt
    if (iconName.includes('car') || iconName.includes('vehicle')) return FaCar
    if (iconName.includes('motor') || iconName.includes('moter') || iconName.includes('bike')) return FaMotorcycle
    if (iconName.includes('house') || iconName.includes('home')) {
      // Property for Rent uses key icon, Property for Sale uses house
      if (label.includes('rent')) return FaKey
      return FaHome
    }
    if (iconName.includes('key') || label.includes('rent')) return FaKey
    if (iconName.includes('tv') || iconName.includes('video') || iconName.includes('audio') || iconName.includes('electronics') || iconName.includes('camera')) return FaCamera
    if (iconName.includes('tablet')) return FaTabletAlt
    if (iconName.includes('map') || iconName.includes('location') || iconName.includes('land') || iconName.includes('plot')) return FaMapMarkerAlt
    if (iconName.includes('briefcase') || iconName.includes('job')) return FaBriefcase
    if (iconName.includes('paint') || iconName.includes('service')) return FaPaintRoller
    if (iconName.includes('chair') || iconName.includes('furniture')) return FaChair
    
    // Fallback to label/key matching
    if (label.includes('mobile') || label.includes('phone') || key.includes('mobile') || key.includes('phone')) return FaMobileAlt
    if (label.includes('vehicle') || label.includes('car') || key.includes('vehicle') || key.includes('car')) return FaCar
    if (label.includes('bike') || label.includes('motor') || key.includes('bike') || key.includes('motor')) return FaMotorcycle
    if (label.includes('property') && label.includes('rent')) return FaKey
    if (label.includes('property') && label.includes('sale')) return FaHome
    if (label.includes('property') || key.includes('house') || key.includes('property')) return FaHome
    if (label.includes('electronics') || key.includes('tv') || key.includes('video') || key.includes('audio')) return FaCamera
    if (label.includes('tablet') || key.includes('tablet')) return FaTabletAlt
    if (label.includes('land') || label.includes('plot') || key.includes('land') || key.includes('plot')) return FaMapMarkerAlt
    if (label.includes('job') || key.includes('job')) return FaBriefcase
    if (label.includes('service') || key.includes('service')) return FaPaintRoller
    if (label.includes('furniture') || key.includes('furniture')) return FaChair
    
    return FaTags
  }
  async function compressImage(file){
    return await new Promise((resolve,reject)=>{
      const img = new Image()
      img.onload = () => {
        const max = 1600
        let w = img.width
        let h = img.height
        if (w>max || h>max){ const ratio = Math.min(max/w, max/h); w = Math.round(w*ratio); h = Math.round(h*ratio) }
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)
        try{ const out = canvas.toDataURL('image/jpeg', 0.8); resolve(out) }catch(e){ reject(e) }
      }
      img.onerror = reject
      const reader = new FileReader()
      reader.onload = () => { img.src = reader.result }
      reader.readAsDataURL(file)
    })
  }
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
  const cities = ['Karachi','Lahore','Islamabad','Rawalpindi','Peshawar','Quetta','Multan','Hyderabad','Faisalabad','Sialkot','Gujranwala']
  const [auth, setAuth] = useState({ email:'', isAuthenticated:false, name:'' })
  const [isAdmin, setIsAdmin] = useState(false)
  const [showTop, setShowTop] = useState(false)
  useEffect(() => {
    const email = localStorage.getItem('email') || ''
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
    const name = localStorage.getItem('name') || ''
    setAuth({ email, isAuthenticated, name })
    if (!isAuthenticated || !email) { router.push('/login'); return }
    
    // Check if user is admin
    async function checkAdminStatus(){
      try{
        const token = localStorage.getItem('auth_token')
        if (!token) { setIsAdmin(false); return }
        const res = await fetch('/api/v1/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok){
          const data = await res.json()
          setIsAdmin(data.user?.role === 'admin')
        } else {
          setIsAdmin(false)
        }
      }catch(_){
        setIsAdmin(false)
      }
    }
    checkAdminStatus()
    const uname = (localStorage.getItem('name')||'').toUpperCase()
    const phone = (localStorage.getItem('phone')||'').toUpperCase()
    setForm(f => ({ ...f, profileName:uname, profilePhone:phone }))
    ;(async ()=>{
      try{
        const res = await fetch('/api/v1/category')
        const data = await res.json()
        const payload = data.data || {}
        setCategories(payload.categories || [])
        setTiles(payload.tiles || [])
        setGroups(payload.groups || [])
      }catch(_){ setCategories(['Mobile Phones','Cars','Motercycles','House','TV - Video - Audio','Tablets','Land & Plots']); setTiles([]) }
    })()
    try{
      const qsId = router.query.editId ? String(router.query.editId) : null
      const qsSrc = router.query.source ? String(router.query.source) : ''
      if (qsId){
        // Defer edit prefill to router.isReady effect to avoid double-fetch/overwrite
      } else if (editIndex!=null && !Number.isNaN(editIndex)){
        const products = JSON.parse(localStorage.getItem('products')) || []
        const p = products[editIndex]
        if (p){
          setEditing(true)
          setEditingId('local:'+editIndex)
          setEditingSource('local')
          setForm({
            title: p.name||'', description: p.description||'', price: p.price||'', location: p.location||'', profileName: p.profileName||uname, profilePhone: p.profilePhone||phone, phoneShow: (p.phoneShow||'yes')==='yes', category: p.category||''
          })
          setStep(2)
          setHeaderCatOpen(false)
        }
      }
    }catch(_){ }
  }, [])
  useEffect(() => {
    function onScroll(){ setShowTop(typeof window!=='undefined' ? window.scrollY > 240 : false) }
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => {
    try{
      const checkMobile = () => setIsMobile(typeof window !== 'undefined' ? window.innerWidth <= 768 : false)
      checkMobile()
      window.addEventListener('resize', checkMobile)
      return () => window.removeEventListener('resize', checkMobile)
    }catch(_){ }
  }, [])
  useEffect(() => {
    if (!router.isReady) return
    try{
      const uname = (localStorage.getItem('name')||'').toUpperCase()
      const phone = (localStorage.getItem('phone')||'').toUpperCase()
      const qsId = router.query.editId ? String(router.query.editId) : null
      const qsSrc = router.query.source ? String(router.query.source) : ''
      if (qsId){
        setEditing(true)
        setEditingId(qsId)
        setEditingSource(qsSrc||'db')
        setStep(2)
        setHeaderCatOpen(false)
        ;(async ()=>{
          try{
            if ((qsSrc||'')==='db'){
              const r = await fetch('/api/v1/posts/'+encodeURIComponent(qsId))
              const j = await r.json()
              const d = j?.data||{}
              setForm(f=>({ ...f, title: d.title||'', description: d.content||'', price: d.price||'', location: d.location||'', profileName: f.profileName||uname, profilePhone: f.profilePhone||phone, phoneShow: f.phoneShow, category: (d.category && d.category.name) || '' }))
              const arr = new Array(9).fill(null)
              if (Array.isArray(d.images)){
                for (let i=0;i<Math.min(d.images.length, 9); i++){
                  const im = d.images[i]
                  arr[i] = { preview: im.url, url: im.url, mime: im.mime || 'image/jpeg', size: im.size || 0, name: '' }
                }
              }
              setImages(arr)
            }
          }catch(_){ }
        })()
      }
    }catch(_){ }
  }, [router.isReady])
  useEffect(() => {
    function onKey(e){ if (e.key === 'Escape') setProfileOpen(false) }
    function onOutside(e){ if (!profileWrapRef.current) return; if (!profileWrapRef.current.contains(e.target)) setProfileOpen(false) }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onOutside)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onOutside)
    }
  }, [])
  function sell(){ if (auth.email && auth.isAuthenticated) router.push('/sell'); else router.push('/login') }
  function manage(){ router.push('/manage') }
  function logout(){ try{ localStorage.removeItem('auth_token'); localStorage.removeItem('email'); localStorage.removeItem('username'); localStorage.removeItem('name'); localStorage.removeItem('phone'); localStorage.removeItem('gender'); localStorage.removeItem('isAuthenticated'); }catch(_){ } router.replace('/') }
  function toggleProfileMenu(){
    setProfileOpen(v => {
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
  useEffect(() => {
    if (profileOpen) {
      const first = profileMenuRef.current?.querySelector('a,button,[tabindex]')
      if (first) first.focus()
      if (profileBtnRef.current) profileBtnRef.current.setAttribute('aria-expanded','true')
    } else {
      if (profileBtnRef.current) profileBtnRef.current.setAttribute('aria-expanded','false')
    }
  }, [profileOpen])
  useEffect(() => {
    function onKey(e){ if (e.key === 'Escape') setHeaderCatOpen(false) }
    function onOutside(e){ if (!catWrapRef.current) return; if (!catWrapRef.current.contains(e.target)) setHeaderCatOpen(false) }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onOutside)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onOutside)
    }
  }, [])
  async function addProduct(){
    const nextErrors = {}
    const title = String(form.title||'').trim()
    const description = String(form.description||'').trim()
    const priceRaw = String(form.price||'').trim()
    const priceNum = parseFloat(priceRaw)
    const location = String(form.location||'').trim()
    const category = String(form.category||'').trim()
    const imgs = images.filter(Boolean)

    if (!title) nextErrors.title = 'Ad title is required'
    if (!description) nextErrors.description = 'Description is required'
    if (!location) nextErrors.location = 'Location is required'
    if (!category) nextErrors.category = 'Category is required'
    if (!priceRaw || Number.isNaN(priceNum) || priceNum <= 0) nextErrors.price = 'Enter a valid price'
    if (imgs.length < 1) nextErrors.images = 'Please upload at least one image'

    

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0){
      if (nextErrors.images) setImgError(nextErrors.images)
      return
    }
    setSubmitting(true)
    const obg = {
      title: form.title,
      description: form.description,
      image: images.find(u=>u) || 'https://picsum.photos/seed/product/800/600',
      price: form.price,
      location: form.location,
      profilePhone: form.profilePhone,
      phoneShow: form.phoneShow ? 'yes' : 'no',
      category: form.category || ''
    }
    try{
      const token = localStorage.getItem('auth_token') || ''
      const userId = getUserId()
      if (editing && editingSource==='db'){
        const body = { title: obg.title, content: obg.description, category: obg.category, price: parseInt(String(obg.price||'0'),10)||null, location: obg.location||null, images: imgs.map((m,i)=>({ url: m.url, mime: m.mime, size: m.size, order: i })) }
        const res = await fetch('/api/v1/posts/'+encodeURIComponent(String(editingId)), { method:'PATCH', headers:{ 'Content-Type':'application/json', ...(token?{ 'Authorization': 'Bearer ' + token }:{} ) }, body: JSON.stringify(body) })
        const json = await res.json()
        if (res.status === 401){ alert('Please login to update'); setSubmitting(false); router.push('/login'); return }
        if (!res.ok){ const msg = (json && (json.message || json.error?.message)) || 'Failed to update'; alert(msg); setSubmitting(false); return }
        try{ if (typeof window !== 'undefined' && window.swal){ await window.swal('Success', 'Ad updated successfully', 'success') } }catch(_){ }
        try{ const raw = localStorage.getItem('last_updates') || '{}'; const map = JSON.parse(raw); map['db:'+String(editingId)] = Date.now(); localStorage.setItem('last_updates', JSON.stringify(map)) }catch(_){ }
        router.push('/manage'); return
      }
      
      const body = {
        title: obg.title,
        content: obg.description,
        category: obg.category,
        price: parseInt(String(obg.price||'0'),10) || null,
        location: obg.location || null,
        images: imgs.map((m,i)=>({ url: m.url, mime: m.mime, size: m.size, order: i }))
      }
      const res = await fetch('/api/v1/posts', { method:'POST', headers:{ 'Content-Type':'application/json', ...(token?{ 'Authorization': 'Bearer ' + token }:{} ) }, body: JSON.stringify(body) })
      let json = null
      let text = ''
      try{ json = await res.json() }catch(e){ try{ text = await res.text() }catch(_){ } }
      if (res.status === 401){ alert('Please login to post'); setSubmitting(false); router.push('/login'); return }
      if (!res.ok){
        const msg = (json && (json.message || json.error?.message)) || text || 'Failed to post'
        alert(msg)
        setSubmitting(false)
        return
      }
      try{ if (typeof window !== 'undefined' && window.swal){ await window.swal('Success', 'Ad posted successfully', 'success') } }catch(_){ }
      try{ const raw = localStorage.getItem('last_updates') || '{}'; const map = JSON.parse(raw); const pid = (json && json.data && json.data.post_id) || null; if (pid!=null){ map['db:'+String(pid)] = Date.now(); localStorage.setItem('last_updates', JSON.stringify(map)) } }catch(_){ }
      router.push('/manage')
    }catch(_){ setSubmitting(false); alert('Network error while posting. Please try again.') }
  }
  function onPickImage(idx){
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e)=>{
      const f = e.target.files && e.target.files[0]
      if (!f) return
      if (!String(f.type||'').startsWith('image/')){ setImgError('Invalid image type'); return }
      if (f.size > 10*1024*1024){ setImgError('Image must be 10MB or smaller'); return }
      compressImage(f).then(dataUrl => {
        const url = URL.createObjectURL(f)
        const baseLen = String(dataUrl||'').length
        const comma = String(dataUrl||'').indexOf(',')
        const b64Len = baseLen - (comma>=0 ? (comma+1) : 0)
        const approxBytes = Math.ceil(b64Len * 0.75)
        const meta = { preview:url, url:dataUrl, mime:'image/jpeg', size: approxBytes, name:f.name }
        setImages(arr => { const next = arr.slice(); next[idx] = meta; return next })
        setImgError('')
      }).catch(()=>{ setImgError('Failed to process image') })
    }
    input.click()
  }
  function handleDrop(idx, e){
    e.preventDefault()
    try{
      const files = e.dataTransfer?.files || []
      if (!files.length) return
      const list = Array.from(files).filter(f => String(f.type||'').startsWith('image/')).slice(0, images.length - idx)
      if (!list.length){ setImgError('Invalid image type'); return }
      ;(async ()=>{
        for(let i=0;i<list.length;i++){
          const f = list[i]
          if (f.size > 10*1024*1024){ setImgError('Image must be 10MB or smaller'); break }
          const dataUrl = await compressImage(f)
          const url = URL.createObjectURL(f)
          const baseLen = String(dataUrl||'').length
          const comma = String(dataUrl||'').indexOf(',')
          const b64Len = baseLen - (comma>=0 ? (comma+1) : 0)
          const approxBytes = Math.ceil(b64Len * 0.75)
          const meta = { preview:url, url:dataUrl, mime:'image/jpeg', size: approxBytes, name:f.name }
          setImages(arr => { const next = arr.slice(); next[idx+i] = meta; return next })
        }
        setImgError('')
      })()
    }catch(_){ setImgError('Failed to process image') }
  }
  function removeImage(idx){ setImages(arr => { const next = arr.slice(); next[idx] = null; return next }) }
  return (
    <>
      <div className="same__color">
        <div className="small__navbar">
          <div className="icons_flex sell__hdr" style={{width:'100%'}}>
            {isMobile ? (
              <div className="nav__mobile" style={{display:'flex', alignItems:'center', justifyContent:'center', position:'relative', width:'100%'}}>
                <button onClick={sell} className="sell__btn" style={{margin:'0 auto'}}>+ Sell</button>
                <button aria-label="Menu" className="mobile__menu" ref={profileBtnRef} onClick={toggleProfileMenu} style={{position:'absolute', right:16}}>
                  <FaBars />
                </button>
                {profileOpen && (
                  <div id="profileMenu" ref={profileMenuRef} className="profile__menu" style={{ position:'fixed', top: profileMenuPos.top, left: profileMenuPos.left }}>
                    <div className="header">
                      <FaUser style={{fontSize:22}} />
                      <div>
                        <h4 style={{fontWeight:500}}>{auth.name || 'My Profile'}</h4>
                        <a href="/profile" className="profile__link" style={{textDecoration:'none'}}>
                          <span>View Public Profile</span>
                        </a>
                      </div>
                    </div>
                    <div className="menu__item" onClick={manage}><FaList /><span>My Ads</span></div>
                    <div className="menu__item" onClick={()=>router.push('/favorites')}><FaHeart /><span>Favorites</span></div>
                    <div className="menu__item" onClick={()=>router.push('/chat')}><FaComment /><span>Chat</span></div>
                    <div className="menu__item" onClick={()=>router.push('/change-password')}><FaKey /><span>Change Password</span></div>
                    {isAdmin && (
                      <div className="menu__item" onClick={()=>router.push('/admin')}><FaCog /><span>Admin</span></div>
                    )}
                    <div className="menu__item" onClick={logout}><FaSignOutAlt /><span>Logout</span></div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <a href="/" aria-label="Back" style={{color: '#3c3c3c'}}><FaArrowLeft /></a>
                <a href="/" aria-label="Home" style={{marginLeft:8}}>
                 <svg height="32" viewBox="0 0 80 30" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="KJX Logo">
                <text x="2" y="26" fontFamily="'Arial Black', 'Arial Bold', Arial, sans-serif" fontSize="27" fontWeight="900" fill="#f55100" fontStyle="italic" transform="skewX(0)">KJX</text>
              </svg>
                </a>
              </>
            )}
          </div>
        </div>
      </div>
      {showTop && (
        <button aria-label="Back to top" onClick={()=>{ try{ window.scrollTo({ top:0, behavior:'smooth' }) }catch(_){ } }} style={{position:'fixed', right:16, bottom:16, width:44, height:44, borderRadius:22, background:'#012f34', color:'#fff', border:'none', boxShadow:'0 2px 8px rgba(0,0,0,.2)', zIndex:4000}}>
          <FaArrowUp />
        </button>
      )}
    <div className="sell__main" style={step === 1 ? {maxWidth: '1200px', marginTop: '16px', marginBottom: '40px'} : {}}>
      <h1 style={{color: '#012f34', fontSize: step === 1 ? '32px' : '22px', fontWeight: 600, marginBottom: step === 1 ? '24px' : '12px', marginTop: '0'}}>Post Your Ad</h1>
      <div className="sell__grid" style={step === 1 ? {gridTemplateColumns: '1fr'} : {}}>
        <div className="sell__card" style={step === 1 ? {border: 'none', boxShadow: 'none', padding: '0', background: 'transparent'} : {}}>
          {step !== 1 && (
          <div style={{marginBottom:12}}>
            <div style={{position:'relative', height:16, borderRadius:8, background:'rgba(1,47,52,.12)'}}>
              <div style={{height:16, borderRadius:8, background:'#012f34', width: (step===2?'66%':'100%')}}></div>
              <div style={{position:'absolute', top:'50%', left:'50%', transform:'translate(-50%, -50%)'}}>
                <span style={{display:'inline-block', padding:'2px 8px', borderRadius:9999, background:'rgba(255,255,255,.85)', color:'#012f34', fontSize:12, fontWeight:600}}>Step {step} of 3</span>
              </div>
            </div>
          </div>
          )}
          {step === 1 ? (
            <div style={{marginTop:0}}>
              <h2 style={{color: '#012f34', fontSize: '20px', fontWeight: 600, marginBottom: '24px', textAlign: 'left'}}>Choose a Category</h2>
              {!showCategoryColumns ? (
                // Grid View - Initial main categories
                <div className="home__categories-grid" style={{transition:'opacity 200ms ease', opacity:1, marginBottom: 0}}>
                  {(groups.length > 0 ? groups.map(g => {
                    const tileMatch = tiles.find(t => t.k === g.parent.name || t.label === g.parent.name)
                    return {
                      ...g.parent,
                      displayLabel: tileMatch ? tileMatch.label : g.parent.name,
                      icon: tileMatch ? tileMatch.icon : g.parent.icon
                    }
                  }) : (tiles.length ? tiles.map(t => ({name: t.k || t.label, displayLabel: t.label || t.k, icon: t.icon})) : categories.filter(c => !c.parent_id).map(c => ({name: c.name, displayLabel: c.name, icon: c.icon})))).map((parent, idx) => {
                    const group = groups.find(g => (g.parent.category_id === parent.category_id || g.parent.name === parent.name))
                    const hasChildren = group && group.children && group.children.length > 0
                    const iconData = {icon: parent.icon || 'fa-tags', label: parent.displayLabel || parent.name}
                    const IconComponent = getCategoryIcon(iconData)
                    return (
                      <a 
                        key={parent.category_id || parent.name || idx} 
                        className="cat__card" 
                        href="#" 
                        onClick={(e)=>{ 
                          e.preventDefault()
                          if (hasChildren) {
                            setSelectedParentCategory(parent)
                            setSelectedSubCategory(null)
                            setShowCategoryColumns(true)
                          } else {
                            setForm({...form, category: parent.name})
                            setStep(2)
                          }
                        }}
                      >
                        <div className="cat__icon"><IconComponent /></div>
                        <div className="cat__label">{parent.displayLabel || parent.name}</div>
                      </a>
                    )
                  })}
                </div>
              ) : (
                // Column View - After selecting a main category
                <div style={{display: 'flex', gap: '0', border: '1px solid rgba(1,47,52,.15)', borderRadius: '8px', overflow: 'hidden', minHeight: '400px'}}>
                {/* First Column - Main Categories */}
                <div style={{flex: '0 0 280px', borderRight: '1px solid rgba(1,47,52,.15)', background: '#fff', overflowY: 'auto', maxHeight: '600px'}}>
                  {(groups.length > 0 ? groups.map(g => {
                    const tileMatch = tiles.find(t => t.k === g.parent.name || t.label === g.parent.name)
                    return {
                      ...g.parent,
                      displayLabel: tileMatch ? tileMatch.label : g.parent.name,
                      icon: tileMatch ? tileMatch.icon : g.parent.icon
                    }
                  }) : (tiles.length ? tiles.map(t => ({name: t.k || t.label, displayLabel: t.label || t.k, icon: t.icon})) : categories.filter(c => !c.parent_id).map(c => ({name: c.name, displayLabel: c.name, icon: c.icon})))).map((parent, idx) => {
                    const group = groups.find(g => (g.parent.category_id === parent.category_id || g.parent.name === parent.name))
                    const isSelected = selectedParentCategory && (selectedParentCategory.category_id === parent.category_id || (selectedParentCategory.name === parent.name && !selectedParentCategory.category_id))
                    const iconData = {icon: parent.icon || 'fa-tags', label: parent.displayLabel || parent.name}
                    const IconComponent = getCategoryIcon(iconData)
                    const hasChildren = group && group.children && group.children.length > 0
                    return (
                      <div
                        key={parent.category_id || parent.name || idx}
                        onClick={() => {
                          setSelectedParentCategory(parent)
                          setSelectedSubCategory(null)
                          if (!hasChildren) {
                            setForm({...form, category: parent.name})
                            setStep(2)
                          }
                        }}
                        style={{
                          padding: '14px 16px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: isSelected ? 'rgba(58,119,255,0.1)' : '#fff',
                          borderBottom: '1px solid rgba(1,47,52,.08)',
                          transition: 'background 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.background = 'rgba(1,47,52,.04)'
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.background = '#fff'
                        }}
                      >
                        <div style={{display: 'flex', alignItems: 'center', gap: '12px', flex: 1}}>
                          <div style={{width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3c3c3c'}}>
                            <IconComponent style={{fontSize: '20px'}} />
                          </div>
                          <span style={{fontSize: '15px', fontWeight: 500, color: '#012f34'}}>{parent.displayLabel || parent.name}</span>
                        </div>
                        {hasChildren && <FaChevronRight style={{fontSize: '14px', color: '#3c3c3c'}} />}
                      </div>
                    )
                  })}
                </div>
                
                {/* Second Column - Subcategories */}
                {selectedParentCategory && (() => {
                  const group = groups.find(g => (g.parent.category_id === selectedParentCategory.category_id || g.parent.name === selectedParentCategory.name))
                  const subcategories = group ? group.children : []
                  if (subcategories.length === 0) return null
                  return (
                    <div style={{flex: '0 0 280px', borderRight: '1px solid rgba(1,47,52,.15)', background: '#fff', overflowY: 'auto', maxHeight: '600px'}}>
                      {subcategories.map((subcat, idx) => {
                        const isSelected = selectedSubCategory && (selectedSubCategory.category_id === subcat.category_id || selectedSubCategory.name === subcat.name)
                        const hasSubChildren = subcat.subchildren && subcat.subchildren.length > 0
                        return (
                          <div
                            key={subcat.category_id || subcat.name || idx}
                            onClick={() => {
                              setSelectedSubCategory(subcat)
                              if (!hasSubChildren) {
                                setForm({...form, category: subcat.name})
                                setStep(2)
                              }
                            }}
                            style={{
                              padding: '14px 16px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: isSelected ? 'rgba(58,119,255,0.1)' : '#fff',
                              borderBottom: '1px solid rgba(1,47,52,.08)',
                              transition: 'background 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) e.currentTarget.style.background = 'rgba(1,47,52,.04)'
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) e.currentTarget.style.background = '#fff'
                            }}
                          >
                            <span style={{fontSize: '15px', fontWeight: 400, color: '#012f34'}}>{subcat.name}</span>
                            {hasSubChildren && <FaChevronRight style={{fontSize: '14px', color: '#3c3c3c'}} />}
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
                
                {/* Third Column - Sub-subcategories */}
                {selectedSubCategory && (() => {
                  const subSubcategories = selectedSubCategory.subchildren || []
                  if (subSubcategories.length === 0) return null
                  return (
                    <div style={{flex: '1', background: '#fff', overflowY: 'auto', maxHeight: '600px'}}>
                      {subSubcategories.map((subsubcat, idx) => (
                        <div
                          key={subsubcat.category_id || subsubcat.name || idx}
                          onClick={() => {
                            setForm({...form, category: subsubcat.name})
                            setStep(2)
                          }}
                          style={{
                            padding: '14px 16px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            background: '#fff',
                            borderBottom: '1px solid rgba(1,47,52,.08)',
                            transition: 'background 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(1,47,52,.04)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                        >
                          <span style={{fontSize: '15px', fontWeight: 400, color: '#012f34'}}>{subsubcat.name}</span>
                        </div>
                      ))}
                    </div>
                  )
                })()}
                </div>
              )}
            </div>
          ) : (
          <div className="sell__section" style={{border:'1px solid rgba(1,47,52,.2)', borderRadius:12, padding:16, background:'#fff', boxShadow:'0 6px 18px rgba(1,47,52,.08)', marginBottom:12}}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:12}}>
              <div style={{flex:1}}>
                <div className="form__label" style={{marginBottom:6}}>Category</div>
                <div style={{display:'flex', alignItems:'center', gap:10, flexWrap:'wrap'}}>
                  <span style={{display:'inline-flex', alignItems:'center', gap:8, padding:'8px 12px', border:'1px solid rgba(1,47,52,.2)', borderRadius:9999, background:'rgba(1,47,52,.06)'}}>
                    <FaList aria-hidden="true" />
                    <span style={{fontWeight:600}}>{form.category || 'Select Category'}</span>
                  </span>
                  <span style={{color:'rgba(0,47,52,.64)'}}>{form.category ? 'Selected' : 'Choose a category to continue'}</span>
                </div>
              </div>
              {step>=2 ? (
                <button
                  className="login__btn"
                  onClick={()=>{ 
                    setHeaderCatOpen(v=>!v)
                    if (!headerCatOpen) {
                      // When opening, try to find the currently selected category in the hierarchy
                      const currentCategoryName = form.category
                      if (currentCategoryName && groups.length > 0) {
                        // Try to find if it's a parent category
                        let foundParent = groups.find(g => g.parent.name === currentCategoryName)
                        if (foundParent) {
                          setSelectedParentCategory(foundParent.parent)
                          setSelectedSubCategory(null)
                        } else {
                          // Try to find if it's a child or subchild
                          for (const group of groups) {
                            const foundChild = group.children.find(c => c.name === currentCategoryName)
                            if (foundChild) {
                              setSelectedParentCategory(group.parent)
                              setSelectedSubCategory(foundChild)
                              break
                            }
                            // Try subchildren
                            for (const child of group.children) {
                              const foundSubChild = child.subchildren?.find(sc => sc.name === currentCategoryName)
                              if (foundSubChild) {
                                setSelectedParentCategory(group.parent)
                                setSelectedSubCategory(child)
                                break
                              }
                            }
                          }
                        }
                      }
                    }
                  }}
                  style={{border:'1px solid rgba(1,47,52,.2)', background:'#fff', color:'#012f34', borderRadius:20, padding:'6px 12px'}}
                >
                  {headerCatOpen ? 'Close' : 'Change'} {headerCatOpen ? <FaChevronUp style={{marginLeft:6}} /> : <FaChevronDown style={{marginLeft:6}} />}
                </button>
              ) : null}
            </div>
            {headerCatOpen && (
              <div style={{marginTop:10}}>
                <div style={{display: 'flex', gap: '0', border: '1px solid rgba(1,47,52,.15)', borderRadius: '8px', overflow: 'hidden', minHeight: '400px', background: '#fff'}}>
                  {/* First Column - Main Categories */}
                  <div style={{flex: '0 0 280px', borderRight: '1px solid rgba(1,47,52,.15)', background: '#fff', overflowY: 'auto', maxHeight: '600px'}}>
                    {(groups.length > 0 ? groups.map(g => {
                      const tileMatch = tiles.find(t => 
                        t.k === g.parent.name || 
                        t.label === g.parent.name ||
                        t.k.toLowerCase() === g.parent.name.toLowerCase() ||
                        t.label.toLowerCase() === g.parent.name.toLowerCase()
                      )
                      return {
                        ...g.parent,
                        displayLabel: tileMatch ? tileMatch.label : g.parent.name,
                        icon: tileMatch ? tileMatch.icon : (g.parent.icon || 'fa-tags'),
                        tileData: tileMatch
                      }
                    }) : (tiles.length ? tiles.map(t => ({name: t.k || t.label, displayLabel: t.label || t.k, icon: t.icon, tileData: t})) : categories.filter(c => !c.parent_id).map(c => ({name: c.name, displayLabel: c.name, icon: c.icon || 'fa-tags', tileData: null})))).map((parent, idx) => {
                      const group = groups.find(g => (g.parent.category_id === parent.category_id || g.parent.name === parent.name))
                      const isSelected = selectedParentCategory && (selectedParentCategory.category_id === parent.category_id || (selectedParentCategory.name === parent.name && !selectedParentCategory.category_id))
                      const iconData = parent.tileData || {
                        icon: parent.icon || 'fa-tags', 
                        label: parent.displayLabel || parent.name,
                        k: parent.name
                      }
                      const IconComponent = getCategoryIcon(iconData)
                      const hasChildren = group && group.children && group.children.length > 0
                      return (
                        <div
                          key={parent.category_id || parent.name || idx}
                          onClick={() => {
                            setSelectedParentCategory(parent)
                            setSelectedSubCategory(null)
                            if (!hasChildren) {
                              setForm({...form, category: parent.name})
                              setErrors(err=>({ ...err, category:'' }))
                              setHeaderCatOpen(false)
                            }
                          }}
                          style={{
                            padding: '14px 16px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: isSelected ? 'rgba(230, 240, 255, 1)' : '#fff',
                            borderBottom: '1px solid rgba(1,47,52,.08)',
                            transition: 'background 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.background = 'rgba(1,47,52,.03)'
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.background = '#fff'
                          }}
                        >
                          <div style={{display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0}}>
                            <div style={{width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3c3c3c', flexShrink: 0}}>
                              <IconComponent style={{fontSize: '20px'}} />
                            </div>
                            <span style={{fontSize: '15px', fontWeight: 500, color: '#012f34', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{parent.displayLabel || parent.name}</span>
                          </div>
                          {hasChildren && <FaChevronRight style={{fontSize: '14px', color: '#3c3c3c', flexShrink: 0, marginLeft: '8px'}} />}
                        </div>
                      )
                    })}
                  </div>
                  
                  {/* Second Column - Subcategories */}
                  {selectedParentCategory && (() => {
                    const group = groups.find(g => (g.parent.category_id === selectedParentCategory.category_id || g.parent.name === selectedParentCategory.name))
                    const subcategories = group ? group.children : []
                    if (subcategories.length === 0) return null
                    return (
                      <div style={{flex: '0 0 280px', borderRight: '1px solid rgba(1,47,52,.15)', background: '#fff', overflowY: 'auto', maxHeight: '600px'}}>
                        {subcategories.map((subcat, idx) => {
                          const isSelected = selectedSubCategory && (selectedSubCategory.category_id === subcat.category_id || selectedSubCategory.name === subcat.name)
                          const hasSubChildren = subcat.subchildren && subcat.subchildren.length > 0
                          return (
                            <div
                              key={subcat.category_id || subcat.name || idx}
                              onClick={() => {
                                setSelectedSubCategory(subcat)
                                if (!hasSubChildren) {
                                  setForm({...form, category: subcat.name})
                                  setErrors(err=>({ ...err, category:'' }))
                                  setHeaderCatOpen(false)
                                }
                              }}
                              style={{
                                padding: '14px 16px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: isSelected ? 'rgba(230, 240, 255, 1)' : '#fff',
                                borderBottom: '1px solid rgba(1,47,52,.08)',
                                transition: 'background 0.15s ease'
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) e.currentTarget.style.background = 'rgba(1,47,52,.03)'
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) e.currentTarget.style.background = '#fff'
                              }}
                            >
                              <span style={{fontSize: '15px', fontWeight: 400, color: '#012f34', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{subcat.name}</span>
                              {hasSubChildren && <FaChevronRight style={{fontSize: '14px', color: '#3c3c3c', flexShrink: 0, marginLeft: '8px'}} />}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}
                  
                  {/* Third Column - Sub-subcategories */}
                  {selectedSubCategory && (() => {
                    const subSubcategories = selectedSubCategory.subchildren || []
                    if (subSubcategories.length === 0) return null
                    return (
                      <div style={{flex: '1', background: '#fff', overflowY: 'auto', maxHeight: '600px'}}>
                        {subSubcategories.map((subsubcat, idx) => (
                          <div
                            key={subsubcat.category_id || subsubcat.name || idx}
                            onClick={() => {
                              setForm({...form, category: subsubcat.name})
                              setErrors(err=>({ ...err, category:'' }))
                              setHeaderCatOpen(false)
                            }}
                            style={{
                              padding: '14px 16px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              background: '#fff',
                              borderBottom: '1px solid rgba(1,47,52,.08)',
                              transition: 'background 0.15s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(1,47,52,.03)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                          >
                            <span style={{fontSize: '15px', fontWeight: 400, color: '#012f34', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{subsubcat.name}</span>
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                </div>
              </div>
            )}
            {errors.category ? <div className="form__error" aria-live="polite" style={{marginTop:6}}>{errors.category}</div> : null}
          </div>
          )}
          {step>=2 && (
          <div className="sell__section" style={{border:'1px solid rgba(1,47,52,.2)', borderRadius:12, padding:16, background:'#fff', boxShadow:'0 6px 18px rgba(1,47,52,.08)', marginBottom:12}}>
            <h4>Upload Images</h4>
            <div className="upload__grid" style={{display:'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)', gap:12}}>
              {images.map((u,idx)=> (
                <div
                  key={idx}
                  className="upload__tile"
                  onClick={()=>onPickImage(idx)}
                  onDragOver={(e)=>{ e.preventDefault() }}
                  onDrop={(e)=>handleDrop(idx, e)}
                  style={{
                    position:'relative',
                    width:'100%',
                    paddingTop:'75%',
                    border:'1px solid rgba(1,47,52,.2)',
                    borderRadius:12,
                    background:'rgba(1,47,52,.03)',
                    overflow:'hidden',
                    cursor:'pointer'
                  }}
                >
                  {!u ? (
                    <button
                      className="upload__add"
                      onClick={()=>onPickImage(idx)}
                      style={{
                        position:'absolute',
                        top:'50%', left:'50%', transform:'translate(-50%, -50%)',
                        width:48, height:48, borderRadius:24,
                        display:'inline-flex', alignItems:'center', justifyContent:'center',
                        border:'1px solid rgba(1,47,52,.3)', background:'#fff'
                      }}
                    >
                      <FaPlus style={{fontSize:20}} />
                    </button>
                  ) : (
                    <>
                      <img src={u.preview} alt="" loading="lazy" decoding="async" style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', objectFit:'cover'}} />
                      <div style={{position:'absolute', left:8, bottom:8, padding:'6px 10px', borderRadius:20, background:'rgba(255,255,255,.9)', border:'1px solid rgba(1,47,52,.2)', color:'rgba(0,47,52,.84)', fontSize:12}}>Change</div>
                      <button aria-label="Remove image" onClick={(e)=>{ e.stopPropagation(); removeImage(idx) }} style={{position:'absolute', top:8, right:8, background:'rgba(0,0,0,0.6)', color:'#fff', border:'none', borderRadius:14, width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center'}}><FaTimes /></button>
                    </>
                  )}
                </div>
              ))}
            </div>
            {imgError ? <div className="form__error" style={{marginTop:6}}>{imgError}</div> : null}
            <div style={{color:'rgba(0,47,52,.64)', marginTop:6}}>For the cover picture we recommend using the landscape mode.</div>
          </div>
          )}
          {step>=2 && (
          <div className="sell__section" style={{border:'1px solid rgba(1,47,52,.2)', borderRadius:12, padding:16, background:'#fff', boxShadow:'0 6px 18px rgba(1,47,52,.08)', marginBottom:12}}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
              <label className="form__label">Ad title*</label>
              <div className="form__hint">{String(form.title||'').length}/70</div>
            </div>
            <input className="form__input" value={form.title} onChange={e=>{ const v = e.target.value.slice(0,70); setForm({...form, title:v}) }} placeholder="Mention the key features of your item (e.g brand, model, age, type)" aria-invalid={!!errors.title} style={{height:42}} />
            {errors.title ? <div className="form__error" aria-live="polite" style={{marginTop:6}}>{errors.title}</div> : null}
          </div>
          )}
          {step>=2 && (
          <div className="sell__section" style={{border:'1px solid rgba(1,47,52,.2)', borderRadius:12, padding:16, background:'#fff', boxShadow:'0 6px 18px rgba(1,47,52,.08)', marginBottom:12}}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
              <label className="form__label">Description*</label>
              <div className="form__hint">{String(form.description||'').length}/4096</div>
            </div>
            <textarea className="form__textarea" value={form.description} onChange={e=>{ const v = e.target.value.slice(0,4096); setForm({...form, description:v}) }} placeholder="Describe the item you're selling" aria-invalid={!!errors.description} style={{minHeight:120}}></textarea>
            {errors.description ? <div className="form__error" aria-live="polite" style={{marginTop:6}}>{errors.description}</div> : null}
            <div style={{color:'rgba(0,47,52,.64)', marginTop:6}}>Include condition, features and reason for selling</div>
          </div>
          )}
          {step>=2 && (
          <div className="sell__section" style={{border:'1px solid rgba(1,47,52,.2)', borderRadius:12, padding:16, background:'#fff', boxShadow:'0 6px 18px rgba(1,47,52,.08)', marginBottom:12}}>
            <label className="form__label">Location*</label>
            <select className="form__input" value={form.location} onChange={e=>setForm({...form, location:e.target.value})} aria-invalid={!!errors.location} style={{height:42}}>
              <option value="">Select Location</option>
              {cities.map(c => (<option key={c} value={c}>{c}</option>))}
            </select>
            {errors.location ? <div className="form__error" aria-live="polite" style={{marginTop:6}}>{errors.location}</div> : null}
          </div>
          )}
          {step>=2 && (
          <div className="sell__section" style={{border:'1px solid rgba(1,47,52,.2)', borderRadius:12, padding:16, background:'#fff', boxShadow:'0 6px 18px rgba(1,47,52,.08)', marginBottom:12}}>
            <label className="form__label">Price*</label>
            <div style={{display:'flex', alignItems:'center', gap:8}}>
              <div style={{border:'1px solid rgba(1,47,52,.2)', borderRadius:8, padding:'10px 12px', background:'rgba(1,47,52,.06)'}}>Rs</div>
              <input className="form__input" style={{flex:1, height:42}} value={form.price} onChange={e=>setForm({...form, price:e.target.value})} placeholder="Enter Price" aria-invalid={!!errors.price} />
            </div>
            {errors.price ? <div className="form__error" aria-live="polite" style={{marginTop:6}}>{errors.price}</div> : null}
          </div>
          )}
          {step>=2 && (
          <div className="sell__section" style={{border:'1px solid rgba(1,47,52,.2)', borderRadius:12, padding:16, background:'#fff', boxShadow:'0 6px 18px rgba(1,47,52,.08)'}}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
              <div style={{color:'rgba(0,47,52,.84)'}}>Your phone number</div>
              <div style={{fontWeight:600}}>{form.profilePhone || '+92XXXXXXXXXX'}</div>
            </div>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:12}}>
              <div>Show my phone number in ads</div>
              <label style={{display:'inline-flex', alignItems:'center', cursor:'pointer'}}>
                <input type="checkbox" checked={!!form.phoneShow} onChange={e=>setForm({...form, phoneShow:e.target.checked})} style={{display:'none'}} />
                <span style={{width:42, height:24, borderRadius:12, background: form.phoneShow ? '#012f34' : 'rgba(1,47,52,.2)', position:'relative'}}>
                  <span style={{position:'absolute', top:2, left: form.phoneShow ? 22 : 2, width:20, height:20, borderRadius:'50%', background:'#fff'}}></span>
                </span>
              </label>
            </div>
            
            <div style={{display:'flex', justifyContent:'flex-end', marginTop:12}}>
              <button id="btnSubmit" className="load__more-btn" onClick={addProduct} disabled={submitting}>{submitting ? 'Posting...' : 'Post now'}</button>
            </div>
          </div>
          )}
        </div>
        {step !== 1 && (
        <div className="sell__card sell__aside">
          <div className="sell__section" style={{border:'1px solid rgba(1,47,52,.2)', borderRadius:12, padding:16, background:'#fff', boxShadow:'0 6px 18px rgba(1,47,52,.08)'}}>
            <h4>Need help getting started?</h4>
            <p>Review these resource to learn how to create a great ad and increase your selling chances</p>
            <ul style={{textAlign:'left'}}>
              <li><a href="/tips">Tips for improving your ads and your chances of selling</a></li>
              <li><a href="/posting-ads">All you need to know about Posting Ads</a></li>
            </ul>
            <p>You can always come back to change your ad</p>
          </div>
        </div>
        )}
      </div>
    </div>
    </>
  )
}