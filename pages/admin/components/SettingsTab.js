import { useEffect, useState } from 'react'

export default function SettingsTab({ error, setError }) {
  const [expirationDays, setExpirationDays] = useState(30)
  const [googleClientId, setGoogleClientId] = useState('')
  const [googleClientSecret, setGoogleClientSecret] = useState('')
  const [facebookAppId, setFacebookAppId] = useState('')
  const [facebookAppSecret, setFacebookAppSecret] = useState('')
  const [editWithoutApprovalRoles, setEditWithoutApprovalRoles] = useState(['admin', 'manager', 'data_entry'])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  
  const availableRoles = ['admin', 'manager', 'data_entry', 'user']

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      if (!token) {
        setError('Not authenticated')
        return
      }

      const res = await fetch('/api/v1/admin/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        const data = await res.json()
        if (data.data) {
          if (data.data.ad_expiration_days) {
            setExpirationDays(parseInt(data.data.ad_expiration_days, 10) || 30)
          }
          if (data.data.google_client_id) {
            setGoogleClientId(data.data.google_client_id)
          }
          if (data.data.google_client_secret) {
            setGoogleClientSecret(data.data.google_client_secret)
          }
          if (data.data.facebook_app_id) {
            setFacebookAppId(data.data.facebook_app_id)
          }
          if (data.data.facebook_app_secret) {
            setFacebookAppSecret(data.data.facebook_app_secret)
          }
          if (data.data.edit_without_approval_roles) {
            // Parse comma-separated roles or JSON array
            try {
              const roles = typeof data.data.edit_without_approval_roles === 'string' 
                ? (data.data.edit_without_approval_roles.includes('[') 
                    ? JSON.parse(data.data.edit_without_approval_roles)
                    : data.data.edit_without_approval_roles.split(',').map(r => r.trim()).filter(r => r))
                : data.data.edit_without_approval_roles
              if (Array.isArray(roles)) {
                setEditWithoutApprovalRoles(roles)
              }
            } catch (e) {
              console.error('Error parsing edit_without_approval_roles:', e)
            }
          }
        }
      } else {
        setError('Failed to load settings')
      }
    } catch (e) {
      setError('Failed to load settings: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  async function saveSettings() {
    try {
      setSaving(true)
      setMessage('')
      setError('')
      const token = localStorage.getItem('auth_token')
      if (!token) {
        setError('Not authenticated')
        return
      }

      if (expirationDays < 1 || expirationDays > 365) {
        setError('Expiration days must be between 1 and 365')
        return
      }

      const res = await fetch('/api/v1/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          ad_expiration_days: expirationDays,
          google_client_id: googleClientId.trim(),
          google_client_secret: googleClientSecret.trim(),
          facebook_app_id: facebookAppId.trim(),
          facebook_app_secret: facebookAppSecret.trim(),
          edit_without_approval_roles: JSON.stringify(editWithoutApprovalRoles)
        })
      })

      if (res.ok) {
        setMessage('Settings saved successfully!')
        setTimeout(() => setMessage(''), 3000)
      } else {
        const data = await res.json()
        setError(data.message || 'Failed to save settings')
      }
    } catch (e) {
      setError('Failed to save settings: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div style={{padding: '40px', textAlign: 'center'}}>Loading settings...</div>
  }

  return (
    <div style={{background: '#fff', borderRadius: '8px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'}}>
      <h2 style={{fontSize: '24px', fontWeight: 500, marginBottom: '24px'}}>Settings</h2>
      
      {message && (
        <div style={{padding: '12px 20px', marginBottom: '20px', color: 'var(--primary-color-dark)', background: 'rgba(245, 81, 0, 0.1)', borderRadius: '4px'}}>
          {message}
        </div>
      )}

      {/* Ad Expiration Settings */}
      <div style={{marginBottom: '32px', paddingBottom: '32px', borderBottom: '1px solid rgba(1,47,52,.1)'}}>
        <label style={{display: 'block', marginBottom: '8px', fontSize: '16px', fontWeight: 500, color: 'var(--dark-teal)'}}>
          Ad Expiration Days
        </label>
        <p style={{marginBottom: '12px', color: 'rgba(1,47,52,.7)', fontSize: '14px'}}>
          Set the number of days after which ads will automatically expire. Default is 30 days.
        </p>
        <input
          type="number"
          min="1"
          max="365"
          value={expirationDays}
          onChange={(e) => setExpirationDays(parseInt(e.target.value, 10) || 30)}
          style={{
            width: '200px',
            padding: '10px 14px',
            border: '1px solid rgba(1,47,52,.2)',
            borderRadius: '6px',
            fontSize: '16px',
            marginBottom: '16px'
          }}
        />
      </div>

      {/* Google OAuth Settings */}
      <div style={{marginBottom: '32px', paddingBottom: '32px', borderBottom: '1px solid rgba(1,47,52,.1)'}}>
        <h3 style={{fontSize: '18px', fontWeight: 500, marginBottom: '16px', color: 'var(--dark-teal)'}}>Google OAuth Configuration</h3>
        <p style={{marginBottom: '16px', color: 'rgba(1,47,52,.7)', fontSize: '14px'}}>
          Configure Google Sign-In authentication. Get your credentials from{' '}
          <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" style={{color: 'var(--primary-color-dark)', textDecoration: 'underline'}}>
            Google Cloud Console
          </a>.
        </p>
        
        <div style={{marginBottom: '16px'}}>
          <label style={{display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: 'var(--dark-teal)'}}>
            Google Client ID
          </label>
          <input
            type="text"
            value={googleClientId}
            onChange={(e) => setGoogleClientId(e.target.value)}
            placeholder="your-client-id.apps.googleusercontent.com"
            style={{
              width: '100%',
              maxWidth: '600px',
              padding: '10px 14px',
              border: '1px solid rgba(1,47,52,.2)',
              borderRadius: '6px',
              fontSize: '15px'
            }}
          />
        </div>

        <div style={{marginBottom: '16px'}}>
          <label style={{display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: 'var(--dark-teal)'}}>
            Google Client Secret
          </label>
          <input
            type="password"
            value={googleClientSecret}
            onChange={(e) => setGoogleClientSecret(e.target.value)}
            placeholder="your-client-secret"
            style={{
              width: '100%',
              maxWidth: '600px',
              padding: '10px 14px',
              border: '1px solid rgba(1,47,52,.2)',
              borderRadius: '6px',
              fontSize: '15px'
            }}
          />
        </div>
      </div>

      {/* Facebook OAuth Settings */}
      <div style={{marginBottom: '32px', paddingBottom: '32px', borderBottom: '1px solid rgba(1,47,52,.1)'}}>
        <h3 style={{fontSize: '18px', fontWeight: 500, marginBottom: '16px', color: 'var(--dark-teal)'}}>Facebook OAuth Configuration</h3>
        <p style={{marginBottom: '16px', color: 'rgba(1,47,52,.7)', fontSize: '14px'}}>
          Configure Facebook Sign-In authentication. Get your credentials from{' '}
          <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer" style={{color: 'var(--primary-color-dark)', textDecoration: 'underline'}}>
            Facebook Developers
          </a>.
        </p>
        
        <div style={{marginBottom: '16px'}}>
          <label style={{display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: 'var(--dark-teal)'}}>
            Facebook App ID
          </label>
          <input
            type="text"
            value={facebookAppId}
            onChange={(e) => setFacebookAppId(e.target.value)}
            placeholder="your-facebook-app-id"
            style={{
              width: '100%',
              maxWidth: '600px',
              padding: '10px 14px',
              border: '1px solid rgba(1,47,52,.2)',
              borderRadius: '6px',
              fontSize: '15px'
            }}
          />
        </div>

        <div style={{marginBottom: '16px'}}>
          <label style={{display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: 'var(--dark-teal)'}}>
            Facebook App Secret
          </label>
          <input
            type="password"
            value={facebookAppSecret}
            onChange={(e) => setFacebookAppSecret(e.target.value)}
            placeholder="your-facebook-app-secret"
            style={{
              width: '100%',
              maxWidth: '600px',
              padding: '10px 14px',
              border: '1px solid rgba(1,47,52,.2)',
              borderRadius: '6px',
              fontSize: '15px'
            }}
          />
        </div>
      </div>

      {/* Post Editing Permissions */}
      <div style={{marginBottom: '32px', paddingBottom: '32px', borderBottom: '1px solid rgba(1,47,52,.1)'}}>
        <h3 style={{fontSize: '18px', fontWeight: 500, marginBottom: '16px', color: 'var(--dark-teal)'}}>Post Editing Permissions</h3>
        <p style={{marginBottom: '16px', color: 'rgba(1,47,52,.7)', fontSize: '14px'}}>
          Select which user roles can edit posts without requiring admin approval. Posts edited by other roles will be set to "pending" status and require approval.
        </p>
        
        <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
          {availableRoles.map(role => (
            <label
              key={role}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: '6px',
                transition: 'background 0.2s',
                userSelect: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f8f9fa'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <input
                type="checkbox"
                checked={editWithoutApprovalRoles.includes(role)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setEditWithoutApprovalRoles([...editWithoutApprovalRoles, role])
                  } else {
                    setEditWithoutApprovalRoles(editWithoutApprovalRoles.filter(r => r !== role))
                  }
                }}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer'
                }}
              />
              <span style={{fontSize: '15px', color: 'var(--dark-teal)', textTransform: 'capitalize'}}>
                {role === 'data_entry' ? 'Data Entry' : role}
              </span>
            </label>
          ))}
        </div>
        
        {editWithoutApprovalRoles.length === 0 && (
          <div style={{
            marginTop: '12px',
            padding: '12px',
            background: '#fff3cd',
            borderRadius: '6px',
            border: '1px solid #ffc107',
            color: '#856404',
            fontSize: '14px'
          }}>
            ⚠️ No roles selected. All post edits will require admin approval.
          </div>
        )}
      </div>

      {/* Save Button */}
      <div style={{marginBottom: '20px'}}>
        <button
          onClick={saveSettings}
          disabled={saving || expirationDays < 1 || expirationDays > 365}
          style={{
            padding: '10px 24px',
            background: saving || expirationDays < 1 || expirationDays > 365 ? 'rgba(1,47,52,0.3)' : 'var(--primary-color-dark)',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '15px',
            fontWeight: 400,
            cursor: saving || expirationDays < 1 || expirationDays > 365 ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!saving && expirationDays >= 1 && expirationDays <= 365) {
              e.currentTarget.style.background = 'var(--primary-color)'
            }
          }}
          onMouseLeave={(e) => {
            if (!saving && expirationDays >= 1 && expirationDays <= 365) {
              e.currentTarget.style.background = 'var(--primary-color-dark)'
            }
          }}
        >
          {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>

      <div style={{
        padding: '16px',
        background: '#f8f9fa',
        borderRadius: '6px',
        border: '1px solid rgba(1,47,52,.1)'
      }}>
        <h3 style={{fontSize: '16px', fontWeight: 500, marginBottom: '8px'}}>Note:</h3>
        <p style={{margin: 0, fontSize: '14px', color: 'rgba(1,47,52,.7)', lineHeight: 1.6}}>
          This setting applies to all new ads posted after saving. Existing ads will continue to use their original expiration dates.
        </p>
      </div>
    </div>
  )
}
