import { useEffect, useRef, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Footer from '../components/Footer'
import Header from '../components/Header'
import CategorySlider from '../components/CategorySlider'
import CategoryBar from '../components/CategoryBar'
import HomeHero from '../components/HomeHero'
import CategoryGrid from '../components/CategoryGrid'
import BannerAd from '../components/BannerAd'
import PopularAdsSlider from '../components/PopularAdsSlider'
import { FaArrowUp } from 'react-icons/fa'

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
  const [allProducts, setAllProducts] = useState([])
  const [list, setList] = useState([])
  const [displayCount, setDisplayCount] = useState(8)
  const [dbPage, setDbPage] = useState(1)
  const [dbHasMore, setDbHasMore] = useState(true)
  const [usingDb, setUsingDb] = useState(false)
  const [q, setQ] = useState('')
  const searchTimerRef = useRef(null)
  const [showTop, setShowTop] = useState(false)
  const [mounted, setMounted] = useState(false)
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
            featured: p.featured || 0, // Include featured field from database
            created_at: p.created_at || null
          }
        })
        if (rows.length){ setUsingDb(true); setDbPage(1); setDbHasMore(!!j2.has_more) }
      }catch(_){ db = [] }
      const merged = db.filter(p => String(p.status||'active')==='active')
      localStorage.setItem('products', JSON.stringify(db))
      setAllProducts(merged)
      setList(merged)
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
  function manage() { router.push('/my-ads') }
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
  function logout(){ 
    try{ 
      // Get current path before clearing auth
      const currentPath = router.asPath || router.pathname || '/'
      // Pages that require auth - redirect to home instead
      const authRequiredPages = ['/admin', '/profile', '/my-ads', '/sell', '/cart', '/checkout', '/orders', '/favorites']
      const shouldRedirectHome = authRequiredPages.some(page => currentPath.startsWith(page))
      const redirectPath = shouldRedirectHome ? '/' : currentPath
      
      // Clear all auth data at once
      const keysToRemove = ['auth_token', 'email', 'username', 'name', 'phone', 'gender', 'isAuthenticated']
      keysToRemove.forEach(key => {
        try { localStorage.removeItem(key) } catch(_) {}
      })
      
      // Use replace for immediate redirect (faster than push)
      router.replace(redirectPath)
    }catch(_){ 
      // Fallback: use window.location for immediate redirect
      try {
        window.location.href = '/'
      } catch(e) {
        router.replace('/')
      }
    }
  }
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
      <CategoryBar />
      <HomeHero />
      <CategoryGrid 
        catTiles={catTiles} 
        catGroups={catGroups} 
        catsExpanded={catsExpanded} 
        setCatsExpanded={setCatsExpanded} 
      />
      <BannerAd />

      <PopularAdsSlider 
        products={toShow}
        onProductClick={productDetail}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
      />

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