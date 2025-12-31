import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { FaBars, FaUser, FaList, FaHeart, FaComment, FaKey, FaSignOutAlt, FaChevronDown, FaChevronUp, FaTags, FaPlus, FaTimes, FaArrowLeft, FaArrowUp, FaCog, FaMobileAlt, FaCar, FaMotorcycle, FaHome, FaTv, FaTabletAlt, FaMapMarkerAlt, FaBriefcase, FaPaintRoller, FaChair, FaCamera, FaChevronRight, FaDog, FaBook, FaBaby, FaIndustry } from 'react-icons/fa'
import { getShortCategoryName } from '../lib/categoryNames'
import { getCategoryIcon } from '../lib/categoryIcons'
import { getOrderedCategories, getCategoryIconComponent } from '../lib/categoryUtils'

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
    title:'', description:'', price:'', location:'', profileName:'', profilePhone:'', phoneShow:true, category:'', post_type:''
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
  const [step, setStep] = useState(0)
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
            title: p.name||'', description: p.description||'', price: p.price||'', location: p.location||'', profileName: p.profileName||uname, profilePhone: p.profilePhone||phone, phoneShow: (p.phoneShow||'yes')==='yes', category: p.category||'', post_type: p.post_type || 'ad'
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
              setForm(f=>({ ...f, title: d.title||'', description: d.content||'', price: d.price||'', location: d.location||'', profileName: f.profileName||uname, profilePhone: f.profilePhone||phone, phoneShow: f.phoneShow, category: (d.category && d.category.name) || '', post_type: d.post_type || 'ad' }))
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
  function manage(){ router.push('/my-ads') }
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
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey) }
  }, [])
  
  // State for modal category selection
  const [modalSelectedParent, setModalSelectedParent] = useState(null)
  const [modalSelectedSub, setModalSelectedSub] = useState(null)
  
  // Reset modal selection when opening
  useEffect(() => {
    if (headerCatOpen) {
      setModalSelectedParent(null)
      setModalSelectedSub(null)
      // Try to find current category in hierarchy
      if (form.category && groups.length > 0) {
        let foundParent = groups.find(g => g.parent.name === form.category)
        if (foundParent) {
          setModalSelectedParent(foundParent.parent)
        } else {
          for (const group of groups) {
            const foundChild = group.children?.find(c => c.name === form.category)
            if (foundChild) {
              setModalSelectedParent(group.parent)
              setModalSelectedSub(foundChild)
              break
            }
            for (const child of group.children || []) {
              const foundSubChild = child.subchildren?.find(sc => sc.name === form.category)
              if (foundSubChild) {
                setModalSelectedParent(group.parent)
                setModalSelectedSub(child)
                break
              }
            }
          }
        }
      }
    }
  }, [headerCatOpen])
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
        const body = { title: obg.title, content: obg.description, category: obg.category, price: parseInt(String(obg.price||'0'),10)||null, location: obg.location||null, post_type: form.post_type || 'ad', images: imgs.map((m,i)=>({ url: m.url, mime: m.mime, size: m.size, order: i })) }
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
        post_type: form.post_type || 'ad',
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
    <div className="sell__main" style={step === 0 || step === 1 ? {maxWidth: '1200px', margin: '24px auto 40px', padding: '0 16px'} : {maxWidth: '1200px', margin: '24px auto 40px', padding: '0 16px'}}>
      <div style={{marginBottom: step === 0 || step === 1 ? '20px' : '16px'}}>
        <h1 style={{color: '#012f34', fontSize: '24px', fontWeight: 600, marginBottom: '0', marginTop: '0', fontFamily:'var(--font-roboto), Roboto, sans-serif'}}>Post Your Ad</h1>
      </div>
      <div className="sell__grid" style={step === 0 || step === 1 ? {gridTemplateColumns: '1fr'} : {}}>
        <div className="sell__card" style={step === 0 || step === 1 ? {border: 'none', boxShadow: 'none', padding: '0', background: 'transparent'} : {border: '1px solid rgba(1,47,52,.2)', borderRadius: '10px', padding: '20px', background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,.06)'}}>
          {step !== 0 && step !== 1 && (
          <div style={{marginBottom:16}}>
            <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:8}}>
              <span style={{fontSize:14, color:'rgba(0,47,52,.64)', fontFamily:'var(--font-roboto), Roboto, sans-serif'}}>Step {step} of 3</span>
            </div>
            <div style={{height:4, borderRadius:2, background:'rgba(1,47,52,.12)'}}>
              <div style={{height:4, borderRadius:2, background:'#012f34', width: (step===1?'33%':step===2?'66%':'100%'), transition:'width 0.3s ease'}}></div>
            </div>
          </div>
          )}
          {step === 0 ? (
            <div style={{marginTop:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 20px', minHeight:'400px'}}>
              <h2 style={{color: '#012f34', fontSize: '28px', fontWeight: 600, marginBottom: '12px', textAlign: 'center', fontFamily:'var(--font-roboto), Roboto, sans-serif'}}>
                What would you like to do?
              </h2>
              <p style={{color: 'rgba(0,47,52,.64)', fontSize: '16px', marginBottom: '40px', textAlign: 'center', fontFamily:'var(--font-roboto), Roboto, sans-serif'}}>
                Choose an option to get started
              </p>
              <div style={{display:'flex', flexDirection: isMobile ? 'column' : 'row', gap: '20px', width: '100%', maxWidth: '600px'}}>
                <button
                  onClick={() => {
                    setForm({...form, post_type: 'product'})
                    setStep(1)
                  }}
                  style={{
                    flex: 1,
                    padding: '32px 24px',
                    border: '2px solid rgba(1,47,52,.2)',
                    borderRadius: '16px',
                    background: '#fff',
                    color: '#012f34',
                    fontSize: '18px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily:'var(--font-roboto), Roboto, sans-serif',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,.08)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#012f34'
                    e.currentTarget.style.background = 'rgba(1,47,52,.02)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,.12)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(1,47,52,.2)'
                    e.currentTarget.style.background = '#fff'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.08)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    background: 'rgba(58,119,255,.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#3a77ff'
                  }}>
                    <FaTags style={{fontSize: '32px'}} />
                  </div>
                  <span>Sell a Product</span>
                  <span style={{fontSize: '14px', fontWeight: 400, color: 'rgba(0,47,52,.64)', textAlign: 'center'}}>
                    List items that can be added to cart and purchased
                  </span>
                </button>
                <button
                  onClick={() => {
                    setForm({...form, post_type: 'ad'})
                    setStep(1)
                  }}
                  style={{
                    flex: 1,
                    padding: '32px 24px',
                    border: '2px solid rgba(1,47,52,.2)',
                    borderRadius: '16px',
                    background: '#fff',
                    color: '#012f34',
                    fontSize: '18px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily:'var(--font-roboto), Roboto, sans-serif',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,.08)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#012f34'
                    e.currentTarget.style.background = 'rgba(1,47,52,.02)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,.12)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(1,47,52,.2)'
                    e.currentTarget.style.background = '#fff'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.08)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    background: 'rgba(245,81,0,.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#f55100'
                  }}>
                    <FaBriefcase style={{fontSize: '32px'}} />
                  </div>
                  <span>Post an Ad</span>
                  <span style={{fontSize: '14px', fontWeight: 400, color: 'rgba(0,47,52,.64)', textAlign: 'center'}}>
                    Create a classified advertisement listing
                  </span>
                </button>
              </div>
            </div>
          ) : step === 1 ? (
            <div style={{marginTop:0}}>
              {!showCategoryColumns ? (
                // Grid View - Initial main categories
                <div className="home__categories-grid" style={{transition:'opacity 200ms ease', opacity:1, marginBottom: 0}}>
                  {(() => {
                    const orderedCats = getOrderedCategories(tiles, groups)
                    return orderedCats.map((parent, idx) => {
                      const group = groups.find(g => (g.parent.category_id === parent.category_id || g.parent.name === parent.name || g.parent.name === parent.k))
                      const hasChildren = group && group.children && group.children.length > 0
                      const IconComponent = getCategoryIconComponent(parent) || FaTags
                      return (
                        <a 
                          key={parent.category_id || parent.k || parent.name || idx} 
                          className="cat__card" 
                          href="#" 
                          onClick={(e)=>{ 
                            e.preventDefault()
                            if (hasChildren) {
                              setSelectedParentCategory({...parent, name: parent.k || parent.name})
                              setSelectedSubCategory(null)
                              setShowCategoryColumns(true)
                            } else {
                              setForm({...form, category: parent.k || parent.name})
                              setStep(2)
                            }
                          }}
                          style={{
                            textDecoration: 'none',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '16px',
                            background: '#fff',
                            border: '1px solid rgba(1,47,52,.12)',
                            borderRadius: '12px',
                            transition: 'box-shadow .2s ease, transform .2s ease, border-color .2s ease',
                            cursor: 'pointer',
                            color: '#012f34',
                            gap: '10px'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(1,47,52,.3)'
                            e.currentTarget.style.background = 'rgba(1,47,52,.02)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(1,47,52,.12)'
                            e.currentTarget.style.background = '#fff'
                          }}
                        >
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '8px',
                            background: 'rgba(1,47,52,.03)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#012f34'
                          }}>
                            {IconComponent ? <IconComponent style={{fontSize: '20px', color: '#012f34'}} /> : <FaTags style={{fontSize: '20px', color: '#012f34'}} />}
                          </div>
                          <div style={{
                            color: '#012f34',
                            fontSize: '14px',
                            fontWeight: 500,
                            textAlign: 'center',
                            fontFamily:'var(--font-roboto), Roboto, sans-serif',
                            lineHeight: 1.3
                          }}>{parent.displayLabel || parent.k}</div>
                        </a>
                      )
                    })
                  })()}
                </div>
              ) : (
                // Column View - After selecting a main category
                <div>
                  <button
                    onClick={() => {
                      setShowCategoryColumns(false)
                      setSelectedParentCategory(null)
                      setSelectedSubCategory(null)
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      marginBottom: 12,
                      padding: '6px 12px',
                      border: '1px solid rgba(1,47,52,.2)',
                      background: '#fff',
                      color: '#012f34',
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-roboto), Roboto, sans-serif'
                    }}
                  >
                    <FaArrowLeft style={{fontSize: 12}} /> Back to Categories
                  </button>
                  <div style={{display: 'flex', gap: '0', border: '1px solid rgba(1,47,52,.2)', borderRadius: '10px', overflow: 'hidden', minHeight: '300px', background: '#fff'}}>
                {/* First Column - Main Categories */}
                <div style={{flex: '0 0 280px', borderRight: '1px solid rgba(1,47,52,.15)', background: '#fff', overflowY: 'auto', maxHeight: '500px'}}>
                  {(() => {
                    const orderedCats = getOrderedCategories(tiles, groups)
                    return orderedCats.map((parent, idx) => {
                      const group = groups.find(g => (g.parent.category_id === parent.category_id || g.parent.name === parent.name || g.parent.name === parent.k))
                      const isSelected = selectedParentCategory && (selectedParentCategory.category_id === parent.category_id || (selectedParentCategory.name === parent.name && !selectedParentCategory.category_id) || (selectedParentCategory.name === parent.k && !selectedParentCategory.category_id))
                      const hasChildren = group && group.children && group.children.length > 0
                      return (
                        <div
                          key={parent.category_id || parent.k || parent.name || idx}
                          onClick={() => {
                            const categoryName = parent.k || parent.name
                            setSelectedParentCategory({...parent, name: categoryName})
                            setSelectedSubCategory(null)
                            if (!hasChildren) {
                              setForm({...form, category: categoryName})
                              setStep(2)
                            }
                          }}
                          style={{
                            padding: '10px 0',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: isSelected ? 'rgba(230,239,246,0.7)' : 'transparent',
                            borderLeft: isSelected ? '3px solid #3a77ff' : '3px solid transparent',
                            borderBottom: '1px solid rgba(1,47,52,.1)',
                            transition: 'background 0.15s ease',
                            paddingLeft: isSelected ? '13px' : '16px',
                            paddingRight: '16px'
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.background = 'rgba(1,47,52,.03)'
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.background = 'transparent'
                          }}
                        >
                          <span style={{
                            fontSize: '14px',
                            fontWeight: isSelected ? 500 : 400,
                            color: '#012f34',
                            fontFamily:'var(--font-roboto), Roboto, sans-serif'
                          }}>{parent.displayLabel || parent.k}</span>
                          {hasChildren && <FaChevronRight style={{fontSize: '12px', color: '#012f34'}} />}
                        </div>
                      )
                    })
                  })()}
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
                              padding: '10px 0',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: isSelected ? 'rgba(230,239,246,0.7)' : 'transparent',
                              borderLeft: isSelected ? '3px solid #3a77ff' : '3px solid transparent',
                              borderBottom: '1px solid rgba(1,47,52,.1)',
                              transition: 'background 0.15s ease',
                              paddingLeft: isSelected ? '13px' : '16px',
                              paddingRight: '16px'
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) e.currentTarget.style.background = 'rgba(1,47,52,.03)'
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) e.currentTarget.style.background = 'transparent'
                            }}
                          >
                            <span style={{
                              fontSize: '14px',
                              fontWeight: isSelected ? 500 : 400,
                              color: '#012f34',
                              fontFamily:'var(--font-roboto), Roboto, sans-serif'
                            }}>{subcat.name}</span>
                            {hasSubChildren && <FaChevronRight style={{fontSize: '12px', color: '#012f34'}} />}
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
                            padding: '10px 16px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            background: '#fff',
                            borderBottom: '1px solid rgba(1,47,52,.1)',
                            transition: 'background 0.15s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(1,47,52,.03)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                        >
                          <span style={{
                            fontSize: '14px',
                            fontWeight: 400,
                            color: '#012f34',
                            fontFamily:'var(--font-roboto), Roboto, sans-serif'
                          }}>{subsubcat.name}</span>
                        </div>
                      ))}
                      </div>
                    )
                  })()}
                  </div>
                </div>
              )}
            </div>
          ) : (
          <div className="sell__section" style={{border:'1px solid rgba(1,47,52,.2)', borderRadius:10, padding:20, background:'#fff', marginBottom:16}}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap'}}>
              <div style={{flex:1, minWidth:200}}>
                <div className="form__label" style={{marginBottom:6, fontSize:14, color:'rgba(0,47,52,.64)', fontFamily:'var(--font-roboto), Roboto, sans-serif'}}>Category</div>
                <div style={{fontSize:16, fontWeight:500, color:'#012f34', fontFamily:'var(--font-roboto), Roboto, sans-serif'}}>
                  {form.category || 'No category selected'}
                </div>
              </div>
              {step>=2 ? (
                <button
                  onClick={()=>{ setHeaderCatOpen(true) }}
                  style={{
                    border:'1px solid rgba(1,47,52,.2)', 
                    background:'#fff', 
                    color:'#012f34', 
                    borderRadius:8, 
                    padding:'8px 16px',
                    fontSize:14,
                    fontWeight:500,
                    cursor:'pointer',
                    fontFamily:'var(--font-roboto), Roboto, sans-serif',
                    display:'inline-flex',
                    alignItems:'center',
                    gap:6
                  }}
                >
                  Change Category
                </button>
              ) : null}
            </div>
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
          <div className="sell__section" style={{border:'1px solid rgba(1,47,52,.2)', borderRadius:12, padding:16, background:'#fff', boxShadow:'0 6px 18px rgba(1,47,52,.08)', marginBottom:12}}>
            <label className="form__label">Post Type*</label>
            <select className="form__input" value={form.post_type} onChange={e=>setForm({...form, post_type:e.target.value})} style={{height:42}}>
              <option value="ad">Ad</option>
              <option value="product">Product</option>
            </select>
            <div style={{color:'rgba(0,47,52,.64)', marginTop:6}}>Select "Product" if this item can be added to cart and purchased</div>
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
        {(step !== 0 && step !== 1) && (
        <div className="sell__card sell__aside" style={{border: '1px solid rgba(1,47,52,.2)', borderRadius: '10px', padding: '20px', background: '#fff'}}>
          <div style={{marginBottom: 20}}>
            <h4 style={{margin: '0 0 12px 0', fontSize: '18px', fontWeight: 600, color: '#012f34', fontFamily: 'var(--font-roboto), Roboto, sans-serif'}}>Tips for Better Ads</h4>
            <p style={{margin: '0 0 16px 0', fontSize: '14px', color: 'rgba(0,47,52,.64)', lineHeight: 1.5, fontFamily: 'var(--font-roboto), Roboto, sans-serif'}}>Create a great ad to increase your chances of selling</p>
          </div>
          
          <div style={{marginBottom: 20}}>
            <div style={{display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12, padding: '12px', background: 'rgba(1,47,52,.02)', borderRadius: '8px', border: '1px solid rgba(1,47,52,.1)'}}>
              <div style={{width: 24, height: 24, borderRadius: '50%', background: 'rgba(58,119,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2}}>
                <span style={{fontSize: 12, fontWeight: 600, color: '#3a77ff'}}>1</span>
              </div>
              <div style={{flex: 1}}>
                <div style={{fontSize: '14px', fontWeight: 500, color: '#012f34', marginBottom: 4, fontFamily: 'var(--font-roboto), Roboto, sans-serif'}}>Clear Title</div>
                <div style={{fontSize: '13px', color: 'rgba(0,47,52,.64)', lineHeight: 1.4, fontFamily: 'var(--font-roboto), Roboto, sans-serif'}}>Use a descriptive title with key features</div>
              </div>
            </div>
            
            <div style={{display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12, padding: '12px', background: 'rgba(1,47,52,.02)', borderRadius: '8px', border: '1px solid rgba(1,47,52,.1)'}}>
              <div style={{width: 24, height: 24, borderRadius: '50%', background: 'rgba(58,119,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2}}>
                <span style={{fontSize: 12, fontWeight: 600, color: '#3a77ff'}}>2</span>
              </div>
              <div style={{flex: 1}}>
                <div style={{fontSize: '14px', fontWeight: 500, color: '#012f34', marginBottom: 4, fontFamily: 'var(--font-roboto), Roboto, sans-serif'}}>Good Photos</div>
                <div style={{fontSize: '13px', color: 'rgba(0,47,52,.64)', lineHeight: 1.4, fontFamily: 'var(--font-roboto), Roboto, sans-serif'}}>Add clear, well-lit photos from different angles</div>
              </div>
            </div>
            
            <div style={{display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px', background: 'rgba(1,47,52,.02)', borderRadius: '8px', border: '1px solid rgba(1,47,52,.1)'}}>
              <div style={{width: 24, height: 24, borderRadius: '50%', background: 'rgba(58,119,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2}}>
                <span style={{fontSize: 12, fontWeight: 600, color: '#3a77ff'}}>3</span>
              </div>
              <div style={{flex: 1}}>
                <div style={{fontSize: '14px', fontWeight: 500, color: '#012f34', marginBottom: 4, fontFamily: 'var(--font-roboto), Roboto, sans-serif'}}>Honest Description</div>
                <div style={{fontSize: '13px', color: 'rgba(0,47,52,.64)', lineHeight: 1.4, fontFamily: 'var(--font-roboto), Roboto, sans-serif'}}>Include condition, features, and reason for selling</div>
              </div>
            </div>
          </div>
          
          <div style={{padding: '12px', background: 'rgba(1,47,52,.03)', borderRadius: '8px', border: '1px solid rgba(1,47,52,.1)'}}>
            <div style={{fontSize: '13px', color: 'rgba(0,47,52,.64)', lineHeight: 1.5, fontFamily: 'var(--font-roboto), Roboto, sans-serif'}}>
              <strong style={{color: '#012f34'}}>Note:</strong> You can always edit or delete your ad later from the Manage page.
            </div>
          </div>
        </div>
        )}
      </div>
      
      {/* Category Selection Modal */}
      {headerCatOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 5000,
            padding: '16px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setHeaderCatOpen(false)
              setModalSelectedParent(null)
              setModalSelectedSub(null)
            }
          }}
        >
          <div 
            style={{
              background: '#fff',
              width: '100%',
              maxWidth: '600px',
              borderRadius: '12px',
              boxShadow: '0 10px 24px rgba(0,0,0,.18)',
              padding: '24px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px'}}>
              <div>
                <h3 style={{margin: 0, fontSize: '20px', fontWeight: 600, color: '#012f34', fontFamily: 'var(--font-roboto), Roboto, sans-serif'}}>
                  Select Category
                </h3>
                {modalSelectedParent && (
                  <button
                    onClick={() => {
                      setModalSelectedParent(null)
                      setModalSelectedSub(null)
                    }}
                    style={{
                      marginTop: '8px',
                      border: 'none',
                      background: 'transparent',
                      color: '#3a77ff',
                      cursor: 'pointer',
                      padding: '4px 0',
                      fontSize: '14px',
                      fontFamily: 'var(--font-roboto), Roboto, sans-serif',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <FaArrowLeft style={{fontSize: '12px'}} /> Back to Main Categories
                  </button>
                )}
              </div>
              <button
                onClick={() => {
                  setHeaderCatOpen(false)
                  setModalSelectedParent(null)
                  setModalSelectedSub(null)
                }}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#012f34',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(1,47,52,.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <FaTimes style={{fontSize: '20px'}} />
              </button>
            </div>
            
            <div style={{flex: 1, overflow: 'auto', minHeight: '300px'}}>
              {!modalSelectedParent ? (
                // Main Categories
                <div>
                  <label className="form__label" style={{display: 'block', marginBottom: '12px', fontSize: '14px', color: 'rgba(0,47,52,.64)', fontFamily: 'var(--font-roboto), Roboto, sans-serif'}}>
                    Select Main Category
                  </label>
                  <div style={{display: 'grid', gap: '8px'}}>
                    {(() => {
                      const orderedCats = getOrderedCategories(tiles, groups)
                      return orderedCats.map((parent, idx) => {
                        const group = groups.find(g => (g.parent.category_id === parent.category_id || g.parent.name === parent.name || g.parent.name === parent.k))
                        const hasChildren = group && group.children && group.children.length > 0
                      return (
                        <button
                          key={parent.category_id || parent.name || idx}
                          onClick={() => {
                            if (!hasChildren) {
                              setForm({...form, category: parent.name})
                              setErrors(err => ({ ...err, category: '' }))
                              setHeaderCatOpen(false)
                              setModalSelectedParent(null)
                            } else {
                              setModalSelectedParent(parent)
                            }
                          }}
                          style={{
                            padding: '12px 16px',
                            border: '1px solid rgba(1,47,52,.2)',
                            borderRadius: '8px',
                            background: '#fff',
                            color: '#012f34',
                            fontSize: '15px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            fontFamily: 'var(--font-roboto), Roboto, sans-serif',
                            textAlign: 'left',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#3a77ff'
                            e.currentTarget.style.background = 'rgba(58,119,255,.05)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(1,47,52,.2)'
                            e.currentTarget.style.background = '#fff'
                          }}
                        >
                          <span>{parent.displayLabel || parent.k}</span>
                          {hasChildren && <FaChevronRight style={{fontSize: '12px', color: 'rgba(0,47,52,.64)'}} />}
                        </button>
                      )
                    })})()}
                  </div>
                </div>
              ) : (
                // Subcategories
                <div>
                  <label className="form__label" style={{display: 'block', marginBottom: '12px', fontSize: '14px', color: 'rgba(0,47,52,.64)', fontFamily: 'var(--font-roboto), Roboto, sans-serif'}}>
                    Select Subcategory
                  </label>
                  {(() => {
                    const group = groups.find(g => (g.parent.category_id === modalSelectedParent.category_id || g.parent.name === modalSelectedParent.name))
                    const subcategories = group ? group.children : []
                    if (subcategories.length === 0) {
                      return (
                        <div style={{padding: '20px', textAlign: 'center', color: 'rgba(0,47,52,.64)'}}>
                          No subcategories available
                        </div>
                      )
                    }
                    return (
                      <div style={{display: 'grid', gap: '8px'}}>
                        {subcategories.map((subcat, idx) => {
                          const hasSubChildren = subcat.subchildren && subcat.subchildren.length > 0
                          return (
                            <div key={subcat.category_id || subcat.name || idx}>
                              <button
                                onClick={() => {
                                  if (!hasSubChildren) {
                                    setForm({...form, category: subcat.name})
                                    setErrors(err => ({ ...err, category: '' }))
                                    setHeaderCatOpen(false)
                                    setModalSelectedParent(null)
                                    setModalSelectedSub(null)
                                  } else {
                                    setModalSelectedSub(subcat)
                                  }
                                }}
                                style={{
                                  width: '100%',
                                  padding: '12px 16px',
                                  border: '1px solid rgba(1,47,52,.2)',
                                  borderRadius: '8px',
                                  background: '#fff',
                                  color: '#012f34',
                                  fontSize: '15px',
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                  fontFamily: 'var(--font-roboto), Roboto, sans-serif',
                                  textAlign: 'left',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.borderColor = '#3a77ff'
                                  e.currentTarget.style.background = 'rgba(58,119,255,.05)'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.borderColor = 'rgba(1,47,52,.2)'
                                  e.currentTarget.style.background = '#fff'
                                }}
                              >
                                <span>{subcat.name}</span>
                                {hasSubChildren && <FaChevronRight style={{fontSize: '12px', color: 'rgba(0,47,52,.64)'}} />}
                              </button>
                              
                              {/* Sub-subcategories */}
                              {hasSubChildren && modalSelectedSub && modalSelectedSub.category_id === subcat.category_id && (
                                <div style={{marginTop: '8px', marginLeft: '16px', display: 'grid', gap: '6px'}}>
                                  {subcat.subchildren.map((subsubcat, subIdx) => (
                                    <button
                                      key={subsubcat.category_id || subsubcat.name || subIdx}
                                      onClick={() => {
                                        setForm({...form, category: subsubcat.name})
                                        setErrors(err => ({ ...err, category: '' }))
                                        setHeaderCatOpen(false)
                                        setModalSelectedParent(null)
                                        setModalSelectedSub(null)
                                      }}
                                      style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        border: '1px solid rgba(1,47,52,.15)',
                                        borderRadius: '6px',
                                        background: '#fff',
                                        color: '#012f34',
                                        fontSize: '14px',
                                        fontWeight: 400,
                                        cursor: 'pointer',
                                        fontFamily: 'var(--font-roboto), Roboto, sans-serif',
                                        textAlign: 'left',
                                        transition: 'all 0.2s ease'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = '#3a77ff'
                                        e.currentTarget.style.background = 'rgba(58,119,255,.05)'
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = 'rgba(1,47,52,.15)'
                                        e.currentTarget.style.background = '#fff'
                                      }}
                                    >
                                      {subsubcat.name}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
            
            <div style={{display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(1,47,52,.1)'}}>
              <button
                onClick={() => {
                  setHeaderCatOpen(false)
                  setModalSelectedParent(null)
                  setModalSelectedSub(null)
                }}
                style={{
                  border: '1px solid rgba(1,47,52,.2)',
                  background: '#fff',
                  color: '#012f34',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-roboto), Roboto, sans-serif'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(1,47,52,.05)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#fff'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}