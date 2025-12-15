import { useRouter } from 'next/router'
import { useState } from 'react'

export default function Login(){
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  async function login(){
    if (!email || !password){ alert('Enter email and password'); return }
    try{
      const res = await fetch('/api/v1/auth/login', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ email, password }) })
      const json = await res.json()
      if (!res.ok){ alert(json.error || 'Login failed'); return }
      const { token, user } = json
      localStorage.setItem('auth_token', token)
      localStorage.setItem('email', user.email)
      localStorage.setItem('username', user.username || '')
      localStorage.setItem('name', user.name || '')
      localStorage.setItem('phone', user.phone || '')
      localStorage.setItem('gender', user.gender || '')
      localStorage.setItem('isAuthenticated', 'true')
      alert('You have successfully Login')
      router.push('/')
    }catch(e){ alert('Network error during login') }
  }
  return (
    <div className="email_login" style={{margin:'40px auto'}}>
      <div className="icons_flex">
        <a href="/"><i className="fa-solid fa-arrow-left"></i></a>
      </div>
      <img src="/images/auth/email_login.svg" alt="" />
      <h2>Login</h2>
      <input type="text" id="emailLogin" placeholder="Email or phone number" value={email} onChange={e=>setEmail(e.target.value)} />
      <input type="password" id="passwordLogin" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
      <button className="next_button" onClick={login}>Login</button>
      <p>We won't reveal your email to anyone else nor use it to send you spam.</p>
      <a href="/register" className="login__btn">Create Account</a>
    </div>
  )
}