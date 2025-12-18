import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Footer from '../../components/Footer'
import Image from 'next/image'
import Header from '../../components/Header'
// keep utilities local for page logic; test coverage uses lib/catUtils.js

function slugify(str){
  return String(str||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')
}
function isVehicleChild(slug){
  const s = String(slug||'').toLowerCase()
  return s==='cars' || s==='auto-parts' || s==='tyres-wheels' || s==='car-care'
}
function isActiveSlug(currentSlug, itemSlug){
  return String(currentSlug||'').toLowerCase() === String(itemSlug||'').toLowerCase()
}
function titleCase(s){
  return String(s||'').split('-').map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(' ')
}
function browseLabelForSlug(s){
  const m = {
    vehicles: 'Cars',
    mobiles: 'Mobile Phones',
    bikes: 'Motercycles',
    electronics: 'Tv - Video - Audio'
  }
  const key = String(s||'').toLowerCase()
  return m[key] || titleCase(key)
}

export default function CategoryPage(){
  const router = useRouter()
  const slug = String(router.query.slug||'')
  const [categories, setCategories] = useState([])
  const [catTiles, setCatTiles] = useState([])
  const [catGroups, setCatGroups] = useState([])
  const catWrapRef = useRef(null)
  const catBtnRef = useRef(null)
  const catMenuRef = useRef(null)
  const [headerCatOpen, setHeaderCatOpen] = useState(false)
  const [auth, setAuth] = useState({ email:'', isAuthenticated:false, name:'' })
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileWrapRef = useRef(null)
  const profileBtnRef = useRef(null)
  const profileMenuRef = useRef(null)
  const [allCatOpen, setAllCatOpen] = useState(false)
  const allCatWrapRef = useRef(null)
  const allCatBtnRef = useRef(null)
  const allCatMenuRef = useRef(null)
  const [profileMenuPos, setProfileMenuPos] = useState({ top: 100, left: 16 })
  const [isMobile, setIsMobile] = useState(false)
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    async function loadCats(){
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
    }
    loadCats()
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
    function onKey(e){ if (e.key === 'Escape') setAllCatOpen(false) }
    function onOutside(e){ const el = allCatWrapRef.current; if (!el) return; if (!el.contains(e.target)) setAllCatOpen(false) }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onOutside)
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onOutside) }
  }, [])
  useEffect(() => {
    try{
      const email = localStorage.getItem('email') || ''
      const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
      const name = localStorage.getItem('name') || ''
      setAuth({ email, isAuthenticated, name })
    }catch(_){ setAuth({ email:'', isAuthenticated:false, name:'' }) }
  }, [])
  useEffect(() => {
    function onKey(e){ if (e.key === 'Escape') setHeaderCatOpen(false) }
    function onOutside(e){ if (!catWrapRef.current) return; if (!catWrapRef.current.contains(e.target)) setHeaderCatOpen(false) }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onOutside)
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onOutside) }
  }, [])
  useEffect(() => {
    function onKey(e){ if (e.key === 'Escape') setProfileMenuOpen(false) }
    function onOutside(e){ if (!profileWrapRef.current) return; if (!profileWrapRef.current.contains(e.target)) setProfileMenuOpen(false) }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onOutside)
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onOutside) }
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
  const [products, setProducts] = useState([])
  const [displayCount, setDisplayCount] = useState(12)
  const [sortKey, setSortKey] = useState('newly_listed')
  const [filterLocation, setFilterLocation] = useState('')
  const locations = ['Karachi','Lahore','Islamabad','Rawalpindi','Peshawar','Quetta','Multan','Hyderabad','Faisalabad','Sialkot','Gujranwala']
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [view, setView] = useState('list')
  const [sortOpen, setSortOpen] = useState(false)
  const sortWrapRef = useRef(null)
  const sortBtnRef = useRef(null)
  const sortMenuRef = useRef(null)
  const [groupExpanded, setGroupExpanded] = useState(false)
  const [catQ, setCatQ] = useState('')
  const [catExpanded, setCatExpanded] = useState(false)
  const [countryOpen, setCountryOpen] = useState(true)
  const priceInvalid = (!!priceMin && !!priceMax && Number(priceMin) > Number(priceMax))
  const canApply = (!!priceMin || !!priceMax) && !priceInvalid
  useEffect(() => {
    function onKey(e){ if (e.key === 'Escape') setSortOpen(false) }
    function onOutside(e){
      const el = sortWrapRef.current
      if (!el) return
      if (!el.contains(e.target)) setSortOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onOutside)
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onOutside) }
  }, [])
  useEffect(() => { setView('list') }, [slug])
  useEffect(() => {
    setDisplayCount(12)
    setFilterLocation('')
    setPriceMin('')
    setPriceMax('')
    setSortKey('newly_listed')
    // Removed auto scroll-to-top on category change to prevent visual jerk
  }, [slug])
  useEffect(() => {
    if (!slug) return
    async function load(){
      setProducts([])
      setLoading(true)
      try{
        const res = await fetch('/api/v1/category/'+encodeURIComponent(slug))
        const data = await res.json()
        const raw = (data.data?.products)||[]
        const aliasName = browseLabelForSlug(slug)
        const catLabel = aliasName
        function categoryImage(cat){
          const s = String(cat||'').toLowerCase()
          if (s.includes('mobile')||s.includes('phone')) return 'https://picsum.photos/seed/phone/800/600'
          if (s.includes('car')) return 'https://picsum.photos/seed/car/800/600'
          if (s.includes('motor')) return 'https://picsum.photos/seed/motorcycle/800/600'
          if (s.includes('house')||s.includes('property')||s.includes('land')) return 'https://picsum.photos/seed/property/800/600'
          return 'https://picsum.photos/seed/product/800/600'
        }
        let statusMap = {}
        try{ statusMap = JSON.parse(localStorage.getItem('post_statuses')||'{}') || {} }catch(_){ statusMap = {} }
        const list = raw.map((p,i) => {
          const withImg = Array.isArray(p.images) && p.images.length ? { ...p, image: p.images[0].url } : p
          const needsReplace = !withImg.image || withImg.image === '/images/products/img1.jpg'
          const base = needsReplace ? { ...withImg, image: categoryImage(catLabel) } : withImg
          const id = base.id || base.post_id || (i+1)
          const slug = base.slug || (slugify(base.title || base.name)+'-'+id)
          const key = 'db:'+String(id)
          const status = String(statusMap[key]||'active')
          return {
            id,
            slug,
            name: base.title || base.name || 'Item',
            description: base.content || base.description || '',
            image: base.image,
            price: base.price || '',
            location: base.location || '',
            profilePhone: base.profilePhone || '',
            category: catLabel,
            status
          }
        })
        let merged = list.filter(p => String(p.status||'active')==='active')
        if (!merged.length){
          try{
            const cached = JSON.parse(localStorage.getItem('products')||'[]') || []
            const fromCache = cached.filter(p => {
              const catSlug = slugify(p.category)
              return catSlug === String(slug||'').toLowerCase()
            }).map((p,i)=>({
              id: p.id||i+1,
              slug: p.slug || (String(p.name||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')+'-'+(p.id||i+1)),
              name: p.name||'Item',
              description: p.description||'',
              image: p.image || categoryImage(catLabel),
              price: p.price || '',
              location: p.location || '',
              profilePhone: p.profilePhone || '',
              category: catLabel,
              status: 'active'
            }))
            merged = fromCache
          }catch(_){ }
        }
        setProducts(merged)
        setLoading(false)
      }catch(e){ setProducts([]); setLoading(false) }
    }
    load()
  }, [slug])
  function productDetail(p){
    const rawId = (p.id!=null) ? parseInt(String(p.id),10) : NaN
    const idFromSlug = parseInt(String(String(p.slug||'').split('-').pop()||''),10)
    const idPart = Number.isNaN(rawId) ? idFromSlug : rawId
    const s = p.slug || (slugify(p.name)+'-'+(idPart || p.id || 1))
    const dest = '/product/'+encodeURIComponent(s)
    try{
      localStorage.setItem('productName', p.name||'')
      localStorage.setItem('description', p.description||'')
      localStorage.setItem('image', p.image||'/images/products/img1.jpg')
      localStorage.setItem('price', String(p.price||''))
      localStorage.setItem('location', p.location||'')
      localStorage.setItem('phone', (p.profilePhone||''))
      localStorage.setItem('phoneShow', 'true')
      localStorage.setItem('category', label||'')
    }catch(e){}
    router.push(dest)
  }
  function sell(){ if (auth.email && auth.isAuthenticated) router.push('/sell'); else router.push('/login') }
  function manage(){ router.push('/manage') }
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
  function openWhatsApp(p){
    const fallback = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER||'')
    const n = ((p.profilePhone||fallback)||'').replace(/[^0-9]/g,'')
    const msg = 'Hello! I am interested in ' + (p.name||'this product')
    try{ window.dispatchEvent(new CustomEvent('whatsapp:open', { detail: { number: n, message: msg } })) }catch(e){}
  }
  function callSeller(p){
    const n = String(p.profilePhone||'').replace(/[^0-9]/g,'')
    if (n) { try{ window.location.href = 'tel:'+n }catch(_){ } }
  }
  function provinceFor(city){
    const c = String(city||'').toLowerCase()
    if (c==='karachi' || c==='hyderabad') return 'Sindh'
    if (c==='lahore' || c==='faisalabad' || c==='multan' || c==='sialkot' || c==='gujranwala') return 'Punjab'
    if (c==='islamabad') return 'Islamabad Capital Territory'
    if (c==='peshawar') return 'Khyber Pakhtunkhwa'
    if (c==='quetta') return 'Balochistan'
    return 'Northern Areas'
  }
  const filtered = products.filter(p => {
    const byLoc = !filterLocation || String(p.location||'') === filterLocation || provinceFor(p.location) === filterLocation
    const price = Number(p.price||0)
    const byMin = !priceMin || price >= Number(priceMin)
    const byMax = !priceMax || price <= Number(priceMax)
    return byLoc && byMin && byMax
  })
  function fmt(n){ try{ return new Intl.NumberFormat('en-US').format(n||0) }catch(_){ return String(n||0) } }
  const carsCount = products.filter(p => String(p.category||'').toLowerCase().includes('car')).length
  const accessoriesCount = products.filter(p => { const s = String(p.category||'').toLowerCase(); return s.includes('accessor') || s.includes('auto parts') || s.includes('parts') }).length
  const sparePartsCount = products.filter(p => { const s = String(p.category||'').toLowerCase(); return s.includes('parts') || s.includes('tyre') || s.includes('wheel') }).length
  const carCareCount = products.filter(p => String(p.category||'').toLowerCase().includes('care')).length
  const sorted = (() => {
    const base = filtered.slice()
    if (sortKey === 'newly_listed') return base.sort((a,b)=>{
      const ai = parseInt(String(a.id||String(a.slug||'').split('-').pop()||'0'),10)
      const bi = parseInt(String(b.id||String(b.slug||'').split('-').pop()||'0'),10)
      return (isNaN(bi)?0:bi) - (isNaN(ai)?0:ai)
    })
    if (sortKey === 'price_asc') return base.sort((a,b)=>Number(a.price||0)-Number(b.price||0))
    if (sortKey === 'price_desc') return base.sort((a,b)=>Number(b.price||0)-Number(a.price||0))
    if (sortKey === 'name_asc') return base.sort((a,b)=>String(a.name||'').localeCompare(String(b.name||'')))
    if (sortKey === 'name_desc') return base.sort((a,b)=>String(b.name||'').localeCompare(String(a.name||'')))
    return base
  })()
  const toShow = sorted.slice(0, displayCount)
  const label = browseLabelForSlug(slug)
  const canonical = '/category/'+slug
  const jsonLd = {
    '@context':'https://schema.org',
    '@type':'ItemList',
    name: label,
    itemListElement: toShow.map((p,i)=>({
      '@type':'ListItem',
      position: i+1,
      url: '/product/'+(p.slug||slugify(p.name))
    }))
  }
  return (
    <>
      <Head>
        <title>{label ? (label+' | OMG') : 'Category | OMG'}</title>
        <link rel="canonical" href={canonical} />
        <meta name="description" content={'Browse '+label+' on OMG'} />
        <meta property="og:title" content={label || 'Category'} />
        <meta property="og:description" content={'Find deals in '+label} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonical} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}} />
      </Head>
      <div className="same__color">
        <Header />
        <div className="third__navbar" id="categories" ref={allCatWrapRef} style={{position:'relative'}}>
          <div className="select__itself"><a href="#" onClick={(e)=>{ e.preventDefault(); setAllCatOpen(v=>!v) }} ref={allCatBtnRef} aria-expanded={allCatOpen} style={{textDecoration:'none'}}>All Categories</a></div>
          <div className="links" id="links" style={{display:'flex', flexWrap:'wrap', gap:16}}>
            {(() => {
              const order = ['mobile-phones','cars','motercycles','house','tv-video-audio','tablets','land-plots','jobs','services','furniture']
              function slug(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'') }
              const tiles = order.map(sl => catTiles.find(t => slug(t.k)===sl)).filter(Boolean)
              return tiles.map(c => (
                <a
                  key={c.k}
                  href={'/category/' + slug(c.k)}
                  onClick={(e)=>{ e.preventDefault(); try{ localStorage.setItem('selectedCategory', slug(c.k)) }catch(_){ } router.push('/category/'+slug(c.k)) }}
                  style={{textDecoration:'none', color:'rgba(0,47,52,.84)'}}
                >
                  {c.label}
                </a>
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
              <div ref={allCatMenuRef} style={{display: allCatOpen ? 'block':'none', position:'absolute', zIndex:30, top:48, left:0, right:0, margin:'0 30px',
              //  maxWidth:1100,
                background:'#fff', border:'1px solid rgba(1,47,52,.2)', boxShadow:'0 6px 18px rgba(0,0,0,.08)', borderRadius:12}}>
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
        <div className="fresh__recomandation" aria-labelledby="cat-title" style={{textAlign:'left',
          margin:'20px 0 0 0'
        }}>
          <h1 id="cat-title" style={{fontWeight:500, textAlign:'left'}}>{label}</h1>
          <div style={{
            // maxWidth:1100,
             margin:'0 auto', padding:'0 0px'}}>
          <div className="cat__layout" style={{display:'grid', gridTemplateColumns:'280px 1fr', gap:16}}>
            <aside style={{position:'sticky', top:80, alignSelf:'start'}}>
              <div className="sell__section" style={{border:'1px solid rgba(1,47,52,.2)', borderRadius:12, padding:12, background:'#fff', boxShadow:'0 2px 8px rgba(0,0,0,.04)'}}>
                <div style={{display:'flex', alignItems:'center', gap:8, marginTop:0, marginBottom:8}}>
                  <span style={{width:22, display:'inline-flex', alignItems:'center', justifyContent:'center', color:'#3a77ff'}}><i className="fa-solid fa-rectangle-list"></i></span>
                  <h4 style={{margin:0}}>Categories</h4>
                </div>
                <div style={{display:'flex', alignItems:'center', gap:8, margin:'8px 0'}}>
                  <input className="form__input" placeholder="Search categories" value={catQ||''} onChange={(e)=>setCatQ(e.target.value)} />
                </div>
                <div style={{maxHeight:300, overflow:'auto', borderRadius:8}}>
                  <ul style={{listStyle:'none', padding:0, margin:0}}>
                    <li style={{margin:'6px 0'}}>
                      <a href="/" onClick={(e)=>{ e.preventDefault(); router.push('/') }} style={{textDecoration:'none', display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:8, color:'rgba(0,47,52,.84)'}}>
                        <span style={{display:'inline-flex', alignItems:'center', justifyContent:'center', width:20}}><i className="fa-solid fa-layer-group" style={{color:'#012f34'}}></i></span>
                        <span>All categories</span>
                      </a>
                    </li>
                    {(() => {
                      const seen = new Set()
                      const list = []
                      for (const t of catTiles){
                        const key = String(t.label||t.k||'').toLowerCase()
                        if (seen.has(key)) continue
                        if (catQ && !key.includes(String(catQ||'').toLowerCase())) continue
                        seen.add(key)
                        list.push(t)
                      }
                      const tiles = catExpanded ? list : list.slice(0, 10)
                      return tiles.map(c => {
                        const s = String(c.k||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')
                        const active = isActiveSlug(slug, s)
                        return (
                          <li key={c.k} style={{margin:'2px 0'}}>
                            <a
                              href={'/category/'+s}
                              className={active ? 'active-category' : ''}
                              style={{textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 10px', borderRadius:8, background: active ? 'rgba(230,239,246,0.7)' : 'transparent', color: active ? '#012f34' : 'rgba(0,47,52,.84)'}}
                              onClick={(e)=>{ e.preventDefault(); try{ localStorage.setItem('selectedCategory', s) }catch(_){ } router.push('/category/'+s) }}
                              aria-current={active ? 'page' : undefined}
                            >
                              <span style={{display:'inline-flex', alignItems:'center', gap:8}}>
                                <span style={{width:20, display:'inline-flex', alignItems:'center', justifyContent:'center', color:'#012f34'}}><i className={"fa-solid "+(c.icon||'fa-tags')}></i></span>
                                {c.label}
                              </span>
                              <i className="fa-solid fa-chevron-right" style={{fontSize:10, color:'rgba(0,47,52,.64)'}}></i>
                            </a>
                          </li>
                        )
                      })
                    })()}
                  </ul>
                </div>
                {(() => {
                  const seen = new Set(catTiles.map(t=>String(t.label||t.k||'').toLowerCase()))
                  return (!catExpanded && seen.size>10) ? (
                    <div style={{marginTop:10}}>
                      <button className="load__more-btn" onClick={()=>setCatExpanded(true)}>View more</button>
                    </div>
                  ) : null
                })()}
              </div>
              <div className="filter__card" style={{marginTop:12}}>
                <div className="filter__header">
                  <div className="filter__title"><i className="fa-solid fa-location-dot"></i><h4 style={{margin:0}}>Location</h4></div>
                  <button className="filter__toggle" onClick={()=>setCountryOpen(v=>!v)} aria-expanded={countryOpen} style={{transform: countryOpen ? 'rotate(180deg)' : 'rotate(0deg)'}}><i className="fa-solid fa-chevron-down"></i></button>
                </div>
                <div className="filter__meta"><i className="fa-solid fa-location-dot"></i><span>Pakistan</span></div>
                {filterLocation && (
                  <div className="filter__chips">
                    <span className="chip"><i className="fa-solid fa-map-pin"></i><span>{filterLocation}</span></span>
                    <button className="filter__clear" onClick={()=>{ setFilterLocation(''); setDisplayCount(12) }}>Clear</button>
                  </div>
                )}
                {countryOpen && (
                <ul className="filter__list">
                  {[ 'Punjab','Sindh','Islamabad Capital Territory','Khyber Pakhtunkhwa','Balochistan','Azad Kashmir','Northern Areas' ].map(prov => (
                    <li key={prov}>
                      <a
                        href="#"
                        onClick={(e)=>{ e.preventDefault(); setFilterLocation(prov); setDisplayCount(12) }}
                        className={filterLocation===prov ? 'active' : ''}
                      >
                        <span className="label"><i className="fa-solid fa-circle"></i>{prov}</span>
                      </a>
                    </li>
                  ))}
                </ul>
                )}
              </div>
              <div className="sell__section" style={{border:'1px solid rgba(1,47,52,.2)', borderRadius:12, padding:12, marginTop:12, background:'#fff', boxShadow:'0 2px 8px rgba(0,0,0,.04)'}}>
                <h4 style={{marginTop:0}}>Price</h4>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
                  <div style={{position:'relative'}}>
                    <span aria-hidden="true" style={{position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'rgba(0,47,52,.64)'}}>Rs</span>
                    <input
                      className="form__input"
                      placeholder="Min"
                      inputMode="numeric"
                      aria-label="Minimum price"
                      value={priceMin}
                      onChange={e=>setPriceMin(e.target.value.replace(/[^0-9]/g,''))}
                      style={{paddingLeft:36}}
                    />
                  </div>
                  <div style={{position:'relative'}}>
                    <span aria-hidden="true" style={{position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'rgba(0,47,52,.64)'}}>Rs</span>
                    <input
                      className="form__input"
                      placeholder="Max"
                      inputMode="numeric"
                      aria-label="Maximum price"
                      value={priceMax}
                      onChange={e=>setPriceMax(e.target.value.replace(/[^0-9]/g,''))}
                      style={{paddingLeft:36}}
                    />
                  </div>
                </div>
                {priceInvalid ? (
                  <div role="alert" style={{marginTop:8, fontSize:12, color:'#b00020'}}>Max should be greater than Min</div>
                ) : null}
                <div style={{display:'flex', gap:8, marginTop:8}}>
                  <button
                    className="load__more-btn"
                    onClick={()=>{ setDisplayCount(12) }}
                    disabled={!canApply}
                    style={{opacity: canApply ? 1 : 0.6, cursor: canApply ? 'pointer' : 'not-allowed'}}
                  >
                    Apply
                  </button>
                  {(priceMin || priceMax) && (
                    <button className="login__btn" onClick={()=>{ setPriceMin(''); setPriceMax(''); setDisplayCount(12) }}>Clear</button>
                  )}
                </div>
              </div>
            </aside>
            <main>
          
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', margin:'8px 0'}}>
            <div style={{color:'rgba(0,47,52,.64)'}}>{products.length} results</div>
            <div style={{display:'flex', alignItems:'center', gap:12}}>
              <div style={{display:'inline-flex', alignItems:'center', gap:8}}>
                <span style={{fontWeight:600, color:'#012f34'}}>View</span>
                <button aria-label="List view" onClick={()=>setView('list')} style={{border:'none', background: view==='list' ? '#e6eff6' : 'transparent', borderRadius:'50%', width:28, height:28, display:'inline-flex', alignItems:'center', justifyContent:'center', color:'#012f34'}}>
                  <i className="fa-solid fa-bars"></i>
                </button>
                <button aria-label="Grid view" onClick={()=>setView('grid')} style={{border:'none', background: view==='grid' ? '#e6eff6' : 'transparent', borderRadius:'50%', width:28, height:28, display:'inline-flex', alignItems:'center', justifyContent:'center', color:'#012f34'}}>
                  <i className="fa-solid fa-table-cells"></i>
                </button>
                <span aria-hidden="true" style={{width:1, height:24, background:'rgba(1,47,52,.2)'}}></span>
              </div>
              <div style={{position:'relative', display:'inline-flex', alignItems:'center', gap:8}} ref={sortWrapRef}>
                <span style={{fontWeight:600, color:'#012f34'}}>Sort by:</span>
                <button ref={sortBtnRef} aria-haspopup="true" aria-expanded={sortOpen} onClick={()=>setSortOpen(v=>!v)} style={{border:'none', background:'transparent', color:'rgba(0,47,52,.84)', display:'inline-flex', alignItems:'center', gap:6, cursor:'pointer'}}>
                  <span>{sortKey==='newly_listed' ? 'Newly listed' : sortKey==='price_asc' ? 'Price: Low to High' : sortKey==='price_desc' ? 'Price: High to Low' : sortKey==='name_asc' ? 'Name: A–Z' : 'Name: Z–A'}</span>
                  <i className="fa-solid fa-chevron-down" aria-hidden="true"></i>
                </button>
                {sortOpen && (
                  <div ref={sortMenuRef} role="menu" style={{position:'absolute', top:'100%', right:0, background:'#fff', border:'1px solid rgba(1,47,52,.2)', borderRadius:8, boxShadow:'0 2px 10px rgba(0,0,0,.08)', minWidth:220, zIndex:10}}>
                    {[
                      {k:'newly_listed', label:'Newly listed'},
                      {k:'price_asc', label:'Price: Low to High'},
                      {k:'price_desc', label:'Price: High to Low'},
                      {k:'name_asc', label:'Name: A–Z'},
                      {k:'name_desc', label:'Name: Z–A'},
                    ].map(opt => (
                      <button key={opt.k} role="menuitem" onClick={()=>{ setSortKey(opt.k); setSortOpen(false); setDisplayCount(12) }} style={{display:'block', width:'100%', textAlign:'left', padding:'10px 12px', border:'none', background: sortKey===opt.k ? 'rgba(230,239,246,0.7)' : 'transparent', cursor:'pointer', color:'rgba(0,47,52,.84)'}}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {view==='list' ? (
          <div>
            {toShow.map((card, i) => (
              <article
                className="cat__list-article"
                key={i}
                onClick={() => productDetail(card)}
                aria-label={card.name}
                style={{
                  display:'grid',
                  gridTemplateColumns:'240px 1fr',
                  gap:16,
                  alignItems:'center',
                  background:'#fff',
                  border:'1px solid rgba(1,47,52,.16)',
                  borderRadius:12,
                  boxShadow:'0 2px 8px rgba(0,0,0,.04)',
                  padding:12,
                  margin:'12px 0',
                  cursor:'pointer'
                }}
              >
                <div style={{position:'relative', width:240, height:180}}>
                  <Image src={card.image} alt={card.name} width={240} height={180} loading="lazy" sizes="(max-width: 768px) 100vw, 240px" unoptimized style={{borderRadius:10, width:'100%', height:'100%', objectFit:'cover', display:'block'}} />
                  {(i % 10 === 0) && (
                    <span style={{position:'absolute', top:8, left:8, background:'#ffce32', color:'#012f34', fontWeight:700, borderRadius:6, padding:'4px 8px', fontSize:12}}>Featured</span>
                  )}
                </div>
                <div>
                  <a href={'/product/'+(card.slug || (slugify(card.name)+'-'+(parseInt(String(card.id||String((card.slug||'').split('-').pop()||'')),10)||'')))} onClick={(e)=>{ e.preventDefault(); productDetail(card) }} style={{textDecoration:'none'}}>
                    <h4 style={{margin:0, fontSize:16, color:'#012f34', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden'}}>{card.name}</h4>
                  </a>
                  <h2 aria-label={'Price ' + card.price} style={{margin:'6px 0', fontSize:18, color:'#012f34'}}>Rs {card.price}</h2>
                  <div style={{display:'flex', alignItems:'center', gap:8, color:'rgba(0,47,52,.72)'}}>
                    <i className="fa-solid fa-location-dot" aria-hidden="true"></i>
                    <span>{card.location}</span>
                    <span style={{margin:'0 4px'}}>•</span>
                    <span style={{whiteSpace:'nowrap'}}>{label}</span>
                  </div>
                  <div style={{display:'flex', gap:8, marginTop:10}}>
                    <button className="btn btn--secondary" onClick={(e)=>{ e.stopPropagation(); callSeller(card) }} style={{display:'inline-flex', alignItems:'center', gap:6}}><i className="fa-solid fa-phone" aria-hidden="true"></i><span>Call</span></button>
                    <button aria-label="WhatsApp" onClick={(e)=>{ e.stopPropagation(); openWhatsApp(card) }}
                      style={{
                        display:'inline-flex', alignItems:'center', gap:6,
                        padding:'8px 12px', border:'1px solid #25D366', borderRadius:8,
                        background:'#25D366', color:'#fff', cursor:'pointer'
                      }}
                      onMouseEnter={(e)=>{ e.currentTarget.style.opacity = '0.9' }}
                      onMouseLeave={(e)=>{ e.currentTarget.style.opacity = '1' }}
                    >
                      <i className="fa-brands fa-whatsapp" aria-hidden="true"></i>
                      <span>WhatsApp</span>
                    </button>
                  </div>
                </div>
                
              </article>
            ))}
            {loading && toShow.length===0 && (
              <div>
                {Array.from({length:6}).map((_,i)=>(
                  <div key={i} style={{display:'grid',gridTemplateColumns:'240px 1fr',gap:16,alignItems:'center',background:'#fff',border:'1px solid rgba(1,47,52,.12)',borderRadius:12,boxShadow:'0 2px 8px rgba(0,0,0,.03)',padding:12,margin:'12px 0'}}>
                    <div style={{width:240,height:180,background:'rgba(1,47,52,.08)',borderRadius:10}}></div>
                    <div>
                      <div style={{width:'60%',height:18,background:'rgba(1,47,52,.08)',borderRadius:6}}></div>
                      <div style={{width:'40%',height:16,background:'rgba(1,47,52,.08)',borderRadius:6,marginTop:8}}></div>
                      <div style={{width:'30%',height:16,background:'rgba(1,47,52,.08)',borderRadius:6,marginTop:8}}></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!loading && toShow.length === 0 && (
              <div style={{padding:'28px', textAlign:'center', color:'rgba(0,47,52,.72)', border:'1px solid rgba(1,47,52,.16)', borderRadius:12}}>
                <div style={{fontSize:40, color:'#012f34'}}><i className="fa-regular fa-circle-xmark"></i></div>
                <h3 style={{margin:'8px 0', fontWeight:600, color:'#012f34'}}>No posts found in {label}</h3>
                <p style={{margin:'8px 0'}}>Try adjusting filters or explore similar categories.</p>
                <div style={{marginTop:12}}>
                  <a href="/sell" className="login__btn">Post now</a>
                </div>
                <div style={{marginTop:16, display:'flex', flexWrap:'wrap', gap:10, justifyContent:'center'}}>
                  {catTiles.filter(t=>t.label!==label).slice(0,6).map(t=>{
                    const s = String(t.k||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')
                    return (
                      <a key={t.k} href={'/category/'+s} onClick={(e)=>{ e.preventDefault(); try{ localStorage.setItem('selectedCategory', s) }catch(_){ } router.push('/category/'+s) }} style={{textDecoration:'none', border:'1px solid rgba(1,47,52,.16)', borderRadius:9999, padding:'6px 10px', color:'rgba(0,47,52,.84)'}}>{t.label}</a>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
          ) : (
          <div className="cards__grid cat__grid" style={{gap:16}}>
            {toShow.map((card, i) => (
              <article key={i} className="card" onClick={() => productDetail(card)} aria-label={card.name} style={{background:'#fff', border:'1px solid rgba(1,47,52,.16)', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,.04)', cursor:'pointer'}}>
                <div className="img__featured" style={{overflow:'hidden', borderTopLeftRadius:12, borderTopRightRadius:12}}>
                  <Image src={card.image} alt={card.name} width={320} height={240} loading="lazy" sizes="(max-width: 768px) 100vw, 280px" unoptimized style={{objectFit:'cover'}} />
                </div>
                <div className="card__content" style={{padding:'10px 12px'}}>
                  <div className="card__content-gap">
                    <div className="name__heart">
                      <h4 style={{margin:0, fontSize:16, color:'#012f34', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden'}}>{card.name}</h4>
                      <i className="fa-solid fa-heart" aria-hidden="true"></i>
                    </div>
                    <h2 aria-label={'Price ' + card.price} style={{margin:'6px 0', fontSize:18, color:'#012f34'}}>Rs {card.price}</h2>
                  </div>
                  <h5 className="card__location" style={{color:'rgba(0,47,52,.72)'}}><i className="fa-solid fa-location-dot" aria-hidden="true"></i> {card.location}</h5>
                </div>
              </article>
            ))}
            {loading && toShow.length===0 && (
              <div className="cards__grid cat__grid" style={{gap:16}}>
                {Array.from({length:6}).map((_,i)=>(
                  <div key={i} className="card" style={{background:'#fff', border:'1px solid rgba(1,47,52,.12)', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,.03)'}}>
                    <div style={{height:240, background:'rgba(1,47,52,.08)', borderTopLeftRadius:12, borderTopRightRadius:12}}></div>
                    <div style={{padding:'10px 12px'}}>
                      <div style={{width:'60%',height:18,background:'rgba(1,47,52,.08)',borderRadius:6}}></div>
                      <div style={{width:'40%',height:16,background:'rgba(1,47,52,.08)',borderRadius:6,marginTop:8}}></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!loading && toShow.length === 0 && (
              <div style={{padding:'28px', textAlign:'center', color:'rgba(0,47,52,.72)', border:'1px solid rgba(1,47,52,.16)', borderRadius:12}}>
                <div style={{fontSize:40, color:'#012f34'}}><i className="fa-regular fa-circle-xmark"></i></div>
                <h3 style={{margin:'8px 0', fontWeight:600, color:'#012f34'}}>No posts found in {label}</h3>
                <p style={{margin:'8px 0'}}>Try adjusting filters or explore similar categories.</p>
                <div style={{marginTop:12}}>
                  <a href="/sell" className="login__btn">Post now</a>
                </div>
                <div style={{marginTop:16, display:'flex', flexWrap:'wrap', gap:10, justifyContent:'center'}}>
                  {catTiles.filter(t=>t.label!==label).slice(0,6).map(t=>{
                    const s = String(t.k||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')
                    return (
                      <a key={t.k} href={'/category/'+s} onClick={(e)=>{ e.preventDefault(); try{ localStorage.setItem('selectedCategory', s) }catch(_){ } router.push('/category/'+s) }} style={{textDecoration:'none', border:'1px solid rgba(1,47,52,.16)', borderRadius:9999, padding:'6px 10px', color:'rgba(0,47,52,.84)'}}>{t.label}</a>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
          )}
          <div className="load__more">
            {displayCount < products.length && (
              <button className="load__more-btn" onClick={() => setDisplayCount(displayCount + 12)}>Load More</button>
            )}
          </div>
            </main>
          </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  )
}