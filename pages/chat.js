import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import Header from '../components/Header'

export default function Chat(){
  const router = useRouter()
  const [auth, setAuth] = useState({ email:'', isAuthenticated:false, name:'' })
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState('')
  const [conv, setConv] = useState([])
  const [filters, setFilters] = useState({ tab: 'all' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [composeText, setComposeText] = useState('')
  const [catTiles, setCatTiles] = useState([])
  const messagesRef = useRef(null)
  const wsRef = useRef(null)
  const [wsReady, setWsReady] = useState(false)
  const prevSelectedRef = useRef('')
  const joinedRef = useRef(new Set())
  const queueRef = useRef([])
  const selectedRef = useRef('')
  const seenRef = useRef(new Set())
  const [allCatOpen, setAllCatOpen] = useState(false)
  const allCatWrapRef = useRef(null)
  const allCatBtnRef = useRef(null)
  const allCatMenuRef = useRef(null)

  useEffect(() => {
    try{
      const email = localStorage.getItem('email') || ''
      const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
      const name = localStorage.getItem('name') || ''
      setAuth({ email, isAuthenticated, name })
      
    }catch(_){ router.push('/login') }
  }, [])
  useEffect(() => {
    function onKey(e){ if (e.key === 'Escape') setAllCatOpen(false) }
    function onOutside(e){ const el = allCatWrapRef.current; if (!el) return; if (!el.contains(e.target)) setAllCatOpen(false) }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onOutside)
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onOutside) }
  }, [])
  useEffect(() => {
    async function loadCategories(){
      try{
        const r = await fetch('/api/v1/category')
        const j = await r.json()
        const tiles = (j && j.data && j.data.tiles) ? j.data.tiles : []
        setCatTiles(Array.isArray(tiles) ? tiles : [])
      }catch(_){ setCatTiles([]) }
    }
    loadCategories()
  }, [])

  useEffect(() => {
    async function load(){
      try{
        const who = auth.email || auth.name
        if (!who){ setItems([]); setLoading(false); return }
        const r = await fetch('/api/v1/chat?participant=' + encodeURIComponent(who))
        const j = await r.json()
        const list = Array.isArray(j.data) ? j.data : []
        setItems(list)
        setLoading(false)
      }catch(e){ setError('Failed to load'); setLoading(false) }
    }
    load()
  }, [auth.email, auth.name])

  useEffect(() => {
    try{
      const host = (typeof window!=='undefined' && window.location && window.location.hostname) ? window.location.hostname : 'localhost'
      const proto = (typeof window!=='undefined' && window.location && window.location.protocol==='https:') ? 'wss' : 'ws'
      const wsUrl = `${proto}://${host}:3002`
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws
      ws.onopen = () => { setWsReady(true); try{ for (const m of queueRef.current){ ws.send(m) } queueRef.current = [] }catch(_){ } if (selected){ try{ if (!joinedRef.current.has(String(selected))){ ws.send(JSON.stringify({ type:'join', post_id: Number(selected) })); joinedRef.current.add(String(selected)) } }catch(_){ } } }
      ws.onmessage = (ev) => {
        let msg
        try{ msg = JSON.parse(ev.data) }catch(_){ return }
        if (msg.type === 'new_message' && msg.data){
          const row = { ...msg.data }
          if (row && row.post_id){ const t = grouped[String(row.post_id)]?.title || ''; if (t) row.title = t }
          try{
            const key = row.message_id ? ('id:'+row.message_id) : ('t:'+String(row.post_id||'')+':'+String(row.author||'')+':'+String(row.text||'')+':'+String(row.created_at||''))
            if (seenRef.current.has(key)) return
            seenRef.current.add(key)
          }catch(_){ }
          setItems(prev => [...prev, row])
          const sel = String(selectedRef.current||'')
          setConv(prev => (String(row.post_id||'')===sel ? [...prev, row] : prev))
          try{ const el = messagesRef.current; if (el){ el.scrollTop = el.scrollHeight } }catch(_){ }
        }
        if (msg.type === 'joined' && typeof msg.post_id !== 'undefined'){
          try{ joinedRef.current.add(String(msg.post_id)) }catch(_){ }
        }
        if (msg.type === 'left' && typeof msg.post_id !== 'undefined'){
          try{ joinedRef.current.delete(String(msg.post_id)) }catch(_){ }
        }
        if (msg.type === 'error'){
          try{ console.warn('chat-ws error:', msg.error) }catch(_){ }
        }
      }
      ws.onerror = () => { setWsReady(false) }
      ws.onclose = () => {
        setWsReady(false)
        try{
          setTimeout(() => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return
            try{
              const host2 = (typeof window!=='undefined' && window.location && window.location.hostname) ? window.location.hostname : 'localhost'
              const proto2 = (typeof window!=='undefined' && window.location && window.location.protocol==='https:') ? 'wss' : 'ws'
              const wsUrl2 = `${proto2}://${host2}:3002`
              const ws2 = new WebSocket(wsUrl2)
              wsRef.current = ws2
              ws2.onopen = () => { setWsReady(true); if (selected) try{ ws2.send(JSON.stringify({ type:'join', post_id: Number(selected) })) }catch(_){ } }
              ws2.onmessage = ws.onmessage
              ws2.onerror = () => { setWsReady(false) }
            }catch(_){ }
          }, 1500)
        }catch(_){ }
      }
    }catch(_){ setWsReady(false) }
    return () => { try{ wsRef.current && wsRef.current.close() }catch(_){ } }
  }, [])

  useEffect(() => {
    const id = setInterval(() => { try{ if (wsReady && wsRef.current && wsRef.current.readyState===WebSocket.OPEN){ wsRef.current.send(JSON.stringify({ type:'ping' })) } }catch(_){ } }, 25000)
    return () => clearInterval(id)
  }, [wsReady])


  const grouped = items.reduce((acc, m) => { const k = String(m.post_id||''); if (!acc[k]) acc[k] = { title: m.title||'', list: [] }; acc[k].list.push(m); return acc }, {})
  const keys = Object.keys(grouped)

  useEffect(() => {
    try{
      const qv = router.query.post_id || router.query.id
      const n = parseInt(String(qv||''),10)
      if (!Number.isNaN(n) && n>0){ const k = String(n); setSelected(k); markSeen(k) }
    }catch(_){ }
  }, [router.query.post_id, router.query.id])

  useEffect(() => {
    async function loadConv(){
      if (!selected){ setConv([]); return }
      selectedRef.current = String(selected)
      try{
        const payload = JSON.stringify({ type:'join', post_id: Number(selected) })
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && !joinedRef.current.has(String(selected))){ wsRef.current.send(payload) }
        else { queueRef.current.push(payload) }
      }catch(_){ }
      try{
        const prev = prevSelectedRef.current
        if (prev && prev !== selected){
          try{
            const payload2 = JSON.stringify({ type:'leave', post_id: Number(prev) })
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN){ wsRef.current.send(payload2) }
            else { queueRef.current.push(payload2) }
          }catch(_){ }
        }
        prevSelectedRef.current = selected
      }catch(_){ }
      try{
        const r = await fetch('/api/v1/chat?post_id=' + encodeURIComponent(selected))
        const j = await r.json()
        const list = Array.isArray(j.data) ? j.data : []
        setConv(list)
      }catch(_){
        const list = grouped[selected]?.list || []
        setConv(list)
      }
    }
    loadConv()
  }, [selected, wsReady])

  function lastMsg(k){ const list = grouped[k]?.list || []; const m = list[list.length-1]; return m ? m.text : '' }
  function parseTs(ts){
    try{
      if (typeof ts === 'number') return new Date(ts)
      const s = String(ts||'').trim()
      if (!s) return new Date()
      if (/^\d+$/.test(s)) return new Date(Number(s))
      let iso = s.replace(' ','T')
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(iso)) iso += 'Z'
      const d = new Date(iso)
      if (isNaN(d.getTime())) return new Date()
      return d
    }catch(_){ return new Date() }
  }
  function timeAgo(ts){ try{ const d = parseTs(ts); const diff = Math.max(0, Date.now() - d.getTime()); const s = Math.floor(diff/1000); const m = Math.floor(s/60); const h = Math.floor(m/60); const d2 = Math.floor(h/24); const w = Math.floor(d2/7); if (w>=1) return w===1?'1 week ago':(w+' weeks ago'); if (d2>=1) return d2===1?'1 day ago':(d2+' days ago'); if (h>=1) return h===1?'1 hour ago':(h+' hours ago'); if (m>=1) return m===1?'1 minute ago':(m+' minutes ago'); return 'Just now' }catch(_){ return '' } }
  function lastDate(k){ const list = grouped[k]?.list || []; const m = list[list.length-1]; try{ return m ? timeAgo(m.created_at) : '' }catch(_){ return '' } }
  function unreadCount(k){ try{ const ls = grouped[k]?.list || []; const key = 'chat:lastSeen:' + k; const t = Number(localStorage.getItem(key)||0); return ls.filter(m => new Date(m.created_at).getTime() > t).length }catch(_){ return 0 } }
  function markSeen(k){ try{ const key = 'chat:lastSeen:' + k; localStorage.setItem(key, String(Date.now())) }catch(_){ } }
  async function submitCompose(){
    try{
      const v = String(composeText||'').trim()
      if (!v || !selected) return
      const who = auth.name || auth.email || ''
      const res = await fetch('/api/v1/chat', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ post_id: Number(selected), author: who, text: v }) })
      const js = await res.json().catch(()=>null)
      if (js && js.data){
        const row = { ...js.data, title: grouped[selected]?.title||'' }
        setComposeText('')
        try{ const el = messagesRef.current; if (el){ setTimeout(()=>{ el.scrollTop = el.scrollHeight }, 50) } }catch(_){ }
        try{
          const payload = JSON.stringify({ type:'broadcast', post_id: Number(selected), author: who, text: v })
          if (wsReady && wsRef.current && wsRef.current.readyState===WebSocket.OPEN){ wsRef.current.send(payload) } else { queueRef.current.push(payload) }
        }catch(_){ }
        if (!wsReady || !wsRef.current || wsRef.current.readyState!==WebSocket.OPEN){
          try{ const key = row.message_id ? ('id:'+row.message_id) : ('t:'+String(row.post_id||'')+':'+String(row.author||'')+':'+String(row.text||'')+':'+String(row.created_at||'')); seenRef.current.add(key) }catch(_){ }
          setItems(prev => [...prev, row])
          setConv(prev => [...prev, row])
        }
      }
    }catch(_){ }
  }

  function authorLabel(m){
    const n = String(m.author_name||m.name||'').trim()
    if (n) return n
    const a = String(m.author||'').trim()
    if (!a) return 'User'
    if (a.includes('@')){ const p = a.split('@')[0]; return p || 'User' }
    return a
  }

  function isMine(m){
    const a = String(m.author||'').trim()
    const n = String(auth.name||'').trim()
    const e = String(auth.email||'').trim()
    const el = e.includes('@') ? e.split('@')[0] : e
    return !!a && (a===n || a===e || a===el)
  }

  function onComposeKeyDown(e){
    if (e.key === 'Enter' && !e.shiftKey){
      e.preventDefault()
      submitCompose()
    }
  }

  let content
  if (loading) {
    content = (<div>Loading messages...</div>)
  } else if (error) {
    content = (<div style={{color:'crimson'}}>{error}</div>)
  } else {
    content = (
      <div className="chat__layout">
        <div className="chat__sidebar">
          <div className="chat__filters">
            <div style={{fontWeight:700, color:'#012f34'}}>Quick Filters</div>
            <div style={{display:'flex', gap:8, marginTop:10}}>
              {['all','unread','important'].map(t => {
                const active = filters.tab===t
                return (
                  <button
                    key={t}
                    className={"chat__filter-btn" + (active ? " active" : "")}
                    onClick={()=>setFilters({ tab:t })}
                    aria-pressed={active}
                  >
                    {t==='all'?'All':(t==='unread'?'Unread Chats':'Important')}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="chat__list">
            {keys.length===0 && (<div>No conversations yet</div>)}
              {keys.filter(k => {
                if (filters.tab==='unread') return unreadCount(k)>0
                if (filters.tab==='important') {
                  try{ return (typeof window !== 'undefined' && typeof localStorage !== 'undefined') && localStorage.getItem('chat:star:'+k)==='1' }catch(_){ return false }
                }
                return true
              }).map(k => (
              <button
                key={k}
                onClick={()=>{ setSelected(k); markSeen(k) }}
                className={"chat__item" + (selected===k ? " chat__item--active" : "")}
              >
                <div className="chat__avatar"><i className="fa-regular fa-message"></i></div>
                <div>
                  <div className="chat__title">{grouped[k].title || ('Post #'+k)}</div>
                  <div className="chat__subtitle">{lastMsg(k)}</div>
                </div>
                <div className="chat__meta">
                  <div className="chat__subtitle">{lastDate(k)}</div>
                  <div className="chat__badge">{unreadCount(k) || ''}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="chat__content">
          {!selected ? (
            <div style={{display:'grid', height:'100%', placeItems:'center', color:'rgba(0,47,52,.64)'}}>Select a chat to view conversation</div>
          ) : (
            <>
              <div className="chat__header">
                <div style={{fontWeight:700, color:'#012f34'}}>{grouped[selected]?.title || ('Post #'+selected)}</div>
                <a href={'/product/'+encodeURIComponent(selected)} style={{textDecoration:'none'}}>Open Ad</a>
              </div>
              <div className="chat__messages" ref={messagesRef}>
                {conv.map((m,i)=> {
                  const prev = conv[i-1]
                  const cd = parseTs(m.created_at)
                  const pd = prev ? parseTs(prev.created_at) : null
                  const showDay = !pd || cd.toDateString() !== pd.toDateString()
                  return (
                    <>
                      {showDay && (<div className="chat__day"><span>{cd.toLocaleDateString()}</span></div>)}
                      <div key={i} className={"chat__message "+(isMine(m)?"chat__message--me":"chat__message--other")}> 
                        <div className="chat__message-row">
                          <div style={{color:'#012f34', fontWeight:600}}>{isMine(m)?'You':authorLabel(m)}</div>
                          <div className="chat__subtitle">{timeAgo(m.created_at)}</div>
                        </div>
                        <div style={{marginTop:6}}>{m.text}</div>
                        
                      </div>
                    </>
                  )
                })}
                {conv.length===0 && (<div style={{color:'rgba(0,47,52,.64)'}}>No messages</div>)}
              </div>
              <div className="chat__composer">
                <textarea rows={2} value={composeText} onChange={e=>setComposeText(e.target.value)} onKeyDown={onComposeKeyDown} placeholder="Type a message"></textarea>
                <button className="btn btn--secondary" onClick={submitCompose}>Send</button>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{width:'100%', padding:'0 16px'}}>
      <Header />

      <div className="third__navbar" ref={allCatWrapRef} style={{position:'relative'}}>
        <div className="select__itself"><a href="" onClick={(e)=>{ e.preventDefault(); setAllCatOpen(v=>!v) }} ref={allCatBtnRef} aria-expanded={allCatOpen}>All Categories</a></div>
        <div className="links" id="links" style={{display:'flex', flexWrap:'wrap', gap:16}}>
          {(() => {
            function slug(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'') }
            const variants = ['mobile-phones','cars','motercycles','motorcycles','house','property','property-for-sale','property-for-rent','tv-video-audio','tablets','land-plots','jobs','services','furniture']
            const picked = []
            for (const v of variants){
              const f = catTiles.find(t => slug(t.k)===v)
              if (f && !picked.find(p => slug(p.k)===slug(f.k))) picked.push(f)
            }
            return picked.map(c => (
              <a key={c.k} href={'/category/' + slug(c.k)}>{c.label}</a>
            ))
          })()}
        </div>
        {(() => {
          const seen = new Set()
          const base = []
          for (const t of catTiles){
            const key = String(t.label||t.k||'').toLowerCase()
            if (seen.has(key)) continue
            seen.add(key)
            base.push(t)
          }
          const cols = 4
          const per = Math.ceil(base.length/cols) || 1
          const chunks = Array.from({length:cols}, (_,i)=>base.slice(i*per,(i+1)*per))
          return (
            <div ref={allCatMenuRef} style={{display: allCatOpen ? 'block':'none', position:'absolute', zIndex:30, top:48, left:0, right:0, margin:'0 auto', maxWidth:1100, background:'#fff', border:'1px solid rgba(1,47,52,.2)', boxShadow:'0 6px 18px rgba(0,0,0,.08)', borderRadius:12}}>
              <div style={{maxHeight:360, overflow:'auto', padding:16}}>
                <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:24}}>
                  {chunks.map((list,ci)=> (
                    <div key={'col:'+ci}>
                      <ul style={{listStyle:'none', padding:0, margin:0}}>
                        {list.map(c=>{
                          const s = String(c.k||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')
                          return (
                            <li key={c.k} style={{margin:'6px 0'}}>
                              <a href={'/category/'+s} style={{textDecoration:'none', color:'rgba(0,47,52,.84)'}} onClick={(e)=>{ e.preventDefault(); setAllCatOpen(false); router.push('/category/'+s) }}>{c.label}</a>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })()}
      </div>

      <h1 style={{margin:'12px 0 16px', fontWeight:600}}>Inbox</h1>
      {(!auth.isAuthenticated || !auth.email) && (
        <div style={{margin:'8px 0 16px', color:'rgba(0,47,52,.64)'}}>Login to view your chats</div>
      )}
      {content}
    </div>
  )
}