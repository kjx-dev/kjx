import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import Head from 'next/head'

export default function Login(){
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    
    // Check if client ID is set
    if (!clientId) {
      console.error('Google Client ID is not set. Please add NEXT_PUBLIC_GOOGLE_CLIENT_ID to your .env.local file')
      const buttonContainer = document.getElementById('google-signin-button')
      if (buttonContainer) {
        buttonContainer.innerHTML = '<p style="color: red; font-size: 12px;">Google Sign-In is not configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env.local</p>'
      }
      return
    }
    
    // Load Google Identity Services
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    document.head.appendChild(script)
    
    script.onload = () => {
      if (window.google) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleSignIn,
          })
          
          window.google.accounts.id.renderButton(
            document.getElementById('google-signin-button'),
            {
              theme: 'outline',
              size: 'large',
              width: '100%',
              text: 'signin_with',
              locale: 'en'
            }
          )
        } catch (error) {
          console.error('Error initializing Google Sign-In:', error)
          const buttonContainer = document.getElementById('google-signin-button')
          if (buttonContainer) {
            buttonContainer.innerHTML = '<p style="color: red; font-size: 12px;">Error initializing Google Sign-In. Please check your configuration.</p>'
          }
        }
      }
    }
    
    script.onerror = () => {
      console.error('Failed to load Google Identity Services script')
      const buttonContainer = document.getElementById('google-signin-button')
      if (buttonContainer) {
        buttonContainer.innerHTML = '<p style="color: red; font-size: 12px;">Failed to load Google Sign-In. Please check your internet connection.</p>'
      }
    }
    
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [])
  
  async function handleGoogleSignIn(response) {
    try {
      if (!response || !response.credential) {
        alert('No credential received from Google. Please try again.')
        return
      }
      
      const res = await fetch('/api/v1/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential })
      })
      
      const json = await res.json()
      
      if (!res.ok) {
        const errorMsg = json.error || 'Google sign-in failed'
        const details = json.details ? `\n\nDetails: ${json.details}` : ''
        alert(`${errorMsg}${details}`)
        console.error('Google sign-in error:', json)
        return
      }
      
      if (!json.token || !json.user) {
        alert('Invalid response from server. Please try again.')
        console.error('Invalid response:', json)
        return
      }
      
      const { token, user } = json
      
      // Store authentication data
      try {
        localStorage.setItem('auth_token', token)
        localStorage.setItem('email', user.email)
        localStorage.setItem('username', user.username || '')
        localStorage.setItem('name', user.name || '')
        localStorage.setItem('phone', user.phone || '')
        localStorage.setItem('gender', user.gender || '')
        localStorage.setItem('isAuthenticated', 'true')
      } catch (storageError) {
        console.error('Error storing auth data:', storageError)
        alert('Error saving login information. Please try again.')
        return
      }
      
      alert('You have successfully logged in with Google')
      router.push('/')
    } catch (e) {
      console.error('Network error during Google sign-in:', e)
      alert(`Network error during Google sign-in: ${e.message || 'Please check your internet connection and try again.'}`)
    }
  }
  
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
    <>
      <Head>
        <script src="https://accounts.google.com/gsi/client" async defer></script>
      </Head>
      <div className="email_login" style={{margin:'40px auto', maxWidth: '400px'}}>
        <div className="icons_flex">
          <a href="/"><i className="fa-solid fa-arrow-left"></i></a>
        </div>
        <img src="/images/auth/email_login.svg" alt="" />
        <h2>Login</h2>
        
        {/* Google Sign-In Button */}
        <div id="google-signin-button" className="google-signin-container"></div>
        
        {/* Divider */}
        <div className="divider">
          <span>or</span>
        </div>
        
        <input 
          type="text" 
          id="emailLogin" 
          placeholder="Email or phone number" 
          value={email} 
          onChange={e=>setEmail(e.target.value)}
        />
        <input 
          type="password" 
          id="passwordLogin" 
          placeholder="Password" 
          value={password} 
          onChange={e=>setPassword(e.target.value)} 
        />
        <button className="next_button" onClick={login}>Login</button>
        <p>We won't reveal your email to anyone else nor use it to send you spam.</p>
        <a href="/register" className="login__btn">Create Account</a>
      </div>
    </>
  )
}