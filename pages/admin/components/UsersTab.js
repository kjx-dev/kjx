import { useEffect, useState } from 'react'

export default function UsersTab({ error, setError }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState({})

  useEffect(() => {
    async function fetchUsers(){
      try {
        setLoading(true)
        setError('')
        const response = await fetch('/api/v1/users')
        const data = await response.json()
        if (data.data && Array.isArray(data.data)) {
          setUsers(data.data)
        } else {
          setError('Failed to load users')
        }
      } catch (err) {
        setError('Error loading users: ' + (err.message || 'Unknown error'))
      } finally {
        setLoading(false)
      }
    }
    
    fetchUsers()
  }, [setError])

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

  async function updateUserStatus(userId, newStatus) {
    try {
      setUpdating(prev => ({ ...prev, [userId]: true }))
      setError('')
      const response = await fetch(`/api/v1/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      if (data.data) {
        setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, status: newStatus } : u))
        setError('') // Clear any previous errors
      } else if (data.status === 'error') {
        setError(data.message || 'Failed to update user status')
      } else {
        setError('Failed to update user status: Unexpected response format')
      }
    } catch (err) {
      console.error('Error updating user status:', err)
      setError('Error updating user status: ' + (err.message || 'Unknown error'))
    } finally {
      setUpdating(prev => ({ ...prev, [userId]: false }))
    }
  }

  async function updateUserRole(userId, newRole) {
    console.log('updateUserRole called:', { userId, newRole })
    try {
      setUpdating(prev => ({ ...prev, [userId]: true }))
      setError('')
      
      const url = `/api/v1/users/${userId}`
      const body = JSON.stringify({ role: newRole })
      console.log('Sending request:', { url, method: 'PATCH', body })
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: body
      })
      
      console.log('Response status:', response.status, response.statusText)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Error response:', errorData)
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('Role update response:', data)
      
      if (data.data) {
        // Use the data from the response to ensure we have the latest values
        const updatedUser = data.data
        console.log('Received updated user from API:', updatedUser)
        console.log('New role value:', updatedUser.role)
        
        setUsers(prev => {
          const updated = prev.map(u => {
            if (u.user_id === userId) {
              // Merge all fields from the response, ensuring role is included
              const newUser = { 
                ...u, 
                ...updatedUser,
                role: updatedUser.role || newRole, // Ensure role is set
                status: updatedUser.status || u.status
              }
              console.log('Updating user in state:', { 
                userId, 
                oldRole: u.role, 
                newRole: newUser.role,
                oldUser: u, 
                newUser 
              })
              return newUser
            }
            return u
          })
          console.log('Updated users state - checking role values:', 
            updated.map(u => ({ id: u.user_id, role: u.role }))
          )
          return updated
        })
        setError('') // Clear any previous errors
      } else if (data.status === 'error') {
        setError(data.message || 'Failed to update user role')
      } else {
        setError('Failed to update user role: Unexpected response format')
      }
    } catch (err) {
      console.error('Error updating user role:', err)
      setError('Error updating user role: ' + (err.message || 'Unknown error'))
    } finally {
      setUpdating(prev => ({ ...prev, [userId]: false }))
    }
  }

  return (
    <div style={{background: '#fff', borderRadius: '8px', border: '1px solid rgba(1,47,52,.2)', overflow: 'hidden'}}>
      <div style={{padding: '20px', borderBottom: '1px solid rgba(1,47,52,.1)'}}>
        <h2 style={{fontSize: '20px', fontWeight: '500', margin: 0}}>All Users ({users.length})</h2>
      </div>
      
      {loading && (
        <div style={{padding: '40px', textAlign: 'center', color: '#666'}}>
          Loading users...
        </div>
      )}
      
      {error && (
        <div style={{padding: '20px', color: '#b00020', background: '#ffebee'}}>
          {error}
        </div>
      )}
      
      {!loading && !error && (
        <div style={{overflowX: 'auto'}}>
          <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead>
              <tr style={{background: '#f5f5f5'}}>
                <th style={{padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '14px', color: '#012f34', borderBottom: '1px solid rgba(1,47,52,.1)'}}>ID</th>
                <th style={{padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '14px', color: '#012f34', borderBottom: '1px solid rgba(1,47,52,.1)'}}>Username</th>
                <th style={{padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '14px', color: '#012f34', borderBottom: '1px solid rgba(1,47,52,.1)'}}>Name</th>
                <th style={{padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '14px', color: '#012f34', borderBottom: '1px solid rgba(1,47,52,.1)'}}>Email</th>
                <th style={{padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '14px', color: '#012f34', borderBottom: '1px solid rgba(1,47,52,.1)'}}>Phone</th>
                <th style={{padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '14px', color: '#012f34', borderBottom: '1px solid rgba(1,47,52,.1)'}}>Status</th>
                <th style={{padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '14px', color: '#012f34', borderBottom: '1px solid rgba(1,47,52,.1)'}}>Role</th>
                <th style={{padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '14px', color: '#012f34', borderBottom: '1px solid rgba(1,47,52,.1)'}}>Created At</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{padding: '40px', textAlign: 'center', color: '#666'}}>
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const isUpdating = updating[user.user_id]
                  // Get current values, ensuring we use the actual values from the user object
                  const currentStatus = (user.status !== undefined && user.status !== null) ? String(user.status) : 'active'
                  const currentRole = (user.role !== undefined && user.role !== null) ? String(user.role) : 'user'
                  console.log('Rendering user:', { id: user.user_id, currentRole, currentStatus, user })
                  return (
                    <tr key={user.user_id} style={{borderBottom: '1px solid rgba(1,47,52,.05)'}}>
                      <td style={{padding: '12px 16px', fontSize: '14px', color: '#012f34'}}>{user.user_id}</td>
                      <td style={{padding: '12px 16px', fontSize: '14px', color: '#012f34', fontWeight: '500'}}>{user.username || 'N/A'}</td>
                      <td style={{padding: '12px 16px', fontSize: '14px', color: '#012f34'}}>{user.name || 'N/A'}</td>
                      <td style={{padding: '12px 16px', fontSize: '14px', color: '#012f34'}}>{user.email || 'N/A'}</td>
                      <td style={{padding: '12px 16px', fontSize: '14px', color: '#012f34'}}>{user.phone || 'N/A'}</td>
                      <td style={{padding: '12px 16px', fontSize: '14px'}}>
                        <select
                          value={currentStatus}
                          onChange={(e) => updateUserStatus(user.user_id, e.target.value)}
                          disabled={isUpdating}
                          style={{
                            padding: '6px 10px',
                            fontSize: '13px',
                            border: '1px solid rgba(1,47,52,.2)',
                            borderRadius: '4px',
                            backgroundColor: currentStatus === 'active' ? '#e8f5e9' : '#ffebee',
                            color: currentStatus === 'active' ? '#2e7d32' : '#c62828',
                            fontWeight: '500',
                            cursor: isUpdating ? 'not-allowed' : 'pointer',
                            minWidth: '100px'
                          }}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </td>
                      <td style={{padding: '12px 16px', fontSize: '14px'}}>
                        <select
                          value={currentRole}
                          onChange={(e) => updateUserRole(user.user_id, e.target.value)}
                          disabled={isUpdating}
                          style={{
                            padding: '6px 10px',
                            fontSize: '13px',
                            border: '1px solid rgba(1,47,52,.2)',
                            borderRadius: '4px',
                            backgroundColor: '#fff',
                            color: '#012f34',
                            cursor: isUpdating ? 'not-allowed' : 'pointer',
                            minWidth: '120px'
                          }}
                        >
                          <option value="user">User</option>
                          <option value="data_entry">Data Entry</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td style={{padding: '12px 16px', fontSize: '14px', color: '#666'}}>{formatDate(user.created_at)}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

