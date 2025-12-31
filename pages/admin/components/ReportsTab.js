import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { FaExclamationTriangle, FaTrash, FaBan, FaEye, FaTimes, FaCheckCircle } from 'react-icons/fa'

export default function ReportsTab({ error, setError }) {
  const router = useRouter()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(false)
  const [minReports, setMinReports] = useState(1)
  const [actionLoading, setActionLoading] = useState({})
  const [expandedPost, setExpandedPost] = useState(null)

  useEffect(() => {
    fetchReports()
  }, [minReports])

  async function fetchReports() {
    try {
      setLoading(true)
      setError('')
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/v1/admin/reports?minReports=${minReports}&reason=spam`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      
      if (data.status === 'success' && Array.isArray(data.data)) {
        setReports(data.data)
      } else {
        setError(data.message || 'Failed to load reports')
        setReports([])
      }
    } catch (err) {
      console.error('Error loading reports:', err)
      setError('Error loading reports: ' + (err.message || 'Unknown error'))
      setReports([])
    } finally {
      setLoading(false)
    }
  }

  async function takeAction(action, postId, userId) {
    if (!confirm(`Are you sure you want to ${action.replace(/_/g, ' ')}?`)) {
      return
    }

    try {
      setActionLoading(prev => ({ ...prev, [postId]: true }))
      setError('')
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/v1/admin/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action,
          post_id: postId,
          user_id: userId,
          reason: 'spam',
          ...(action === 'change_status' ? { new_status: 'rejected' } : {})
        })
      })
      
      const data = await response.json()
      
      if (data.status === 'success') {
        // Remove the post from the list if it was deleted
        if (action === 'delete_post' || action === 'delete_and_ban') {
          setReports(prev => prev.filter(r => r.post_id !== postId))
        } else {
          // Refresh the list
          fetchReports()
        }
        
        if (typeof window !== 'undefined' && window.swal) {
          window.swal('Success', `Action completed successfully`, 'success')
        }
      } else {
        setError(data.message || 'Failed to execute action')
        if (typeof window !== 'undefined' && window.swal) {
          window.swal('Error', data.message || 'Failed to execute action', 'error')
        }
      }
    } catch (err) {
      console.error('Error taking action:', err)
      setError('Error taking action: ' + (err.message || 'Unknown error'))
      if (typeof window !== 'undefined' && window.swal) {
        window.swal('Error', 'Failed to execute action', 'error')
      }
    } finally {
      setActionLoading(prev => {
        const next = { ...prev }
        delete next[postId]
        return next
      })
    }
  }

  function formatDate(dateString) {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  function formatPrice(price) {
    if (!price) return 'N/A'
    try {
      return 'Rs ' + Number(price).toLocaleString('en-PK')
    } catch {
      return price
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '500', marginBottom: '8px' }}>Spam Reports</h2>
          <p style={{ color: 'rgba(0,0,0,0.6)', fontSize: '14px' }}>
            Posts reported as spam multiple times. Review and take appropriate action.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ fontSize: '14px', color: 'rgba(0,0,0,0.7)' }}>
            Min Reports:
          </label>
          <select
            value={minReports}
            onChange={(e) => setMinReports(parseInt(e.target.value, 10))}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(0,0,0,0.2)',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option value={1}>1+</option>
            <option value={2}>2+</option>
            <option value={3}>3+</option>
            <option value={5}>5+</option>
            <option value={10}>10+</option>
          </select>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '12px 20px',
          marginBottom: '20px',
          color: '#b00020',
          background: '#ffebee',
          borderRadius: '8px',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(0,0,0,0.6)' }}>
          Loading reports...
        </div>
      ) : reports.length === 0 ? (
        <div style={{
          padding: '60px 20px',
          textAlign: 'center',
          background: '#f5f5f5',
          borderRadius: '12px',
          border: '1px solid rgba(0,0,0,0.1)'
        }}>
          <FaCheckCircle style={{ fontSize: '48px', color: 'rgba(0,0,0,0.3)', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>No Reports Found</h3>
          <p style={{ color: 'rgba(0,0,0,0.6)', fontSize: '14px' }}>
            {minReports === 1 
              ? 'No posts have been reported as spam yet.'
              : `No posts have been reported as spam ${minReports} or more times.`}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {reports.map((report) => (
            <div
              key={report.post_id}
              style={{
                background: '#fff',
                borderRadius: '12px',
                border: '1px solid rgba(0,0,0,0.1)',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}
            >
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                {/* Post Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{
                      background: '#ffebee',
                      color: '#b00020',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <FaExclamationTriangle />
                      {report.report_count} {report.report_count === 1 ? 'Report' : 'Reports'}
                    </div>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      background: report.status === 'active' ? '#e8f5e9' : report.status === 'pending' ? '#fff3e0' : '#ffebee',
                      color: report.status === 'active' ? '#2e7d32' : report.status === 'pending' ? '#e65100' : '#b00020'
                    }}>
                      {report.status || 'pending'}
                    </span>
                  </div>

                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '500',
                    marginBottom: '8px',
                    color: '#012f34',
                    cursor: 'pointer'
                  }}
                  onClick={() => router.push(`/product/${report.post_id}`)}
                  >
                    {report.title}
                  </h3>

                  <p style={{
                    fontSize: '14px',
                    color: 'rgba(0,0,0,0.7)',
                    marginBottom: '12px',
                    lineHeight: '1.5',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {report.content}
                  </p>

                  <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: 'rgba(0,0,0,0.6)', marginBottom: '12px' }}>
                    {report.price && (
                      <span style={{ fontWeight: '500', color: '#f55100' }}>
                        {formatPrice(report.price)}
                      </span>
                    )}
                    {report.location && (
                      <span>{report.location}</span>
                    )}
                    <span>Posted: {formatDate(report.created_at)}</span>
                  </div>

                  {/* User Info */}
                  {report.user && (
                    <div style={{
                      padding: '12px',
                      background: '#f5f5f5',
                      borderRadius: '8px',
                      marginBottom: '12px',
                      fontSize: '14px'
                    }}>
                      <div style={{ fontWeight: '500', marginBottom: '4px' }}>Posted by:</div>
                      <div style={{ color: 'rgba(0,0,0,0.7)' }}>
                        {report.user.name || report.user.username} ({report.user.email})
                        {report.user.role && (
                          <span style={{
                            marginLeft: '8px',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            background: report.user.role === 'admin' ? '#e3f2fd' : '#f3e5f5',
                            color: report.user.role === 'admin' ? '#1976d2' : '#7b1fa2'
                          }}>
                            {report.user.role}
                          </span>
                        )}
                        {report.user.status === 'banned' && (
                          <span style={{
                            marginLeft: '8px',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            background: '#ffebee',
                            color: '#b00020',
                            fontWeight: '600'
                          }}>
                            BANNED
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Report Details */}
                  <button
                    onClick={() => setExpandedPost(expandedPost === report.post_id ? null : report.post_id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#1976d2',
                      cursor: 'pointer',
                      fontSize: '14px',
                      padding: '8px 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <FaEye />
                    {expandedPost === report.post_id ? 'Hide' : 'View'} Report Details ({report.flags?.length || 0})
                  </button>

                  {expandedPost === report.post_id && report.flags && report.flags.length > 0 && (
                    <div style={{
                      marginTop: '12px',
                      padding: '16px',
                      background: '#fff3e0',
                      borderRadius: '8px',
                      border: '1px solid #ffcc80'
                    }}>
                      <div style={{ fontWeight: '500', marginBottom: '12px', fontSize: '14px' }}>Report Details:</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {report.flags.map((flag, idx) => (
                          <div key={flag.flag_id || idx} style={{
                            padding: '12px',
                            background: '#fff',
                            borderRadius: '6px',
                            fontSize: '13px'
                          }}>
                            <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                              {flag.author || 'Anonymous'} - {formatDate(flag.created_at)}
                            </div>
                            {flag.details && (
                              <div style={{ color: 'rgba(0,0,0,0.7)', marginTop: '4px' }}>
                                {flag.details}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  minWidth: '200px'
                }}>
                  <button
                    onClick={() => takeAction('delete_post', report.post_id, report.user_id)}
                    disabled={actionLoading[report.post_id]}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      background: '#b00020',
                      color: '#fff',
                      border: 'none',
                      cursor: actionLoading[report.post_id] ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      opacity: actionLoading[report.post_id] ? 0.6 : 1
                    }}
                  >
                    <FaTrash />
                    Delete Post
                  </button>

                  {report.user_id && (
                    <button
                      onClick={() => takeAction('ban_user', report.post_id, report.user_id)}
                      disabled={actionLoading[report.post_id] || report.user?.status === 'banned'}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '8px',
                        background: report.user?.status === 'banned' ? '#ccc' : '#ff6f00',
                        color: '#fff',
                        border: 'none',
                        cursor: (actionLoading[report.post_id] || report.user?.status === 'banned') ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        opacity: (actionLoading[report.post_id] || report.user?.status === 'banned') ? 0.6 : 1
                      }}
                    >
                      <FaBan />
                      {report.user?.status === 'banned' ? 'User Banned' : 'Ban User'}
                    </button>
                  )}

                  {report.user_id && (
                    <button
                      onClick={() => takeAction('delete_and_ban', report.post_id, report.user_id)}
                      disabled={actionLoading[report.post_id]}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '8px',
                        background: '#d32f2f',
                        color: '#fff',
                        border: 'none',
                        cursor: actionLoading[report.post_id] ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        opacity: actionLoading[report.post_id] ? 0.6 : 1
                      }}
                    >
                      <FaTrash />
                      Delete & Ban
                    </button>
                  )}

                  <button
                    onClick={() => takeAction('change_status', report.post_id, report.user_id)}
                    disabled={actionLoading[report.post_id]}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      background: '#f57c00',
                      color: '#fff',
                      border: 'none',
                      cursor: actionLoading[report.post_id] ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      opacity: actionLoading[report.post_id] ? 0.6 : 1
                    }}
                  >
                    Reject Post
                  </button>

                  <button
                    onClick={() => takeAction('dismiss_reports', report.post_id, report.user_id)}
                    disabled={actionLoading[report.post_id]}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      background: '#4caf50',
                      color: '#fff',
                      border: 'none',
                      cursor: actionLoading[report.post_id] ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      opacity: actionLoading[report.post_id] ? 0.6 : 1
                    }}
                  >
                    <FaTimes />
                    Dismiss Reports
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
