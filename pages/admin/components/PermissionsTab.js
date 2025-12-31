import { useEffect, useState } from 'react'

export default function PermissionsTab({ error, setError }) {
  const [permissions, setPermissions] = useState({})
  const [permissionsLoading, setPermissionsLoading] = useState(false)
  const [togglingPermission, setTogglingPermission] = useState({})

  useEffect(() => {
    fetchPermissions()
  }, [])

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

  async function grantAllPermissionsForResource(role, resource) {
    const resourceKey = `${role}-${resource}-all`
    try {
      setError('')
      setTogglingPermission(prev => ({ ...prev, [resourceKey]: true }))
      
      const token = localStorage.getItem('auth_token')
      if (!token) {
        setError('Not authenticated')
        return
      }
      
      // Grant all actions for this resource
      const promises = actions.map(action => {
        const rolePerms = permissions[role] || []
        const hasPermission = rolePerms.some(p => p.resource === resource && p.action === action.key)
        
        if (!hasPermission) {
          return fetch('/api/v1/admin/permissions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              role,
              resource,
              action: action.key
            })
          })
        }
        return Promise.resolve()
      })
      
      await Promise.all(promises)
      await fetchPermissions() // Refresh permissions
    } catch (err) {
      console.error('Error granting all permissions for resource:', err)
      setError('Error granting all permissions: ' + (err.message || 'Unknown error'))
    } finally {
      setTogglingPermission(prev => {
        const next = { ...prev }
        delete next[resourceKey]
        return next
      })
    }
  }

  async function grantAllPermissionsForRole(role) {
    const roleKey = `${role}-all-all`
    try {
      setError('')
      setTogglingPermission(prev => ({ ...prev, [roleKey]: true }))
      
      const token = localStorage.getItem('auth_token')
      if (!token) {
        setError('Not authenticated')
        return
      }
      
      // Grant all permissions for all resources
      const promises = resources.flatMap(resource => 
        actions.map(action => {
          const rolePerms = permissions[role] || []
          const hasPermission = rolePerms.some(p => p.resource === resource.key && p.action === action.key)
          
          if (!hasPermission) {
            return fetch('/api/v1/admin/permissions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                role,
                resource: resource.key,
                action: action.key
              })
            })
          }
          return Promise.resolve()
        })
      )
      
      await Promise.all(promises)
      await fetchPermissions() // Refresh permissions
    } catch (err) {
      console.error('Error granting all permissions for role:', err)
      setError('Error granting all permissions: ' + (err.message || 'Unknown error'))
    } finally {
      setTogglingPermission(prev => {
        const next = { ...prev }
        delete next[roleKey]
        return next
      })
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
    { key: 'create', label: 'Create', icon: 'fa-plus' },
    { key: 'edit', label: 'Edit', icon: 'fa-pen' },
    { key: 'delete', label: 'Delete', icon: 'fa-trash' },
    { key: 'view', label: 'View', icon: 'fa-eye' }
  ]

  const roleColors = {
    admin: { bg: 'rgba(245, 81, 0, 0.08)', border: 'rgba(245, 81, 0, 0.2)', color: 'var(--primary-color)' },
    manager: { bg: 'rgba(245, 81, 0, 0.12)', border: 'rgba(245, 81, 0, 0.25)', color: 'var(--primary-color-dark)' },
    data_entry: { bg: 'rgba(245, 81, 0, 0.06)', border: 'rgba(245, 81, 0, 0.15)', color: 'var(--primary-color)' },
    user: { bg: 'rgba(1, 47, 52, 0.06)', border: 'rgba(1, 47, 52, 0.15)', color: 'var(--dark-teal)' }
  }

  return (
    <div style={{background: '#fff', borderRadius: '8px', border: '1px solid rgba(1,47,52,.2)', overflow: 'hidden'}}>
      <div style={{padding: '24px', borderBottom: '1px solid rgba(1,47,52,.1)', background: 'rgba(1,47,52,.02)'}}>
        <h2 style={{fontSize: '24px', fontWeight: '500', margin: '0 0 8px 0', color: 'var(--dark-teal)'}}>Role Permissions</h2>
        <p style={{fontSize: '14px', color: 'rgba(1,47,52,.64)', margin: 0, lineHeight: '1.5'}}>Manage access controls by assigning specific permissions to each role. Toggle permissions to grant or revoke access.</p>
      </div>
      
      {permissionsLoading ? (
        <div style={{padding: '60px', textAlign: 'center', color: 'rgba(1,47,52,.64)'}}>
          <i className="fa-solid fa-spinner fa-spin" style={{fontSize: '24px', marginBottom: '12px', display: 'block'}}></i>
          <div>Loading permissions...</div>
        </div>
      ) : (
        <div style={{padding: '24px'}}>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px'}}>
            {roles.map(role => {
              const roleColor = roleColors[role] || roleColors.user
              const rolePerms = permissions[role] || []
              const totalPerms = resources.length * actions.length
              const grantedPerms = rolePerms.length
              
              return (
                <div 
                  key={role} 
                  style={{
                    border: `1px solid ${roleColor.border}`,
                    borderRadius: '12px',
                    background: '#fff',
                    boxShadow: '0 2px 12px rgba(0,0,0,.06)',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.1)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,.06)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <div style={{
                    padding: '18px 20px',
                    borderBottom: `1px solid ${roleColor.border}`,
                    background: roleColor.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px', flex: 1}}>
                      <i className={`fa-solid fa-user-shield`} style={{fontSize: '16px'}}></i>
                      <h3 style={{
                        margin: 0,
                        fontSize: '18px',
                        fontWeight: '500',
                        color: roleColor.color,
                        textTransform: 'capitalize'
                      }}>
                        {role.replace('_', ' ')}
                      </h3>
                    </div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: '500',
                        color: 'rgba(1,47,52,.64)',
                        background: '#fff',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        border: `1px solid ${roleColor.border}`
                      }}>
                        {grantedPerms}/{totalPerms}
                      </div>
                      <button
                        onClick={() => grantAllPermissionsForRole(role)}
                        disabled={togglingPermission[`${role}-all-all`] || grantedPerms === totalPerms}
                        style={{
                          padding: '6px 12px',
                          fontSize: '11px',
                          fontWeight: '500',
                          color: '#fff',
                          background: togglingPermission[`${role}-all-all`] || grantedPerms === totalPerms ? 'rgba(1,47,52,0.3)' : 'var(--primary-color)',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: togglingPermission[`${role}-all-all`] || grantedPerms === totalPerms ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          opacity: togglingPermission[`${role}-all-all`] ? 0.6 : 1
                        }}
                        title={grantedPerms === totalPerms ? 'All permissions already granted' : 'Grant all permissions for this role'}
                      >
                        <i className="fa-solid fa-check-double" style={{fontSize: '10px'}}></i>
                        All
                      </button>
                    </div>
                  </div>
                  
                  <div style={{padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px'}}>
                    {resources.map(resource => {
                      const resourcePerms = rolePerms.filter(p => p.resource === resource.key)
                      
                      return (
                        <div key={resource.key} style={{
                          border: '1px solid rgba(1,47,52,.1)',
                          borderRadius: '10px',
                          padding: '16px',
                          background: '#f7f8f8',
                          transition: 'all 0.2s ease'
                        }}>
                          <div style={{
                            marginBottom: '14px',
                            fontSize: '15px',
                            fontWeight: '600',
                            color: 'var(--dark-teal)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}>
                            <span style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                              <i className={`fa-solid fa-folder`} style={{fontSize: '14px', color: 'var(--primary-color)'}}></i>
                              {resource.label}
                            </span>
                            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                              <span style={{
                                fontSize: '11px',
                                fontWeight: '500',
                                color: 'rgba(1,47,52,.6)',
                                background: '#fff',
                                padding: '2px 8px',
                                borderRadius: '10px'
                              }}>
                                {resourcePerms.length}/{actions.length}
                              </span>
                              <button
                                onClick={() => grantAllPermissionsForResource(role, resource.key)}
                                disabled={togglingPermission[`${role}-${resource.key}-all`] || resourcePerms.length === actions.length}
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '10px',
                                  fontWeight: '500',
                                  color: '#fff',
                                  background: togglingPermission[`${role}-${resource.key}-all`] || resourcePerms.length === actions.length ? 'rgba(1,47,52,0.3)' : 'var(--primary-color)',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: togglingPermission[`${role}-${resource.key}-all`] || resourcePerms.length === actions.length ? 'not-allowed' : 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  opacity: togglingPermission[`${role}-${resource.key}-all`] ? 0.6 : 1
                                }}
                                title={resourcePerms.length === actions.length ? 'All permissions already granted' : 'Grant all permissions for this resource'}
                              >
                                <i className="fa-solid fa-check" style={{fontSize: '9px'}}></i>
                                All
                              </button>
                            </div>
                          </div>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                            gap: '10px'
                          }}>
                            {actions.map(action => {
                              const checked = hasPermission(role, resource.key, action.key)
                              const key = `${role}-${resource.key}-${action.key}`
                              const isToggling = togglingPermission[key]
                              
                              return (
                                <button
                                  key={key}
                                  type="button"
                                  onClick={() => togglePermission(role, resource.key, action.key)}
                                  disabled={isToggling}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '12px 14px',
                                    borderRadius: '8px',
                                    border: checked ? `2px solid ${roleColor.color}` : '2px solid rgba(1,47,52,.15)',
                                    background: checked ? roleColor.bg : '#fff',
                                    cursor: isToggling ? 'wait' : 'pointer',
                                    opacity: isToggling ? 0.6 : 1,
                                    transition: 'all 0.2s ease',
                                    textAlign: 'left',
                                    fontFamily: 'inherit'
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!isToggling) {
                                      e.currentTarget.style.transform = 'translateY(-2px)'
                                      e.currentTarget.style.boxShadow = checked 
                                        ? `0 4px 12px ${roleColor.color}20` 
                                        : '0 2px 8px rgba(0,0,0,.08)'
                                      e.currentTarget.style.borderColor = checked ? roleColor.color : 'rgba(1,47,52,.3)'
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)'
                                    e.currentTarget.style.boxShadow = 'none'
                                  }}
                                  title={isToggling ? 'Updating...' : (checked ? `Remove ${action.label} permission` : `Grant ${action.label} permission`)}
                                >
                                  <div style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '4px',
                                    border: checked ? `2px solid ${roleColor.color}` : '2px solid rgba(1,47,52,.3)',
                                    background: checked ? roleColor.color : 'transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    transition: 'all 0.2s ease'
                                  }}>
                                    {checked && (
                                      <i className="fa-solid fa-check" style={{fontSize: '11px', color: '#fff'}}></i>
                                    )}
                                  </div>
                                  <div style={{display: 'flex', alignItems: 'center', gap: '6px', flex: 1}}>
                                    {action.icon && (
                                      <i className={`fa-solid ${action.icon}`} style={{
                                        fontSize: '12px',
                                        color: checked ? roleColor.color : 'rgba(1,47,52,.5)'
                                      }}></i>
                                    )}
                                    <span style={{
                                      fontSize: '13px',
                                      color: checked ? 'var(--dark-teal)' : 'rgba(1,47,52,.7)',
                                      fontWeight: checked ? '600' : '500',
                                      lineHeight: '1.2'
                                    }}>
                                      {action.label}
                                    </span>
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

