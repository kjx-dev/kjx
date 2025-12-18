import { useEffect, useState } from 'react'
import { computeStrength } from '../lib/passwordStrength'
import { useRouter } from 'next/router'
import Header from '../components/Header'

export default function ChangePassword(){
  const router = useRouter()
  const [auth, setAuth] = useState({ token:'', isAuthenticated:false, email:'', name:'' })
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [csrf, setCsrf] = useState('')
  const [strength, setStrength] = useState({ score:0, label:'Weak', color:'#b00020' })
  useEffect(() => {
    try{
      const email = localStorage.getItem('email') || ''
      const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
      const token = localStorage.getItem('auth_token') || ''
      const name = localStorage.getItem('name') || ''
      setAuth({ token, isAuthenticated, email, name })
      if (!isAuthenticated || !email){ router.push('/login') }
    }catch(_){ router.push('/login') }
    try{
      const existing = document.cookie.split(';').map(s=>s.trim()).find(s=>s.startsWith('csrf_token='))
      let tok = existing ? decodeURIComponent(existing.split('=')[1]) : ''
      if (!tok){ tok = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
        document.cookie = 'csrf_token='+encodeURIComponent(tok)+'; path=/; SameSite=Lax'
      }
      setCsrf(tok)
    }catch(_){ }
  }, [])
  useEffect(() => { setStrength(computeStrength(next)) }, [next])
  async function submit(){
    setStatus('')
    if (!current || !next || !confirm){ setStatus('All fields required'); return }
    if (next !== confirm){ setStatus('Passwords do not match'); return }
    if (strength.score < 5){ setStatus('Password must be 8+ chars and include upper, lower, digit, special'); return }
    setLoading(true)
    try{
      const res = await fetch('/api/v1/auth/change-password', { method:'POST', headers:{ 'Content-Type':'application/json', 'X-CSRF-Token': csrf, ...(auth.token?{ 'Authorization':'Bearer '+auth.token }:{} ) }, body: JSON.stringify({ current_password: current, new_password: next }) })
      const j = await res.json().catch(()=>null)
      if (res.status === 401){ setStatus('Session expired. Please login again'); setLoading(false); router.push('/login'); return }
      if (res.status === 429){ setStatus('Too many attempts. Please try later'); setLoading(false); return }
      if (!res.ok){ const msg = (j && (j.error||j.message)) || 'Failed'; setStatus(msg); setLoading(false); return }
      setStatus('Password changed')
      try{ if (typeof window !== 'undefined' && window.swal){ await window.swal('Success','Password changed','success') } }catch(_){ }
      setCurrent(''); setNext(''); setConfirm('')
      router.push('/profile')
    }catch(_){ setStatus('Network error'); setLoading(false) }
  }
  return (
    <>
      <Header />
    <div className="sell__main" style={{marginTop:20}}>
        <h1>Change Password</h1>
        </div>
      <div style={{maxWidth:560, margin:'16px auto', padding:'16px', border:'1px solid rgba(1,47,52,.2)', borderRadius:12, background:'#fff'}}>
        <div>
          <label style={{display:'block', marginBottom:6}}>Current password</label>
          <input type="password" value={current} onChange={e=>setCurrent(e.target.value)} style={{width:'100%', padding:'10px 12px', border:'1px solid rgba(1,47,52,.2)', borderRadius:8}} />
        </div>
        <div>
          <label style={{display:'block', marginBottom:6}}>New password</label>
          <input type="password" aria-describedby="pwStrength" value={next} onChange={e=>setNext(e.target.value)} style={{width:'100%', padding:'10px 12px', border:'1px solid rgba(1,47,52,.2)', borderRadius:8}} />
          <div id="pwStrength" role="status" aria-live="polite" style={{marginTop:6, display:'flex', alignItems:'center', gap:8}}>
            <div style={{height:8, flex:1, background:'rgba(0,47,52,.12)', borderRadius:4}}>
              <div style={{height:8, width: Math.min(100, strength.score*20)+'%', background: strength.color, borderRadius:4}}></div>
            </div>
            <span style={{color: strength.color, fontWeight:600}}>{strength.label}</span>
          </div>
        </div>
        <div>
          <label style={{display:'block', marginBottom:6}}>Confirm new password</label>
          <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} style={{width:'100%', padding:'10px 12px', border:'1px solid rgba(1,47,52,.2)', borderRadius:8}} />
        </div>
        <div style={{display:'flex', justifyContent:'space-between', marginTop:12}}>
          <button className="btn" onClick={()=>router.back()} aria-label="Cancel">Cancel</button>
          <button className="btn" onClick={submit} disabled={loading} style={{minWidth:160}}>{loading ? (<><i className="fa-solid fa-spinner fa-spin"></i>&nbsp;Saving...</>) : 'Change Password'}</button>
        </div>
        <div className="status__line" aria-live="polite" style={{marginTop:10}}>{status}</div>
      </div>
      
    </>
  )
}