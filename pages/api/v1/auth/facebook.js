import { getPrisma } from '../../../../db/client'
import { createHmac } from 'crypto'
import { logger } from '../../../../lib/logger'
import { setNoCacheHeaders } from '../../../../lib/api-helpers'

function sign(payload){
  const secret = process.env.AUTH_SECRET || 'dev-secret'
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', secret).update(data).digest('hex')
  return `v1.${data}.${sig}`
}

async function getOAuthSettings(prisma) {
  try {
    const settings = await prisma.$queryRawUnsafe(
      "SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('google_client_id', 'google_client_secret', 'facebook_app_id', 'facebook_app_secret')"
    )
    const settingsObj = {}
    if (Array.isArray(settings)) {
      settings.forEach(s => {
        settingsObj[s.setting_key] = s.setting_value
      })
    }
    return settingsObj
  } catch (e) {
    return {}
  }
}

async function verifyFacebookToken(accessToken, prisma) {
  // Get settings from database with fallback to environment variables
  const settings = prisma ? await getOAuthSettings(prisma) : {}
  const appId = settings.facebook_app_id || process.env.NEXT_PUBLIC_FACEBOOK_APP_ID
  const appSecret = settings.facebook_app_secret || process.env.FACEBOOK_APP_SECRET
  
  if (!accessToken) {
    logger.error('No access token provided')
    return null
  }
  
  try {
    // Verify the access token with Facebook
    // First get basic info with public_profile (always available, no email permission needed)
    const response = await fetch(`https://graph.facebook.com/me?fields=id,name,picture&access_token=${accessToken}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      logger.error('Facebook token verification failed:', response.status, errorText)
      return null
    }
    
    const userInfo = await response.json()
    
    // Check for error in response
    if (userInfo.error) {
      logger.error('Facebook API error:', userInfo.error)
      return null
    }
    
    // Verify the app ID matches (if set)
    if (appId && userInfo.id) {
      // Also verify the token is valid by checking app_id
      const debugResponse = await fetch(`https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${appId}|${appSecret}`)
      if (debugResponse.ok) {
        const debugInfo = await debugResponse.json()
        if (debugInfo.data && debugInfo.data.app_id !== appId) {
          logger.error('App ID mismatch. Expected:', appId, 'Got:', debugInfo.data.app_id)
          return null
        }
      }
    }
    
    return userInfo
  } catch (e) {
    logger.error('Facebook token verification error:', e)
    return null
  }
}

export default async function handler(req, res){
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })
  
  const prisma = getPrisma()
  if (!prisma) return res.status(500).json({ error: 'Database not available' })
  
  const { accessToken } = req.body || {}
  if (!accessToken) return res.status(400).json({ error: 'Facebook access token required' })
  
  try{
    // Verify the Facebook token
    const facebookUser = await verifyFacebookToken(accessToken, prisma)
    if (!facebookUser) {
      logger.error('Token verification failed for access token:', accessToken?.substring(0, 20) + '...')
      return res.status(401).json({ error: 'Invalid or expired Facebook token. Please try signing in again.' })
    }
    
    const { email, name, id: facebookId, picture } = facebookUser
    
    // Try to get email if not in initial response
    let userEmail = email
    if (!userEmail && accessToken) {
      try {
        // Try to get email with a separate API call - request it explicitly
        const emailResponse = await fetch(`https://graph.facebook.com/me?fields=email&access_token=${accessToken}`)
        if (emailResponse.ok) {
          const emailData = await emailResponse.json()
          if (emailData.email && !emailData.error) {
            userEmail = emailData.email
            logger.log('Email retrieved from separate API call')
          } else if (emailData.error) {
            logger.warn('Email permission error:', emailData.error)
            // Check if it's a permission issue
            if (emailData.error.code === 200 || emailData.error.type === 'OAuthException') {
              logger.warn('Email permission not granted by user')
            }
          }
        }
      } catch (e) {
        logger.warn('Could not fetch email separately:', e)
      }
    }
    
    // If still no email, create a fallback email using Facebook ID
    let finalEmail = userEmail
    if (!finalEmail) {
      logger.warn('No email available, creating fallback email from Facebook ID:', facebookId)
      // Create a temporary email using Facebook ID
      // This allows the user to sign in, but they should grant email permission
      finalEmail = `fb_${facebookId}@facebook.temp`
      
      // Return a warning but allow the sign-in to proceed
      logger.warn('Using fallback email. User should grant email permission for better experience.')
    }
    
    // Check if user exists
    let user = null
    try {
      user = await prisma.user.findUnique({ where: { email: finalEmail } })
    } catch (dbError) {
      logger.error('Database error finding user:', dbError)
      return res.status(500).json({ error: 'Database error while checking user', details: String(dbError?.message || dbError) })
    }
    
    if (!user) {
      // Create new user with Facebook OAuth
      // Generate a unique username from email or Facebook ID
      let baseUsername = ''
      if (finalEmail.includes('@facebook.temp')) {
        // Use Facebook ID for username if using fallback email
        baseUsername = `fbuser${facebookId}`.substring(0, 50)
      } else {
        baseUsername = finalEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') // Remove special characters
      }
      
      // Ensure baseUsername is not empty and has at least 3 characters
      if (!baseUsername || baseUsername.length < 3) {
        baseUsername = `user${Date.now().toString().slice(-8)}`
      }
      
      // Ensure username doesn't exceed reasonable length
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
        logger.error('Error checking username uniqueness:', usernameError)
        username = `user${Date.now()}${Math.floor(Math.random() * 10000)}`
      }
      
      // Final validation
      if (!username || username.trim().length === 0) {
        username = `user${Date.now()}${Math.floor(Math.random() * 10000)}`
      }
      
      // Ensure email is valid
      if (!finalEmail || !finalEmail.includes('@')) {
        return res.status(400).json({ error: 'Invalid email address from Facebook' })
      }
      
      try {
        // Prepare user data
        const userData = {
          username: username.trim(),
          email: finalEmail.trim().toLowerCase(),
        }
        
        // Add optional fields only if they have values
        if (name && name.trim()) {
          userData.name = name.trim()
        }
        
        // Use placeholder for OAuth users
        userData.password_hash = 'OAUTH_USER_NO_PASSWORD'
        
        logger.log('Attempting to create user with data:', { ...userData, password_hash: '[OAUTH_USER_NO_PASSWORD]' })
        
        user = await prisma.user.create({
          data: userData
        })
        logger.log('Successfully created user:', user.user_id, user.email)
      } catch (createError) {
        logger.error('Error creating user:', createError)
        logger.error('Error code:', createError.code)
        logger.error('Error message:', createError.message)
        logger.error('Error meta:', createError.meta)
        logger.error('Attempted data:', { username: username.trim(), email: email.trim().toLowerCase(), name })
        
        // Check if user was created by another request (race condition)
        if (createError.code === 'P2002') { // Unique constraint violation
          logger.log('Unique constraint violation, checking if user exists...')
          user = await prisma.user.findUnique({ where: { email: finalEmail.trim().toLowerCase() } })
          if (!user) {
            // Try username instead
            user = await prisma.user.findUnique({ where: { username: username.trim() } })
          }
          if (user) {
            logger.log('User found after constraint violation:', user.user_id)
          } else {
            return res.status(500).json({ 
              error: 'Failed to create user account - username or email already exists', 
              details: String(createError?.message || createError),
              code: createError.code,
              field: createError.meta?.target?.[0] || 'unknown'
            })
          }
        } else if (createError.code === 'P2003') {
          return res.status(500).json({ 
            error: 'Database constraint error', 
            details: String(createError?.message || createError),
            code: createError.code
          })
        } else {
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
    
    // Don't cache auth responses
    setNoCacheHeaders(res)
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
    logger.error('Facebook OAuth error:', e)
    logger.error('Error stack:', e?.stack)
    return res.status(500).json({ 
      error: 'Facebook authentication failed', 
      details: String(e && e.message || e),
      type: e?.name || 'UnknownError'
    })
  }
}

