import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Footer from '../components/Footer'
import Image from 'next/image'
import Header from '../components/Header'

function slugify(str){
  return String(str||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')
}

function categoryImage(cat){
  const s = String(cat||'').toLowerCase()
  if (s.includes('mobile')||s.includes('phone')) return 'https://picsum.photos/seed/phone/800/600'
  if (s.includes('car')) return 'https://picsum.photos/seed/car/800/600'
  if (s.includes('motor')) return 'https://picsum.photos/seed/motorcycle/800/600'
  if (s.includes('house')||s.includes('property')||s.includes('land')) return 'https://picsum.photos/seed/property/800/600'
  return 'https://picsum.photos/seed/product/800/600'
}

export default function SearchPage(){
  const router = useRouter()
  const searchQuery = String(router.query.q||'').trim()
  const locationQuery = String(router.query.location||'').trim()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [displayCount, setDisplayCount] = useState(12)
  const [sortKey, setSortKey] = useState('newly_listed')
  const [filterLocation, setFilterLocation] = useState(locationQuery)
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [view, setView] = useState('list')
  const [sortOpen, setSortOpen] = useState(false)
  const sortWrapRef = useRef(null)
  const sortBtnRef = useRef(null)
  const sortMenuRef = useRef(null)
  const [catTiles, setCatTiles] = useState([])
  const [catQ, setCatQ] = useState('')
  const [catExpanded, setCatExpanded] = useState(false)
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

  useEffect(() => {
    // Update filterLocation when location query param changes
    setFilterLocation(locationQuery)
  }, [locationQuery])

  useEffect(() => {
    async function loadCategories(){
      try{
        const res = await fetch('/api/v1/category')
        const data = await res.json()
        const payload = data.data || {}
        setCatTiles(payload.tiles || [])
      }catch(e){ setCatTiles([]) }
    }
    loadCategories()
  }, [])

  useEffect(() => {
    if (!searchQuery && !locationQuery) {
      setProducts([])
      setLoading(false)
      return
    }
    async function load(){
      setProducts([])
      setLoading(true)
      try{
        // Build API URL with search query and/or location
        const params = new URLSearchParams()
        if (searchQuery && locationQuery) {
          // If both are provided, combine them
          params.set('q', `${searchQuery} ${locationQuery}`.trim())
        } else if (locationQuery) {
          // If only location is provided, search by location
          params.set('q', locationQuery)
        } else if (searchQuery) {
          params.set('q', searchQuery)
        }
        params.set('limit', '100')
        const res = await fetch('/api/v1/posts?' + params.toString())
        const data = await res.json()
        const raw = Array.isArray(data.data) ? data.data : []
        const list = raw.map((p,i) => {
          const withImg = Array.isArray(p.images) && p.images.length ? { ...p, image: p.images[0].url } : p
          const needsReplace = !withImg.image || withImg.image === '/images/products/img1.jpg'
          const base = needsReplace ? { ...withImg, image: categoryImage(p.category?.name||'') } : withImg
          const id = base.post_id || base.id || (i+1)
          const slug = base.slug || (slugify(base.title || base.name)+'-'+id)
          return {
            id,
            slug,
            name: base.title || base.name || 'Item',
            description: base.content || base.description || '',
            image: base.image,
            price: base.price || '',
            location: base.location || '',
            profilePhone: base.profilePhone || '',
            category: (base.category && base.category.name) || '',
            status: base.status || 'active'
          }
        })
        const merged = list.filter(p => String(p.status||'active')==='active')
        setProducts(merged)
        setLoading(false)
      }catch(e){ setProducts([]); setLoading(false) }
    }
    load()
  }, [searchQuery, locationQuery])

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
      localStorage.setItem('category', p.category||'')
    }catch(e){}
    router.push(dest)
  }

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

  const locations = ['Karachi','Lahore','Islamabad','Rawalpindi','Peshawar','Quetta','Multan','Hyderabad','Faisalabad','Sialkot','Gujranwala']
  
  let filtered = [...products]
  
  if (filterLocation) {
    filtered = filtered.filter(p => String(p.location||'').toLowerCase().includes(String(filterLocation).toLowerCase()))
  }
  
  if (priceMin) {
    const min = Number(priceMin)
    if (!isNaN(min)) filtered = filtered.filter(p => {
      const price = Number(String(p.price||'0').replace(/[^0-9]/g,''))
      return !isNaN(price) && price >= min
    })
  }
  
  if (priceMax) {
    const max = Number(priceMax)
    if (!isNaN(max)) filtered = filtered.filter(p => {
      const price = Number(String(p.price||'0').replace(/[^0-9]/g,''))
      return !isNaN(price) && price <= max
    })
  }
  
  const sorted = [...filtered].sort((a, b) => {
    if (sortKey === 'newly_listed') {
      return 0 // Already sorted by created_at DESC from API
    } else if (sortKey === 'price_low_to_high') {
      const priceA = Number(String(a.price||'0').replace(/[^0-9]/g,'')) || 0
      const priceB = Number(String(b.price||'0').replace(/[^0-9]/g,'')) || 0
      return priceA - priceB
    } else if (sortKey === 'price_high_to_low') {
      const priceA = Number(String(a.price||'0').replace(/[^0-9]/g,'')) || 0
      const priceB = Number(String(b.price||'0').replace(/[^0-9]/g,'')) || 0
      return priceB - priceA
    }
    return 0
  })
  
  const toShow = sorted.slice(0, displayCount)

  return (
    <>
      <Head>
        <title>{searchQuery ? `Search results for "${searchQuery}"` : 'Search'} | KJX</title>
        <meta name="description" content={searchQuery ? `Search results for ${searchQuery}` : 'Search for products'} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Header />
      <div style={{minHeight:'100vh', display:'flex', flexDirection:'column'}}>
        <div style={{flex:1, width:'100%', maxWidth:'1400px', margin:'0 auto', padding:'20px 16px'}}>
          <div style={{display:'grid', gridTemplateColumns:'280px 1fr', gap:20, alignItems:'start'}}>
            <aside>
              <div className="sell__section" style={{border:'1px solid rgba(1,47,52,.2)', borderRadius:12, padding:20, background:'#fff', boxShadow:'0 2px 8px rgba(0,0,0,.04)', marginBottom:12}}>
                <h4 style={{margin:'0 0 16px 0', fontSize:18, fontWeight:600, color:'#012f34', letterSpacing:'-0.01em'}}>Categories</h4>
                <div style={{maxHeight:450, overflowY:'auto', overflowX:'hidden'}}>
                  <ul style={{listStyle:'none', padding:0, margin:0}}>
                    <li>
                      <a 
                        href="/" 
                        onClick={(e)=>{ e.preventDefault(); router.push('/') }} 
                        style={{
                          textDecoration:'none', 
                          display:'block', 
                          padding:'12px 0', 
                          color:'rgba(0,47,52,.84)',
                          fontSize:15,
                          fontWeight:400,
                          borderBottom:'1px solid rgba(1,47,52,.1)',
                          transition:'all 0.2s ease'
                        }}
                        onMouseEnter={(e)=>{ e.currentTarget.style.color = '#012f34'; e.currentTarget.style.paddingLeft = '4px' }}
                        onMouseLeave={(e)=>{ e.currentTarget.style.color = 'rgba(0,47,52,.84)'; e.currentTarget.style.paddingLeft = '0' }}
                      >
                        All categories
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
                      const tiles = catExpanded ? list : list.slice(0, 12)
                      return tiles.map(c => {
                        const s = String(c.k||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')
                        return (
                          <li key={c.k}>
                            <a
                              href={'/category/'+s}
                              style={{
                                textDecoration:'none', 
                                display:'block', 
                                padding:'12px 0', 
                                color:'rgba(0,47,52,.84)',
                                fontSize:15,
                                fontWeight:400,
                                borderBottom:'1px solid rgba(1,47,52,.1)',
                                transition:'all 0.2s ease'
                              }}
                              onClick={(e)=>{ e.preventDefault(); try{ localStorage.setItem('selectedCategory', s) }catch(_){ } router.push('/category/'+s) }}
                              onMouseEnter={(e)=>{ 
                                e.currentTarget.style.color = '#012f34'
                                e.currentTarget.style.paddingLeft = '4px'
                              }}
                              onMouseLeave={(e)=>{ 
                                e.currentTarget.style.color = 'rgba(0,47,52,.84)'
                                e.currentTarget.style.paddingLeft = '0'
                              }}
                            >
                              {c.label}
                            </a>
                          </li>
                        )
                      })
                    })()}
                  </ul>
                </div>
                {(() => {
                  const seen = new Set(catTiles.map(t=>String(t.label||t.k||'').toLowerCase()))
                  return (!catExpanded && seen.size>12) ? (
                    <div style={{marginTop:16, paddingTop:16, borderTop:'1px solid rgba(1,47,52,.1)'}}>
                      <a 
                        href="#" 
                        onClick={(e)=>{ e.preventDefault(); setCatExpanded(true) }}
                        style={{
                          textDecoration:'none',
                          color:'#3a77ff',
                          fontSize:14,
                          fontWeight:500,
                          display:'inline-block',
                          transition:'all 0.2s ease'
                        }}
                        onMouseEnter={(e)=>{ e.currentTarget.style.textDecoration = 'underline'; e.currentTarget.style.color = '#2d5cdd' }}
                        onMouseLeave={(e)=>{ e.currentTarget.style.textDecoration = 'none'; e.currentTarget.style.color = '#3a77ff' }}
                      >
                        View more
                      </a>
                    </div>
                  ) : null
                })()}
              </div>
              <div className="filter__card">
                <div className="filter__header">
                  <div className="filter__title"><i className="fa-solid fa-location-dot"></i><h4 style={{margin:0}}>Location</h4></div>
                  <button className="filter__toggle" onClick={()=>{}} aria-expanded={true} style={{transform: 'rotate(0deg)'}}><i className="fa-solid fa-chevron-down"></i></button>
                </div>
                <div className="filter__meta"><i className="fa-solid fa-location-dot"></i><span>Pakistan</span></div>
                {filterLocation && (
                  <div className="filter__chips">
                    <span className="chip"><i className="fa-solid fa-map-pin"></i><span>{filterLocation}</span></span>
                    <button className="filter__clear" onClick={()=>{ setFilterLocation(''); setDisplayCount(12) }}>Clear</button>
                  </div>
                )}
                <ul className="filter__list">
                  {locations.map(prov => (
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
                <div style={{color:'rgba(0,47,52,.64)'}}>
                  {searchQuery || locationQuery ? (
                    <h1 style={{margin:0, fontSize:24, color:'#012f34', fontWeight:600}}>
                      {searchQuery && locationQuery 
                        ? `Search results for "${searchQuery}" in ${locationQuery}`
                        : searchQuery 
                        ? `Search results for "${searchQuery}"`
                        : `Search results in ${locationQuery}`
                      }
                    </h1>
                  ) : (
                    <h1 style={{margin:0, fontSize:24, color:'#012f34', fontWeight:600}}>Search</h1>
                  )}
                  <p style={{margin:'4px 0 0', color:'rgba(0,47,52,.64)'}}>{filtered.length} {filtered.length === 1 ? 'result' : 'results'}</p>
                </div>
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
                    <button 
                      ref={sortBtnRef} 
                      onClick={()=>setSortOpen(v=>!v)} 
                      aria-expanded={sortOpen} 
                      style={{
                        border:'none', 
                        background: sortOpen ? '#f5f8fa' : 'transparent',
                        color:'#012f34', 
                        display:'inline-flex', 
                        alignItems:'center', 
                        gap:8, 
                        cursor:'pointer',
                        padding:'8px 12px',
                        borderRadius:8,
                        fontWeight:500,
                        fontSize:14,
                        transition:'all 0.2s ease'
                      }}
                      onMouseEnter={(e)=>{ if(!sortOpen) e.currentTarget.style.background = '#f5f8fa' }}
                      onMouseLeave={(e)=>{ if(!sortOpen) e.currentTarget.style.background = 'transparent' }}
                    >
                      <span>{sortKey === 'newly_listed' ? 'Newly Listed' : sortKey === 'price_low_to_high' ? 'Price: Low to High' : 'Price: High to Low'}</span>
                      <i className="fa-solid fa-chevron-down" style={{fontSize:11, transform: sortOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition:'transform 0.2s ease'}}></i>
                    </button>
                    {sortOpen && (
                      <div ref={sortMenuRef} style={{position:'absolute', top:'calc(100% + 4px)', right:0, background:'#fff', border:'1px solid rgba(1,47,52,.2)', borderRadius:8, boxShadow:'0 4px 12px rgba(0,0,0,.12)', zIndex:1000, minWidth:200, overflow:'hidden'}}>
                        {[
                          { key: 'newly_listed', label: 'Newly Listed' },
                          { key: 'price_low_to_high', label: 'Price: Low to High' },
                          { key: 'price_high_to_low', label: 'Price: High to Low' }
                        ].map(opt => (
                          <button
                            key={opt.key}
                            onClick={()=>{ setSortKey(opt.key); setSortOpen(false); setDisplayCount(12) }}
                            style={{
                              width:'100%', 
                              textAlign:'left', 
                              padding:'10px 16px', 
                              border:'none', 
                              background: sortKey===opt.key ? '#e6eff6' : 'transparent', 
                              color: sortKey===opt.key ? '#012f34' : 'rgba(0,47,52,.84)',
                              cursor:'pointer',
                              fontWeight: sortKey===opt.key ? 600 : 400,
                              fontSize:14,
                              transition:'all 0.15s ease'
                            }}
                            onMouseEnter={(e)=>{ if(sortKey!==opt.key) e.currentTarget.style.background = '#f5f8fa' }}
                            onMouseLeave={(e)=>{ if(sortKey!==opt.key) e.currentTarget.style.background = 'transparent' }}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {!searchQuery && !locationQuery ? (
                <div style={{padding:'40px', textAlign:'center', color:'rgba(0,47,52,.72)', border:'1px solid rgba(1,47,52,.16)', borderRadius:12, marginTop:20}}>
                  <div style={{fontSize:48, color:'#012f34', marginBottom:16}}><i className="fa-solid fa-search"></i></div>
                  <h3 style={{margin:'8px 0', fontWeight:600, color:'#012f34'}}>Enter a search term or location</h3>
                  <p style={{margin:'8px 0'}}>Use the search bar in the header to find products.</p>
                </div>
              ) : view==='list' ? (
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
                      </div>
                      <div>
                        <a href={'/product/'+(card.slug || (slugify(card.name)+'-'+(parseInt(String(card.id||String((card.slug||'').split('-').pop()||'')),10)||'')))} onClick={(e)=>{ e.preventDefault(); productDetail(card) }} style={{textDecoration:'none'}}>
                          <h4 style={{margin:0, fontSize:16, color:'#012f34', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden'}}>{card.name}</h4>
                        </a>
                        <h2 aria-label={'Price ' + card.price} style={{margin:'6px 0', fontSize:18, color:'#012f34'}}>Rs {card.price}</h2>
                        <div style={{display:'flex', alignItems:'center', gap:8, color:'rgba(0,47,52,.72)'}}>
                          <i className="fa-solid fa-location-dot" aria-hidden="true"></i>
                          <span>{card.location}</span>
                          {card.category && (
                            <>
                              <span style={{margin:'0 4px'}}>•</span>
                              <span style={{whiteSpace:'nowrap'}}>{card.category}</span>
                            </>
                          )}
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
                      <h3 style={{margin:'8px 0', fontWeight:600, color:'#012f34'}}>No results found for "{searchQuery}"</h3>
                      <p style={{margin:'8px 0'}}>Try different keywords or browse categories.</p>
                      <div style={{marginTop:12}}>
                        <a href="/sell" className="login__btn">Post now</a>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="cards__grid cat__grid" style={{gap:16}}>
                  {toShow.map((card, i) => (
                    <article key={i} className="card" onClick={() => productDetail(card)} aria-label={card.name} style={{background:'#fff', border:'1px solid rgba(1,47,52,.16)', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,.04)', cursor:'pointer'}}>
                      <div className="img__featured" style={{overflow:'hidden', borderTopLeftRadius:12, borderTopRightRadius:12, position:'relative', width:'100%', height:240}}>
                        <Image src={card.image} alt={card.name} fill loading="lazy" sizes="(max-width: 768px) 100vw, 280px" unoptimized style={{objectFit:'cover'}} />
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
                      <h3 style={{margin:'8px 0', fontWeight:600, color:'#012f34'}}>No results found for "{searchQuery}"</h3>
                      <p style={{margin:'8px 0'}}>Try different keywords or browse categories.</p>
                      <div style={{marginTop:12}}>
                        <a href="/sell" className="login__btn">Post now</a>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="load__more">
                {displayCount < sorted.length && (
                  <button className="load__more-btn" onClick={() => setDisplayCount(displayCount + 12)}>Load More</button>
                )}
              </div>
            </main>
          </div>
        </div>
        <Footer />
      </div>
    </>
  )
}
