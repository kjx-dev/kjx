import { getPrisma } from '../../../../db/client'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' })
    return
  }
  
  try {
    const prisma = getPrisma()
    if (!prisma) {
      // Fallback to environment variables if database is not available
      return res.status(200).json({
        google_client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
        facebook_app_id: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || ''
      })
    }
    
    // Try to get settings from database
    try {
      const settings = await prisma.$queryRawUnsafe(
        "SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('google_client_id', 'facebook_app_id')"
      )
      
      const settingsObj = {}
      if (Array.isArray(settings)) {
        settings.forEach(s => {
          settingsObj[s.setting_key] = s.setting_value
        })
      }
      
      // Return database settings with fallback to environment variables
      res.status(200).json({
        google_client_id: settingsObj.google_client_id || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
        facebook_app_id: settingsObj.facebook_app_id || process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || ''
      })
    } catch (dbError) {
      // If database query fails, fallback to environment variables
      console.error('Error fetching OAuth settings from database:', dbError)
      res.status(200).json({
        google_client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
        facebook_app_id: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || ''
      })
    }
  } catch (e) {
    // Fallback to environment variables on any error
    res.status(200).json({
      google_client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
      facebook_app_id: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || ''
    })
  }
}
