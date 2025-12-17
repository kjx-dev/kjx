import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Footer from '../components/Footer'
import Header from '../components/Header'

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

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const email = localStorage.getItem('email') || ''
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
    const name = localStorage.getItem('name') || ''
    setAuth({ email, isAuthenticated, name })

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
        db = rows.filter(p => String(p.status||'active')==='active').map((p,i) => ({
          id: p.post_id||p.id||i+1,
          slug: (slugify(p.title||'')+"-"+(p.post_id||p.id||i+1)),
          name: p.title||'Item',
          description: p.content||'',
          image: (Array.isArray(p.images)&&p.images.length ? p.images[0].url : categoryImage(p.category?.name||'')),
          price: p.price||'',
          location: p.location||'',
          profileName: '',
          profilePhone: '',
          phoneShow: 'no',
          category: (p.category && p.category.name) || '',
          status: p.status || 'active'
        }))
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
          status: p.status || 'active'
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
  const toShow = Array.isArray(list) ? (usingDb ? list : list.slice(0, displayCount)) : []

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

        <div className="third__navbar" id="categories" ref={allCatWrapRef} style={{position:'relative'}}>
          <div className="select__itself"><a href="#" onClick={(e)=>{ e.preventDefault(); setAllCatOpen(v=>!v) }} ref={allCatBtnRef} aria-expanded={allCatOpen}>All Categories</a></div>
          <div className="links" id="links" style={{display:'flex', flexWrap:'wrap', gap:16, alignItems:'center'}}>
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
                      style={{
                        whiteSpace:'nowrap',
                        fontSize:'14px',
                        fontWeight:500,
                        color:'rgba(0,47,52,.84)',
                        textDecoration:'none',
                        padding:'4px 8px',
                        borderRadius:'6px',
                        transition:'background-color 0.2s'
                      }}
                      onMouseEnter={(e)=>{ e.currentTarget.style.backgroundColor='rgba(1,47,52,.06)' }}
                      onMouseLeave={(e)=>{ e.currentTarget.style.backgroundColor='transparent' }}
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

      <section className="hero" aria-labelledby="hero-title" style={{width:'100%', padding:'40px 20px', background:'#f7f8f9'}}>
        <div className="hero__inner" style={{maxWidth:1100, margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:40, alignItems:'center'}}>
          <div className="hero__content">
            <h1 id="hero-title">Find great deals near you</h1>
            <p style={{fontSize:'18px', color:'rgba(0,47,52,.84)', marginBottom:24}}>Buy, sell and discover items across Pakistan. Post your ad or browse categories to get started.</p>
            <div className="hero__actions" role="group" aria-label="Primary actions" style={{display:'flex', gap:12}}>
              <a className="btn btn--primary" href="/sell" aria-label="Post your ad" style={{padding:'12px 24px', fontSize:'16px', fontWeight:600}}>Post Your Ad</a>
              <a className="btn btn--secondary" href="#categories" aria-label="Browse categories" style={{padding:'12px 24px', fontSize:'16px', fontWeight:600, background:'#fff', color:'#012f34', border:'2px solid #012f34'}}>Browse Categories</a>
            </div>
          </div>
          <div className="hero__art" aria-hidden="true" style={{display:'flex', alignItems:'center', justifyContent:'center'}}>
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
                return <div style={{gridColumn:'1/-1', textAlign:'center', padding:'20px', color:'rgba(0,47,52,.64)'}}>Loading categories...</div>
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
              return tiles.map((c,i) => {
                if (!c || !c.k) return null
                const slug = String(c.k||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')
                return (
                  <a
                    key={(c.label||c.k||'')+':'+i}
                    className="cat__card"
                    href={'/category/'+slug}
                    aria-label={c.label || c.k}
                    onClick={(e)=>{ e.preventDefault(); router.push('/category/'+slug) }}
                  >
                    <div className="cat__icon">
                      <i className={"fa-solid "+(c.icon||'fa-tags')}></i>
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
            <div style={{textAlign:'center', marginTop:12}}>
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

      <div className="fresh__recomandation" aria-labelledby="fresh-title">
        <div style={{maxWidth:1100, margin:'0 auto'}}>
          <h1 id="fresh-title" style={{textAlign:'left'}}>Fresh recommendations</h1>
          <div className="cards__grid" id="cards" style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:16}}>
          {Array.isArray(toShow) && toShow.length > 0 ? toShow.map((card, i) => {
            const isFeatured = i % 3 === 0
            return (
              <article
                key={i}
                className="card"
                onClick={() => productDetail(i)}
                aria-label={card.name}
                style={{
                  background:'#fff', border:'1px solid rgba(1,47,52,.16)', borderRadius:12, overflow:'hidden',
                  boxShadow:'0 2px 8px rgba(0,0,0,.04)', cursor:'pointer', transition:'box-shadow .2s, transform .2s'
                }}
                onMouseEnter={(e)=>{ e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,.08)'; e.currentTarget.style.transform='translateY(-2px)' }}
                onMouseLeave={(e)=>{ e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,.04)'; e.currentTarget.style.transform='none' }}
              >
                <div className="img__featured" style={{position:'relative', width:'100%', paddingTop:'66.66%', background:'#f7f8f9'}}>
                  <Image src={card.image} alt={card.name} fill loading="lazy" sizes="(max-width: 768px) 100vw, 320px" unoptimized style={{objectFit:'cover'}} />
                  {isFeatured && (
                    <p className="featured" style={{position:'absolute', top:8, left:8, margin:0, padding:'4px 8px', borderRadius:6, fontSize:12, fontWeight:600, background:'linear-gradient(180deg,#FFF1CC,#FFD580)', color:'#5a2c00', boxShadow:'0 1px 4px rgba(0,0,0,.12)'}}>featured</p>
                  )}
                </div>
                <div className="card__content" style={{padding:12}}>
                  <div className="card__content-gap" style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8}}>
                    <div className="name__heart" style={{display:'flex', alignItems:'center', gap:8, flex:1}}>
                      <h4 style={{margin:0, fontSize:14, fontWeight:600, color:'#012f34', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden', textOverflow:'ellipsis'}}>{card.name}</h4>
                      <i className="fa-solid fa-heart" aria-hidden="true" style={{color:'rgba(0,47,52,.3)', fontSize:16}}></i>
                      <button
                        className="card__wa-btn"
                        aria-label="Chat on WhatsApp"
                        onClick={(e)=>{ e.stopPropagation(); try { window.dispatchEvent(new CustomEvent('whatsapp:open', { detail: { number: (card.profilePhone||'').replace(/[^0-9]/g,''), message: 'Hello! I am interested in ' + (card.name||'') } })) } catch(_){} }}
                        style={{display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6, padding:'6px 8px', borderRadius:8, border:'1px solid rgba(37,211,102,.3)', background:'rgba(37,211,102,.1)', color:'#25D366'}}
                        onMouseEnter={(e)=>{ e.currentTarget.style.background='rgba(37,211,102,.15)'; e.currentTarget.style.boxShadow='0 2px 6px rgba(37,211,102,.25)' }}
                        onMouseLeave={(e)=>{ e.currentTarget.style.background='rgba(37,211,102,.1)'; e.currentTarget.style.boxShadow='none' }}
                      >
                        <i className="fa-brands fa-whatsapp" aria-hidden="true"></i>
                      </button>
                    </div>
                    <h2 aria-label={'Price ' + card.price} style={{margin:0, fontSize:18, fontWeight:700, color:'#012f34'}}>Rs {card.price}</h2>
                  </div>
                  <h5 className="card__location" style={{margin:'8px 0 0', fontSize:12, color:'rgba(0,47,52,.64)'}}><i className="fa-solid fa-location-dot" aria-hidden="true"></i> {card.location}</h5>
                </div>
              </article>
            )
          }) : (
            <div style={{gridColumn:'1/-1', textAlign:'center', padding:'40px 20px', color:'rgba(0,47,52,.64)'}}>
              <p>No products found. Be the first to post an ad!</p>
            </div>
          )}
          </div>
          <div className="load__more">
          {usingDb ? (
            dbHasMore ? (<button className="load__more-btn" onClick={loadMore}>Load More</button>) : null
          ) : (
            displayCount < list.length ? (<button className="load__more-btn" onClick={loadMore}>Load More</button>) : null
          )}
          </div>
        </div>
      </div>

      <Footer />
      {showTop && (
        <button aria-label="Back to top" onClick={toTop} style={{position:'fixed', right:16, bottom:16, width:44, height:44, borderRadius:22, background:'#012f34', color:'#fff', border:'none', boxShadow:'0 2px 8px rgba(0,0,0,.2)', zIndex:4000}}>
          <i className="fa-solid fa-arrow-up"></i>
        </button>
      )}
    </>
  )
}