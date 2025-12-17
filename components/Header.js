import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { FaSearch, FaUser, FaChevronDown, FaList, FaHeart, FaComment, FaKey, FaSignOutAlt } from 'react-icons/fa'

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
          <div className="small__navbar_logo">
            <svg height="20" viewBox="0 0 36.289 20.768" alt="Logo"><path d="M18.9 20.77V0h4.93v20.77zM0 10.39a8.56 8.56 0 1 1 8.56 8.56A8.56 8.56 0 0 1 0 10.4zm5.97-.01a2.6 2.6 0 1 0 2.6-2.6 2.6 2.6 0 0 0-2.6 2.6zm27 5.2l-1.88-1.87-1.87 1.88H25.9V12.3l1.9-1.9-1.9-1.89V5.18h3.27l1.92 1.92 1.93-1.92h3.27v3.33l-1.9 1.9 1.9 1.9v3.39h-3.27z"></path></svg>
          </div>
          <div className="actions__links">
            <a href="https://www.olx.com.pk/motors/" aria-label="OMG Motors">
              <svg xmlns="http://www.w3.org/2000/svg" width="88.9" height="33" alt="OLX Motors" className="_1a6eed8f"><defs><linearGradient id="a" x1=".5" x2=".5" y2="1" gradientUnits="objectBoundingBox"><stop offset="0" stopColor="#ddd"></stop><stop offset="1" stopColor="#fff"></stop></linearGradient></defs><path stroke="rgba(0,0,0,0)" d="M40 20.5h1v-6.2l3 6.2h.6l2.8-6.2v6.2h1v-8.3h-1L44.1 19l-3-6.8H40zm18.3-4.2A4.1 4.1 0 0 0 54 12a4.1 4.1 0 0 0-4.2 4.3 4.1 4.1 0 0 0 4.2 4.3 4.1 4.1 0 0 0 4.2-4.3zm-7.3 0a3 3 0 0 1 3-3.3 3 3 0 0 1 3.2 3.3 3 3 0 0 1-3 3.3 3 3 0 0 1-3.2-3.3zm8.2-3.3h2.3v7.5h1V13H65v-1h-5.7zm15 3.3A4.1 4.1 0 0 0 70 12a4.1 4.1 0 0 0-4.2 4.3 4.1 4.1 0 0 0 4.2 4.3 4.1 4.1 0 0 0 4.2-4.3zm-7.2 0a3 3 0 0 1 3-3.3 3 3 0 0 1 3 3.3 3 3 0 0 1-3 3.3 3 3 0 0 1-3-3.3zm13.2-1.7c0 1-.6 1.6-1.8 1.6h-1.6V13h1.6c1.2 0 1.8.6 1.8 1.6zM75.7 12v8.4h1V17H78l2 3.4h1.3l-2-3.5a2.4 2.4 0 0 0 2-2.4c0-1.4-1-2.5-3-2.5zm12.7 6c0-3-4.5-1.7-4.5-3.8 0-1 .7-1.4 1.6-1.4a1.5 1.5 0 0 1 1.6 1.2h1.2a2.5 2.5 0 0 0-2.7-2.1c-1.7 0-2.8 1-2.8 2.3 0 3 4.5 1.7 4.5 4 0 .7-.6 1.3-1.7 1.3a1.5 1.5 0 0 1-1.7-1.4h-1.2c0 1.4 1.3 2.4 3 2.4a2.5 2.5 0 0 0 2.7-2.4z"></path><path fill="url(#a)" d="M0 16.5a16.5 16.5 0 1 1 33 0 16.5 16.5 0 0 1-33 0z" opacity=".6"></path><path d="M24.7 13.5a1.1 1.1 0 0 0-1.4-.7l-.6.2-1-2.2-.4-.1a16 16 0 0 0-4.8-.7 12 12 0 0 0-4.3.7l-.3.1-1 2.3h-.5a1.1 1.1 0  0 0-.6 2v.2a4 4 0 0 0-.4 1.5v4a2.1 2.1 0 0 0 0 .6.7.7 0 0 0 .8.5h1.6a.7.7 0 0 0 .8-.5 2.1 2.1 0 0 0 0-.7v-.3a47.1 47.1 0 0 0 8.3 0v.3a2.1 2.1 0 0 0 0 .7.7.7 0 0 0 .8.5h1.6a.7.7 0 0 0 .7-.5 2.1 2.1 0 0 0 .1-.7v-4a3.7 3.7 0 0 0-.4-1.5V15h.3a1.1 1.1 0 0 0 .7-1.5zm-12.2-2.1a11.3 11.3 0 0 1 4-.6 15.2 15.2 0  0 1 4.6.6l.9 1.8a17.6 17.6 0 0 1-4.3.4H17a28.2 28.2 0  0 1-5.4-.3zm-.6 9.3a2.2 2.2 0 0 1 0 .4h-1.7a2.2 2.2 0  0 1 0-.4V20a1 1 0  0 0 .3 0l1.4.2v.4zm11.4 0a2.2 2.2 0 0 1 0 .4h-1.6a2.2 2.2 0 0 1 0-.4v-.4H23a1 1 0  0 0 .4-.2zm.5-6.5l-1.2.4.5 1a3 3 0  0 1 .3 1.2V18l-.1.7c0 .3-.2.7-.5.7-3 .3-4.5.5-6 .5s-3-.2-6.2-.5c-.2 0-.3-.3-.4-.6V18a17 17 0  0 1 0-1 3.2 3.2 0  0 1 .3-1.3l.5-1-1-.2a.3.3 0  0 1-.2-.4.3.3 0  0 1 .4-.3l1.1.4a23.6 23.6 0  0 0 5 .3h1.4a17.9 17.9 0  0 0 4.6-.5h.3l1-.4a.3.3 0  0 1 .4.3.3.3 0  0 1-.2.4z"></path></svg>
            </a>
            <a href="https://www.olx.com.pk/properties/" className="ac22b0e1" aria-label="OMG Property">
              <svg xmlns="http://www.w3.org/2000/svg" width="97.25" height="33" alt="OLX Property" className="_1a6eed8f"><defs><linearGradient id="b" x1=".5" x2=".5" y2="1" gradientUnits="objectBoundingBox"><stop offset="0" stopColor="#ddd"></stop><stop offset="1" stopColor="#fff"></stop></linearGradient></defs><path stroke="rgba(0,0,0,0)" d="M41.1 16.64v-3.07h1.6c1.25 0 1.78.58 1.78 1.55 0 .94-.53 1.52-1.78 1.52zm4.5-1.52c0-1.37-.93-2.45-2.9-2.45H40v8.36h1.1v-3.49h1.6c2.08 0 2.9-1.15 2.9-2.42zm5.82.01c0 .94-.54 1.6-1.77 1.6h-1.6v-3.16h1.6c1.25 0 1.77.61 1.77 1.57zm-4.47-2.46v8.36h1.1v-3.42h1.31l2 3.42h1.3l-2.1-3.5a2.36 2.36 0  0 0 2-2.4c0-1.36-.94-2.45-2.9-2.45zm15.3 4.18a4.12 4.12 0  0 0-4.2-4.28 4.13 4.13 0  0 0-4.2 4.28 4.13 4.13 0  0 0 4.2 4.27 4.12 4.12 0  0 0 4.2-4.27zm-7.3 0a3.05 3.05 0  0 1 3.1-3.33 3.05 3.05 0  0 1 3.07 3.33 3 3 0  0 1-3.08 3.32 3.06 3.06 0  0 1-3.09-3.32zm9.82-.2v-3.08h1.6c1.25 0 1.78.58 1.78 1.55 0 .94-.53 1.52-1.77 1.52zm4.5-1.53c0-1.36-.93-2.44-2.9-2.44h-2.7v8.35h1.1v-3.49h1.6c2.08 0 2.9-1.15 2.9-2.42zm5.85-2.46h-4.5v8.37h4.5v-.9h-3.4v-2.88h3.04v-.9h-3.04v-2.8h3.4zm6.14 2.48c0 .93-.54 1.6-1.78 1.6h-1.6v-3.17h1.6c1.25 0 1.78.61 1.78 1.57zm-4.48-2.47v8.36h1.1v-3.42h1.32l1.98 3.42h1.3l-2.1-3.5a2.36 2.36 0  0 0 2-2.4c0-1.36-.94-2.45-2.9-2.45zm6.78.9h2.29v7.46h1.1v-7.47h2.27v-.89h-5.66zm9.04 4.3v3.16h1.1v-3.15l2.72-5.2h-1.2l-2.07 4.23-2.07-4.24h-1.2z"></path><path fill="url(#b)" d="M0 16.5a16.5 16.5 0  1 1 33 0 16.5 16.5 0  0 1-33 0z" opacity=".57"></path><path d="M25.03 21.92v-9.35l-4.99-1.66v1.05l4 1.33v8.59h-5V7.85h-8.38v14.08h-.4v1h15.17v-1zm-6.98-11.68v11.68h-6.4V8.84h6.4z"></path><path d="M15.17 10.3h1.61v.8h-1.6zm-2.42 0h1.6v.8h-1.6zm2.42 1.6h1.61v.81h-1.6zm-2.42 0h1.6v.81h-1.6zm2.42 2.42h1.61v.81h-1.6zm-2.42 0h1.6v.81h-1.6zm2.42 1.62h1.61v.8h-1.6zm-2.42 0h1.6v.8h-1.6zm2.42 2.42h1.61v.8h-1.6zm-2.42 0h1.6v.8h-1.6zm8.87-4.04h.8v.81h-.8zm-1.62 0h.8v.81H20zm1.62 1.62h.8v.8h-.8zm-1.62 0h.8v.8H20zm1.62 2.42h.8v.8h-.8zm-1.62 0h.8v.8H20z"></path></svg>
            </a>
          </div>
        </div>
      </div>
      <div className={"second__navbar" + (menuOpen ? " open" : "") }>
        <div className="second-navbar__logo">
          <a href="/">
            <svg viewBox="0 0 36.289 20.768" alt="Logo"><path d="M18.9 20.77V0h4.93v20.77zM0 10.39a8.56 8.56 0 1 1 8.56 8.56A8.56 8.56 0 0 1 0 10.4zm5.97-.01a2.6 2.6 0 1 0 2.6-2.6 2.6 2.6 0 0 0-2.6 2.6zm27 5.2l-1.88-1.87-1.87 1.88H25.9V12.3l1.9-1.9-1.9-1.89V5.18h3.27l1.92 1.92 1.93-1.92h3.27v3.33l-1.9 1.89 1.9 1.9v3.39h-3.27z"/></svg>
          </a>
        </div>
        <button className="hamburger" aria-label="Menu" onClick={()=>setMenuOpen(v=>!v)}>
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>
        <div className="select_option">
          <FaSearch />
          <input type="text" placeholder="Pakistan" name="loc" autoComplete="off" spellCheck={false} />
        </div>
        <div className="search__bar" role="search">
          <input type="search" id="hdr-txt" aria-label="Search" placeholder="Find Cars, Mobile Phones and more..." value={q} onChange={onSearchChange} onKeyDown={(e)=>{ if(e.key==='Enter'){ applySearch(q) } }} name="search" autoComplete="nope" aria-autocomplete="none" spellCheck={false} inputMode="search" autoCorrect="off" autoCapitalize="none" />
          <button className="clear" aria-label="Clear search" onClick={clearSearch}>×</button>
          <FaSearch aria-label="Submit search" onClick={()=>applySearch(q)} style={{cursor:'pointer'}} />
        </div>
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
                    <div className="menu__item" onClick={logout}><FaSignOutAlt /><span>Logout</span></div>
                  </div>
                )}
              </div>
            ) : (
              <button className="login__btn" onClick={() => router.push('/login')}>Login</button>
            )}
            <button onClick={sell} className="sell__btn">+ Sell</button>
          </div>
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