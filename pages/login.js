import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import Head from 'next/head'

export default function Login(){
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const facebookAppId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID
    
    // Load Google Identity Services
    if (clientId) {
      const googleScript = document.createElement('script')
      googleScript.src = 'https://accounts.google.com/gsi/client'
      googleScript.async = true
      googleScript.defer = true
      document.head.appendChild(googleScript)
      
      googleScript.onload = () => {
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
      
      googleScript.onerror = () => {
        console.error('Failed to load Google Identity Services script')
      }
    } else {
      const buttonContainer = document.getElementById('google-signin-button')
      if (buttonContainer) {
        buttonContainer.innerHTML = '<p style="color: red; font-size: 12px;">Google Sign-In is not configured.</p>'
      }
    }
    
    // Load Facebook SDK
    if (facebookAppId) {
      // Set up fbAsyncInit before loading the script
      window.fbAsyncInit = function() {
        if (window.FB) {
          try {
            window.FB.init({
              appId: facebookAppId,
              cookie: true,
              xfbml: true,
              version: 'v18.0'
            })
            console.log('Facebook SDK initialized successfully')
          } catch (e) {
            console.error('Error initializing Facebook SDK:', e)
          }
        }
      }
      
      // Load Facebook SDK script if not already loaded
      if (!document.getElementById('facebook-jssdk')) {
        const facebookScript = document.createElement('script')
        facebookScript.id = 'facebook-jssdk'
        facebookScript.src = 'https://connect.facebook.net/en_US/sdk.js'
        facebookScript.async = true
        facebookScript.defer = true
        facebookScript.onload = () => {
          console.log('Facebook SDK script loaded')
          // If fbAsyncInit hasn't been called yet, call it manually
          if (window.FB && typeof window.fbAsyncInit === 'function') {
            window.fbAsyncInit()
          }
        }
        facebookScript.onerror = () => {
          console.error('Failed to load Facebook SDK')
          const button = document.querySelector('.facebook-signin-button')
          if (button) {
            button.style.opacity = '0.5'
            button.style.cursor = 'not-allowed'
            button.title = 'Facebook SDK failed to load'
          }
        }
        document.head.appendChild(facebookScript)
      } else if (window.FB && facebookAppId) {
        // SDK already loaded, initialize it
        try {
          window.FB.init({
            appId: facebookAppId,
            cookie: true,
            xfbml: true,
            version: 'v18.0'
          })
          console.log('Facebook SDK initialized (already loaded)')
        } catch (e) {
          console.error('Error initializing already-loaded Facebook SDK:', e)
        }
      }
    } else {
      console.warn('Facebook App ID not found. Facebook sign-in will not work.')
      const button = document.querySelector('.facebook-signin-button')
      if (button) {
        button.style.opacity = '0.5'
        button.title = 'Facebook sign-in not configured'
      }
    }
    
    return () => {
      // Cleanup handled by browser
    }
  }, [])
  
  async function handleFacebookSignIn() {
    try {
      const facebookAppId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID
      if (!facebookAppId) {
        alert('Facebook sign-in is not configured. Please set NEXT_PUBLIC_FACEBOOK_APP_ID in your environment variables.')
        console.error('Facebook App ID not found in environment variables')
        return
      }
      
      // Wait for Facebook SDK to load
      let retries = 0
      const maxRetries = 10
      
      const waitForFB = () => {
        return new Promise((resolve, reject) => {
          const checkFB = () => {
            if (window.FB) {
              // Ensure FB is initialized
              try {
                window.FB.getLoginStatus((response) => {
                  // This will initialize FB if not already done
                  resolve(window.FB)
                })
              } catch (e) {
                // If getLoginStatus fails, try to init manually
                try {
                  window.FB.init({
                    appId: facebookAppId,
                    cookie: true,
                    xfbml: true,
                    version: 'v18.0'
                  })
                  resolve(window.FB)
                } catch (initError) {
                  if (retries < maxRetries) {
                    retries++
                    setTimeout(checkFB, 500)
                  } else {
                    reject(new Error('Facebook SDK failed to initialize'))
                  }
                }
              }
            } else {
              if (retries < maxRetries) {
                retries++
                setTimeout(checkFB, 500)
              } else {
                reject(new Error('Facebook SDK not loaded. Please refresh the page and try again.'))
              }
            }
          }
          checkFB()
        })
      }
      
      const fb = await waitForFB()
      
      // Initialize if not already done
      if (!fb.getAuthResponse) {
        try {
          fb.init({
            appId: facebookAppId,
            cookie: true,
            xfbml: true,
            version: 'v18.0'
          })
        } catch (initError) {
          console.error('Error initializing Facebook SDK:', initError)
          alert('Error initializing Facebook. Please refresh the page and try again.')
          return
        }
      }
      
      fb.login((response) => {
        // Handle Facebook login response (not async)
        if (response.error) {
          console.error('Facebook login error:', response.error)
          if (response.error.error_code === 190) {
            alert('Invalid Facebook App ID. Please check your configuration.')
          } else if (response.error.error_code === 200) {
            alert('Facebook login permission denied. Please grant the required permissions.')
          } else {
            alert(`Facebook login error: ${response.error.error_message || 'Please try again.'}`)
          }
          return
        }
        
        if (response.authResponse) {
          const accessToken = response.authResponse.accessToken
          
          if (!accessToken) {
            alert('No access token received from Facebook. Please try again.')
            return
          }
          
          // Process the login asynchronously
          (async () => {
            try {
              const res = await fetch('/api/v1/auth/facebook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accessToken })
              })
              
              const json = await res.json()
              
              if (!res.ok) {
                const errorMsg = json.error || 'Facebook sign-in failed'
                const details = json.details ? `\n\nDetails: ${json.details}` : ''
                alert(`${errorMsg}${details}`)
                console.error('Facebook sign-in error:', json)
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
              
              alert('You have successfully logged in with Facebook')
              router.push('/')
            } catch (e) {
              console.error('Network error during Facebook sign-in:', e)
              alert(`Network error during Facebook sign-in: ${e.message || 'Please check your internet connection and try again.'}`)
            }
          })()
        } else {
          console.log('Facebook login cancelled or no auth response:', response)
          if (response.status !== 'unknown') {
            alert('Facebook login was cancelled or failed. Please try again.')
          }
        }
      }, { scope: 'public_profile' })
    } catch (e) {
      console.error('Error initiating Facebook login:', e)
      alert(`Error connecting to Facebook: ${e.message || 'Please refresh the page and try again.'}`)
    }
  }
  
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
        
        {/* Social Sign-In Buttons */}
        <div style={{display:'flex', flexDirection:'column', gap:'12px', width:'80%', margin:'0 auto 20px'}}>
          {/* Google Sign-In Button */}
          <div id="google-signin-button" className="google-signin-container"></div>
          
          {/* Facebook Sign-In Button */}
          <button
            onClick={handleFacebookSignIn}
            type="button"
            className="facebook-signin-button"
            style={{
              width:'100%',
              height:'44px',
              borderRadius:'5px',
              border:'1px solid #1877f2',
              background:'#1877f2',
              color:'#fff',
              fontSize:'16px',
              fontWeight:'600',
              cursor:'pointer',
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
              gap:'10px',
              transition:'all 0.2s ease',
              boxShadow:'0 2px 4px rgba(0,0,0,.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#166fe5'
              e.currentTarget.style.borderColor = '#166fe5'
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,.15)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#1877f2'
              e.currentTarget.style.borderColor = '#1877f2'
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,.1)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <i className="fa-brands fa-facebook-f" style={{fontSize:'18px'}}></i>
            <span>Continue with Facebook</span>
          </button>
        </div>
        
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