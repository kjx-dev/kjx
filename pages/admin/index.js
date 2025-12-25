import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Header from '../../components/Header'
import UsersTab from './components/UsersTab'
import PermissionsTab from './components/PermissionsTab'
import AdsTab from './components/AdsTab'
import CategoriesTab from './components/CategoriesTab'

export default function Admin(){
  const router = useRouter()
  const [auth, setAuth] = useState({ email:'', isAuthenticated:false, name:'' })
  const [activeTab, setActiveTab] = useState('users')
  const [error, setError] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const email = localStorage.getItem('email') || ''
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
    const name = localStorage.getItem('name') || ''
    setAuth({ email, isAuthenticated, name })
    if (!isAuthenticated || !email) { 
      router.push('/login')
      return 
    }
    
    // Check if user is admin
    async function checkAdminStatus(){
      try{
        setChecking(true)
        const token = localStorage.getItem('auth_token')
        if (!token) { 
          setIsAdmin(false)
          setChecking(false)
          router.push('/')
          return 
        }
        const res = await fetch('/api/v1/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok){
          const data = await res.json()
          const userIsAdmin = data.user?.role === 'admin'
          setIsAdmin(userIsAdmin)
          if (!userIsAdmin) {
            router.push('/')
            return
          }
        } else {
          setIsAdmin(false)
          router.push('/')
          return
        }
      }catch(_){
        setIsAdmin(false)
        router.push('/')
        return
      } finally {
        setChecking(false)
      }
    }
    checkAdminStatus()
  }, [router])
  
  // Don't render admin panel until we've checked admin status
  if (checking || !isAdmin) {
    return (
      <>
        <Header />
        <div style={{minHeight: '100vh', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div>Loading...</div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div style={{minHeight: '100vh', padding: '20px'}}>
        <div style={{maxWidth: '1400px', margin: '0 auto'}}>
          <h1 style={{fontSize: '32px', fontWeight: '600', marginBottom: '20px'}}>Admin Panel</h1>
          
          {/* Tabs */}
          <div className="tabs" style={{marginBottom: '20px'}}>
            <button
              className={`tab ${activeTab === 'users' ? 'tab--active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              Users
            </button>
            <button
              className={`tab ${activeTab === 'permissions' ? 'tab--active' : ''}`}
              onClick={() => setActiveTab('permissions')}
            >
              Role Permissions
            </button>
            <button
              className={`tab ${activeTab === 'ads' ? 'tab--active' : ''}`}
              onClick={() => setActiveTab('ads')}
            >
              Manage Ads
            </button>
            <button
              className={`tab ${activeTab === 'categories' ? 'tab--active' : ''}`}
              onClick={() => setActiveTab('categories')}
            >
              Categories
            </button>
          </div>

          {error && (
            <div style={{padding: '12px 20px', marginBottom: '20px', color: '#b00020', background: '#ffebee', borderRadius: '4px'}}>
              {error}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && <UsersTab error={error} setError={setError} />}

          {/* Permissions Tab */}
          {activeTab === 'permissions' && <PermissionsTab error={error} setError={setError} />}

          {/* Ads Management Tab */}
          {activeTab === 'ads' && <AdsTab error={error} setError={setError} />}

          {/* Categories Tab */}
          {activeTab === 'categories' && <CategoriesTab error={error} setError={setError} />}
        </div>
      </div>
    </>
  )
}

