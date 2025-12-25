import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Header from '../components/Header'
import { FaShoppingBag, FaMapMarkerAlt, FaPhone, FaEnvelope, FaCalendar, FaCheckCircle, FaClock, FaTimesCircle } from 'react-icons/fa'

export default function Orders(){
  const router = useRouter()
  const [orders, setOrders] = useState([])
  const [auth, setAuth] = useState({ email:'', isAuthenticated:false, name:'' })
  const [hydrated, setHydrated] = useState(false)
  const [filter, setFilter] = useState('all') // all, pending, completed, cancelled

  useEffect(() => {
    setHydrated(true)
    const email = localStorage.getItem('email') || ''
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
    const name = localStorage.getItem('name') || ''
    setAuth({ email, isAuthenticated, name })
    
    if (!isAuthenticated || !email) { 
      router.push('/login')
      return 
    }
    
    // Get current user ID
    function getUserId(){
      try{
        const tok = localStorage.getItem('auth_token')||''
        const parts = String(tok||'').split('.')
        if (parts.length<3) return null
        const data = parts[1]
        const pad = data.length%4===2 ? '==' : data.length%4===3 ? '=' : ''
        const norm = data.replace(/-/g,'+').replace(/_/g,'/') + pad
        const json = JSON.parse(atob(norm))
        return json && json.sub ? json.sub : null
      }catch(_){ return null }
    }
    
    const currentUserId = getUserId()
    
    try{
      const ordersData = JSON.parse(localStorage.getItem('orders') || '[]')
      // Filter orders where current user is the buyer
      const userOrders = ordersData.filter(order => order.buyer_id === currentUserId)
      // Sort by order date (newest first)
      const sortedOrders = userOrders.sort((a, b) => {
        const dateA = new Date(a.orderDate || 0)
        const dateB = new Date(b.orderDate || 0)
        return dateB - dateA
      })
      setOrders(sortedOrders)
    }catch(_){
      setOrders([])
    }
  }, [router])

  function getStatusIcon(status){
    switch(status){
      case 'completed':
        return <FaCheckCircle style={{color: '#25D366', fontSize: '16px'}} />
      case 'cancelled':
        return <FaTimesCircle style={{color: '#b00020', fontSize: '16px'}} />
      default:
        return <FaClock style={{color: '#f55100', fontSize: '16px'}} />
    }
  }

  function getStatusColor(status){
    switch(status){
      case 'completed':
        return '#25D366'
      case 'cancelled':
        return '#b00020'
      default:
        return '#f55100'
    }
  }

  function formatPrice(val){
    try{
      if (val == null) return ''
      const num = Number(String(val).replace(/[^0-9.-]/g,''))
      if (isNaN(num)) return String(val)
      return 'Rs ' + num.toLocaleString('en-PK')
    }catch(e){ return String(val||'') }
  }

  function formatDate(dateString){
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

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(order => order.status === filter)

  if (!hydrated) {
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
      <div style={{minHeight: '100vh', padding: '20px', background: '#f5f5f5'}}>
        <div style={{maxWidth: '1200px', margin: '0 auto'}}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px'}}>
            <h1 style={{fontSize: '28px', fontWeight: '600', color: '#012f34', display: 'flex', alignItems: 'center', gap: '12px'}}>
              <FaShoppingBag style={{color: '#f55100'}} />
              My Orders
            </h1>
            <div style={{display: 'flex', gap: '8px'}}>
              {['all', 'pending', 'completed', 'cancelled'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(1,47,52,.2)',
                    background: filter === status ? '#f55100' : '#fff',
                    color: filter === status ? '#fff' : '#012f34',
                    fontWeight: filter === status ? '600' : '400',
                    cursor: 'pointer',
                    fontSize: '14px',
                    textTransform: 'capitalize'
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
          
          {filteredOrders.length === 0 ? (
            <div style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '60px 20px',
              textAlign: 'center',
              border: '1px solid rgba(1,47,52,.1)'
            }}>
              <FaShoppingBag style={{fontSize: '64px', color: 'rgba(1,47,52,.3)', marginBottom: '20px'}} />
              <h2 style={{fontSize: '24px', fontWeight: '600', marginBottom: '12px', color: '#012f34'}}>No orders found</h2>
              <p style={{color: 'rgba(0,47,52,.64)', marginBottom: '24px'}}>
                {filter === 'all' 
                  ? "You haven't placed any orders yet"
                  : `You don't have any ${filter} orders`
                }
              </p>
              <button 
                onClick={() => router.push('/')}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  background: '#f55100',
                  color: '#fff',
                  border: 'none',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
              {filteredOrders.map((order, index) => (
                <div
                  key={order.orderId || index}
                  style={{
                    background: '#fff',
                    borderRadius: '12px',
                    padding: '24px',
                    border: '1px solid rgba(1,47,52,.1)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,.1)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                  onClick={() => router.push('/order-confirmation?orderId=' + encodeURIComponent(order.orderId))}
                >
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px'}}>
                    <div>
                      <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px'}}>
                        <h3 style={{fontSize: '18px', fontWeight: '600', color: '#012f34', margin: 0}}>
                          Order #{order.orderId}
                        </h3>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          background: getStatusColor(order.status || 'pending') + '15',
                          color: getStatusColor(order.status || 'pending'),
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {getStatusIcon(order.status || 'pending')}
                          {(order.status || 'pending').charAt(0).toUpperCase() + (order.status || 'pending').slice(1)}
                        </span>
                      </div>
                      <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(0,47,52,.64)', fontSize: '14px'}}>
                        <FaCalendar style={{fontSize: '12px'}} />
                        <span>{formatDate(order.orderDate)}</span>
                      </div>
                    </div>
                    <div style={{textAlign: 'right'}}>
                      <div style={{fontSize: '24px', fontWeight: '700', color: '#f55100', marginBottom: '4px'}}>
                        {formatPrice(order.total)}
                      </div>
                      <div style={{fontSize: '14px', color: 'rgba(0,47,52,.64)'}}>
                        {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{
                    height: '1px',
                    background: 'rgba(1,47,52,.1)',
                    margin: '16px 0'
                  }}></div>
                  
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px'}}>
                    <div>
                      <div style={{fontSize: '12px', color: 'rgba(0,47,52,.64)', marginBottom: '8px', fontWeight: '500'}}>
                        SHIPPING ADDRESS
                      </div>
                      <div style={{fontSize: '14px', color: '#012f34', lineHeight: '1.6'}}>
                        <div style={{fontWeight: '600', marginBottom: '4px'}}>{order.shipping?.fullName}</div>
                        <div>{order.shipping?.address}</div>
                        <div>{order.shipping?.city}, {order.shipping?.postalCode}</div>
                      </div>
                    </div>
                    <div>
                      <div style={{fontSize: '12px', color: 'rgba(0,47,52,.64)', marginBottom: '8px', fontWeight: '500'}}>
                        PAYMENT METHOD
                      </div>
                      <div style={{fontSize: '14px', color: '#012f34', fontWeight: '500'}}>
                        {order.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 'Bank Transfer'}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div style={{fontSize: '12px', color: 'rgba(0,47,52,.64)', marginBottom: '8px', fontWeight: '500'}}>
                      ORDER ITEMS
                    </div>
                    <div style={{display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px'}}>
                      {order.items?.slice(0, 5).map((item, idx) => (
                        <div key={idx} style={{
                          flexShrink: 0,
                          width: '80px',
                          height: '80px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          background: '#f0f0f0',
                          position: 'relative'
                        }}>
                          <img 
                            src={item.image || '/images/products/img1.jpg'} 
                            alt={item.title}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        </div>
                      ))}
                      {order.items?.length > 5 && (
                        <div style={{
                          flexShrink: 0,
                          width: '80px',
                          height: '80px',
                          borderRadius: '8px',
                          background: 'rgba(1,47,52,.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#012f34'
                        }}>
                          +{order.items.length - 5}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

