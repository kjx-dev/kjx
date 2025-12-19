import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Footer from '../components/Footer'
import Header from '../components/Header'
import CategorySlider from '../components/CategorySlider'
import { FaTags, FaHeart, FaRegHeart, FaWhatsapp, FaMapMarkerAlt, FaArrowUp, FaChevronDown, FaChevronLeft, FaChevronRight, FaMobileAlt, FaCar, FaMotorcycle, FaHome, FaTv, FaTabletAlt, FaMapMarker, FaBriefcase, FaPaintRoller, FaChair, FaLaptop, FaHeadphones, FaCamera, FaGamepad, FaBook, FaDumbbell, FaShirt, FaBaby, FaDog, FaIndustry, FaTools, FaClock, FaRegClock } from 'react-icons/fa'

export default function Home() {
  const router = useRouter()
  const [categories, setCategories] = useState([])
  const [catTiles, setCatTiles] = useState([])
  const [catGroups, setCatGroups] = useState([])
  const [auth, setAuth] = useState({ email: '', isAuthenticated: false, name: '' })
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [headerCatOpen, setHeaderCatOpen] = useState(false)
  const catWrapRef = useRef(null)
  const catBtnRef = useRef(null)
  const catMenuRef = useRef(null)
  const profileWrapRef = useRef(null)
  const profileBtnRef = useRef(null)
  const profileMenuRef = useRef(null)
  const [profileMenuPos, setProfileMenuPos] = useState({ top: 100, left: 16 })
  const [allCatOpen, setAllCatOpen] = useState(false)
  const allCatWrapRef = useRef(null)
  const allCatBtnRef = useRef(null)
  const allCatMenuRef = useRef(null)
  const [allProducts, setAllProducts] = useState([])
  const [list, setList] = useState([])
  const [displayCount, setDisplayCount] = useState(8)
  const [dbPage, setDbPage] = useState(1)
  const [dbHasMore, setDbHasMore] = useState(true)
  const [usingDb, setUsingDb] = useState(false)
  const [q, setQ] = useState('')
  const searchTimerRef = useRef(null)
  const year = new Date().getFullYear()
  const [showTop, setShowTop] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [sliderIndex, setSliderIndex] = useState(0)
  const [favorites, setFavorites] = useState(new Set())
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  function getUserId(){
    try{
      const tok = localStorage.getItem('auth_token')||''
      const parts = String(tok||'').split('.')
      if (parts.length>=3){
        const data = parts[1]
        const pad = data.length%4===2 ? '==' : data.length%4===3 ? '=' : ''
        const norm = data.replace(/-/g,'+').replace(/_/g,'/') + pad
        const json = JSON.parse(atob(norm))
        return json && json.sub ? json.sub : null
      }
    }catch(_){ }
    return null
  }

  useEffect(() => {
    const email = localStorage.getItem('email') || ''
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
    const name = localStorage.getItem('name') || ''
    setAuth({ email, isAuthenticated, name })
    const uid = getUserId()
    setUserId(uid)

    async function loadFavorites(){
      try{
        const uid = getUserId()
        if (!uid) return
        const res = await fetch('/api/v1/favorites?user_id='+encodeURIComponent(String(uid)))
        const js = await res.json().catch(()=>({}))
        const list = Array.isArray(js.data) ? js.data : []
        const favSet = new Set()
        list.forEach(x => {
          if (x.post_id) favSet.add(String(x.post_id))
          if (x.id) favSet.add(String(x.id))
        })
        setFavorites(favSet)
      }catch(_){ }
    }
    loadFavorites()
  }, [])

  useEffect(() => {
    async function loadFavoritesOnUserIdChange(){
      if (!userId) return
      try{
        const res = await fetch('/api/v1/favorites?user_id='+encodeURIComponent(String(userId)))
        const js = await res.json().catch(()=>({}))
        const list = Array.isArray(js.data) ? js.data : []
        const favSet = new Set()
        list.forEach(x => {
          if (x.post_id) favSet.add(String(x.post_id))
          if (x.id) favSet.add(String(x.id))
        })
        setFavorites(favSet)
      }catch(_){ }
    }
    loadFavoritesOnUserIdChange()
  }, [userId])

  useEffect(() => {
    async function loadProducts(){
      let demo = []
      function categoryImage(cat){
        if ((cat||'').toLowerCase().includes('mobile')) return 'https://picsum.photos/seed/phone/800/600'
        if ((cat||'').toLowerCase().includes('car')) return 'https://picsum.photos/seed/car/800/600'
        if ((cat||'').toLowerCase().includes('motor')) return 'https://picsum.photos/seed/motorcycle/800/600'
        if ((cat||'').toLowerCase().includes('house') || (cat||'').toLowerCase().includes('property')) return 'https://picsum.photos/seed/property/800/600'
        return 'https://picsum.photos/seed/product/800/600'
      }
      function slugify(str){
        return String(str||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')
      }
      const normalizedDemo = []
      let db = []
      try{
        const r2 = await fetch('/api/v1/posts?page=1&limit=8')
        const j2 = await r2.json()
        const rows = Array.isArray(j2.data) ? j2.data : []
        db = rows.filter(p => String(p.status||'active')==='active').map((p,i) => {
          const postId = p.post_id||p.id||i+1
          return {
            id: postId,
            post_id: postId,
            slug: (slugify(p.title||'')+"-"+postId),
            name: p.title||'Item',
            description: p.content||'',
            image: (Array.isArray(p.images)&&p.images.length ? p.images[0].url : categoryImage(p.category?.name||'')),
            price: p.price||'',
            location: p.location||'',
            profileName: '',
            profilePhone: '',
            phoneShow: 'no',
            category: (p.category && p.category.name) || '',
            status: p.status || 'active',
            created_at: p.created_at || null
          }
        })
        if (rows.length){ setUsingDb(true); setDbPage(1); setDbHasMore(!!j2.has_more) }
      }catch(_){ db = [] }
      const merged = db.filter(p => String(p.status||'active')==='active')
      localStorage.setItem('products', JSON.stringify(db))
      setAllProducts(merged)
      setList(merged)
      setSliderIndex(0)
    }
    loadProducts()
  }, [])
  useEffect(() => {
    function onScroll(){ setShowTop(typeof window!=='undefined' ? window.scrollY > 240 : false) }
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  function toTop(){ try{ window.scrollTo({ top:0, behavior:'smooth' }) }catch(_){ } }
  useEffect(() => {
    try{
      const checkMobile = () => setIsMobile(typeof window !== 'undefined' ? window.innerWidth <= 768 : false)
      checkMobile()
      window.addEventListener('resize', checkMobile)
      return () => window.removeEventListener('resize', checkMobile)
    }catch(_){ }
  }, [])
  useEffect(() => {
    function onKey(e){ if (e.key === 'Escape') setAllCatOpen(false) }
    function onOutside(e){ const el = allCatWrapRef.current; if (!el) return; if (!el.contains(e.target)) setAllCatOpen(false) }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onOutside)
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onOutside) }
  }, [])
  const [catsExpanded, setCatsExpanded] = useState(false)

  useEffect(() => {
    async function loadCategories(){
      try {
        const res = await fetch('/api/v1/category')
        const data = await res.json()
        const payload = data.data || {}
        setCategories(payload.categories || [])
        setCatTiles(payload.tiles || [])
        try{ localStorage.setItem('categories_payload', JSON.stringify(payload)); localStorage.setItem('categories_updated_at', String(Date.now())) }catch(_){ }
        try{
          const rg = await fetch('/api/v1/categories')
          const dg = await rg.json()
          const groups = (dg && dg.data && dg.data.groups) || []
          setCatGroups(groups)
          try{ localStorage.setItem('categories_groups_payload', JSON.stringify(groups)) }catch(_){ }
        }catch(_){ setCatGroups([]) }
      } catch(e) {
        try{
          const raw = localStorage.getItem('categories_payload') || '{}'
          const cached = JSON.parse(raw)
          setCategories(cached.categories || [])
          setCatTiles(cached.tiles || [])
          try{ const rawG = localStorage.getItem('categories_groups_payload') || '[]'; setCatGroups(JSON.parse(rawG)) }catch(_){ setCatGroups([]) }
        }catch(_){ setCategories([]); setCatTiles([]) }
      }
    }
    loadCategories()
  }, [])

  useEffect(() => {
    if (categories.length) return
    const uniq = Array.from(new Set(allProducts.map(p => String(p.category||'').trim()).filter(Boolean)))
    if (uniq.length){
      setCategories(uniq)
      function shortLabel(n){
        const s = String(n||'').toLowerCase()
        if (s.includes('mobile')) return 'Mobile'
        if (s.includes('phone')) return 'Mobile'
        if (s.includes('tv')||s.includes('video')||s.includes('audio')) return 'TV'
        if (s.includes('books')||s.includes('hobbies')) return 'Books'
        if (s.includes('sports')) return 'Sports'
        if (s.includes('fashion')) return 'Fashion'
        if (s.includes('beauty')) return 'Beauty'
        if (s.includes('furniture')) return 'Furniture'
        if (s.includes('house')||s.includes('property')) return 'Property'
        if (s.includes('land')||s.includes('plot')) return 'Land'
        if (s.includes('motor')||s.includes('moter')) return 'Bikes'
        if (s.includes('car')) return 'Cars'
        if (s.includes('jobs')) return 'Jobs'
        if (s.includes('kids')||s.includes('children')) return 'Kids'
        if (s.includes('services')) return 'Services'
        if (s.includes('business')||s.includes('industrial')) return 'Business'
        if (s.includes('animals')||s.includes('pets')) return 'Pets'
        if (s.includes('tablets')) return 'Tablets'
        return String(n||'')
      }
      setCatTiles(uniq.map(n => ({ k:n, label: shortLabel(n), icon:'fa-tags' })))
    }
  }, [allProducts])

  useEffect(() => {
    function onStorage(e){
      try{
        if (e.key === 'categories_payload'){
          const cached = JSON.parse(e.newValue||'{}')
          setCategories(cached.categories || [])
          setCatTiles(cached.tiles || [])
        }
      }catch(_){ }
    }
    window.addEventListener('storage', onStorage)
    return () => { window.removeEventListener('storage', onStorage) }
  }, [])

  useEffect(() => {
    const cat = (router.query.cat || '').toString()
    if (!cat) return
    const filtered = allProducts.filter(p => p.category === cat)
    setDisplayCount(8)
    setList(filtered)
  }, [router.query.cat, allProducts])

  useEffect(() => {
    setProfileMenuOpen(false)
  }, [router.asPath])

  function sell() {
    if (auth.email && auth.isAuthenticated) router.push('/sell')
    else router.push('/login')
  }
  function manage() { router.push('/manage') }
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
  function applySearch(val){
    const qq = String(val||'').toLowerCase()
    const filtered = allProducts.filter(p => {
      const nm = (p.name||'').toLowerCase()
      const loc = (p.location||'').toLowerCase()
      const br = (p.brands||'').toLowerCase()
      const cat = (p.category||'').toLowerCase()
      const catMatch = (
        cat.includes(qq)
        || ((qq.includes('motor')||qq.includes('bike')) && (cat.includes('motor')||cat.includes('moter')||cat.includes('bike')))
        || (qq.includes('property') && (cat.includes('property')||cat.includes('house')||cat.includes('land')||cat.includes('plot')))
      )
      return nm.includes(qq) || loc.includes(qq) || br.includes(qq) || catMatch
    })
    setDisplayCount(8)
    setList(filtered)
  }
  function clearSearch(){ setQ(''); applySearch('') }
  function onSearchChange(e){ const v = e.target.value||''; setQ(v); if (searchTimerRef.current){ clearTimeout(searchTimerRef.current) } searchTimerRef.current = setTimeout(()=>applySearch(v), 400) }
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
  useEffect(() => {
    function onKey(e){ if (e.key === 'Escape') setProfileMenuOpen(false) }
    function onOutside(e){ if (!profileWrapRef.current) return; if (!profileWrapRef.current.contains(e.target)) setProfileMenuOpen(false) }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onOutside)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onOutside)
    }
  }, [])
  useEffect(() => {
    if (profileMenuOpen) {
      const first = profileMenuRef.current?.querySelector('a,button,[tabindex]')
      if (first) first.focus()
      if (profileBtnRef.current) profileBtnRef.current.setAttribute('aria-expanded','true')
    } else {
      if (profileBtnRef.current) profileBtnRef.current.setAttribute('aria-expanded','false')
    }
  }, [profileMenuOpen])
  useEffect(() => {
    if (headerCatOpen) {
      const first = catMenuRef.current?.querySelector('a')
      if (first) first.focus()
      if (catBtnRef.current) catBtnRef.current.setAttribute('aria-expanded','true')
    } else {
      if (catBtnRef.current) catBtnRef.current.setAttribute('aria-expanded','false')
    }
  }, [headerCatOpen])
  function categorySet(cat){
    const filtered = allProducts.filter(p => p.category === cat)
    setDisplayCount(8)
    setList(filtered)
  }
  function productDetail(index){
    const p = list[index]
    if (!p) return
    localStorage.setItem('productName', p.name)
    localStorage.setItem('name', p.profileName)
    localStorage.setItem('description', p.description)
    localStorage.setItem('image', p.image)
    localStorage.setItem('price', p.price)
    localStorage.setItem('location', p.location)
    localStorage.setItem('phone', p.profilePhone)
    localStorage.setItem('phoneShow', p.phoneShow)
    localStorage.setItem('category', p.category || '')
    const pid = p.id || (index+1)
    const slug = p.slug || (String(p.name||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'') + '-' + pid)
    router.push('/product/' + encodeURIComponent(slug))
  }

  async function loadMore(){
    if (usingDb && dbHasMore){
      const nextPage = dbPage + 1
      try{
        const r = await fetch('/api/v1/posts?page='+nextPage+'&limit=8')
        const j = await r.json()
        const rows = Array.isArray(j.data) ? j.data : []
        const more = rows.filter(p => String(p.status||'active')==='active').map((p,i) => ({
          id: p.post_id||p.id||i+1,
          post_id: p.post_id||p.id||i+1,
          slug: (String(p.title||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')+"-"+(p.post_id||p.id||i+1)),
          name: p.title||'Item',
          description: p.content||'',
          image: (Array.isArray(p.images)&&p.images.length ? p.images[0].url : 'https://picsum.photos/seed/product/800/600'),
          price: p.price||'',
          location: p.location||'',
          profileName: '',
          profilePhone: '',
          phoneShow: 'no',
          category: (p.category && p.category.name) || '',
          status: p.status || 'active',
          created_at: p.created_at || null
        }))
        const nextList = [...list, ...more].filter(p => String(p.status||'active')==='active')
        setList(nextList)
        setDbPage(nextPage)
        setDbHasMore(!!j.has_more)
      }catch(_){ setDbHasMore(false) }
      return
    }
    setDisplayCount(displayCount + 8)
  }
  const toShow = Array.isArray(list) ? (usingDb ? list.slice(0, 8) : list.slice(0, Math.min(displayCount, 8))) : []
  
  // Slider functionality - Popular Ads limited to 8 items
  const itemsPerPage = 4
  const totalPages = Math.ceil(toShow.length / itemsPerPage)
  const currentPage = Math.min(sliderIndex, totalPages - 1)
  const startIndex = currentPage * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const visibleItems = toShow.slice(startIndex, endIndex)
  
  function nextSlide() {
    setSliderIndex((prev) => (prev + 1) % totalPages)
  }
  
  function prevSlide() {
    setSliderIndex((prev) => (prev - 1 + totalPages) % totalPages)
  }

  function getTimeAgo(dateString) {
    if (!dateString) return 'Recently'
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffInSeconds = Math.floor((now - date) / 1000)
      
      if (diffInSeconds < 60) return 'Just now'
      if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60)
        return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
      }
      if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600)
        return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
      }
      if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400)
        return `${days} ${days === 1 ? 'day' : 'days'} ago`
      }
      if (diffInSeconds < 2592000) {
        const weeks = Math.floor(diffInSeconds / 604800)
        return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`
      }
      if (diffInSeconds < 31536000) {
        const months = Math.floor(diffInSeconds / 2592000)
        return `${months} ${months === 1 ? 'month' : 'months'} ago`
      }
      const years = Math.floor(diffInSeconds / 31536000)
      return `${years} ${years === 1 ? 'year' : 'years'} ago`
    } catch (_) {
      return 'Recently'
    }
  }

  async function toggleFavorite(postId, e){
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    try{
      const uid = userId || getUserId()
      if (!uid){ 
        router.push('/login')
        return 
      }
      const pid = Number(postId)
      if (Number.isNaN(pid)) return
      
      const isFav = favorites.has(String(pid))
      if (!isFav){
        await fetch('/api/v1/favorites', { 
          method:'POST', 
          headers:{ 'Content-Type':'application/json' }, 
          body: JSON.stringify({ user_id: uid, post_id: pid }) 
        })
        setFavorites(prev => new Set([...prev, String(pid)]))
        try{ if (typeof window !== 'undefined' && window.swal){ window.swal('Success','Added to favorites','success') } }catch(_){ }
      } else {
        await fetch('/api/v1/favorites', { 
          method:'DELETE', 
          headers:{ 'Content-Type':'application/json' }, 
          body: JSON.stringify({ user_id: uid, post_id: pid }) 
        })
        setFavorites(prev => {
          const next = new Set(prev)
          next.delete(String(pid))
          return next
        })
        try{ if (typeof window !== 'undefined' && window.swal){ window.swal('Removed','Removed from favorites','info') } }catch(_){ }
      }
    }catch(_){ }
  }

  return (
    <>
      <Head>
        <title>OMG Pakistan | Buy & Sell Classifieds</title>
        <meta name="description" content="Buy, sell and find anything in Pakistan. Explore mobiles, vehicles, property, electronics, jobs and more on OMG." />
        <meta name="keywords" content="OMG, classifieds, mobiles, cars, property, electronics, jobs" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="OMG Pakistan" />
        <meta property="og:description" content="Discover deals across categories and post your ad easily." />
        <meta property="og:type" content="website" />
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

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__inner">
          <div className="hero__content">
            <h1 id="hero-title">Find great deals near you</h1>
            <p>Buy, sell and discover items across Pakistan. Post your ad or browse categories to get started.</p>
            <div className="hero__actions" role="group" aria-label="Primary actions">
              <a className="btn btn--primary" href="/sell" aria-label="Post your ad">Post Your Ad</a>
              <a className="btn btn--secondary" href="#categories" aria-label="Browse categories">Browse Categories</a>
            </div>
          </div>
          <div className="hero__art" aria-hidden="true">
            <Image src="/images/banners/mobile.webp" alt="" width={640} height={380} priority sizes="(max-width: 768px) 100vw, 640px" style={{width:'100%', height:'auto'}} />
          </div>
        </div>
      </section>

      <section className="home__categories" aria-labelledby="home-cats-title">
        <h2 id="home-cats-title">Browse by category</h2>
        <div className="home__categories-grid">
          {(() => {
            try {
              if (!Array.isArray(catTiles) || catTiles.length === 0) {
                return <div className="loading-categories">Loading categories...</div>
              }
              const seen = new Set()
              const uniq = []
              for (const t of catTiles){
                if (!t || !t.k) continue
                const key = String(t.label||t.k||'').toLowerCase()
                if (seen.has(key)) continue
                seen.add(key)
                uniq.push(t)
              }
              const tiles = catsExpanded ? uniq : uniq.slice(0, 21)
              if (tiles.length === 0) return null
              
              function getCategoryIcon(category) {
                if (!category) return FaTags
                const cat = String(category.k || category.label || category || '').toLowerCase()
                if (cat.includes('mobile') || cat.includes('phone')) return FaMobileAlt
                if (cat.includes('car') || cat.includes('vehicle')) return FaCar
                if (cat.includes('motor') || cat.includes('moter') || cat.includes('bike')) return FaMotorcycle
                if (cat.includes('house') || cat.includes('property')) return FaHome
                if (cat.includes('tv') || cat.includes('video') || cat.includes('audio') || cat.includes('electronics')) return FaTv
                if (cat.includes('tablet')) return FaTabletAlt
                if (cat.includes('land') || cat.includes('plot')) return FaMapMarker
                if (cat.includes('job')) return FaBriefcase
                if (cat.includes('service')) return FaPaintRoller
                if (cat.includes('furniture')) return FaChair
                if (cat.includes('laptop') || cat.includes('computer')) return FaLaptop
                if (cat.includes('headphone') || cat.includes('audio')) return FaHeadphones
                if (cat.includes('camera')) return FaCamera
                if (cat.includes('game') || cat.includes('console')) return FaGamepad
                if (cat.includes('book') || cat.includes('hobby')) return FaBook
                if (cat.includes('sport') || cat.includes('fitness')) return FaDumbbell
                if (cat.includes('fashion') || cat.includes('beauty') || cat.includes('clothing')) return FaShirt
                if (cat.includes('kid') || cat.includes('children') || cat.includes('baby')) return FaBaby
                if (cat.includes('animal') || cat.includes('pet')) return FaDog
                if (cat.includes('business') || cat.includes('industrial')) return FaIndustry
                if (cat.includes('tool')) return FaTools
                return FaTags
              }
              
              return tiles.map((c,i) => {
                if (!c || !c.k) return null
                const slug = String(c.k||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')
                const IconComponent = getCategoryIcon(c)
                return (
                  <a
                    key={(c.label||c.k||'')+':'+i}
                    className="cat__card"
                    href={'/category/'+slug}
                    aria-label={c.label || c.k}
                    onClick={(e)=>{ e.preventDefault(); router.push('/category/'+slug) }}
                  >
                    <div className="cat__icon">
                      <IconComponent />
                    </div>
                    <div className="cat__label">{c.label || c.k}</div>
                  </a>
                )
              })
            } catch(e) {
              console.error('Category render error:', e)
              return null
            }
          })()}
        </div>
        {(() => {
          const total = catTiles.length
          const seen = new Set(catTiles.map(t=>String(t.label||t.k||'').toLowerCase()))
          const uniqCount = seen.size
          return (!catsExpanded && uniqCount>21) ? (
            <div className="view-more-container">
              <button className="load__more-btn" onClick={()=>setCatsExpanded(true)}>View more</button>
            </div>
          ) : null
        })()}
      </section>

      <div className="ad" role="img" aria-label="Exclusive offers banner">
        <Image
          src="/images/banners/ad.jpg"
          alt="Exclusive offers"
          width={1300}
          height={240}
          loading="lazy"
          sizes="(max-width: 768px) 100vw, 1100px"
          style={{ width: '100%', height: 'auto' }}
        />
      </div>

      {/* Popular Ads - All Categories */}
      <div className="fresh__recomandation" aria-labelledby="fresh-title">
        <div className="fresh__recomandation-container">
          <h1 id="fresh-title">Popular Ads</h1>
          {Array.isArray(toShow) && toShow.length > 0 ? (
            <div className="popular-ads-slider">
              <button 
                className="slider-nav slider-nav-prev" 
                onClick={prevSlide}
                aria-label="Previous ads"
                disabled={totalPages <= 1}
              >
                <FaChevronLeft />
              </button>
              <div className="slider-container">
                <div className="slider-track" style={{ transform: `translateX(-${currentPage * 100}%)` }}>
                  {Array.from({ length: totalPages }).map((_, pageIndex) => {
                    const pageStart = pageIndex * itemsPerPage
                    const pageEnd = pageStart + itemsPerPage
                    const pageItems = toShow.slice(pageStart, pageEnd)
                    return (
                      <div key={pageIndex} className="slider-page">
                        <div className="cards__grid">
                          {pageItems.map((card, i) => {
                            const originalIndex = pageStart + i
                            const isFeatured = originalIndex % 3 === 0
                            return (
                              <article
                                key={originalIndex}
                                className="card"
                                onClick={() => productDetail(originalIndex)}
                                aria-label={card.name}
                              >
                                <div className="img__featured">
                                  <Image src={card.image} alt={card.name} fill loading="lazy" sizes="(max-width: 768px) 100vw, 320px" unoptimized style={{objectFit:'cover'}} />
                                  {isFeatured && (
                                    <p className="featured">featured</p>
                                  )}
                                </div>
                                <div className="card__content">
                                  <div className="card__content-gap">
                                    <div className="name__heart">
                                      <h4 className="card__price" aria-label={'Price ' + card.price}>Rs {card.price}</h4>
                                      <button
                                        onClick={(e) => toggleFavorite(card.post_id || card.id, e)}
                                        aria-label={favorites.has(String(card.post_id || card.id)) ? 'Remove from favorites' : 'Add to favorites'}
                                        className="card__heart-btn"
                                      >
                                        {favorites.has(String(card.post_id || card.id)) ? (
                                          <FaHeart 
                                            aria-hidden="true" 
                                            className="card__heart" 
                                            style={{
                                              color: '#f55100',
                                              fill: '#f55100',
                                              fontSize: '16px',
                                              transition: 'all 0.2s ease'
                                            }} 
                                          />
                                        ) : (
                                          <FaRegHeart 
                                            aria-hidden="true" 
                                            className="card__heart" 
                                            style={{
                                              color: '#f55100',
                                              opacity: 0.5,
                                              fontSize: '16px',
                                              transition: 'all 0.2s ease'
                                            }} 
                                          />
                                        )}
                                      </button>
                                    </div>
                                    <div className="card__name-wrap">
                                    <h4 className="card__name">{card.name}</h4>
                                    </div>
                                  </div>
                                  <h5 className="card__location"><FaMapMarkerAlt aria-hidden="true" /> {card.location}</h5>
                                  <h5 className="card__location time-total">
                                    {getTimeAgo(card.created_at)}
                                  </h5>
                                </div>
                              </article>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <button 
                className="slider-nav slider-nav-next" 
                onClick={nextSlide}
                aria-label="Next ads"
                disabled={totalPages <= 1}
              >
                <FaChevronRight />
              </button>
              {totalPages > 1 && (
                <div className="slider-dots">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      className={`slider-dot ${i === currentPage ? 'active' : ''}`}
                      onClick={() => setSliderIndex(i)}
                      aria-label={`Go to page ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="no-products">
              <p>No products found. Be the first to post an ad!</p>
            </div>
          )}
        </div>
      </div>

      {/* Category-wise Sliders */}
      <CategorySlider heading="Mobile Phones" category="Mobile Phones" favorites={favorites} onToggleFavorite={toggleFavorite} userId={userId} />
      <CategorySlider heading="Cars & Vehicles" category="Cars" favorites={favorites} onToggleFavorite={toggleFavorite} userId={userId} />
      <CategorySlider heading="Motorcycles" category="Motercycles" favorites={favorites} onToggleFavorite={toggleFavorite} userId={userId} />
      <CategorySlider heading="Property & Real Estate" category="House" favorites={favorites} onToggleFavorite={toggleFavorite} userId={userId} />
      <CategorySlider heading="Electronics" category="Tv - Video - Audio" favorites={favorites} onToggleFavorite={toggleFavorite} userId={userId} />

      <Footer />
      {showTop && (
        <button aria-label="Back to top" onClick={toTop} className="back-to-top">
          <FaArrowUp />
        </button>
      )}
    </>
  )
}