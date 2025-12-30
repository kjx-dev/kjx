import { useEffect, useState } from 'react'

export default function SettingsTab({ error, setError }) {
  const [expirationDays, setExpirationDays] = useState(30)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

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
        if (data.data && data.data.ad_expiration_days) {
          setExpirationDays(parseInt(data.data.ad_expiration_days, 10) || 30)
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
        body: JSON.stringify({ ad_expiration_days: expirationDays })
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
        <div style={{padding: '12px 20px', marginBottom: '20px', color: '#1b5e20', background: '#e8f5e9', borderRadius: '4px'}}>
          {message}
        </div>
      )}

      <div style={{marginBottom: '32px'}}>
        <label style={{display: 'block', marginBottom: '8px', fontSize: '16px', fontWeight: 500, color: '#012f34'}}>
          Ad Expiration Days
        </label>
        <p style={{marginBottom: '12px', color: 'rgba(0,47,52,.7)', fontSize: '14px'}}>
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
        <div style={{marginBottom: '20px'}}>
          <button
            onClick={saveSettings}
            disabled={saving || expirationDays < 1 || expirationDays > 365}
            style={{
              padding: '10px 24px',
              background: saving || expirationDays < 1 || expirationDays > 365 ? '#ccc' : '#e44c00',
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
                e.currentTarget.style.background = '#c94300'
              }
            }}
            onMouseLeave={(e) => {
              if (!saving && expirationDays >= 1 && expirationDays <= 365) {
                e.currentTarget.style.background = '#e44c00'
              }
            }}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      <div style={{
        padding: '16px',
        background: '#f8f9fa',
        borderRadius: '6px',
        border: '1px solid rgba(1,47,52,.1)'
      }}>
        <h3 style={{fontSize: '16px', fontWeight: 500, marginBottom: '8px'}}>Note:</h3>
        <p style={{margin: 0, fontSize: '14px', color: 'rgba(0,47,52,.7)', lineHeight: 1.6}}>
          This setting applies to all new ads posted after saving. Existing ads will continue to use their original expiration dates.
        </p>
      </div>
    </div>
  )
}
