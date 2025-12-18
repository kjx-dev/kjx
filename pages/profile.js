import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Header from '../components/Header'
import { FaSpinner } from 'react-icons/fa'

export default function Profile(){
  const router = useRouter()
  const [form, setForm] = useState({ name:'', email:'', phone:'', gender:'' })
  const [userId, setUserId] = useState(null)
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
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
    }catch(_){ }
    try{
      const checkMobile = () => setIsMobile(typeof window !== 'undefined' ? window.innerWidth <= 768 : false)
      checkMobile()
      window.addEventListener('resize', checkMobile)
      return () => window.removeEventListener('resize', checkMobile)
    }catch(_){ }
  }, [])
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
      setForm({ name: form.name||'', email: form.email||'', phone: form.phone||'', gender: form.gender||'' })
      setStatus('Profile saved')
      try{ if (typeof window !== 'undefined' && window.swal){ window.swal('Success','Profile saved successfully','success') } }catch(_){ }
      try{ router.replace(router.asPath+(router.asPath.includes('?')?'&':'?')+'v='+(Date.now()), undefined, { scroll:false }) }catch(_){ }
      setSaving(false)
    }catch(e){ setStatus('Failed to save'); setSaving(false) }
  }
  return (
    <>
      <Header />
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
      <div style={{display:'flex', justifyContent:'flex-start', marginTop:20}}>
        <button className="btn" onClick={saveProfile} disabled={saving} style={{minWidth:160}}>{saving ? (<><FaSpinner style={{animation:'spin 1s linear infinite', display:'inline-block'}} />&nbsp;Saving...</>) : 'Save Changes'}</button>
      </div>
      <div className="status__line" aria-live="polite" style={{marginTop:10}}>{status}</div>
    </div>
    </>
  )
}