import { useRouter } from 'next/router'
import { useState } from 'react'

export default function ForgotPassword(){
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  function generateToken(){
    const users = JSON.parse(localStorage.getItem('users')) || []
    const user = users.find(u=>u.email===email)
    if (!user) { setMessage('No account found for this email'); return }
    const token = Math.random().toString(36).slice(2,8)+Math.random().toString(36).slice(2,8)
    const expiry = Date.now() + 10*60*1000
    localStorage.setItem('reset:'+email, JSON.stringify({ token, expiry }))
    setMessage('Reset token generated. Use it within 10 minutes: '+token)
  }
  function gotoChange(){ router.push('/change-password?email='+encodeURIComponent(email)) }
  return (
    <div className="email_login" style={{margin:'40px auto'}}>
      <div className="icons_flex">
        <a href="/"><i className="fa-solid fa-arrow-left"></i></a>
      </div>
      <img src="/images/auth/email_login.svg" alt="" />
      <h2>Forgot Password</h2>
      <input type="text" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <button className="next_button" onClick={generateToken}>Generate Reset Token</button>
      <button className="next_button" onClick={gotoChange}>Go to Change Password</button>
      {message && (<p>{message}</p>)}
    </div>
  )
}