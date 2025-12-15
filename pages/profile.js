import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { getHeaderState } from '../lib/headerAuth'
import Image from 'next/image'

export default function Profile(){
  const router = useRouter()
  const [form, setForm] = useState({ name:'', email:'', phone:'', gender:'' })
  const [userId, setUserId] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [hdrOpen, setHdrOpen] = useState(false)
  const hdrWrapRef = useRef(null)
  const hdrBtnRef = useRef(null)
  const hdrMenuRef = useRef(null)
  const [auth, setAuth] = useState({ email:'', isAuthenticated:false, name:'' })
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileWrapRef = useRef(null)
  const profileBtnRef = useRef(null)
  const profileMenuRef = useRef(null)
  const [profileMenuPos, setProfileMenuPos] = useState({ top: 100, left: 16 })
  const [categories, setCategories] = useState([])
  const [catTiles, setCatTiles] = useState([])
  const [catGroups, setCatGroups] = useState([])
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [allCatOpen, setAllCatOpen] = useState(false)
  const allCatWrapRef = useRef(null)
  const allCatBtnRef = useRef(null)
  const allCatMenuRef = useRef(null)
  function onPhoneChange(e){ let t = e.target.value || ''; t = t.replace(/[^\d+]/g,''); t = t.replace(/(?!^)\+/g,''); setForm(f=>({ ...f, phone: t })) }
  function isValidPhone(s){ try{ const raw = String(s||''); const digits = raw.replace(/\D/g,''); if (raw.startsWith('+')) return digits.startsWith('92') && digits.length===12; return digits.length===11 && digits.startsWith('03') }catch(_){ return false } }
  useEffect(() => {
    setForm({
      name: localStorage.getItem('name') || '',
      email: localStorage.getItem('email') || '',
      phone: localStorage.getItem('phone') || '',
      gender: localStorage.getItem('gender') || ''
    })
    try{
      const email = localStorage.getItem('email') || ''
      const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
      const name = localStorage.getItem('name') || ''
      setAuth({ email, isAuthenticated, name })
      const tok = localStorage.getItem('auth_token')||''
      const parts = String(tok||'').split('.')
      if (parts.length>=3){
        const data = parts[1]
        const pad = data.length%4===2 ? '==' : data.length%4===3 ? '=' : ''
        const norm = data.replace(/-/g,'+').replace(/_/g,'/') + pad
        const json = JSON.parse(atob(norm))
        if (json && json.sub) setUserId(json.sub)
      }
    }catch(_){ setAuth({ email:'', isAuthenticated:false, name:'' }) }
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
  function sell(){ if (auth.email && auth.isAuthenticated) router.push('/sell'); else router.push('/login') }
  function manage(){ router.push('/manage') }
  function logout(){ try{ localStorage.removeItem('auth_token'); localStorage.removeItem('email'); localStorage.removeItem('username'); localStorage.removeItem('name'); localStorage.removeItem('phone'); localStorage.removeItem('gender'); localStorage.removeItem('isAuthenticated'); }catch(_){ } router.replace('/') }
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
  function saveProfile(){
    try{
      setSaving(true)
      if (!isValidPhone(form.phone||'')){ setStatus('Invalid phone number'); try{ if (typeof window !== 'undefined' && window.swal){ window.swal('Invalid phone','Enter a valid Pakistani number','warning') } }catch(_){ } setSaving(false); return }
      if (userId){
        ;(async ()=>{
          try{
            const res = await fetch('/api/v1/users/'+encodeURIComponent(String(userId)), { method:'PATCH', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ name: form.name||'', email: form.email||'', phone: form.phone||'', gender: form.gender||'' }) })
            await res.json().catch(()=>null)
          }catch(_){ }
        })()
      }
      localStorage.setItem('name', form.name||'')
      localStorage.setItem('email', form.email||'')
      localStorage.setItem('phone', form.phone||'')
      localStorage.setItem('gender', form.gender||'')
      if (form.email) localStorage.setItem('isAuthenticated','true')
      setAuth({ email: form.email||'', isAuthenticated: !!form.email, name: form.name||'' })
      setForm({ name: form.name||'', email: form.email||'', phone: form.phone||'', gender: form.gender||'' })
      setStatus('Profile saved')
      try{ if (typeof window !== 'undefined' && window.swal){ window.swal('Success','Profile saved successfully','success') } }catch(_){ }
      try{ router.replace(router.asPath+(router.asPath.includes('?')?'&':'?')+'v='+(Date.now()), undefined, { scroll:false }) }catch(_){ }
      setSaving(false)
    }catch(e){ setStatus('Failed to save'); setSaving(false) }
  }
  const [q, setQ] = useState('')
  const searchTimerRef = useRef(null)
  function applySearch(val){
    const qq = String(val||'').toLowerCase()
    setStatus(qq ? ('Searching: '+val) : '')
    if (!qq) return
    if (qq.includes('motor') || qq.includes('bike') || qq.includes('moter')){ router.push('/motercycles'); return }
    if (qq.includes('property') || qq.includes('house') || qq.includes('land') || qq.includes('plot')){ router.push('/house'); return }
    router.push('/')
  }
  function clearSearch(){ setQ(''); applySearch('') }
  function onSearchChange(e){ const v = e.target.value||''; setQ(v); if (searchTimerRef.current){ clearTimeout(searchTimerRef.current) } searchTimerRef.current = setTimeout(()=>applySearch(v), 400) }
  useEffect(() => {
    async function loadCategories(){
      try{
        const res = await fetch('/api/v1/category')
        const data = await res.json()
        const payload = data.data || {}
        setCategories(payload.categories || [])
        setCatTiles(payload.tiles || [])
        try{ localStorage.setItem('categories_payload', JSON.stringify(payload)); localStorage.setItem('categories_updated_at', String(Date.now())) }catch(_){ }
        try{
          const rg = await fetch('/api/v1/categories')
          const dg = await rg.json()
          setCatGroups((dg && dg.data && dg.data.groups) || [])
        }catch(_){ setCatGroups([]) }
      }catch(e){ setCategories([]); setCatTiles([]); setCatGroups([]) }
    }
    loadCategories()
  }, [])
  useEffect(() => {
    if (catTiles.length) return
    if (!categories.length) return
    function shortLabel(n){
      const s = String(n||'').toLowerCase()
      if (s.includes('mobile') || s.includes('phone')) return 'Mobile'
      if (s.includes('tv')||s.includes('video')||s.includes('audio')) return 'TV'
      if (s.includes('motor')) return 'Bikes'
      if (s.includes('car')) return 'Cars'
      if (s.includes('house')||s.includes('property')) return 'Property'
      if (s.includes('land')||s.includes('plot')) return 'Land'
      if (s.includes('tablets')) return 'Tablets'
      return String(n||'')
    }
    setCatTiles(categories.map(n => ({ k:n, label: shortLabel(n), icon:'fa-tags' })))
  }, [categories, catTiles])
  useEffect(() => {
    function onKey(e){ if (e.key === 'Escape') setHdrOpen(false) }
    function onOutside(e){ if (!hdrWrapRef.current) return; if (!hdrWrapRef.current.contains(e.target)) setHdrOpen(false) }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onOutside)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onOutside)
    }
  }, [])
  useEffect(() => {
    function onStorage(e){
      try{
        if (e.key === 'categories_payload'){
          const cached = JSON.parse(e.newValue||'{}')
          setCategories(cached.categories || [])
          setCatTiles(cached.tiles || [])
          setStatus('Categories updated')
        }
      }catch(_){ }
    }
    window.addEventListener('storage', onStorage)
    return () => { window.removeEventListener('storage', onStorage) }
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
    if (hdrOpen) {
      const first = hdrMenuRef.current?.querySelector('a')
      if (first) first.focus()
      if (hdrBtnRef.current) hdrBtnRef.current.setAttribute('aria-expanded','true')
    } else {
      if (hdrBtnRef.current) hdrBtnRef.current.setAttribute('aria-expanded','false')
    }
  }, [hdrOpen])
  return (
    <>
      <div className="same__color">
        <div className="small__navbar">
          <div className="small__navbar_logo">
            <svg height="20" viewBox="0 0 36.289 20.768" alt="Logo"><path d="M18.9 20.77V0h4.93v20.77zM0 10.39a8.56 8.56 0 1 1 8.56 8.56A8.56 8.56 0 0 1 0 10.4zm5.97-.01a2.6 2.6 0 1 0 2.6-2.6 2.6 2.6 0 0 0-2.6 2.6zm27 5.2l-1.88-1.87-1.87 1.88H25.9V12.3l1.9-1.9-1.9-1.89V5.18h3.27l1.92 1.92 1.93-1.92h3.27v3.33l-1.9 1.9 1.9 1.9v3.27z"></path></svg>
          </div>
          <div className="actions__links" style={{display:'none'}}>
            <a href="https://www.olx.com.pk/motors/" aria-label="OMG Motors"></a>
              <svg xmlns="http://www.w3.org/2000/svg" width="88.9" height="33" alt="OLX Motors" className="_1a6eed8f"><defs><linearGradient id="a" x1=".5" x2=".5" y2="1" gradientUnits="objectBoundingBox"><stop offset="0" stopColor="#ddd"></stop><stop offset="1" stopColor="#fff"></stop></linearGradient></defs><path stroke="rgba(0,0,0,0)" d="M40 20.5h1v-6.2l3 6.2h.6l2.8-6.2v6.2h1v-8.3h-1L44.1 19l-3-6.8H40zm18.3-4.2A4.1 4.1 0 0 0 54 12a4.1 4.1 0 0 0-4.2 4.3 4.1 4.1 0 0 0 4.2 4.3 4.1 4.1 0 0 0 4.2-4.3zm-7.3 0a3 3 0 0 1 3-3.3 3 3 0 0 1 3.2 3.3 3 3 0 0 1-3 3.3 3 3 0 0 1-3.2-3.3zm8.2-3.3h2.3v7.5h1V13H65v-1h-5.7zm15 3.3A4.1 4.1 0 0 0 70 12a4.1 4.1 0 0 0-4.2 4.3 4.1 4.1 0 0 0 4.2 4.3 4.1 4.1 0 0 0 4.2-4.3zm-7.2 0a3 3 0 0 1 3-3.3 3 3 0 0 1 3 3.3 3 3 0 0 1-3 3.3 3 3 0 0 1-3-3.3zm13.2-1.7c0 1-.6 1.6-1.8 1.6h-1.6V13h1.6c1.2 0 1.8.6 1.8 1.6zM75.7 12v8.4h1V17H78l2 3.4h1.3l-2-3.5a2.4 2.4 0 0 0 2-2.4c0-1.4-1-2.5-3-2.5zm12.7 6c0-3-4.5-1.7-4.5-3.8 0-1 .7-1.4 1.6-1.4a1.5 1.5 0 0 1 1.6 1.2h1.2a2.5 2.5 0 0 0-2.7-2.1c-1.7 0-2.8 1-2.8 2.3 0 3 4.5 1.7 4.5 4 0 .7-.6 1.3-1.7 1.3a1.5 1.5 0 0 1-1.7-1.4h-1.2c0 1.4 1.3 2.4 3 2.4a2.5 2.5 0 0 0 2.7-2.4z"></path><path fill="url(#a)" d="M0 16.5a16.5 16.5 0 1 1 33 0 16.5 16.5 0 0 1-33 0z" opacity=".6"></path><path d="M24.7 13.5a1.1 1.1 0 0 0-1.4-.7l-.6.2-1-2.2-.4-.1a16 16 0 0 0-4.8-.7 12 12 0 0 0-4.3.7l-.3.1-1 2.3h-.5a1.1 1.1 0 0 0-.6 2v.2a4 4 0 0 0-.4 1.5v4a2.1 2.1 0 0 0 0 .6.7.7 0 0 0 .8.5h1.6a.7.7 0 0 0 .8-.5 2.1 2.1 0 0 0 0-.7v-.3a47.1 47.1 0 0 0 8.3 0v.3a2.1 2.1 0 0 0 0 .7.7.7 0 0 0 .8.5h1.6a.7.7 0 0 0 .7-.5 2.1 2.1 0 0 0 .1-.7v-4a3.7 3.7 0 0 0-.4-1.5V15h.3a1.1 1.1 0 0 0 .7-1.5zm-12.2-2.1a11.3 11.3 0 0 1 4-.6 15.2 15.2 0 0 1 4.6.6l.9 1.8a17.6 17.6 0 0 1-4.3.4H17a28.2 28.2 0 0 1-5.4-.3zm-.6 9.3a2.2 2.2 0 0 1 0 .4h-1.7a2.2 2.2 0 0 1 0-.4V20a1 1 0 0 0 .3 0l1.4.2v.4zm11.4 0a2.2 2.2 0 0 1 0 .4h-1.6a2.2 2.2 0 0 1 0-.4v-.4H23a1 1 0 0 0 .4-.2zm.5-6.5l-1.2.4.5 1a3 3 0 0 1 .3 1.2V18l-.1.7c0 .3-.2.7-.5.7-3 .3-4.5.5-6 .5s-3-.2-6.2-.5c-.2 0-.3-.3-.4-.6V18a17 17 0 0 1 0-1 3.2 3.2 0 0 1 .3-1.3l.5-1-1-.2a.3.3 0 0 1-.2-.4.3.3 0 0 1 .4-.3l1.1.4a23.6 23.6 0 0 0 5 .3h1.4a17.9 17.9 0 0 0 4.6-.5h.3l1-.4a.3.3 0 0 1 .4.3.3.3 0 0 1-.2.4z"></path><path d="M12 16a1.2 1.2 0 1 0 1.1 1.2A1.2 1.2 0 0 0 12 16zm0 1.6a.4.4 0 1 1 .3-.4.4.4 0 0 1-.4.4zm9.6-1.6a1.2 1.2 0 1 0 1.2 1.2 1.2 1.2 0 0 0-1.2-1.2zm0 1.6a.4.4 0 1 1 .5-.4.4.4 0 0 1-.5.4zm-7.8.2h6v.8h-6z"></path></svg>
          </div>
          <div className="actions__links">
            <a href="https://www.olx.com.pk/motors/" aria-label="OMG Motors">
              <svg xmlns="http://www.w3.org/2000/svg" width="88.9" height="33" alt="OLX Motors" className="_1a6eed8f"><defs><linearGradient id="a" x1=".5" x2=".5" y2="1" gradientUnits="objectBoundingBox"><stop offset="0" stopColor="#ddd"></stop><stop offset="1" stopColor="#fff"></stop></linearGradient></defs><path stroke="rgba(0,0,0,0)" d="M40 20.5h1v-6.2l3 6.2h.6l2.8-6.2v6.2h1v-8.3h-1L44.1 19l-3-6.8H40zm18.3-4.2A4.1 4.1 0 0 0 54 12a4.1 4.1 0 0 0-4.2 4.3 4.1 4.1 0 0 0 4.2 4.3 4.1 4.1 0 0 0 4.2-4.3zm-7.3 0a3 3 0 0 1 3-3.3 3 3 0 0 1 3.2 3.3 3 3 0 0 1-3 3.3 3 3 0 0 1-3.2-3.3zm8.2-3.3h2.3v7.5h1V13H65v-1h-5.7zm15 3.3A4.1 4.1 0 0 0 70 12a4.1 4.1 0 0 0-4.2 4.3 4.1 4.1 0 0 0 4.2 4.3 4.1 4.1 0 0 0 4.2-4.3zm-7.2 0a3 3 0 0 1 3-3.3 3 3 0 0 1 3 3.3 3 3 0 0 1-3 3.3 3 3 0 0 1-3-3.3zm13.2-1.7c0 1-.6 1.6-1.8 1.6h-1.6V13h1.6c1.2 0 1.8.6 1.8 1.6zM75.7 12v8.4h1V17H78l2 3.4h1.3l-2-3.5a2.4 2.4 0 0 0 2-2.4c0-1.4-1-2.5-3-2.5zm12.7 6c0-3-4.5-1.7-4.5-3.8 0-1 .7-1.4 1.6-1.4a1.5 1.5 0 0 1 1.6 1.2h1.2a2.5 2.5 0 0 0-2.7-2.1c-1.7 0-2.8 1-2.8 2.3 0 3 4.5 1.7 4.5 4 0 .7-.6 1.3-1.7 1.3a1.5 1.5 0 0 1-1.7-1.4h-1.2c0 1.4 1.3 2.4 3 2.4a2.5 2.5 0 0 0 2.7-2.4z"></path><path fill="url(#a)" d="M0 16.5a16.5 16.5 0 1 1 33 0 16.5 16.5 0 0 1-33 0z" opacity=".6"></path><path d="M24.7 13.5a1.1 1.1 0 0 0-1.4-.7l-.6.2-1-2.2-.4-.1a16 16 0 0 0-4.8-.7 12 12 0 0 0-4.3.7l-.3.1-1 2.3h-.5a1.1 1.1 0 0 0-.6 2v.2a4 4 0 0 0-.4 1.5v4a2.1 2.1 0 0 0 0 .6.7.7 0 0 0 .8.5h1.6a.7.7 0 0 0 .8-.5 2.1 2.1 0 0 0 0-.7v-.3a47.1 47.1 0 0 0 8.3 0v.3a2.1 2.1 0 0 0 0 .7.7.7 0 0 0 .8.5h1.6a.7.7 0 0 0 .7-.5 2.1 2.1 0 0 0 .1-.7v-4a3.7 3.7 0 0 0-.4-1.5V15h.3a1.1 1.1 0 0 0 .7-1.5zm-12.2-2.1a11.3 11.3 0 0 1 4-.6 15.2 15.2 0 0 1 4.6.6l.9 1.8a17.6 17.6 0 0 1-4.3.4H17a28.2 28.2 0 0 1-5.4-.3zm-.6 9.3a2.2 2.2 0 0 1 0 .4h-1.7a2.2 2.2 0 0 1 0-.4V20a1 1 0  0 0 .3 0l1.4.2v.4zm11.4 0a2.2 2.2 0  0 1 0 .4h-1.6a2.2 2.2 0 0 1 0-.4v-.4H23a1 1 0  0 0 .4-.2zm.5-6.5l-1.2.4.5 1a3 3 0 0 1 .3 1.2V18l-.1.7c0 .3-.2.7-.5.7-3 .3-4.5.5-6 .5s-3-.2-6.2-.5c-.2 0-.3-.3-.4-.6V18a17.5 17.5 0 0 0 8.8.3c.3 0 .7 0 .7-.7v-4a2.6 2.6 0 0 0-.3-1v-.3h.2z"></path></svg>
            </a>
            <a href="https://www.olx.com.pk/properties/" className="ac22b0e1" aria-label="OMG Property">
              <svg xmlns="http://www.w3.org/2000/svg" width="97.25" height="33" alt="OLX Property" className="_1a6eed8f"><defs><linearGradient id="b" x1=".5" x2=".5" y2="1" gradientUnits="objectBoundingBox"><stop offset="0" stopColor="#ddd"></stop><stop offset="1" stopColor="#fff"></stop></linearGradient></defs><path stroke="rgba(0,0,0,0)" d="M41.1 16.64v-3.07h1.6c1.25 0 1.78.58 1.78 1.55 0 .94-.53 1.52-1.78 1.52zm4.5-1.52c0-1.37-.93-2.45-2.9-2.45H40v8.36h1.1v-3.49h1.6c2.08 0 2.9-1.15 2.9-2.42zm5.82.01c0 .94-.54 1.6-1.77 1.6h-1.6v-3.16h1.6c1.25 0 1.77.61 1.77 1.57zm-4.47-2.46v8.36h1.1v-3.42h1.31l2 3.42h1.3l-2.1-3.5a2.36 2.36 0 0 0 2-2.4c0-1.36-.94-2.45-2.9-2.45zm15.3 4.18a4.12 4.12 0 0 0-4.2-4.28 4.13 4.13 0  0 0-4.2 4.28 4.13 4.13 0 0 0 4.2 4.27 4.12 4.12 0  0 0 4.2-4.27zm-7.3 0a3.05 3.05 0  0 1 3.1-3.33 3.05 3.05 0  0 1 3.07 3.33 3 3 0 0 1-3.08 3.32 3.06 3.06 0 0 1-3.09-3.32zm9.82-.2v-3.08h1.6c1.25 0 1.78.58 1.78 1.55 0 .94-.53 1.52-1.77 1.52zm4.5-1.53c0-1.36-.93-2.44-2.9-2.44h-2.7v8.35h1.1v-3.49h1.6c2.08 0 2.9-1.15 2.9-2.42zm5.85-2.46h-4.5v8.37h4.5v-.9h-3.4v-2.88h3.04v-.9h-3.04v-2.8h3.4zm6.14 2.48c0 .93-.54 1.6-1.78 1.6h-1.6v-3.17h1.6c1.25 0 1.78.61 1.78 1.57zm-4.48-2.47v8.36h1.1v-3.42h1.32l1.98 3.42h1.3l-2.1-3.5a2.36 2.36 0 0 0 2-2.4c0-1.36-.94-2.45-2.9-2.45zm6.78.9h2.29v7.46h1.1v-7.47h2.27v-.89h-5.66zm9.04 4.3v3.16h1.1v-3.15l2.72-5.2h-1.2l-2.07 4.23-2.07-4.24h-1.2z"></path><path fill="url(#b)" d="M0 16.5a16.5 16.5 0 1 1 33 0 16.5 16.5 0 0 1-33 0z" opacity=".57"></path><path d="M25.03 21.92v-9.35l-4.99-1.66v1.05l4 1.33v8.59h-5V7.85h-8.38v14.08h-.4v1h15.17v-1zm-6.98-11.68v11.68h-6.4V8.84h6.4z"></path><path d="M15.17 10.3h1.61v.8h-1.6zm-2.42 0h1.6v.8h-1.6zm2.42 1.6h1.61v.81h-1.6zm-2.42 0h1.6v.81h-1.6zm2.42 2.42h1.61v.81h-1.6zm-2.42 0h1.6v.81h-1.6zm2.42 1.62h1.61v.8h-1.6zm-2.42 0h1.6v.8h-1.6zm2.42 2.42h1.61v.8h-1.6zm-2.42 0h1.6v.8h-1.6zm8.87-4.04h.8v.81h-.8zm-1.62 0h.8v.81H20zm1.62 1.62h.8v.8h-.8zm-1.62 0h.8v.8H20zm1.62 2.42h.8v.8h-.8zm-1.62 0h.8v.8H20z"></path></svg>
            </a>
          </div>
        </div>
        <div className={"second__navbar" + (menuOpen ? " open" : "")}>
          <div className="second-navbar__logo">
            <a href="/">
              <svg viewBox="0 0 36.289 20.768" alt="Logo"><path d="M18.9 20.77V0h4.93v20.77zM0 10.39a8.56 8.56 0 1 1 8.56 8.56A8.56 8.56 0 0 1 0 10.4zm5.97-.01a2.6 2.6 0 1 0 2.6-2.6 2.6 2.6 0 0 0-2.6 2.6zm27 5.2l-1.88-1.87-1.87 1.88H25.9V12.3l1.9-1.9-1.9-1.89V5.18h3.27l1.92 1.92 1.93-1.92h3.27v3.33l-1.9 1.9 1.9 1.9v3.27z"></path></svg>
            </a>
          </div>
          {!isMobile && (
          <button className="hamburger" aria-label="Menu" onClick={()=>setMenuOpen(!menuOpen)}>
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </button>
          )}
          <div className="select_option">
            <i className="fa-solid fa-search"></i>
            <input type="text" placeholder="Jamshed Town, Karachi" />
          </div>
          
          <div className="search__bar" role="search">
            <input type="text" id="profile-txt" aria-label="Search" placeholder="Find Cars, Mobile Phones and more..." value={q} onChange={onSearchChange} onKeyDown={(e)=>{ if(e.key==='Enter'){ applySearch(q) } }} />
            <button className="clear" aria-label="Clear search" onClick={clearSearch}>×</button>
            <i className="fa-solid fa-search" aria-label="Submit search" onClick={()=>applySearch(q)}></i>
          </div>
          <div className="login__sell" id="login__sell">
            {isMobile ? (
              <div className="nav__mobile" style={{display:'flex', alignItems:'center', justifyContent:'center', position:'relative', width:'100%'}}>
                <button onClick={sell} className="sell__btn" style={{margin:'0 auto'}}>+ Sell</button>
                <button aria-label="Menu" className="mobile__menu" ref={profileBtnRef} onClick={toggleProfileMenu} style={{position:'absolute', right:16}}>
                  <i className="fa-solid fa-bars"></i>
                </button>
                {profileMenuOpen && (
                  <div id="profileMenu" ref={profileMenuRef} className="profile__menu" style={{ position:'fixed', top: profileMenuPos.top, left: profileMenuPos.left }}>
                    <div className="header">
                      <i className="fa-regular fa-user" style={{fontSize:22}}></i>
                      <div>
                        <h4 style={{fontWeight:500}}>{auth.name || 'My Profile'}</h4>
                        <a href="/profile" className="profile__link" style={{textDecoration:'none'}}>
                          <span>View Public Profile</span>
                        </a>
                      </div>
                    </div>
                    <div className="menu__item" onClick={manage}><i className="fa-solid fa-rectangle-list"></i><span>My Ads</span></div>
                    <div className="menu__item" onClick={()=>router.push('/favorites')}><i className="fa-regular fa-heart"></i><span>Favorites</span></div>
                    <div className="menu__item" onClick={()=>router.push('/chat')}><i className="fa-regular fa-message"></i><span>Chat</span></div>
                    <div className="menu__item" onClick={()=>router.push('/change-password')}><i className="fa-solid fa-key"></i><span>Change Password</span></div>
                    <div className="menu__item" onClick={logout}><i className="fa-solid fa-right-from-bracket"></i><span>Logout</span></div>
                  </div>
                )}
              </div>
            ) : (
              <div className="nav__icons">
                <div className="profile__wrapper" ref={profileWrapRef}>
                  <button ref={profileBtnRef} className="profile__toggle" aria-haspopup="true" aria-controls="profileMenu" aria-expanded={profileMenuOpen} onClick={toggleProfileMenu}>
                    <i className="fa-regular fa-user"></i>
                    <i className="fa-solid fa-chevron-down"></i>
                  </button>
                  {profileMenuOpen && (
                    <div id="profileMenu" ref={profileMenuRef} className="profile__menu" style={{ position:'fixed', top: profileMenuPos.top, left: profileMenuPos.left }}>
                      <div className="header">
                        <i className="fa-regular fa-user" style={{fontSize:22}}></i>
                        <div>
                          <h4 style={{fontWeight:500}}>{auth.name || 'My Profile'}</h4>
                          <a href="/profile" className="profile__link" style={{textDecoration:'none'}}>
                            <span>View Public Profile</span>
                          </a>
                        </div>
                      </div>
                    <div className="menu__item" onClick={manage}><i className="fa-solid fa-rectangle-list"></i><span>My Ads</span></div>
                    <div className="menu__item" onClick={()=>router.push('/favorites')}><i className="fa-regular fa-heart"></i><span>Favorites</span></div>
                    <div className="menu__item" onClick={()=>router.push('/chat')}><i className="fa-regular fa-message"></i><span>Chat</span></div>
                    <div className="menu__item" onClick={()=>router.push('/change-password')}><i className="fa-solid fa-key"></i><span>Change Password</span></div>
                      <div className="menu__item" onClick={logout}><i className="fa-solid fa-right-from-bracket"></i><span>Logout</span></div>
                    </div>
                  )}
                </div>
                <button onClick={sell} className="sell__btn">+ Sell</button>
                <div className="header__category-wrapper" ref={hdrWrapRef}>
                  <button ref={hdrBtnRef} className="header__category-btn" aria-haspopup="true" aria-controls="hdrCatMenu" aria-expanded={hdrOpen} onClick={()=>setHdrOpen(v=>!v)} onKeyDown={(e)=>{ if (e.key==='Enter' || e.key===' '){ e.preventDefault(); setHdrOpen(true) } }}>
                    <i className="fa-solid fa-list"></i>
                    <span>Category</span>
                    <i className="fa-solid fa-chevron-down"></i>
                  </button>
                  <div ref={hdrMenuRef} id="hdrCatMenu" role="menu" className={"header__category-menu" + (hdrOpen ? " open" : "")}>
                    {catTiles.slice(0,10).map(c => {
                      const s = String(c.k||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')
                      return (
                        <a role="menuitem" tabIndex={hdrOpen ? 0 : -1} key={c.k} href={'/category/' + s} onClick={()=>{ try{ localStorage.setItem('selectedCategory', s) }catch(_){ } setHdrOpen(false) }}>{c.label}</a>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="third__navbar" id="categories" ref={allCatWrapRef} style={{position:'relative'}}>
        <div className="select__itself"><a href="#" onClick={(e)=>{ e.preventDefault(); setAllCatOpen(v=>!v) }} ref={allCatBtnRef} aria-expanded={allCatOpen}>All Categories</a></div>
        <div className="links" id="links" style={{display:'flex', flexWrap:'wrap', gap:16}}>
          {(() => {
            const order = ['mobile-phones','cars','motercycles','house','tv-video-audio','tablets','land-plots','jobs','services','furniture']
            function slug(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'') }
            const tiles = order.map(sl => catTiles.find(t => slug(t.k)===sl)).filter(Boolean)
            return tiles.map(c => (
              <a key={c.k} href={'/category/' + slug(c.k)}>{c.label}</a>
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
    <div className="sell__main" style={{marginTop:20}}>
      <h1>Account Settings</h1>
    </div>
    <div style={{maxWidth:780, margin:'24px auto', padding:'16px', border:'1px solid rgba(1,47,52,.2)', borderRadius:12, background:'#fff'}}>
      <div style={{display:'flex', alignItems:'center', gap:8, flexWrap:'wrap'}}>
        <span style={{fontSize:18, fontWeight:600}}>{form.name || 'Your Name'}</span>
        {(form.email||'') ? (<span style={{opacity:.4}}>|</span>) : null}
        <span style={{color:'rgba(0,47,52,.64)'}}>{form.email || ''}</span>
      </div>
      <div style={{display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:16, marginTop:16}}>
        <div style={{gridColumn:'1 / -1'}}>
          <label style={{display:'block', marginBottom:6}}>Name</label>
          <input type="text" placeholder="Your name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} style={{width:'100%', padding:'10px 12px', border:'1px solid rgba(1,47,52,.2)', borderRadius:8}} />
        </div>
        <div>
          <label style={{display:'block', marginBottom:6}}>Email</label>
          <input type="email" placeholder="you@example.com" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} style={{width:'100%', padding:'10px 12px', border:'1px solid rgba(1,47,52,.2)', borderRadius:8}} />
        </div>
        <div>
          <label style={{display:'block', marginBottom:6}}>Phone</label>
          <input type="tel" placeholder="03XXXXXXXXX or +92XXXXXXXXXX" value={form.phone} onChange={onPhoneChange} style={{width:'100%', padding:'10px 12px', border:'1px solid rgba(1,47,52,.2)', borderRadius:8}} />
        </div>
        <div style={{gridColumn:'1 / -1'}}>
          <label style={{display:'block', marginBottom:6}}>Gender</label>
          <div style={{display:'flex', gap:16}}>
            <label style={{display:'inline-flex', alignItems:'center', gap:8, padding:'8px 10px', border:'1px solid rgba(1,47,52,.2)', borderRadius:8}}>
              <input type="radio" name="gender" value="male" checked={(form.gender||'').toLowerCase()==='male'} onChange={e=>setForm({...form, gender:'male'})} />
              <span>Male</span>
            </label>
            <label style={{display:'inline-flex', alignItems:'center', gap:8, padding:'8px 10px', border:'1px solid rgba(1,47,52,.2)', borderRadius:8}}>
              <input type="radio" name="gender" value="female" checked={(form.gender||'').toLowerCase()==='female'} onChange={e=>setForm({...form, gender:'female'})} />
              <span>Female</span>
            </label>
          </div>
        </div>
      </div>
      <div style={{display:'flex', justifyContent:'flex-end', marginTop:20}}>
        <button className="btn" onClick={saveProfile} disabled={saving} style={{minWidth:160}}>{saving ? (<><i className="fa-solid fa-spinner fa-spin"></i>&nbsp;Saving...</>) : 'Save Changes'}</button>
      </div>
      <div className="status__line" aria-live="polite" style={{marginTop:10}}>{status}</div>
    </div>
    </>
  )
}