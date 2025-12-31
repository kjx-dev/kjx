# Google Sign-In Setup Guide

This guide will help you configure Google Sign-In for your application.

## Prerequisites

- A Google account
- Access to Google Cloud Console

## Step-by-Step Instructions

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter a project name (e.g., "My App")
5. Click "Create"

### 2. Enable Google+ API

1. In the Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Google+ API" or "Google Identity Services"
3. Click on it and click **Enable**

### 3. Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client ID**
3. If prompted, configure the OAuth consent screen:
   - Choose **External** (unless you have a Google Workspace account)
   - Fill in the required fields:
     - App name: Your app name
     - User support email: Your email
     - Developer contact information: Your email
   - Click **Save and Continue** through the steps
   - Click **Back to Dashboard**

4. Create the OAuth Client ID:
   - Application type: **Web application**
   - Name: "Web Client" (or any name you prefer)
   - **Authorized JavaScript origins**:
     - For development: `http://localhost:3000`
     - For production: `https://yourdomain.com`
   - **Authorized redirect URIs**:
     - For development: `http://localhost:3000`
     - For production: `https://yourdomain.com`
   - Click **Create**

5. Copy your credentials:
   - **Client ID**: This is your `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
   - **Client Secret**: This is your `GOOGLE_CLIENT_SECRET`

### 4. Configure Environment Variables

1. Open `.env.local` in your project root
2. Add your Google credentials:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

**Important Notes:**
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` must start with `NEXT_PUBLIC_` to be accessible in the browser
- Never commit `.env.local` to version control (it's already in `.gitignore`)
- The Client ID will be visible in your frontend code, but the Client Secret should remain server-side only

### 5. Restart Your Development Server

After adding the environment variables, restart your Next.js development server:

```bash
npm run dev
```

### 6. Test Google Sign-In

1. Navigate to your login page
2. You should see the Google Sign-In button
3. Click it and test the authentication flow

## Troubleshooting

### "Google Sign-In is not configured" Error

- Make sure `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set in `.env.local`
- Restart your development server after adding environment variables
- Check that the variable name starts with `NEXT_PUBLIC_`

### "Invalid client" Error

- Verify your Client ID is correct
- Check that your authorized JavaScript origins include your current URL
- For local development, make sure `http://localhost:3000` is added

### Token Verification Fails

- Ensure `GOOGLE_CLIENT_SECRET` is set (though it's optional for token verification)
- Check that the Google+ API is enabled in your Google Cloud project

## Production Setup

For production deployment:

1. Add your production domain to **Authorized JavaScript origins**:
   - `https://yourdomain.com`
   - `https://www.yourdomain.com` (if applicable)

2. Add your production domain to **Authorized redirect URIs**:
   - `https://yourdomain.com`
   - `https://www.yourdomain.com` (if applicable)

3. Update your production environment variables with the same Client ID and Secret

## Security Best Practices

- Never commit `.env.local` or `.env` files to version control
- Use different OAuth credentials for development and production
- Regularly rotate your Client Secret
- Monitor your Google Cloud Console for any suspicious activity

## Additional Resources

- [Google Identity Services Documentation](https://developers.google.com/identity/gsi/web)
- [OAuth 2.0 Setup Guide](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
