import { useEffect, useMemo, useRef, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Image from 'next/image'
import Footer from '../components/Footer'
import Header from '../components/Header'

export default function ProductDetails(){
  const router = useRouter()
  const [data, setData] = useState({
    phoneShow:'', phone:'', name:'', description:'', image:'', price:'', location:'', productName:'', category:''
  })
  const [bids, setBids] = useState([])
  const [bidAmount, setBidAmount] = useState('')
  const [placingBid, setPlacingBid] = useState(false)
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
  const [countdown, setCountdown] = useState('')
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
  const ratingStats = useMemo(() => {
    const bidRatings = bids.filter(b => typeof b.rating === 'number')
    const reviewRatings = reviews.filter(r => typeof r.rating === 'number')
    const list = [...bidRatings, ...reviewRatings]
    const total = list.length || 1
    const avg = list.reduce((a,b)=>a+((b.rating)||0),0)/total
    const dist = [0,0,0,0,0]
    list.forEach(b=>{ const r = Math.round(b.rating||0); const idx = Math.max(1, Math.min(5, r)); dist[5-idx]++ })
    return { avg: Number(avg.toFixed(1)), dist, total }
  }, [bids, reviews])
  const topAmount = useMemo(() => Math.max(0, ...bids.map(b => Number(b.amount)||0)), [bids])
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
                setData({ phoneShow, phone, name: profileName, description, image, price, location, productName, category, created_at })
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
                try{
                  const rb = await fetch('/api/v1/posts/'+idFromSlug+'/bids')
                  const bj = await rb.json()
                  const listB = Array.isArray(bj.data) ? bj.data : []
                  setBids(listB.map(b=>({ email:b.email||'', name:b.author, amount:b.amount, created_at:b.created_at })))
                }catch(_){ setBids([]) }
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
            const created_at = d.created_at || Date.now()
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
            setData({ phoneShow, phone, name, description, image, price, location, productName, category, created_at })
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
                try{
                  const rb = await fetch('/api/v1/posts/'+id+'/bids')
                  const bj = await rb.json()
                  const listB = Array.isArray(bj.data) ? bj.data : []
                  setBids(listB.map(b=>({ email:b.email||'', name:b.author, amount:b.amount, created_at:b.created_at })))
                }catch(_){ setBids([]) }
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
      setData({ phoneShow, phone, name: profileNameLocal, description, image, price, location, productName, category, created_at })
      setActiveImg(image || '/images/products/img1.jpg')
      const g = [image || '/images/products/img1.jpg', 'https://picsum.photos/seed/phone/800/600', 'https://picsum.photos/seed/car/800/600', 'https://picsum.photos/seed/property/800/600']
      const uniq = []
      for (let i=0; i<g.length; i++) { const s = g[i]; if (s && !uniq.includes(s)) uniq.push(s) }
      setGallery(uniq)
      try {
        const pid = (router.query.slug||router.query.id||'').toString()
        const idPart = parseInt((pid.split('-').pop()||pid),10)
        const rb = await fetch('/api/v1/posts/'+encodeURIComponent(String(idPart))+'/bids')
        const bj = await rb.json()
        const listB = Array.isArray(bj.data) ? bj.data : []
        setBids(listB.map(b=>({ email:b.email||'', name:b.author, amount:b.amount, created_at:b.created_at })))
      } catch (e) {
        setBids([])
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
    if (!deadline) return
    const fmt = (ms) => {
      const s = Math.max(0, Math.floor(ms/1000))
      const hh = String(Math.floor(s/3600)).padStart(2,'0')
      const mm = String(Math.floor((s%3600)/60)).padStart(2,'0')
      const ss = String(s%60).padStart(2,'0')
      return hh+':'+mm+':'+ss
    }
    const id = setInterval(() => {
      setCountdown(fmt(deadline - Date.now()))
    }, 1000)
    setCountdown(fmt(deadline - Date.now()))
    return () => clearInterval(id)
  }, [deadline])
  function search(){ router.push('/') }
  function sell(){ if (auth.email && auth.isAuthenticated) router.push('/sell'); else router.push('/login') }
  function manage(){ router.push('/manage') }
  function addToCart(){
    const item = { name: data.productName, price: data.price, image: data.image, location: data.location }
    try {
      const raw = localStorage.getItem('cart')
      const list = raw ? JSON.parse(raw) : []
      list.push(item)
      localStorage.setItem('cart', JSON.stringify(list))
      setActionStatus('Added to cart')
    } catch(e){ setActionStatus('Failed to add to cart') }
  }
  function buyNow(){
    addToCart()
    router.push('/manage')
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
  async function placeBid(){
    if (placingBid) return
    const email = localStorage.getItem('email') || ''
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
    const name = localStorage.getItem('name') || ''
    if (!isAuthenticated || !email) { try{ if (typeof window !== 'undefined' && window.swal){ window.swal('Login required', 'Please login to place a bid', 'warning') } }catch(_){ } router.push('/login'); return }
    const amount = parseFloat(bidAmount)
    if (isNaN(amount) || amount<=0) { setError('Enter a valid bid amount'); return }
    setPlacingBid(true)
    try{
      const idPart = getPostId()
      if (Number.isNaN(idPart)) { setError('Invalid product id'); setPlacingBid(false); return }
      const res = await fetch('/api/v1/posts/'+encodeURIComponent(String(idPart))+'/bids', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ amount: Math.round(amount), author: name || email, email }) })
      const js = await res.json().catch(()=>null)
      if (res.status===409){ setError('You have already placed a bid'); setPlacingBid(false); return }
      if (!res.ok){ setError((js && js.message) || 'Failed to place bid'); setPlacingBid(false); return }
      const r = js?.data || { email, author: name||email, amount: Math.round(amount), created_at: Date.now() }
      const created = { email: r.email||'', name: r.author||name||email, amount: r.amount, created_at: r.created_at }
      const next = [created, ...bids].sort((a,b)=>Number(b.amount||0)-Number(a.amount||0))
      setBids(next)
      setBidAmount('')
      setError('')
    }catch(_){ setError('Failed to place bid') }
    finally{ setPlacingBid(false) }
  }
  async function removeBid(b){
    async function apply(){
      try{
        const idPart = getPostId()
        if (Number.isNaN(idPart)) return
        const payload = { email: b.email||'', author: b.name||'' }
        const res = await fetch('/api/v1/posts/'+encodeURIComponent(String(idPart))+'/bids', { method:'DELETE', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload) })
        const js = await res.json().catch(()=>null)
        if (!res.ok){ setError((js && js.message) || 'Failed to remove bid'); return }
        const next = bids.filter(x => !(String(x.email||'')===String(b.email||'') && String(x.name||'')===String(b.name||'')))
        setBids(next)
        setError('')
      }catch(_){ setError('Failed to remove bid') }
    }
    try{
      if (typeof window !== 'undefined' && window.swal){
        const ok = await window.swal({ title:'Remove bid?', text:'Are you sure you want to remove your bid?', icon:'warning', buttons:['Cancel','Remove'] })
        if (ok) await apply()
      } else {
        const ok = typeof window !== 'undefined' ? window.confirm('Remove your bid?') : true
        if (ok) await apply()
      }
    }catch(_){ await apply() }
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
      setActiveAdsCount(Array.isArray(products) ? products.length : 7)
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
   
    <div className="productDetails" style={{marginTop:40}}>
      <div className="left__side">
        
        <div className="hero__grid">
          <div className="details__gallery" style={{display:'grid', gap:12}}>
            <div className="details__image product__banner" style={{position:'relative', borderRadius:12, overflow:'hidden', boxShadow:'0 6px 18px rgba(1,47,52,.08)'}}>
            <div className="ribbon ribbon--bid"><i className="fa-solid fa-gavel"></i><span>Bid</span></div>
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
            <div className="slider__controls" aria-label="Image slider controls">
              <button className="slider__btn slider__btn--prev" aria-label="Previous image" onClick={prevImage}><i className="fa-solid fa-chevron-left"></i></button>
              <button className="slider__btn slider__btn--next" aria-label="Next image" onClick={nextImage}><i className="fa-solid fa-chevron-right"></i></button>
            </div>
            </div>
            <div className="details__thumbs" role="list" aria-label="Gallery thumbnails" style={{display:'flex', gap:10, flexWrap:'wrap'}}>
              {gallery.map((src,i)=> (
                <button
                  key={i}
                  aria-label={'Image '+(i+1)}
                  onClick={()=>setActiveImg(src)}
                  className="thumb"
                  style={{
                    padding:0,
                    border:'1px solid rgba(1,47,52,.2)',
                    borderRadius:10,
                    overflow:'hidden',
                    boxShadow: (activeImg===src) ? '0 2px 8px rgba(0,0,0,.12)' : 'none'
                  }}
                >
                  <Image src={src.replace('/800/600','/240/180')} alt={'Image '+(i+1)} width={120} height={90} unoptimized style={{display:'block'}} />
                </button>
              ))}
            </div>
          </div>
          <aside className="profile__card" aria-label="Seller info">
            <div className="profile__header">
              <div className="profile__label">Posted by</div>
              <div className="profile__name">{data.name || 'Seller'}</div>
              <div className="profile__role">Seller</div>
              <i className="fa-solid fa-chevron-right" aria-hidden="true"></i>
            </div>
            <div className="profile__divider"></div>
            <div className="profile__meta">
              <div className="profile__stat"><i className="fa-regular fa-id-badge"></i><div><div className="muted">Member Since</div><div className="val">{new Date(data.created_at||Date.now()).getFullYear()}</div></div></div>
              <div className="profile__stat"><i className="fa-regular fa-rectangle-list"></i><div><div className="muted">Active Ads</div><div className="val"><span suppressHydrationWarning={true}>{hydrated ? activeAdsCount : 7}</span></div></div></div>
            </div>
            <div className="profile__actions">
              <button className="btn btn--primary btn--xl" onClick={callSeller}><i className="fa-solid fa-phone"></i>&nbsp;{showPhone ? (data.profilePhone||data.phone||'') : 'Show phone number'}</button>
              <button className="btn btn--secondary btn--outline btn--xl" onClick={openChat}><i className="fa-regular fa-message"></i>&nbsp;Chat</button>
              <button className="btn btn--secondary btn--outline btn--xl" onClick={()=>triggerWhatsApp(data.profilePhone||data.phone||'', data.productName)} aria-label="Chat on WhatsApp"><i className="fa-brands fa-whatsapp"></i>&nbsp;WhatsApp</button>
            </div>
            <div className="profile__footer">
              <div className="ad__id">Ad ID: {getPostId()}</div>
              <button type="button" className="report__link" onClick={(e)=>{ e.preventDefault(); openReport() }} aria-haspopup="dialog" aria-controls="repReason"><i className="fa-regular fa-flag"></i><span>Report this ad</span></button>
            </div>
          </aside>
        </div>
        <div className="status__line" aria-live="polite">{actionStatus}</div>
        <div className="details__grid">
          <section className="details__section details__section--full" aria-labelledby="details-heading">
            <div className="tabs" role="tablist" aria-label="Product details, bids, and reviews">
              <button role="tab" aria-selected={activeTab==='details'} className={"tab"+(activeTab==='details'?' tab--active':'')} onClick={()=>setActiveTab('details')}>Details</button>
              <button role="tab" aria-selected={activeTab==='bids'} className={"tab"+(activeTab==='bids'?' tab--active':'')} onClick={()=>setActiveTab('bids')}>Bids</button>
              <button role="tab" aria-selected={activeTab==='reviews'} className={"tab"+(activeTab==='reviews'?' tab--active':'')} onClick={()=>setActiveTab('reviews')}>Reviews</button>
            </div>
            <div className="tab__content">
              {activeTab==='details' && (
                <>
                  <div className="details__head" aria-label="Product header" style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', padding:'8px 0'}}>
                    <div className="head__left" style={{display:'grid', gap:6}}>
                      <div className="price__value" id="price" aria-live="polite">{formatPrice(data.price)}</div>
                      <h1 className="details__title" style={{margin:0, fontSize:24, fontWeight:700, color:'#012f34'}}>{data.productName}</h1>
                      <p className="price__location" id="location" style={{color:'rgba(0,47,52,.64)'}}><i className="fa-solid fa-location-dot"></i> {data.location}</p>
                    </div>
                    <div className="head__right" style={{display:'grid', gap:8, justifyItems:'end'}}>
                      <div className="details__time" style={{color:'#012f34'}}>{timeAgo(data.created_at)}</div>
                      <div className="price__actions" aria-label="Actions" style={{display:'inline-flex', alignItems:'center', gap:16}}>
                        <button className="icon__btn" onClick={toggleFavorite} aria-label="Save"><i className={(isFav ? 'fa-solid' : 'fa-regular') + ' fa-heart'}></i></button>
                        <button className="icon__btn" onClick={shareLink} aria-label="Share"><i className="fa-solid fa-share-nodes"></i></button>
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="section__heading" style={{margin:'16px 0 8px'}}>Description</h3>
                  <div className="summary__desc" aria-labelledby="pdesc-summary-heading" style={{border:'none', borderRadius:12, padding:16, background:'#fff'}}>
                    <div className="desc__content" style={{color:'rgba(0,47,52,.84)'}}>
                      <p id="description">{data.description}</p>
                    </div>
                  </div>
    </>
              )}
              {activeTab==='bids' && (
                <div className="bid__card bid__card--featured">
                  <div className="bid__header">
                    <h3>Bids</h3>
                    <div className="bid__status"><i className="fa-solid fa-bolt"></i><span>Limited stock</span><span className="sep">•</span><span className="time">{countdown}</span></div>
                  </div>
                  {error && (<div className="error__text">{error}</div>)}
                  <div className="bid__sub">Total bids: {bids.length}</div>
                  <div className="bid__grid">
                    <div className="bid__left">
                      <div className="bid__row">
                        <div className="bid__input-wrap">
                          <span className="bid__prefix">Rs</span>
                          <input className="bid__input" type="number" placeholder="Enter bid amount" value={bidAmount} onChange={e=>setBidAmount(e.target.value)} aria-label="Bid amount" disabled={placingBid} />
                        </div>
                        <button className="btn btn--primary btn--xl btn--pulse" onClick={placeBid} disabled={placingBid}>{placingBid ? (<><i className="fa-solid fa-spinner fa-spin"></i>&nbsp;Placing...</>) : 'Place Bid'}</button>
                      </div>
                      {placingBid && (
                        <div aria-live="polite" aria-busy="true" style={{display:'flex', alignItems:'center', gap:8, marginTop:8, color:'rgba(0,47,52,.64)'}}>
                          <span style={{width:16, height:16, border:'2px solid rgba(1,47,52,.3)', borderTopColor:'#3a77ff', borderRadius:'50%', animation:'spin 1s linear infinite'}}></span>
                          <span>Submitting your bid...</span>
                        </div>
                      )}
                    </div>
                    <div className="bids__list">
                      {bids.length===0 && (<div className="bid__empty">No bids yet</div>)}
                      {bids.map((b,i)=> (
                        <div key={i} className={"bid__item" + (((Number(b.amount)||0)===topAmount) ? " bid__item--top" : "")}>
                          <div className="bid__row-top">
                            <div className="bid__person">
                              <div className="bid__title">
                                <div className="bid__name">{(String(b.name||'').trim() && !String(b.name||'').includes('@')) ? String(b.name||'').trim() : 'Mr X'}</div>
                              </div>
                            </div>
                            <div className="bid__meta">
                              <span className="amount">{formatPrice(b.amount)}</span>
                              <span className="timeline">{b.days ? (b.days + ' days') : ''}</span>
                              {((String(b.email||'')===String(auth.email||'')) || (!b.email && String(b.name||'')===String(auth.name||''))) ? (
                                <button
                                  className="bid__remove"
                                  onClick={()=>removeBid(b)}
                                  aria-label="Remove bid"
                                >
                                  <i className="fa-solid fa-xmark"></i>
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {activeTab==='reviews' && (
                <>
                  <div className="review__form" aria-label="Submit your review" style={{border:'1px solid rgba(1,47,52,.2)', borderRadius:12, padding:'12px 14px', marginBottom:16, background:'#fff', boxShadow:'0 6px 18px rgba(1,47,52,.06)'}}>
                    <div className="review__intro" style={{margin:'0 0 8px', color:'#012f34', fontWeight:600}}>Share your review and rating</div>
                    <div className="review__controls" role="radiogroup" aria-label="Select rating" style={{marginBottom:8}}>
                      <div className="stars stars--input" style={{display:'inline-flex', gap:6}}>
                        {[1,2,3,4,5].map(s=> (
                          <i
                            key={s}
                            role="radio"
                            aria-checked={s<=reviewRating}
                            tabIndex={0}
                            className={'fa-solid fa-star'+(s<=reviewRating?' on':'')}
                            onClick={()=>setReviewRating(s)}
                            onKeyDown={(e)=>{ if (e.key==='Enter' || e.key===' ') { e.preventDefault(); setReviewRating(s) } }}
                            style={{color: (s<=reviewRating) ? '#ffce32' : 'rgba(1,47,52,.28)', fontSize:18, cursor:'pointer'}}
                          ></i>
                        ))}
                      </div>
                    </div>
                    <textarea placeholder="Write your review" value={reviewText} onChange={e=>setReviewText(e.target.value)} aria-label="Review text" style={{border:'1px solid rgba(1,47,52,.2)', borderRadius:10, padding:'8px 10px', minHeight:80, margin:'4px 0 10px', width:'100%'}}></textarea>
                    <button className="btn btn--secondary" onClick={addReview} disabled={reviewLoading}>{reviewLoading ? 'Submitting...' : 'Submit Review'}</button>
                  </div>
                  <div className="reviews__list" style={{display:'grid', gap:10}}>
                    {reviews.map((r,i)=> (
                      <article key={i} className="review" aria-label={'Review'} style={{border:'1px solid rgba(1,47,52,.2)', borderRadius:10, padding:'10px 12px', background:'#fff', boxShadow:'0 2px 8px rgba(1,47,52,.06)'}}>
                        <div className="review__name" style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:8}}>
                          <span style={{color:'#012f34', fontWeight:600}}>{r.name || 'A user'}</span>
                          {((String(r.name||'')===String(auth.email||'')) || (String(r.name||'')===String(auth.name||''))) ? (
                            <button
                              className="btn btn--mini"
                              onClick={()=>removeReview(r)}
                              aria-label="Remove review"
                              style={{
                                display:'inline-flex', alignItems:'center', justifyContent:'center',
                                width: isMobile ? 24 : 32,
                                height: isMobile ? 24 : 32,
                                borderRadius: isMobile ? 12 : 16,
                                padding:0,
                                background:'rgba(1,47,52,.08)',
                                border:'1px solid rgba(1,47,52,.2)',
                                color:'#012f34'
                              }}
                            >
                              <i className="fa-solid fa-xmark" style={{fontSize: isMobile ? 12 : 16}}></i>
                            </button>
                          ) : null}
                        </div>
                        <div className="stars stars--gold" aria-label={(r.rating||0)+' out of 5'} style={{margin:'6px 0'}}>
                          {[1,2,3,4,5].map(s=> (
                            <i key={s} className={'fa-solid fa-star'+(s <= (r.rating||0) ? ' on' : '')} style={{color:'#ffce32'}}></i>
                          ))}
                        </div>
                        <p style={{margin:0, color:'rgba(0,47,52,.84)'}}>{r.text}</p>
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
    <button className="whatsapp-float" aria-label="Open WhatsApp chat" onClick={()=>triggerWhatsApp(data.profilePhone||data.phone||'', data.productName)}><i className="fa-brands fa-whatsapp"></i></button>
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