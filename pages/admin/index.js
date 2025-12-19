import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Header from '../../components/Header'

export default function Admin(){
  const router = useRouter()
  const [auth, setAuth] = useState({ email:'', isAuthenticated:false, name:'' })
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState({})
  const [activeTab, setActiveTab] = useState('users')
  const [permissions, setPermissions] = useState({})
  const [permissionsLoading, setPermissionsLoading] = useState(false)
  const [togglingPermission, setTogglingPermission] = useState({})
  const [ads, setAds] = useState([])
  const [adsLoading, setAdsLoading] = useState(false)
  const [adsTab, setAdsTab] = useState('all')
  const [adsSearch, setAdsSearch] = useState('')
  const [usersMap, setUsersMap] = useState({})

  useEffect(() => {
    const email = localStorage.getItem('email') || ''
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
    const name = localStorage.getItem('name') || ''
    setAuth({ email, isAuthenticated, name })
    if (!isAuthenticated || !email) { 
      router.push('/login')
      return 
    }
    
    // Fetch users
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
    fetchPermissions()
    fetchAllAds()
  }, [router])

  async function fetchAllAds() {
    try {
      setAdsLoading(true)
      setError('')
      
      // Fetch all posts
      const postsResponse = await fetch('/api/v1/posts')
      const postsData = await postsResponse.json()
      
      if (postsData.data && Array.isArray(postsData.data)) {
        // Fetch all users to create a map
        const usersResponse = await fetch('/api/v1/users')
        const usersData = await usersResponse.json()
        
        if (usersData.data && Array.isArray(usersData.data)) {
          const map = {}
          usersData.data.forEach(u => {
            map[u.user_id] = u
          })
          setUsersMap(map)
        }
        
        // Map posts to the format we need
        const mappedAds = postsData.data.map(post => ({
          id: post.post_id,
          post_id: post.post_id,
          title: post.title,
          content: post.content,
          image: (Array.isArray(post.images) && post.images.length ? post.images[0].url : 'https://picsum.photos/seed/product/300/200'),
          price: post.price || '',
          location: post.location || '',
          category_id: post.category_id,
          user_id: post.user_id,
          created_at: post.created_at,
          images: post.images || []
        }))
        
        setAds(mappedAds)
      } else {
        setAds([])
      }
    } catch (err) {
      console.error('Error loading ads:', err)
      setError('Error loading ads: ' + (err.message || 'Unknown error'))
      setAds([])
    } finally {
      setAdsLoading(false)
    }
  }

  async function fetchPermissions() {
    try {
      setPermissionsLoading(true)
      setError('')
      const response = await fetch('/api/v1/admin/permissions')
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      if (data.data) {
        setPermissions(data.data)
      } else {
        setPermissions({}) // Initialize empty if no data
      }
    } catch (err) {
      console.error('Error loading permissions:', err)
      setError('Error loading permissions: ' + (err.message || 'Unknown error'))
      setPermissions({}) // Set empty object on error
    } finally {
      setPermissionsLoading(false)
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

  async function togglePermission(role, resource, action) {
    const key = `${role}-${resource}-${action}`
    try {
      setError('')
      setTogglingPermission(prev => ({ ...prev, [key]: true }))
      
      const rolePerms = permissions[role] || []
      const hasPermission = rolePerms.some(p => p.resource === resource && p.action === action)
      
      if (hasPermission) {
        // Remove permission
        const response = await fetch(`/api/v1/admin/permissions?role=${encodeURIComponent(role)}&resource=${encodeURIComponent(resource)}&action=${encodeURIComponent(action)}`, {
          method: 'DELETE'
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || `Failed to remove permission: HTTP ${response.status}`)
        }
        
        const deleteData = await response.json().catch(() => ({}))
        if (deleteData.data || response.ok) {
          setPermissions(prev => ({
            ...prev,
            [role]: (prev[role] || []).filter(p => !(p.resource === resource && p.action === action))
          }))
        } else {
          throw new Error('Failed to remove permission: Unexpected response')
        }
      } else {
        // Add permission
        const response = await fetch('/api/v1/admin/permissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role, resource, action })
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || `Failed to add permission: HTTP ${response.status}`)
        }
        
        const data = await response.json()
        if (data.data) {
          setPermissions(prev => ({
            ...prev,
            [role]: [...(prev[role] || []), data.data]
          }))
        } else {
          throw new Error('Failed to add permission: Unexpected response format')
        }
      }
    } catch (err) {
      console.error('Error updating permission:', err)
      setError('Error updating permission: ' + (err.message || 'Unknown error'))
    } finally {
      setTogglingPermission(prev => ({ ...prev, [key]: false }))
    }
  }

  function hasPermission(role, resource, action) {
    const rolePerms = permissions[role] || []
    return rolePerms.some(p => p.resource === resource && p.action === action)
  }

  const roles = ['user', 'data_entry', 'manager', 'admin']
  const resources = [
    { key: 'posts', label: 'Posts' },
    { key: 'users', label: 'Users' },
    { key: 'categories', label: 'Categories' },
    { key: 'comments', label: 'Comments' }
  ]
  const actions = [
    { key: 'create', label: 'Create' },
    { key: 'edit', label: 'Edit' },
    { key: 'delete', label: 'Delete' },
    { key: 'view', label: 'View' }
  ]

  return (
    <>
      <Header />
      <div style={{minHeight: '100vh', padding: '20px'}}>
        <div style={{maxWidth: '1400px', margin: '0 auto'}}>
          <h1 style={{fontSize: '32px', fontWeight: '600', marginBottom: '20px'}}>Admin Panel</h1>
          
          {/* Tabs */}
          <div style={{display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '2px solid rgba(1,47,52,.1)'}}>
            <button
              onClick={() => setActiveTab('users')}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '500',
                border: 'none',
                background: 'transparent',
                color: activeTab === 'users' ? '#012f34' : '#666',
                borderBottom: activeTab === 'users' ? '2px solid #012f34' : '2px solid transparent',
                cursor: 'pointer',
                marginBottom: '-2px'
              }}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '500',
                border: 'none',
                background: 'transparent',
                color: activeTab === 'permissions' ? '#012f34' : '#666',
                borderBottom: activeTab === 'permissions' ? '2px solid #012f34' : '2px solid transparent',
                cursor: 'pointer',
                marginBottom: '-2px'
              }}
            >
              Role Permissions
            </button>
            <button
              onClick={() => setActiveTab('ads')}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '500',
                border: 'none',
                background: 'transparent',
                color: activeTab === 'ads' ? '#012f34' : '#666',
                borderBottom: activeTab === 'ads' ? '2px solid #012f34' : '2px solid transparent',
                cursor: 'pointer',
                marginBottom: '-2px'
              }}
            >
              Manage Ads
            </button>
          </div>

          {error && (
            <div style={{padding: '12px 20px', marginBottom: '20px', color: '#b00020', background: '#ffebee', borderRadius: '4px'}}>
              {error}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
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
          )}

          {/* Permissions Tab */}
          {activeTab === 'permissions' && (
          <div style={{background: '#fff', borderRadius: '8px', border: '1px solid rgba(1,47,52,.2)', overflow: 'hidden'}}>
            <div style={{padding: '20px', borderBottom: '1px solid rgba(1,47,52,.1)'}}>
              <h2 style={{fontSize: '20px', fontWeight: '500', margin: 0}}>Role Permissions</h2>
              <p style={{fontSize: '14px', color: '#666', margin: '8px 0 0 0'}}>Assign permissions to roles. Check the boxes to grant specific rights.</p>
            </div>
            
            {permissionsLoading ? (
              <div style={{padding: '40px', textAlign: 'center', color: '#666'}}>
                Loading permissions...
              </div>
            ) : (
              <div style={{padding: '20px', overflowX: 'auto'}}>
                <table style={{width: '100%', borderCollapse: 'collapse'}}>
                  <thead>
                    <tr style={{background: '#f5f5f5'}}>
                      <th style={{padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '14px', color: '#012f34', borderBottom: '1px solid rgba(1,47,52,.1)'}}>Role</th>
                      {resources.map(resource => (
                        <th key={resource.key} style={{padding: '12px 16px', textAlign: 'center', fontWeight: '600', fontSize: '14px', color: '#012f34', borderBottom: '1px solid rgba(1,47,52,.1)'}} colSpan={actions.length}>
                          {resource.label}
                        </th>
                      ))}
                    </tr>
                    <tr style={{background: '#f5f5f5'}}>
                      <th style={{padding: '8px 16px', textAlign: 'left', fontWeight: '500', fontSize: '12px', color: '#666'}}></th>
                      {resources.map(resource => 
                        actions.map(action => (
                          <th key={`${resource.key}-${action.key}`} style={{padding: '8px 4px', textAlign: 'center', fontWeight: '500', fontSize: '12px', color: '#666'}}>
                            {action.label}
                          </th>
                        ))
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {roles.map(role => (
                      <tr key={role} style={{borderBottom: '1px solid rgba(1,47,52,.05)'}}>
                        <td style={{padding: '12px 16px', fontSize: '14px', fontWeight: '500', color: '#012f34', textTransform: 'capitalize'}}>
                          {role.replace('_', ' ')}
                        </td>
                        {resources.map(resource => 
                          actions.map(action => {
                            const checked = hasPermission(role, resource.key, action.key)
                            const key = `${role}-${resource.key}-${action.key}`
                            const isToggling = togglingPermission[key]
                            return (
                              <td key={key} style={{padding: '12px 4px', textAlign: 'center'}}>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  disabled={isToggling}
                                  onChange={() => togglePermission(role, resource.key, action.key)}
                                  style={{
                                    width: '18px',
                                    height: '18px',
                                    cursor: isToggling ? 'wait' : 'pointer',
                                    opacity: isToggling ? 0.6 : 1
                                  }}
                                  title={isToggling ? 'Updating...' : (checked ? 'Remove permission' : 'Add permission')}
                                />
                              </td>
                            )
                          })
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          )}

          {/* Ads Management Tab */}
          {activeTab === 'ads' && (
          <div style={{background: '#fff', borderRadius: '8px', border: '1px solid rgba(1,47,52,.2)', overflow: 'hidden'}}>
            <div style={{padding: '20px', borderBottom: '1px solid rgba(1,47,52,.1)'}}>
              <h2 style={{fontSize: '20px', fontWeight: '500', margin: 0}}>Manage All Ads</h2>
              <p style={{fontSize: '14px', color: '#666', margin: '8px 0 0 0'}}>View and manage all ads from all users</p>
            </div>
            
            {adsLoading ? (
              <div style={{padding: '40px', textAlign: 'center', color: '#666'}}>
                Loading ads...
              </div>
            ) : (
              <div style={{padding: '20px'}}>
                {/* Search and Filter */}
                <div style={{marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap'}}>
                  <input
                    type="text"
                    placeholder="Search ads by title..."
                    value={adsSearch}
                    onChange={(e) => setAdsSearch(e.target.value)}
                    style={{
                      flex: '1',
                      minWidth: '200px',
                      padding: '10px 12px',
                      border: '1px solid rgba(1,47,52,.2)',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                  <div style={{display: 'flex', gap: '8px'}}>
                    {['all', 'active', 'inactive'].map(kind => {
                      const isActive = adsTab === kind
                      return (
                        <button
                          key={kind}
                          onClick={() => setAdsTab(kind)}
                          style={{
                            padding: '8px 16px',
                            fontSize: '14px',
                            fontWeight: '500',
                            border: 'none',
                            background: isActive ? '#012f34' : '#f5f5f5',
                            color: isActive ? '#fff' : '#666',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          {kind === 'all' ? 'All' : kind.charAt(0).toUpperCase() + kind.slice(1)}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Ads List */}
                <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                  {(() => {
                    let filteredAds = ads
                    
                    // Filter by search
                    if (adsSearch.trim()) {
                      const searchLower = adsSearch.toLowerCase()
                      filteredAds = filteredAds.filter(ad => 
                        ad.title?.toLowerCase().includes(searchLower) ||
                        ad.content?.toLowerCase().includes(searchLower)
                      )
                    }
                    
                    if (filteredAds.length === 0) {
                      return (
                        <div style={{padding: '40px', textAlign: 'center', color: '#666'}}>
                          No ads found
                        </div>
                      )
                    }
                    
                    return filteredAds.map((ad) => {
                      const user = usersMap[ad.user_id] || {}
                      const imgSrc = ad.image || 'https://picsum.photos/seed/product/300/200'
                      
                      return (
                        <div key={ad.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          border: '1px solid rgba(1,47,52,.2)',
                          borderRadius: '6px',
                          padding: '16px',
                          gap: '16px'
                        }}>
                          <div style={{display: 'flex', alignItems: 'center', gap: '16px', flex: '1'}}>
                            <img 
                              src={imgSrc} 
                              alt={ad.title} 
                              loading="lazy" 
                              style={{
                                width: '120px',
                                height: '90px',
                                objectFit: 'cover',
                                borderRadius: '4px'
                              }} 
                            />
                            <div style={{flex: '1'}}>
                              <h3 style={{fontWeight: '500', margin: '0 0 4px 0', fontSize: '16px'}}>
                                {ad.title}
                              </h3>
                              <p style={{color: 'rgba(0,47,52,.64)', fontSize: '14px', margin: '0 0 8px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>
                                {ad.content}
                              </p>
                              <div style={{display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: 'rgba(0,47,52,.64)'}}>
                                {ad.price && (
                                  <span><strong>Price:</strong> {ad.price}</span>
                                )}
                                {ad.location && (
                                  <span><strong>Location:</strong> {ad.location}</span>
                                )}
                                <span><strong>User:</strong> {user.name || user.username || user.email || 'Unknown'}</span>
                                <span><strong>Email:</strong> {user.email || 'N/A'}</span>
                                {ad.created_at && (
                                  <span><strong>Created:</strong> {formatDate(ad.created_at)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div style={{display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap'}}>
                            <button
                              onClick={() => router.push(`/product/${ad.post_id}`)}
                              style={{
                                padding: '8px 12px',
                                fontSize: '13px',
                                border: '1px solid rgba(1,47,52,.2)',
                                background: '#fff',
                                color: '#012f34',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              View
                            </button>
                            <button
                              onClick={() => router.push(`/sell?editId=${ad.post_id}&source=db`)}
                              style={{
                                padding: '8px 12px',
                                fontSize: '13px',
                                border: '1px solid rgba(1,47,52,.2)',
                                background: '#fff',
                                color: '#012f34',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm('Are you sure you want to delete this ad?')) {
                                  try {
                                    const response = await fetch(`/api/v1/posts/${ad.post_id}`, {
                                      method: 'DELETE'
                                    })
                                    if (response.ok) {
                                      setAds(prev => prev.filter(a => a.id !== ad.id))
                                      alert('Ad deleted successfully')
                                    } else {
                                      alert('Failed to delete ad')
                                    }
                                  } catch (err) {
                                    alert('Error deleting ad: ' + err.message)
                                  }
                                }
                              }}
                              style={{
                                padding: '8px 12px',
                                fontSize: '13px',
                                border: '1px solid #b00020',
                                background: '#fff',
                                color: '#b00020',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )
                    })
                  })()}
                </div>
              </div>
            )}
          </div>
          )}
        </div>
      </div>
    </>
  )
}

