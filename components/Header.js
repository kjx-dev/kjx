import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { FaSearch, FaUser, FaChevronDown, FaList, FaHeart, FaComment, FaKey, FaSignOutAlt, FaCar, FaHome, FaCog } from 'react-icons/fa'

export default function Header(){
  const router = useRouter()
  const [auth, setAuth] = useState({ email:'', isAuthenticated:false, name:'' })
  const [q, setQ] = useState('')
  const [headerCatOpen, setHeaderCatOpen] = useState(false)
  const [catTiles, setCatTiles] = useState([])
  const [menuOpen, setMenuOpen] = useState(false)
  const profileWrapRef = useRef(null)
  const profileBtnRef = useRef(null)
  const profileMenuRef = useRef(null)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [profileMenuPos, setProfileMenuPos] = useState({ top: 100, left: 16 })
  const catWrapRef = useRef(null)
  const catBtnRef = useRef(null)
  const catMenuRef = useRef(null)

  useEffect(() => {
    try{
      const email = localStorage.getItem('email') || ''
      const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
      const name = localStorage.getItem('name') || ''
      setAuth({ email, isAuthenticated, name })
    }catch(_){ }
    ;(async () => {
      try{
        const r = await fetch('/api/v1/category')
        const j = await r.json()
        const tiles = (j && j.data && j.data.tiles) ? j.data.tiles : []
        setCatTiles(Array.isArray(tiles) ? tiles : [])
      }catch(_){ setCatTiles([]) }
    })()
  }, [])
  useEffect(() => {
    function onKey(e){ if (e.key === 'Escape'){ setProfileMenuOpen(false); setHeaderCatOpen(false); setMenuOpen(false) } }
    function onOutside(e){
      if (profileWrapRef.current && !profileWrapRef.current.contains(e.target)) setProfileMenuOpen(false)
      if (catWrapRef.current && !catWrapRef.current.contains(e.target)) setHeaderCatOpen(false)
    }
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
  function sell(){ if (auth.email && auth.isAuthenticated) router.push('/sell'); else router.push('/login') }
  function manage(){ router.push('/manage') }
  function logout(){ try{ localStorage.removeItem('auth_token'); localStorage.removeItem('email'); localStorage.removeItem('username'); localStorage.removeItem('name'); localStorage.removeItem('phone'); localStorage.removeItem('gender'); localStorage.removeItem('isAuthenticated'); }catch(_){ } router.push('/login') }
  function onSearchChange(e){ setQ(e.target.value) }
  function clearSearch(){ setQ('') }
  function applySearch(val){ const s = String(val||'').trim(); if (!s) return; router.push('/?q='+encodeURIComponent(s)) }

  return (
    <div style={{width:'100%'}}>
      <div className="same__color">
        <div className="small__navbar">
          <div className="small__navbar_left">
          <div className="small__navbar_logo">
            <a href="/" onClick={(e)=>{ e.preventDefault(); router.push('/') }} style={{display:'inline-block', textDecoration:'none'}}>
              <svg height="20" viewBox="0 0 36.289 20.768" alt="Logo"><path d="M18.9 20.77V0h4.93v20.77zM0 10.39a8.56 8.56 0 1 1 8.56 8.56A8.56 8.56 0 0 1 0 10.4zm5.97-.01a2.6 2.6 0 1 0 2.6-2.6 2.6 2.6 0 0 0-2.6 2.6zm27 5.2l-1.88-1.87-1.87 1.88H25.9V12.3l1.9-1.9-1.9-1.89V5.18h3.27l1.92 1.92 1.93-1.92h3.27v3.33l-1.9 1.9 1.9 1.9v3.39h-3.27z"></path></svg>
            </a>
          </div>
          <div className="actions__links">
            <a href="/category/cars" onClick={(e)=>{ e.preventDefault(); router.push('/category/cars') }} aria-label="OMG Motors">
              <FaCar />
              <span>MOTORS</span>
            </a>
            <a href="/category/house" onClick={(e)=>{ e.preventDefault(); router.push('/category/house') }} className="ac22b0e1" aria-label="OMG Property">
              <FaHome />
              <span>PROPERTY</span>
            </a>
          </div></div>


 <div className="login__sell" id="login__sell">
          <div className="nav__icons">
            {auth.email && auth.isAuthenticated ? (
              <div className="profile__wrapper" ref={profileWrapRef}>
                <button ref={profileBtnRef} className="profile__toggle" aria-haspopup="true" aria-controls="profileMenu" aria-expanded={profileMenuOpen} onClick={toggleProfileMenu}>
                  <FaUser />
                  <FaChevronDown />
                </button>
                {profileMenuOpen && (
                  <div id="profileMenu" ref={profileMenuRef} className="profile__menu" style={{ position:'fixed', top: profileMenuPos.top, left: profileMenuPos.left }}>
                    <div className="header">
                      <FaUser style={{fontSize:22}} />
                      <div>
                        <h4 style={{fontWeight:500}}>{auth.name || 'My Profile'}</h4>
                        <a href="/profile" className="profile__link"><span>View Public Profile</span></a>
                      </div>
                    </div>
                    <div className="menu__item" onClick={manage}><FaList /><span>My Ads</span></div>
                    <div className="menu__item" onClick={()=>router.push('/favorites')}><FaHeart /><span>Favorites</span></div>
                    <div className="menu__item" onClick={()=>router.push('/chat')}><FaComment /><span>Chat</span></div>
                    <div className="menu__item" onClick={()=>router.push('/change-password')}><FaKey /><span>Change Password</span></div>
                    <div className="menu__item" onClick={()=>router.push('/admin')}><FaCog /><span>Admin</span></div>
                    <div className="menu__item" onClick={logout}><FaSignOutAlt /><span>Logout</span></div>
                  </div>
                )}
              </div>
            ) : (
              <button className="login__btn" onClick={() => router.push('/login')}>Login</button>
            )}
            <button onClick={sell} className="sell__btn">+ SELL</button>
          </div>
        </div>
          
        </div>
      </div>
      <div className={"second__navbar" + (menuOpen ? " open" : "") }>
        {/* <div className="second-navbar__logo">
          <a href="/">
            <svg viewBox="0 0 36.289 20.768" alt="Logo"><path d="M18.9 20.77V0h4.93v20.77zM0 10.39a8.56 8.56 0 1 1 8.56 8.56A8.56 8.56 0 0 1 0 10.4zm5.97-.01a2.6 2.6 0 1 0 2.6-2.6 2.6 2.6 0 0 0-2.6 2.6zm27 5.2l-1.88-1.87-1.87 1.88H25.9V12.3l1.9-1.9-1.9-1.89V5.18h3.27l1.92 1.92 1.93-1.92h3.27v3.33l-1.9 1.89 1.9 1.9v3.39h-3.27z"/></svg>
          </a>
        </div>
        <button className="hamburger" aria-label="Menu" onClick={()=>setMenuOpen(v=>!v)}>
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button> */}
        <div className="select_option">
          <FaSearch />
          <input type="text" placeholder="Pakistan" name="loc" autoComplete="off" spellCheck={false} />
        </div>
        <div className="search__bar" role="search">
          <input type="search" id="hdr-txt" aria-label="Search" placeholder="Find Cars, Mobile Phones and more..." value={q} onChange={onSearchChange} onKeyDown={(e)=>{ if(e.key==='Enter'){ applySearch(q) } }} name="search" autoComplete="nope" aria-autocomplete="none" spellCheck={false} inputMode="search" autoCorrect="off" autoCapitalize="none" />
          <button className="clear" aria-label="Clear search" onClick={clearSearch}>×</button>
          <button className="search__btn" aria-label="Submit search" onClick={()=>applySearch(q)}>
            <FaSearch />
            <span>Search</span>
          </button>
        </div>
       
        <div className="header__category-wrapper" ref={catWrapRef}>
          <button ref={catBtnRef} className="header__category-btn" aria-haspopup="true" aria-controls="hdrCatMenuHeader" aria-expanded={headerCatOpen} onClick={()=>setHeaderCatOpen(v=>!v)} onKeyDown={(e)=>{ if (e.key==='Enter' || e.key===' '){ e.preventDefault(); setHeaderCatOpen(true) } }}>
            <FaList />
            <span>Category</span>
            <FaChevronDown />
          </button>
          <div ref={catMenuRef} id="hdrCatMenuHeader" role="menu" className={"header__category-menu" + (headerCatOpen ? " open" : "")}> 
            {(() => {
              function slug(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'') }
              const variants = ['mobile-phones','cars','motercycles','motorcycles','house','property','property-for-sale','property-for-rent','land-plots','tv-video-audio','tablets','jobs','services','furniture']
              const picked = []
              for (const v of variants){
                const f = catTiles.find(t => slug(t.k)===v)
                if (f && !picked.find(p => slug(p.k)===slug(f.k))) picked.push(f)
              }
              const rest = catTiles.filter(t => !picked.find(p => slug(p.k)===slug(t.k)))
              const tiles = [...picked, ...rest].slice(0,12)
              return tiles.map(c => {
                  const s = String(c.k||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')
                  const displayLabel = c.shortLabel || c.label || c.k
                  return (
                    <a
                      role="menuitem"
                      tabIndex={headerCatOpen ? 0 : -1}
                      key={c.k}
                      href={'/category/' + s}
                      onClick={(e)=>{ e.preventDefault(); try{ localStorage.setItem('selectedCategory', s) }catch(_){ } setHeaderCatOpen(false); router.push('/category/'+s) }}
                      style={{whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'200px'}}
                    >
                      {displayLabel}
                    </a>
              )
              })
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}