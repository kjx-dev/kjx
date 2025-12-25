import { useEffect, useMemo, useRef, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Image from 'next/image'
import Footer from '../components/Footer'
import Header from '../components/Header'
import { FaWhatsapp, FaUser, FaIdCard, FaList, FaHeart, FaShare, FaChevronLeft, FaChevronRight, FaChevronDown } from 'react-icons/fa'

export default function ProductDetails(){
  const router = useRouter()
  const [data, setData] = useState({
    phoneShow:'', phone:'', name:'', description:'', image:'', price:'', location:'', productName:'', category:'', post_type:'ad'
  })
  const [postType, setPostType] = useState('ad') // Separate state for post_type to ensure it's always tracked
  const [error, setError] = useState('')
  
  const [activeImg, setActiveImg] = useState('')
  const [actionStatus, setActionStatus] = useState('')
  const [related, setRelated] = useState([])
  const [gallery, setGallery] = useState([])
  
  const [auth, setAuth] = useState({ email:'', isAuthenticated:false, name:'' })
  
  
  const [reviews, setReviews] = useState([])
  const [reviewText, setReviewText] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [isFav, setIsFav] = useState(false)
  const [reviewRating, setReviewRating] = useState(2)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [views, setViews] = useState(0)
  const [likes, setLikes] = useState(0)
  const [deadline, setDeadline] = useState(0)
  const [reported, setReported] = useState(false)
  const [showPhone, setShowPhone] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [activeAdsCount, setActiveAdsCount] = useState(7)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState('Spam or misleading')
  const [reportDetails, setReportDetails] = useState('')
  const [reporting, setReporting] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatText, setChatText] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatItems, setChatItems] = useState([])
  const [menuOpen, setMenuOpen] = useState(false)
  const profileWrapRef = useRef(null)
  const profileBtnRef = useRef(null)
  const profileMenuRef = useRef(null)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [profileMenuPos, setProfileMenuPos] = useState({ top: 100, left: 16 })
  const hdrWrapRef = useRef(null)
  const hdrBtnRef = useRef(null)
  const hdrMenuRef = useRef(null)
  const [hdrOpen, setHdrOpen] = useState(false)
  const [catTiles, setCatTiles] = useState([])
  const [catGroups, setCatGroups] = useState([])
  const [allCatOpen, setAllCatOpen] = useState(false)
  const allCatWrapRef = useRef(null)
  const allCatBtnRef = useRef(null)
  const allCatMenuRef = useRef(null)
  const ratingStats = useMemo(() => {
    const reviewRatings = reviews.filter(r => typeof r.rating === 'number')
    const list = [...reviewRatings]
    const total = list.length || 1
    const avg = list.reduce((a,b)=>a+((b.rating)||0),0)/total
    const dist = [0,0,0,0,0]
    list.forEach(b=>{ const r = Math.round(b.rating||0); const idx = Math.max(1, Math.min(5, r)); dist[5-idx]++ })
    return { avg: Number(avg.toFixed(1)), dist, total }
  }, [reviews])
  const [activeTab, setActiveTab] = useState('details')
  function getPostId(){
    try{
      const qid = router.query.id
      const sid = router.query.slug
      if (qid!=null){ const n = parseInt(String(qid),10); if (!Number.isNaN(n)) return n }
      if (sid){ const n = parseInt(String(String(sid).split('-').pop()||sid),10); if (!Number.isNaN(n)) return n }
      const path = typeof window!=='undefined' ? (window.location.pathname||'') : ''
      const seg = String(path.split('/').filter(Boolean).pop()||'')
      if (seg){ const n = parseInt(String(seg.split('-').pop()||seg),10); if (!Number.isNaN(n)) return n }
      return NaN
    }catch(_){ return NaN }
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
  function extractBullets(text){
    const s = String(text||'').replace(/\s+/g,' ').trim()
    if (!s) return []
    const parts = s.split(/[.!•\n]+\s*/).map(t=>t.trim()).filter(Boolean)
    return parts.slice(0,6)
  }
  useEffect(() => {
    async function init(){
      const email = localStorage.getItem('email') || ''
      const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
      const userName = localStorage.getItem('name') || ''
      setAuth({ email, isAuthenticated, name: userName })
      try{
        const rid = (router.query.slug||router.query.id||'').toString()
        const rk = 'reported:'+rid
        const rv = localStorage.getItem(rk)
        setReported(rv==='true')
      }catch(_){ }
      const slug = (router.query.slug||'').toString()
      const id = parseInt((router.query.id||'').toString(),10)
      if (slug) {
        try {
          const idFromSlug = parseInt((slug.split('-').pop()||''),10)
          if (!isNaN(idFromSlug)){
            try{
              const rdb = await fetch('/api/v1/posts/'+idFromSlug)
              const jdb = await rdb.json()
              const d = jdb.data
              if (d && d.title){
                let phoneShow = ''
                let phone = ''
                let profileName = ''
                const description = d.content || ''
                const image = (Array.isArray(d.images) && d.images.length) ? d.images[0].url : ''
                const price = d.price || ''
                const location = d.location || ''
                const productName = d.title || ''
                const category = (d.category && d.category.name) || ''
                const created_at = d.created_at || Date.now()
                try{
                  if (d.user_id){
                    const ru = await fetch('/api/v1/users/'+encodeURIComponent(String(d.user_id)))
                    const ju = await ru.json()
                    const u = ju.data || {}
                    profileName = u.name || profileName
                    phone = u.phone || phone
                    phoneShow = phone ? 'yes' : ''
                  }
                }catch(_){ }
                const postTypeFromDb = String(d.post_type || 'ad').toLowerCase().trim()
                setPostType(postTypeFromDb)
                setData({ phoneShow, phone, name: profileName, description, image, price, location, productName, category, post_type: postTypeFromDb, created_at })
                setActiveImg(image || '/images/products/img1.jpg')
                const g = Array.isArray(d.images) ? d.images.map(im=>im.url).filter(Boolean) : []
                setGallery(g.length ? g : (image ? [image] : []))
                try {
                  const products = JSON.parse(localStorage.getItem('products')||'[]') || []
                  const rel = products.filter(pp => pp.category === category).slice(0,4)
                  setRelated(rel)
                } catch(e) {}
                try {
                  const vk = 'views:'+productName
                  const lk = 'likes:'+productName
                  const dk = 'bidsDeadline:'+productName
                  const v = parseInt(localStorage.getItem(vk)||'0',10) + 1
                  localStorage.setItem(vk, String(v))
                  setViews(v)
                  const l = parseInt(localStorage.getItem(lk)||'0',10)
                  setLikes(l)
                  let d2 = parseInt(localStorage.getItem(dk)||'0',10)
                  if (!d2 || d2<Date.now()) { d2 = Date.now() + 48*60*60*1000; localStorage.setItem(dk, String(d2)) }
                  setDeadline(d2)
                } catch(e) {}
                try{
                  const rr = await fetch('/api/v1/posts/'+idFromSlug+'/reviews')
                  const rj = await rr.json()
                  const listR = Array.isArray(rj.data) ? rj.data : []
                  setReviews(listR.map(r=>({ name:r.author, text:r.comment, rating:r.rating, time:r.created_at })))
                }catch(_){ setReviews([]) }
                return
              }
            }catch(_){ }
          }
        } catch(e) {}
      }
      if (id && !isNaN(id)) {
        try {
          const rdb = await fetch('/api/v1/posts/'+id)
          const jdb = await rdb.json()
          const d = jdb.data
          if (d && d.title){
            let phoneShow = ''
            let phone = ''
            let name = ''
            let description = d.content || ''
            let image = (Array.isArray(d.images) && d.images.length) ? d.images[0].url : ''
            const price = d.price || ''
            const location = d.location || ''
            const productName = d.title || ''
            const category = (d.category && d.category.name) || ''
            const post_type = String(d.post_type || 'ad').toLowerCase().trim()
            const created_at = d.created_at || Date.now()
            console.log('API Response - post_type:', d.post_type, 'normalized:', post_type, 'full d object keys:', Object.keys(d))
            // Set post_type in separate state
            setPostType(post_type)
            try{
              if (d.user_id){
                const ru = await fetch('/api/v1/users/'+encodeURIComponent(String(d.user_id)))
                const ju = await ru.json()
                const u = ju.data || {}
                name = u.name || name
                phone = u.phone || phone
                phoneShow = phone ? 'yes' : ''
              }
            }catch(_){ }
            setData({ phoneShow, phone, name, description, image, price, location, productName, category, post_type, created_at })
            console.log('State updated with post_type:', post_type, 'data.post_type will be:', post_type, 'postType state:', post_type)
            setActiveImg(image || '/images/products/img1.jpg')
            const g = Array.isArray(d.images) ? d.images.map(im=>im.url).filter(Boolean) : []
            setGallery(g.length ? g : (image ? [image] : []))
            try {
              const products = JSON.parse(localStorage.getItem('products')||'[]') || []
              const rel = products.filter(pp => pp.category === category).slice(0,4)
              setRelated(rel)
            } catch(e) {}
            try {
              const vk = 'views:'+productName
              const lk = 'likes:'+productName
              const dk = 'bidsDeadline:'+productName
              const v = parseInt(localStorage.getItem(vk)||'0',10) + 1
              localStorage.setItem(vk, String(v))
              setViews(v)
              const l = parseInt(localStorage.getItem(lk)||'0',10)
              setLikes(l)
              let d2 = parseInt(localStorage.getItem(dk)||'0',10)
              if (!d2 || d2<Date.now()) { d2 = Date.now() + 48*60*60*1000; localStorage.setItem(dk, String(d2)) }
              setDeadline(d2)
            } catch(e) {}
                try{
                  const rr = await fetch('/api/v1/posts/'+id+'/reviews')
                  const rj = await rr.json()
                  const listR = Array.isArray(rj.data) ? rj.data : []
                  setReviews(listR.map(r=>({ name:r.author, text:r.comment, rating:r.rating, time:r.created_at })))
                }catch(_){ setReviews([]) }
                return
              }
        } catch(e) {}
      }
      const phoneShow = localStorage.getItem('phoneShow') || ''
      const phone = localStorage.getItem('phone') || ''
      const profileNameLocal = localStorage.getItem('name') || ''
      let description = localStorage.getItem('description') || ''
      let image = localStorage.getItem('image') || ''
      if (image === './images/img1.jpg') image = '/images/products/img1.jpg'
      let price = localStorage.getItem('price') || ''
      let location = localStorage.getItem('location') || ''
      let productName = localStorage.getItem('productName') || ''
      let category = localStorage.getItem('category') || ''
      const created_at = Date.now()
      try{
        const idStr = String(router.query.slug||router.query.id||'')
        const idNum = parseInt(idStr,10)
        if ((!productName || !image) && !isNaN(idNum) && idNum>0){
          const list = JSON.parse(localStorage.getItem('products')||'[]') || []
          const found = list.find(p => Number(p.id||0)===idNum)
          if (found){
            productName = found.name||productName
            description = found.description||description
            image = found.image||image
            price = String(found.price||price||'')
            location = found.location||location
            category = found.category||category
          }
        }
      }catch(_){ }
      if (!productName) productName = 'Item'
      if (!image) image = '/images/products/img1.jpg'
      if (!category) category = 'General'
      const carDesc = 'Meticulously maintained sedan with comprehensive service history and single-owner care. Fuel-efficient engine with smooth automatic transmission, responsive steering, and recently serviced suspension. Original paint with no accidental repairs; clean interior, non-smoker vehicle. Mileage around 45,000 km with brand-new tires and a fresh battery. Equipped with ABS, dual airbags, cruise control, infotainment with Bluetooth/CarPlay, reverse camera, and parking sensors. All documents are up to date including token tax, computerized transfer, and original book. Test drive available on request; serious buyers only.'
      if (!description && String(category).toLowerCase() === 'cars') description = carDesc
      setData({ phoneShow, phone, name: profileNameLocal, description, image, price, location, productName, category, post_type: 'ad', created_at })
      setActiveImg(image || '/images/products/img1.jpg')
      const g = [image || '/images/products/img1.jpg', 'https://picsum.photos/seed/phone/800/600', 'https://picsum.photos/seed/car/800/600', 'https://picsum.photos/seed/property/800/600']
      const uniq = []
      for (let i=0; i<g.length; i++) { const s = g[i]; if (s && !uniq.includes(s)) uniq.push(s) }
      setGallery(uniq)
      try {
        const pid = (router.query.slug||router.query.id||'').toString()
        const idPart = parseInt((pid.split('-').pop()||pid),10)
      } catch (e) {
        setError('Failed to load product details')
      }
      try {
        const products = JSON.parse(localStorage.getItem('products')||'[]') || []
        const rel = products.filter(p => p.category === category).slice(0,4)
        setRelated(rel)
      } catch(e) {}
      try {
        const key = 'reviews:'+(router.query.slug||router.query.id||'').toString()
        const cached = JSON.parse(localStorage.getItem(key)||'[]')
        setReviews(Array.isArray(cached) ? cached : [])
      } catch(e) { setReviews([]) }
      try {
        const vk = 'views:'+productName
        const lk = 'likes:'+productName
        const dk = 'bidsDeadline:'+productName
        const v = parseInt(localStorage.getItem(vk)||'0',10) + 1
        localStorage.setItem(vk, String(v))
        setViews(v)
        const l = parseInt(localStorage.getItem(lk)||'0',10)
        setLikes(l)
        let d = parseInt(localStorage.getItem(dk)||'0',10)
        if (!d || d<Date.now()) { d = Date.now() + 48*60*60*1000; localStorage.setItem(dk, String(d)) }
        setDeadline(d)
      } catch(e) {}
    }
    init()
  }, [router.query.id, router.query.slug])
  useEffect(() => {
    async function loadFav(){
      try{
        const uid = getUserId()
        const pid = getPostId()
        if (!uid || Number.isNaN(pid)) return
        const res = await fetch('/api/v1/favorites?user_id='+encodeURIComponent(String(uid)))
        const js = await res.json().catch(()=>({}))
        const list = Array.isArray(js.data) ? js.data : []
        setIsFav(list.some(x => Number(x.post_id)===Number(pid)))
      }catch(_){ setIsFav(false) }
    }
    loadFav()
  }, [router.query.id, router.query.slug])
  useEffect(() => {
    async function loadCategories(){
      try{
        const r = await fetch('/api/v1/category')
        const j = await r.json()
        const tiles = (j && j.data && j.data.tiles) ? j.data.tiles : []
        setCatTiles(Array.isArray(tiles) ? tiles : [])
        try{
          const rg = await fetch('/api/v1/categories')
          const dg = await rg.json()
          const groups = (dg && dg.data && dg.data.groups) || []
          setCatGroups(groups)
        }catch(_){ setCatGroups([]) }
      }catch(_){
        setCatTiles([])
        setCatGroups([])
      }
    }
    loadCategories()
  }, [])
  useEffect(() => {
    function onKey(e){ if (e.key === 'Escape') setAllCatOpen(false) }
    function onOutside(e){ const el = allCatWrapRef.current; if (!el) return; if (!el.contains(e.target)) setAllCatOpen(false) }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onOutside)
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onOutside) }
  }, [])
  function search(){ router.push('/') }
  function sell(){ if (auth.email && auth.isAuthenticated) router.push('/sell'); else router.push('/login') }
  function manage(){ router.push('/manage') }
  function buyNow(){
    const idPart = getPostId()
    if (Number.isNaN(idPart)) return
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
    if (!isAuthenticated){
      try{ if (typeof window !== 'undefined' && window.swal){ window.swal('Login required', 'Please login to add items to cart', 'warning') } }catch(_){ }
      router.push('/login')
      return
    }
    try{
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      const existingIndex = cart.findIndex(item => item.post_id === idPart)
      if (existingIndex >= 0){
        router.push('/cart')
        return
      }
      const cartItem = {
        post_id: idPart,
        title: data.productName,
        price: data.price,
        image: data.image,
        location: data.location
      }
      cart.push(cartItem)
      localStorage.setItem('cart', JSON.stringify(cart))
      router.push('/cart')
    }catch(_){
      try{ if (typeof window !== 'undefined' && window.swal){ window.swal('Error', 'Failed to add to cart', 'error') } }catch(_){ }
    }
  }
  function triggerWhatsApp(number, product){
    const n = (number||'').replace(/[^0-9]/g,'')
    const msg = 'Hello! I am interested in ' + (product||'this product')
    try{ window.dispatchEvent(new CustomEvent('whatsapp:open', { detail: { number: n, message: msg } })) }catch(e){}
  }
  function callSeller(){
    const phone = (data.profilePhone||data.phone||'').replace(/\s+/g,'')
    const can = (data.phoneShow||'').toLowerCase() !== 'no' && phone.length>0
    if (!can){ setActionStatus('Phone is hidden'); return }
    if (!showPhone){ setShowPhone(true); setActionStatus(''); return }
    try{ window.location.href = 'tel:' + phone }catch(_){ }
  }
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
  function logout(){ try{ localStorage.removeItem('auth_token'); localStorage.removeItem('email'); localStorage.removeItem('username'); localStorage.removeItem('name'); localStorage.removeItem('phone'); localStorage.removeItem('gender'); localStorage.removeItem('isAuthenticated'); }catch(_){} router.replace('/') }
  function openReport(){ setReportOpen(true); setReportReason('Spam or misleading'); setReportDetails('') }
  function openChat(){
    const idPart = getPostId()
    if (Number.isNaN(idPart)) return
    router.push('/chat?post_id='+encodeURIComponent(String(idPart)))
  }
  async function addToCart(){
    const idPart = getPostId()
    if (Number.isNaN(idPart)) return
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
    if (!isAuthenticated){
      try{ if (typeof window !== 'undefined' && window.swal){ window.swal('Login required', 'Please login to add items to cart', 'warning') } }catch(_){ }
      router.push('/login')
      return
    }
    try{
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      const existingIndex = cart.findIndex(item => item.post_id === idPart)
      if (existingIndex >= 0){
        try{ if (typeof window !== 'undefined' && window.swal){ window.swal('Already in cart', 'This item is already in your cart', 'info') } }catch(_){ }
        return
      }
      
      // Get seller info from post data
      let sellerId = null
      try{
        const res = await fetch('/api/v1/posts/'+idPart)
        const js = await res.json()
        if (js && js.data && js.data.user_id) {
          sellerId = js.data.user_id
        }
      }catch(_){}
      
      const cartItem = {
        post_id: idPart,
        title: data.productName,
        price: data.price,
        image: data.image,
        location: data.location,
        seller_id: sellerId
      }
      cart.push(cartItem)
      localStorage.setItem('cart', JSON.stringify(cart))
      // Dispatch event to update cart count in header
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cartUpdated'))
      }
      try{ if (typeof window !== 'undefined' && window.swal){ window.swal('Added to cart', 'Item added to cart successfully', 'success') } }catch(_){ }
    }catch(_){
      try{ if (typeof window !== 'undefined' && window.swal){ window.swal('Error', 'Failed to add to cart', 'error') } }catch(_){ }
    }
  }
  async function submitChat(){
    if (chatLoading) return
    const idPart = getPostId()
    if (Number.isNaN(idPart)) return
    const text = String(chatText||'').trim()
    if (!text) return
    const author = localStorage.getItem('email') || localStorage.getItem('name') || ''
    try{
      setChatLoading(true)
      const res = await fetch('/api/v1/posts/'+encodeURIComponent(String(idPart))+'/chat', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ author, text }) })
      const js = await res.json().catch(()=>null)
      if (!res.ok){ setChatLoading(false); return }
      const row = js && js.data ? js.data : null
      setChatItems(prev => (row ? [...prev, row] : prev))
      setChatText('')
      setChatLoading(false)
    }catch(_){ setChatLoading(false) }
  }
  async function submitReport(){
    if (reporting) return
    const idPart = getPostId()
    if (Number.isNaN(idPart)) { setReportOpen(false); return }
    const reason = String(reportReason||'').trim()
    const details = String(reportDetails||'').trim()
    if (!reason) return
    const author = localStorage.getItem('email') || localStorage.getItem('name') || ''
    try{
      setReporting(true)
      const res = await fetch('/api/v1/posts/'+encodeURIComponent(String(idPart))+'/report', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ author, reason, details }) })
      const js = await res.json().catch(()=>null)
      if (!res.ok){ setReporting(false); setActionStatus('Failed to report'); return }
      try{
        const rid = (router.query.slug||router.query.id||data.productName||'').toString()
        const rk = 'reported:'+rid
        localStorage.setItem(rk,'true')
      }catch(_){ }
      setReported(true)
      setReporting(false)
      setReportOpen(false)
      setActionStatus('Reported')
      try{ if (typeof window !== 'undefined' && window.swal){ window.swal('Thank you', 'Your report has been submitted', 'success') } }catch(_){ }
    }catch(_){ setReporting(false); setActionStatus('Failed to report') }
  }
  function formatPrice(val){
    try{
      if (val == null) return ''
      const num = Number(String(val).replace(/[^0-9.-]/g,''))
      if (isNaN(num)) return String(val)
      return 'Rs ' + num.toLocaleString('en-PK')
    }catch(e){ return String(val||'') }
  }
  async function addReview(){
    const text = (reviewText||'').trim()
    const rating = parseInt(reviewRating,10)
    if (!text || isNaN(rating) || rating<1 || rating>5) return
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
    if (!isAuthenticated){ try{ if (typeof window !== 'undefined' && window.swal){ await window.swal('Login required', 'Please login to add a review', 'warning') } }catch(_){ } router.push('/login'); return }
    const author = localStorage.getItem('email') || localStorage.getItem('name') || 'A user'
    try{
      setReviewLoading(true)
      const idPart = getPostId()
      if (Number.isNaN(idPart)) { setReviewLoading(false); return }
      const res = await fetch('/api/v1/posts/'+encodeURIComponent(String(idPart))+'/reviews', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ rating, author, comment: text }) })
      const js = await res.json().catch(()=>null)
      if (!res.ok){
        try{ if (res.status===409 && typeof window !== 'undefined' && window.swal){ await window.swal('Already reviewed', 'You have already reviewed this post', 'info') } }catch(_){ }
        setReviewLoading(false)
        return
      }
      const r = js?.data || { author, comment: text, rating, created_at: Date.now() }
      const entry = { name: r.author, text: r.comment, rating: r.rating, time: r.created_at }
      const next = [entry, ...reviews]
      setReviews(next)
      setReviewText('')
      setReviewRating(5)
      try{ if (typeof window !== 'undefined' && window.swal){ await window.swal('Success', 'Review added', 'success') } }catch(_){ }
    }catch(e){ }
    finally{ setReviewLoading(false) }
  }
  async function removeReview(r){
    async function apply(){
      try{
        const idPart = getPostId()
        if (Number.isNaN(idPart)) return
        const res = await fetch('/api/v1/posts/'+encodeURIComponent(String(idPart))+'/reviews', { method:'DELETE', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ author: r.name||'' }) })
        const js = await res.json().catch(()=>null)
        if (!res.ok){ setError((js && js.message) || 'Failed to remove review'); return }
        const next = reviews.filter(x => String(x.name||'') !== String(r.name||''))
        setReviews(next)
        setError('')
      }catch(_){ setError('Failed to remove review') }
    }
    try{
      if (typeof window !== 'undefined' && window.swal){
        const ok = await window.swal({ title:'Remove review?', text:'Are you sure you want to remove your review?', icon:'warning', buttons:['Cancel','Remove'] })
        if (ok) await apply()
      } else {
        const ok = typeof window !== 'undefined' ? window.confirm('Remove your review?') : true
        if (ok) await apply()
      }
    }catch(_){ await apply() }
  }
  async function toggleFavorite(){
    try{
      const uid = getUserId()
      if (!uid){ router.push('/login'); return }
      const pid = getPostId()
      if (Number.isNaN(pid)) return
      if (!isFav){
        await fetch('/api/v1/favorites', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ user_id: uid, post_id: pid }) })
        setIsFav(true)
        setActionStatus('Saved to favorites')
      } else {
        await fetch('/api/v1/favorites', { method:'DELETE', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ user_id: uid, post_id: pid }) })
        setIsFav(false)
        setActionStatus('Removed from favorites')
      }
      setTimeout(()=>setActionStatus(''), 2000)
    }catch(_){ }
  }
  function timeAgo(ts){
    try{
      const d = new Date(ts)
      const diff = Math.max(0, Date.now() - d.getTime())
      const s = Math.floor(diff/1000)
      const m = Math.floor(s/60)
      const h = Math.floor(m/60)
      const d2 = Math.floor(h/24)
      const w = Math.floor(d2/7)
      if (w>=1) return w===1 ? '1 week ago' : w+' weeks ago'
      if (d2>=1) return d2===1 ? '1 day ago' : d2+' days ago'
      if (h>=1) return h===1 ? '1 hour ago' : h+' hours ago'
      if (m>=1) return m===1 ? '1 minute ago' : m+' minutes ago'
      return 'Just now'
    }catch(_){ return '' }
  }
  const specs = useMemo(() => {
    try{
      const title = String(data.productName||'')
      const desc = String(data.description||'').toLowerCase()
      const parts = title.split(/\s+/)
      const brand = parts[0] || ''
      const model = parts.slice(1).join(' ') || ''
      const condition = desc.includes('new') ? 'New' : 'Used'
      const pta = desc.includes('pta') ? (desc.includes('approved') ? 'PTA Approved' : 'PTA') : ''
      return { brand, model, condition, pta }
    }catch(_){ return { brand:'', model:'', condition:'', pta:'' } }
  }, [data.productName, data.description])
  function shareLink(){
    try{
      const url = typeof window !== 'undefined' ? window.location.href : ''
      if (url){
        if (navigator && navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(url) }
        setActionStatus('Link copied')
        setTimeout(()=>setActionStatus(''), 2000)
      }
    }catch(_){ }
  }
  function nextImage(){
    if (!gallery.length) return
    const idx = Math.max(0, gallery.indexOf(activeImg))
    const next = gallery[(idx+1) % gallery.length]
    setActiveImg(next)
  }
  function prevImage(){
    if (!gallery.length) return
    const idx = Math.max(0, gallery.indexOf(activeImg))
    const prev = gallery[(idx-1+gallery.length) % gallery.length]
    setActiveImg(prev)
  }
  

  useEffect(() => {
    setHydrated(true)
    try{
      const products = JSON.parse(localStorage.getItem('products')||'[]') || []
      const count = Array.isArray(products) ? (products.length || 0) : 7
      setActiveAdsCount(Number.isNaN(count) ? 7 : (count || 0))
    }catch(_){ setActiveAdsCount(7) }
  }, [])
  useEffect(() => {
    try{
      const checkMobile = () => setIsMobile(typeof window !== 'undefined' ? window.innerWidth <= 768 : false)
      checkMobile()
      window.addEventListener('resize', checkMobile)
      return () => window.removeEventListener('resize', checkMobile)
    }catch(_){ }
  }, [])
  
  
  
  
  const priceVal = String(data.price||'').replace(/[^0-9.]/g,'')
  const slugPath = '/product/' + ((router.query.slug||router.query.id||'')||'')
  const jsonLd = {
    "@context":"https://schema.org",
    "@type":"Product",
    name: data.productName || 'Product',
    description: data.description || '',
    image: [data.image || '/images/products/img1.jpg'],
    brand: data.brands ? { "@type":"Brand", name: data.brands } : undefined,
    offers: { "@type":"Offer", priceCurrency:"PKR", price: priceVal || "0", availability:"https://schema.org/InStock" },
    sku: (router.query.slug||'') || String(router.query.id||''),
    category: data.category || '',
    url: slugPath
  }
  return (
    <>
      <Head>
        <title>{data.productName ? (data.productName + ' | OMG') : 'OMG Product'}</title>
        <link rel="canonical" href={slugPath} />
        <meta name="description" content={data.description || 'Buy, sell and find anything on OMG'} />
        <meta property="og:title" content={data.productName || 'OMG Product'} />
        <meta property="og:description" content={data.description || ''} />
        <meta property="og:image" content={data.image || '/images/products/img1.jpg'} />
        <meta property="og:url" content={slugPath} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}} />
      </Head>
      <Header />
        <div className="third__navbar" id="categories" ref={allCatWrapRef}>
          <div className="select__itself">
            <a href="#" onClick={(e)=>{ e.preventDefault(); setAllCatOpen(v=>!v) }} ref={allCatBtnRef} aria-expanded={allCatOpen} className="all-categories-btn">
              <span>All Categories</span>
              <FaChevronDown className={`chevron ${allCatOpen ? 'rotated' : ''}`} />
            </a>
          </div>
          <div className="links" id="links">
          {(() => {
            try {
              const order = ['mobile-phones','cars','motercycles','house','tv-video-audio','tablets','land-plots','jobs','services','furniture']
              function slug(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'') }
              if (!Array.isArray(catTiles) || catTiles.length === 0) return null
              const tiles = order.map(sl => catTiles.find(t => t && slug(t.k)===sl)).filter(Boolean)
              if (tiles.length === 0) return null
              return tiles.map((c, idx) => {
                if (!c || !c.k) return null
                try {
                  const displayLabel = c.shortLabel || c.label || c.k || 'Category'
                  const catSlug = slug(c.k)
                  return (
                    <a 
                      key={c.k || idx} 
                      href={'/category/' + catSlug}
                      className="category-link"
                    >
                      {displayLabel}
                    </a>
                  )
                } catch(e) {
                  return null
                }
              })
            } catch(e) {
              return null
            }
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
              <div ref={allCatMenuRef} className={`all-cat-menu ${allCatOpen ? '' : 'hidden'}`}>
                <div className="all-cat-menu-content">
                  <div className="all-cat-menu-grid">
                    {layout.map((list,ci)=> (
                      <div key={'col:'+ci}>
                        {list.map(gr => (
                          <div key={gr.parent.category_id} className="all-cat-group">
                            <div className="all-cat-group-title">{gr.parent.name}</div>
                            <ul className="all-cat-group-list">
                              {gr.children.map(ch => {
                                const s = String(ch.name||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')
                                return (
                                  <li key={ch.category_id} className="all-cat-group-item">
                                    <a href={'/category/'+s} className="all-cat-group-link" onClick={(e)=>{ e.preventDefault(); setAllCatOpen(false); router.push('/category/'+s) }}>{ch.name}</a>
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
   
    <div className="productDetails" style={{marginTop:40, maxWidth:'1400px', margin:'40px auto', padding:'0 20px'}}>
      <div className="left__side">
        
        <div className="hero__grid">
          <div className="details__gallery" style={{display:'grid', gap:16}}>
            <div className="details__image product__banner" style={{position:'relative', borderRadius:16, overflow:'hidden', boxShadow:'0 8px 24px rgba(1,47,52,.12)', background:'#f8f9fa'}}>
            <Image
              src={activeImg || data.image || 'https://static-01.daraz.pk/p/37cd9cf9ea23a97b7d3097bfd9a03347.jpg_720x720.jpg_.webp'}
              alt={data.productName || 'Product image'}
              width={1200}
              height={900}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 1200px"
              priority
              unoptimized
              style={{ width:'100%', height:'auto', objectFit:'cover' }}
            />
            {Array.isArray(gallery) && gallery.length > 1 && (
              <div className="slider__controls" aria-label="Image slider controls" style={{position:'absolute', left:0, right:0, top:0, bottom:0, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 16px', pointerEvents:'none', zIndex:100}}>
                <button 
                  className="slider__btn slider__btn--prev" 
                  aria-label="Previous image" 
                  onClick={prevImage} 
                  type="button"
                  style={{
                    pointerEvents:'auto',
                    width:'44px',
                    height:'44px',
                    borderRadius:'50%',
                    border:'2px solid rgba(1,47,52,.5)',
                    background:'rgba(255,255,255,.98)',
                    display:'inline-flex',
                    alignItems:'center',
                    justifyContent:'center',
                    cursor:'pointer',
                    zIndex:101,
                    boxShadow:'0 4px 12px rgba(0,0,0,.2)',
                    transition:'all .2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#fff'
                    e.currentTarget.style.borderColor = '#012f34'
                    e.currentTarget.style.transform = 'scale(1.1)'
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,.98)'
                    e.currentTarget.style.borderColor = 'rgba(1,47,52,.5)'
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,.2)'
                  }}
                >
                  <FaChevronLeft style={{color:'#012f34', fontSize:'18px', fontWeight:'bold'}} />
                </button>
                <button 
                  className="slider__btn slider__btn--next" 
                  aria-label="Next image" 
                  onClick={nextImage} 
                  type="button"
                  style={{
                    pointerEvents:'auto',
                    width:'44px',
                    height:'44px',
                    borderRadius:'50%',
                    border:'2px solid rgba(1,47,52,.5)',
                    background:'rgba(255,255,255,.98)',
                    display:'inline-flex',
                    alignItems:'center',
                    justifyContent:'center',
                    cursor:'pointer',
                    zIndex:101,
                    boxShadow:'0 4px 12px rgba(0,0,0,.2)',
                    transition:'all .2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#fff'
                    e.currentTarget.style.borderColor = '#012f34'
                    e.currentTarget.style.transform = 'scale(1.1)'
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,.98)'
                    e.currentTarget.style.borderColor = 'rgba(1,47,52,.5)'
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,.2)'
                  }}
                >
                  <FaChevronRight style={{color:'#012f34', fontSize:'18px', fontWeight:'bold'}} />
                </button>
              </div>
            )}
            </div>
            <div className="details__thumbs" role="list" aria-label="Gallery thumbnails" style={{display:'flex', gap:12, flexWrap:'wrap'}}>
              {gallery.map((src,i)=> (
                <button
                  key={i}
                  aria-label={'Image '+(i+1)}
                  onClick={()=>setActiveImg(src)}
                  className="thumb"
                  style={{
                    padding:0,
                    border: activeImg===src ? '3px solid #3a77ff' : '2px solid rgba(1,47,52,.15)',
                    borderRadius:12,
                    overflow:'hidden',
                    boxShadow: activeImg===src ? '0 4px 12px rgba(58,119,255,.25)' : '0 2px 6px rgba(0,0,0,.08)',
                    transition:'all 0.2s ease',
                    cursor:'pointer',
                    background:'#fff'
                  }}
                  onMouseEnter={(e) => {
                    if (activeImg !== src) {
                      e.currentTarget.style.borderColor = 'rgba(58,119,255,.4)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,.12)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeImg !== src) {
                      e.currentTarget.style.borderColor = 'rgba(1,47,52,.15)'
                      e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,.08)'
                    }
                  }}
                >
                  <Image src={src.replace('/800/600','/240/180')} alt={'Image '+(i+1)} width={120} height={90} unoptimized style={{display:'block', width:'100%', height:'auto'}} />
                </button>
              ))}
            </div>
          </div>
          <aside className="profile__card" aria-label="Seller info" style={{
            border: '1px solid rgba(1,47,52,.12)',
            borderRadius: '16px',
            padding: '20px',
            background: '#fff',
            boxShadow: '0 4px 20px rgba(1,47,52,.08)',
            display: 'grid',
            gap: '16px',
            position: 'sticky',
            top: '20px'
          }}>
            <div className="profile__header" style={{display:'flex', flexDirection:'column', gap:'8px'}}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom:'4px' }}>
                <div style={{width:'40px', height:'40px', borderRadius:'50%', background:'linear-gradient(135deg, #3a77ff 0%, #5a9fff 100%)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 8px rgba(58,119,255,.3)'}}>
                  <FaUser style={{ fontSize: '18px', color: '#fff' }} aria-hidden="true" />
                </div>
                <div style={{flex:1}}>
                  <div className="profile__label" style={{fontSize:'12px', color:'rgba(0,47,52,.6)', marginBottom:'2px'}}>Posted by</div>
                  <div className="profile__name" style={{fontSize:'16px', fontWeight:600, color:'#012f34'}}>{data.name || 'Seller'}</div>
                </div>
              </div>
            </div>
            <div className="profile__divider" style={{height:'1px', background:'rgba(1,47,52,.1)', margin:'4px 0'}}></div>
            <div className="profile__meta" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px'}}>
              <div className="profile__stat" style={{
                display:'flex',
                alignItems:'center',
                gap:'12px',
                padding:'14px',
                border:'1px solid rgba(1,47,52,.1)',
                borderRadius:'12px',
                background:'linear-gradient(135deg, #f6f8fc 0%, #ffffff 100%)',
                boxShadow:'0 2px 8px rgba(0,0,0,.04)'
              }}>
                <div style={{width:'36px', height:'36px', borderRadius:'10px', background:'linear-gradient(135deg, #e6efff 0%, #d0e0ff 100%)', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid rgba(58,119,255,.2)'}}>
                  <FaIdCard style={{ fontSize: '18px', color: '#3a77ff' }} aria-hidden="true" />
                </div>
                <div>
                  <div className="muted" style={{fontSize:'11px', color:'rgba(0,47,52,.6)', marginBottom:'4px', fontWeight:500}}>Member Since</div>
                  <div className="val" style={{fontSize:'16px', fontWeight:700, color:'#012f34'}}>{new Date(data.created_at||Date.now()).getFullYear()}</div>
                </div>
              </div>
              <div className="profile__stat" style={{
                display:'flex',
                alignItems:'center',
                gap:'12px',
                padding:'14px',
                border:'1px solid rgba(1,47,52,.1)',
                borderRadius:'12px',
                background:'linear-gradient(135deg, #f6f8fc 0%, #ffffff 100%)',
                boxShadow:'0 2px 8px rgba(0,0,0,.04)'
              }}>
                <div style={{width:'36px', height:'36px', borderRadius:'10px', background:'linear-gradient(135deg, #e6efff 0%, #d0e0ff 100%)', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid rgba(58,119,255,.2)'}}>
                  <FaList style={{ fontSize: '18px', color: '#3a77ff' }} aria-hidden="true" />
                </div>
                <div>
                  <div className="muted" style={{fontSize:'11px', color:'rgba(0,47,52,.6)', marginBottom:'4px', fontWeight:500}}>Active Ads</div>
                  <div className="val" style={{fontSize:'16px', fontWeight:700, color:'#012f34'}}><span suppressHydrationWarning={true}>{hydrated ? (Number.isNaN(activeAdsCount) ? 0 : activeAdsCount) : 7}</span></div>
                </div>
              </div>
            </div>
            <div className="profile__actions" style={{display:'grid', gap:'12px'}}>
              {(() => {
                // Use both data.post_type and postType state for reliability
                const dataPostType = String(data.post_type || postType || 'ad').toLowerCase().trim()
                const statePostType = String(postType || 'ad').toLowerCase().trim()
                const finalPostType = dataPostType || statePostType || 'ad'
                const isProduct = finalPostType === 'product'
                
                console.log('Rendering button - Current state:', {
                  'data.post_type': data.post_type,
                  'postType state': postType,
                  'dataPostType (normalized)': dataPostType,
                  'statePostType (normalized)': statePostType,
                  'finalPostType': finalPostType,
                  'isProduct': isProduct,
                  'Will show Add to Cart': isProduct
                })
                return isProduct
              })() ? (
                <button 
                  className="btn btn--primary btn--xl" 
                  onClick={addToCart}
                  style={{
                    width:'100%',
                    padding:'14px 20px',
                    borderRadius:'12px',
                    fontWeight:600,
                    fontSize:'15px',
                    background:'linear-gradient(135deg, #f55100 0%, #ff6b2b 100%)',
                    border:'none',
                    color:'#fff',
                    cursor:'pointer',
                    boxShadow:'0 4px 12px rgba(245,81,0,.3)',
                    transition:'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(245,81,0,.4)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(245,81,0,.3)'
                  }}
                >
                  <i className="fa-solid fa-cart-plus"></i>&nbsp;Add to Cart
                </button>
              ) : (
                <button 
                  className="btn btn--primary btn--xl" 
                  onClick={callSeller}
                  style={{
                    width:'100%',
                    padding:'14px 20px',
                    borderRadius:'12px',
                    fontWeight:600,
                    fontSize:'15px',
                    background:'linear-gradient(135deg, #3a77ff 0%, #5a9fff 100%)',
                    border:'none',
                    color:'#fff',
                    cursor:'pointer',
                    boxShadow:'0 4px 12px rgba(58,119,255,.3)',
                    transition:'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(58,119,255,.4)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(58,119,255,.3)'
                  }}
                >
                  <i className="fa-solid fa-phone"></i>&nbsp;{showPhone ? (data.profilePhone||data.phone||'') : 'Show phone number'}
                </button>
              )}
              <button 
                className="btn btn--secondary btn--outline btn--xl" 
                onClick={openChat}
                style={{
                  width:'100%',
                  padding:'14px 20px',
                  borderRadius:'12px',
                  fontWeight:600,
                  fontSize:'15px',
                  background:'#fff',
                  border:'2px solid rgba(1,47,52,.2)',
                  color:'#012f34',
                  cursor:'pointer',
                  transition:'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#3a77ff'
                  e.currentTarget.style.background = 'rgba(58,119,255,.05)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(1,47,52,.2)'
                  e.currentTarget.style.background = '#fff'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <i className="fa-regular fa-message"></i>&nbsp;Chat
              </button>
              <button 
                className="btn btn--secondary btn--outline btn--xl" 
                onClick={()=>triggerWhatsApp(data.profilePhone||data.phone||'', data.productName)} 
                aria-label="Chat on WhatsApp"
                style={{
                  width:'100%',
                  padding:'14px 20px',
                  borderRadius:'12px',
                  fontWeight:600,
                  fontSize:'15px',
                  background:'#fff',
                  border:'2px solid rgba(37,211,102,.3)',
                  color:'#25D366',
                  cursor:'pointer',
                  transition:'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#25D366'
                  e.currentTarget.style.background = 'rgba(37,211,102,.08)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(37,211,102,.3)'
                  e.currentTarget.style.background = '#fff'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <i className="fa-brands fa-whatsapp"></i>&nbsp;WhatsApp
              </button>
            </div>
            <div className="profile__footer" style={{display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:'12px', borderTop:'1px solid rgba(1,47,52,.1)', fontSize:'12px', color:'rgba(0,47,52,.6)'}}>
              <div className="ad__id" style={{fontWeight:500}}>Ad ID: {getPostId()}</div>
              <button 
                type="button" 
                className="report__link" 
                onClick={(e)=>{ e.preventDefault(); openReport() }} 
                aria-haspopup="dialog" 
                aria-controls="repReason"
                style={{
                  background:'transparent',
                  border:'none',
                  color:'rgba(0,47,52,.7)',
                  cursor:'pointer',
                  fontWeight:500,
                  fontSize:'12px',
                  display:'flex',
                  alignItems:'center',
                  gap:'6px',
                  padding:'4px 8px',
                  borderRadius:'6px',
                  transition:'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#012f34'
                  e.currentTarget.style.background = 'rgba(1,47,52,.05)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(0,47,52,.7)'
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <i className="fa-regular fa-flag"></i><span>Report this ad</span>
              </button>
            </div>
          </aside>
        </div>
        <div className="status__line" aria-live="polite" style={{padding:'12px 16px', background:'rgba(58,119,255,.08)', borderRadius:'10px', margin:'16px 0', color:'#3a77ff', fontWeight:500, fontSize:'14px', textAlign:'center'}}>{actionStatus}</div>
        <div className="details__grid">
          <section className="details__section details__section--full" aria-labelledby="details-heading" style={{
            background:'#fff',
            border:'1px solid rgba(1,47,52,.12)',
            borderRadius:'16px',
            padding:'24px',
            boxShadow:'0 4px 20px rgba(1,47,52,.06)'
          }}>
            <div className="tabs" role="tablist" aria-label="Product details and reviews" style={{
              display:'flex',
              gap:'8px',
              borderBottom:'2px solid rgba(1,47,52,.1)',
              marginBottom:'24px',
              paddingBottom:'0'
            }}>
              <button 
                role="tab" 
                aria-selected={activeTab==='details'} 
                className={"tab"+(activeTab==='details'?' tab--active':'')} 
                onClick={()=>setActiveTab('details')}
                style={{
                  padding:'12px 24px',
                  background:'transparent',
                  border:'none',
                  borderBottom: activeTab==='details' ? '3px solid #3a77ff' : '3px solid transparent',
                  color: activeTab==='details' ? '#3a77ff' : 'rgba(0,47,52,.6)',
                  fontWeight: activeTab==='details' ? 600 : 500,
                  fontSize:'15px',
                  cursor:'pointer',
                  transition:'all 0.2s ease',
                  marginBottom:'-2px'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'details') {
                    e.currentTarget.style.color = '#012f34'
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'details') {
                    e.currentTarget.style.color = 'rgba(0,47,52,.6)'
                  }
                }}
              >
                Details
              </button>
              <button 
                role="tab" 
                aria-selected={activeTab==='reviews'} 
                className={"tab"+(activeTab==='reviews'?' tab--active':'')} 
                onClick={()=>setActiveTab('reviews')}
                style={{
                  padding:'12px 24px',
                  background:'transparent',
                  border:'none',
                  borderBottom: activeTab==='reviews' ? '3px solid #3a77ff' : '3px solid transparent',
                  color: activeTab==='reviews' ? '#3a77ff' : 'rgba(0,47,52,.6)',
                  fontWeight: activeTab==='reviews' ? 600 : 500,
                  fontSize:'15px',
                  cursor:'pointer',
                  transition:'all 0.2s ease',
                  marginBottom:'-2px'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'reviews') {
                    e.currentTarget.style.color = '#012f34'
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'reviews') {
                    e.currentTarget.style.color = 'rgba(0,47,52,.6)'
                  }
                }}
              >
                Reviews
              </button>
            </div>
            <div className="tab__content">
              {activeTab==='details' && (
                <>
                  <div className="details__head" aria-label="Product header" style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', padding:'0 0 24px 0', marginBottom:'24px', borderBottom:'1px solid rgba(1,47,52,.1)'}}>
                    <div className="head__left" style={{display:'grid', gap:10, flex:1}}>
                      <div className="price__value" id="price" aria-live="polite" style={{fontSize:'42px', fontWeight:700, color:'#012f34', lineHeight:1.2}}>{formatPrice(data.price)}</div>
                      <h1 className="details__title" style={{margin:0, fontSize:28, fontWeight:700, color:'#012f34', lineHeight:1.3}}>{data.productName}</h1>
                      <p className="price__location" id="location" style={{color:'rgba(0,47,52,.7)', fontSize:'15px', display:'flex', alignItems:'center', gap:'8px', marginTop:'4px'}}>
                        <i className="fa-solid fa-location-dot" style={{color:'#3a77ff', fontSize:'16px'}}></i> 
                        <span>{data.location}</span>
                      </p>
                    </div>
                    <div className="head__right" style={{display:'flex', flexDirection:'column', gap:12, alignItems:'flex-end'}}>
                      <div className="details__time" style={{color:'rgba(0,47,52,.6)', fontSize:'13px', fontWeight:500, padding:'6px 12px', background:'rgba(1,47,52,.05)', borderRadius:'8px'}}>{timeAgo(data.created_at)}</div>
                      <div className="price__actions" aria-label="Actions" style={{display:'inline-flex', alignItems:'center', gap:12}}>
                        <button 
                          className="icon__btn" 
                          onClick={toggleFavorite} 
                          aria-label="Save"
                          style={{
                            width:'44px',
                            height:'44px',
                            borderRadius:'12px',
                            border:'2px solid rgba(1,47,52,.15)',
                            background: isFav ? 'rgba(255,59,48,.1)' : '#fff',
                            color: isFav ? '#ff3b30' : '#012f34',
                            display:'flex',
                            alignItems:'center',
                            justifyContent:'center',
                            cursor:'pointer',
                            transition:'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = isFav ? '#ff3b30' : '#3a77ff'
                            e.currentTarget.style.background = isFav ? 'rgba(255,59,48,.15)' : 'rgba(58,119,255,.08)'
                            e.currentTarget.style.transform = 'scale(1.05)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = isFav ? 'rgba(255,59,48,.3)' : 'rgba(1,47,52,.15)'
                            e.currentTarget.style.background = isFav ? 'rgba(255,59,48,.1)' : '#fff'
                            e.currentTarget.style.transform = 'scale(1)'
                          }}
                        >
                          <FaHeart style={{
                            fontSize:'18px', 
                            color: isFav ? '#ff3b30' : '#012f34',
                            opacity: isFav ? 1 : 0.5
                          }} />
                        </button>
                        <button 
                          className="icon__btn" 
                          onClick={shareLink} 
                          aria-label="Share"
                          style={{
                            width:'44px',
                            height:'44px',
                            borderRadius:'12px',
                            border:'2px solid rgba(1,47,52,.15)',
                            background:'#fff',
                            color:'#012f34',
                            display:'flex',
                            alignItems:'center',
                            justifyContent:'center',
                            cursor:'pointer',
                            transition:'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#3a77ff'
                            e.currentTarget.style.background = 'rgba(58,119,255,.08)'
                            e.currentTarget.style.transform = 'scale(1.05)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(1,47,52,.15)'
                            e.currentTarget.style.background = '#fff'
                            e.currentTarget.style.transform = 'scale(1)'
                          }}
                        >
                          <FaShare style={{fontSize:'18px'}} />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="section__heading" style={{margin:'0 0 16px 0', fontSize:'20px', fontWeight:600, color:'#012f34', display:'flex', alignItems:'center', gap:'10px'}}>
                    <span style={{width:'4px', height:'20px', background:'linear-gradient(135deg, #3a77ff 0%, #5a9fff 100%)', borderRadius:'2px'}}></span>
                    Description
                  </h3>
                  <div className="summary__desc" aria-labelledby="pdesc-summary-heading" style={{
                    border:'1px solid rgba(1,47,52,.1)',
                    borderRadius:'14px',
                    padding:'20px',
                    background:'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
                    boxShadow:'0 2px 8px rgba(0,0,0,.04)'
                  }}>
                    <div className="desc__content" style={{color:'rgba(0,47,52,.85)', fontSize:'15px', lineHeight:1.7}}>
                      <p id="description" style={{margin:0, whiteSpace:'pre-wrap'}}>{data.description}</p>
                    </div>
                  </div>
    </>
              )}
              {activeTab==='reviews' && (
                <>
                  <div className="review__form" aria-label="Submit your review" style={{
                    border:'1px solid rgba(1,47,52,.12)',
                    borderRadius:'16px',
                    padding:'20px',
                    marginBottom:'24px',
                    background:'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                    boxShadow:'0 4px 16px rgba(1,47,52,.08)'
                  }}>
                    <div className="review__intro" style={{margin:'0 0 16px', color:'#012f34', fontWeight:600, fontSize:'16px'}}>Share your review and rating</div>
                    <div className="review__controls" role="radiogroup" aria-label="Select rating" style={{marginBottom:'16px'}}>
                      <div className="stars stars--input" style={{display:'inline-flex', gap:8}}>
                        {[1,2,3,4,5].map(s=> (
                          <i
                            key={s}
                            role="radio"
                            aria-checked={s<=reviewRating}
                            tabIndex={0}
                            className={'fa-solid fa-star'+(s<=reviewRating?' on':'')}
                            onClick={()=>setReviewRating(s)}
                            onKeyDown={(e)=>{ if (e.key==='Enter' || e.key===' ') { e.preventDefault(); setReviewRating(s) } }}
                            style={{
                              color: (s<=reviewRating) ? '#ffce32' : 'rgba(1,47,52,.25)',
                              fontSize:24,
                              cursor:'pointer',
                              transition:'all 0.2s ease',
                              filter: (s<=reviewRating) ? 'drop-shadow(0 2px 4px rgba(255,206,50,.3))' : 'none'
                            }}
                            onMouseEnter={(e) => {
                              if (s > reviewRating) {
                                e.currentTarget.style.color = 'rgba(255,206,50,.6)'
                                e.currentTarget.style.transform = 'scale(1.1)'
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (s > reviewRating) {
                                e.currentTarget.style.color = 'rgba(1,47,52,.25)'
                                e.currentTarget.style.transform = 'scale(1)'
                              }
                            }}
                          ></i>
                        ))}
                      </div>
                    </div>
                    <textarea 
                      placeholder="Write your review..." 
                      value={reviewText} 
                      onChange={e=>setReviewText(e.target.value)} 
                      aria-label="Review text" 
                      style={{
                        border:'2px solid rgba(1,47,52,.15)',
                        borderRadius:'12px',
                        padding:'14px 16px',
                        minHeight:100,
                        margin:'0 0 16px 0',
                        width:'100%',
                        fontSize:'15px',
                        fontFamily:'inherit',
                        resize:'vertical',
                        transition:'all 0.2s ease'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#3a77ff'
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(58,119,255,.1)'
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(1,47,52,.15)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    ></textarea>
                    <button 
                      className="btn btn--secondary" 
                      onClick={addReview} 
                      disabled={reviewLoading}
                      style={{
                        padding:'12px 24px',
                        borderRadius:'12px',
                        fontWeight:600,
                        fontSize:'15px',
                        background: reviewLoading ? 'rgba(1,47,52,.1)' : 'linear-gradient(135deg, #3a77ff 0%, #5a9fff 100%)',
                        border:'none',
                        color:'#fff',
                        cursor: reviewLoading ? 'not-allowed' : 'pointer',
                        boxShadow:'0 4px 12px rgba(58,119,255,.3)',
                        transition:'all 0.2s ease',
                        opacity: reviewLoading ? 0.7 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!reviewLoading) {
                          e.currentTarget.style.transform = 'translateY(-2px)'
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(58,119,255,.4)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!reviewLoading) {
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(58,119,255,.3)'
                        }
                      }}
                    >
                      {reviewLoading ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </div>
                  <div className="reviews__list" style={{display:'grid', gap:16}}>
                    {reviews.map((r,i)=> (
                      <article key={i} className="review" aria-label={'Review'} style={{
                        border:'1px solid rgba(1,47,52,.1)',
                        borderRadius:'14px',
                        padding:'18px 20px',
                        background:'#fff',
                        boxShadow:'0 2px 10px rgba(1,47,52,.06)',
                        transition:'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(1,47,52,.1)'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 2px 10px rgba(1,47,52,.06)'
                        e.currentTarget.style.transform = 'translateY(0)'
                      }}
                      >
                        <div className="review__name" style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginBottom:'12px'}}>
                          <div style={{display:'flex', alignItems:'center', gap:10}}>
                            <div style={{
                              width:'40px',
                              height:'40px',
                              borderRadius:'50%',
                              background:'linear-gradient(135deg, #3a77ff 0%, #5a9fff 100%)',
                              display:'flex',
                              alignItems:'center',
                              justifyContent:'center',
                              color:'#fff',
                              fontWeight:600,
                              fontSize:'16px',
                              boxShadow:'0 2px 8px rgba(58,119,255,.3)'
                            }}>
                              {(r.name || 'A')[0].toUpperCase()}
                            </div>
                            <span style={{color:'#012f34', fontWeight:600, fontSize:'15px'}}>{r.name || 'A user'}</span>
                          </div>
                          {((String(r.name||'')===String(auth.email||'')) || (String(r.name||'')===String(auth.name||''))) ? (
                            <button
                              className="btn btn--mini"
                              onClick={()=>removeReview(r)}
                              aria-label="Remove review"
                              style={{
                                display:'inline-flex', 
                                alignItems:'center', 
                                justifyContent:'center',
                                width: isMobile ? 32 : 36,
                                height: isMobile ? 32 : 36,
                                borderRadius:'10px',
                                padding:0,
                                background:'rgba(255,59,48,.08)',
                                border:'1px solid rgba(255,59,48,.2)',
                                color:'#ff3b30',
                                cursor:'pointer',
                                transition:'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255,59,48,.15)'
                                e.currentTarget.style.borderColor = '#ff3b30'
                                e.currentTarget.style.transform = 'scale(1.1)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255,59,48,.08)'
                                e.currentTarget.style.borderColor = 'rgba(255,59,48,.2)'
                                e.currentTarget.style.transform = 'scale(1)'
                              }}
                            >
                              <i className="fa-solid fa-xmark" style={{fontSize: isMobile ? 14 : 16}}></i>
                            </button>
                          ) : null}
                        </div>
                        <div className="stars stars--gold" aria-label={(r.rating||0)+' out of 5'} style={{margin:'0 0 12px 0', display:'flex', gap:'4px'}}>
                          {[1,2,3,4,5].map(s=> (
                            <i 
                              key={s} 
                              className={'fa-solid fa-star'+(s <= (r.rating||0) ? ' on' : '')} 
                              style={{
                                color: s <= (r.rating||0) ? '#ffce32' : 'rgba(1,47,52,.2)',
                                fontSize:'16px',
                                filter: s <= (r.rating||0) ? 'drop-shadow(0 1px 2px rgba(255,206,50,.3))' : 'none'
                              }}
                            ></i>
                          ))}
                        </div>
                        <p style={{margin:0, color:'rgba(0,47,52,.85)', fontSize:'15px', lineHeight:1.6, whiteSpace:'pre-wrap'}}>{r.text}</p>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      </div>
      
    </div>
    <button 
      className="whatsapp-float" 
      aria-label="Open WhatsApp chat" 
      onClick={()=>triggerWhatsApp(data.profilePhone||data.phone||'', data.productName)}
      style={{
        position: 'fixed',
        right: '20px',
        bottom: '20px',
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        background: '#25D366',
        color: '#fff',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 8px 24px rgba(0,0,0,.16)',
        zIndex: 4000,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,.2)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,.16)'
      }}
    >
      <FaWhatsapp style={{ fontSize: '28px' }} />
    </button>
    <Footer />
    {reportOpen && (
      <div className="whatsapp-modal" role="dialog" aria-modal="true" aria-label="Report ad">
        <div className="whatsapp-dialog">
          <h3><i className="fa-regular fa-flag"></i>&nbsp;Report this ad</h3>
          <div className="whatsapp-field">
            <label htmlFor="repReason">What is wrong?</label>
            <select id="repReason" value={reportReason} onChange={e=>setReportReason(e.target.value)}>
              <option>Spam or misleading</option>
              <option>Inappropriate content</option>
              <option>Scam or fraud</option>
              <option>Duplicate listing</option>
              <option>Incorrect price or info</option>
            </select>
          </div>
          <div className="whatsapp-field">
            <label htmlFor="repDetails">Details (optional)</label>
            <textarea id="repDetails" value={reportDetails} onChange={e=>setReportDetails(e.target.value)} placeholder="Describe the issue"></textarea>
          </div>
          <div className="whatsapp-actions">
            <button className="btn btn--outline btn--md" onClick={()=>setReportOpen(false)} aria-label="Cancel">Cancel</button>
            <button className="btn btn--primary btn--md" onClick={submitReport} disabled={reporting || reported} aria-label="Submit report">{reporting ? (<><i className="fa-solid fa-spinner fa-spin"></i>&nbsp;Submitting...</>) : (reported ? 'Already reported' : 'Submit')}</button>
          </div>
        </div>
      </div>
    )}
    
    </>
  )
}