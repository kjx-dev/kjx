import { getPrisma } from '../../../../db/client'
import { createHmac } from 'crypto'

function sign(payload){
  const secret = process.env.AUTH_SECRET || 'dev-secret'
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', secret).update(data).digest('hex')
  return `v1.${data}.${sig}`
}

async function verifyGoogleToken(idToken) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  
  if (!idToken) {
    console.error('No ID token provided')
    return null
  }
  
  try {
    // Verify using tokeninfo endpoint
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Token verification failed:', response.status, errorText)
      return null
    }
    
    const tokenInfo = await response.json()
    
    // Check for error in response
    if (tokenInfo.error) {
      console.error('Token info error:', tokenInfo.error, tokenInfo.error_description)
      return null
    }
    
    // Verify the token is from Google
    const validIssuers = ['https://accounts.google.com', 'accounts.google.com', 'https://accounts.google.com/']
    if (!validIssuers.includes(tokenInfo.iss)) {
      console.error('Invalid token issuer:', tokenInfo.iss)
      return null
    }
    
    // Verify client ID matches (if set)
    if (clientId && tokenInfo.aud && tokenInfo.aud !== clientId) {
      console.error('Client ID mismatch. Expected:', clientId, 'Got:', tokenInfo.aud)
      return null
    }
    
    // Verify expiration
    if (tokenInfo.exp) {
      const now = Date.now() / 1000
      if (now > tokenInfo.exp) {
        console.error('Token expired. Exp:', tokenInfo.exp, 'Now:', now)
        return null
      }
    }
    
    return tokenInfo
  } catch (e) {
    console.error('Token verification error:', e)
    return null
  }
}

export default async function handler(req, res){
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })
  
  const prisma = getPrisma()
  if (!prisma) return res.status(500).json({ error: 'Database not available' })
  
  const { credential } = req.body || {}
  if (!credential) return res.status(400).json({ error: 'Google credential required' })
  
  try{
    // Verify the Google token
    const googleUser = await verifyGoogleToken(credential)
    if (!googleUser) {
      console.error('Token verification failed for credential:', credential?.substring(0, 20) + '...')
      return res.status(401).json({ error: 'Invalid or expired Google token. Please try signing in again.' })
    }
    
    const { email, name, sub: googleId, picture } = googleUser
    
    if (!email) {
      console.error('No email in Google token:', googleUser)
      return res.status(400).json({ error: 'Email not provided by Google. Please ensure your Google account has an email address.' })
    }
    
    // Check if user exists
    let user = null
    try {
      user = await prisma.user.findUnique({ where: { email } })
    } catch (dbError) {
      console.error('Database error finding user:', dbError)
      return res.status(500).json({ error: 'Database error while checking user', details: String(dbError?.message || dbError) })
    }
    
    if (!user) {
      // Create new user with Google OAuth
      // Generate a unique username from email
      let baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') // Remove special characters
      
      // Ensure baseUsername is not empty and has at least 3 characters
      if (!baseUsername || baseUsername.length < 3) {
        baseUsername = `user${Date.now().toString().slice(-8)}`
      }
      
      // Ensure username doesn't exceed reasonable length (Prisma might have limits)
      if (baseUsername.length > 50) {
        baseUsername = baseUsername.substring(0, 50)
      }
      
      let username = baseUsername
      let counter = 1
      
      // Ensure username is unique
      try {
        while (await prisma.user.findUnique({ where: { username } })) {
          const suffix = counter.toString()
          const maxLength = 50 - suffix.length
          username = `${baseUsername.substring(0, maxLength)}${suffix}`
          counter++
          if (counter > 10000) { // Safety limit
            username = `user${Date.now()}${Math.floor(Math.random() * 10000)}`
            break
          }
        }
      } catch (usernameError) {
        console.error('Error checking username uniqueness:', usernameError)
        username = `user${Date.now()}${Math.floor(Math.random() * 10000)}`
      }
      
      // Final validation
      if (!username || username.trim().length === 0) {
        username = `user${Date.now()}${Math.floor(Math.random() * 10000)}`
      }
      
      // Ensure email is valid
      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Invalid email address from Google' })
      }
      
      try {
        // Prepare user data - only include fields that are needed
        const userData = {
          username: username.trim(),
          email: email.trim().toLowerCase(),
        }
        
        // Add optional fields only if they have values
        if (name && name.trim()) {
          userData.name = name.trim()
        }
        
        // Check if password_hash column allows NULL in database
        // If database still requires it, we'll use a placeholder that indicates OAuth user
        // Try to omit it first, but if that fails, we'll handle it in the catch block
        // For OAuth users, we use a special marker instead of null
        // This is a workaround until the database migration is applied
        userData.password_hash = 'OAUTH_USER_NO_PASSWORD'
        
        console.log('Attempting to create user with data:', { ...userData, password_hash: '[OAUTH_USER_NO_PASSWORD]' })
        
        user = await prisma.user.create({
          data: userData
        })
        console.log('Successfully created user:', user.user_id, user.email)
      } catch (createError) {
        console.error('Error creating user:', createError)
        console.error('Error code:', createError.code)
        console.error('Error message:', createError.message)
        console.error('Error meta:', createError.meta)
        console.error('Attempted data:', { username: username.trim(), email: email.trim().toLowerCase(), name })
        
        // Check if user was created by another request (race condition)
        if (createError.code === 'P2002') { // Unique constraint violation
          console.log('Unique constraint violation, checking if user exists...')
          user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } })
          if (!user) {
            // Try username instead
            user = await prisma.user.findUnique({ where: { username: username.trim() } })
          }
          if (user) {
            console.log('User found after constraint violation:', user.user_id)
          } else {
            return res.status(500).json({ 
              error: 'Failed to create user account - username or email already exists', 
              details: String(createError?.message || createError),
              code: createError.code,
              field: createError.meta?.target?.[0] || 'unknown'
            })
          }
        } else if (createError.code === 'P2003') {
          // Foreign key constraint failed
          return res.status(500).json({ 
            error: 'Database constraint error', 
            details: String(createError?.message || createError),
            code: createError.code
          })
        } else {
          // Return detailed error for debugging
          return res.status(500).json({ 
            error: 'Failed to create user account', 
            details: String(createError?.message || createError),
            code: createError.code || 'UNKNOWN',
            meta: createError.meta || null,
            hint: 'Check server logs for more details'
          })
        }
      }
    }
    
    // Generate JWT token
    const token = sign({ 
      sub: user.user_id, 
      email: user.email, 
      exp: Date.now() + 1000*60*60*12 
    })
    
    return res.status(200).json({ 
      token, 
      user: { 
        user_id: user.user_id, 
        username: user.username, 
        name: user.name || '', 
        phone: user.phone || '', 
        gender: user.gender || '', 
        email: user.email 
      } 
    })
  }catch(e){
    console.error('Google OAuth error:', e)
    console.error('Error stack:', e?.stack)
    return res.status(500).json({ 
      error: 'Google authentication failed', 
      details: String(e && e.message || e),
      type: e?.name || 'UnknownError'
    })
  }
}

