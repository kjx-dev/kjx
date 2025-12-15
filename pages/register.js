import { useRouter } from 'next/router'
import { useState } from 'react'

export default function Register(){
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  async function signUp(){
    setErrors({})
    if (!phone || !email || !password){ setErrors({ form: 'Please fill phone, email and password' }); return }
    try{
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, email, password })
      })
      const json = await res.json()
      if (!res.ok){
        if (json && json.field){ setErrors({ [json.field]: json.error }); return }
        setErrors({ form: json.error || 'Registration failed' });
        return
      }
      try{
        const loginRes = await fetch('/api/v1/auth/login', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ email, password }) })
        const loginJson = await loginRes.json()
        if (!loginRes.ok){ setErrors({ form: loginJson.error || 'Login failed' }); return }
        const { token, user } = loginJson
        localStorage.setItem('auth_token', token)
        localStorage.setItem('email', user.email)
        localStorage.setItem('username', user.username || '')
        localStorage.setItem('name', user.name || '')
        localStorage.setItem('phone', user.phone || '')
        localStorage.setItem('gender', user.gender || '')
        localStorage.setItem('isAuthenticated', 'true')
        router.push('/sell')
      }catch(e){ setErrors({ form: 'Network error during automatic login' }) }
    }catch(e){ setErrors({ form: 'Network error during registration' }) }
  }
  return (
    <div className="email_login" style={{margin:'40px auto'}}>
      <div className="icons_flex">
        <a href="/"><i className="fa-solid fa-arrow-left"></i></a>
      </div>
      <img src="/images/auth/email_login.svg" alt="" />
      <h2>Create Your Account</h2>
      <input type="text" id="signphone" placeholder="Phone Number" value={phone} onChange={e=>setPhone(e.target.value)} aria-invalid={!!errors.phone} />
      {errors.phone ? <div className="form__error" aria-live="polite">{errors.phone}</div> : null}
      <input type="text" id="signEmail" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} aria-invalid={!!errors.email} />
      {errors.email ? <div className="form__error" aria-live="polite">{errors.email}</div> : null}
      <input type="password" id="signPassword" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} aria-invalid={!!errors.form} />
      {errors.form ? <div className="form__error" aria-live="polite" role="alert">{errors.form}</div> : null}
      <button className="next_button" id="button" onClick={signUp}>Create an Account</button>
      <p>We won't reveal your phone number to anyone else nor use it to send you spam.</p>
      <a href="/login" className="login__btn">Already have an account? Login</a>
    </div>
  )
}