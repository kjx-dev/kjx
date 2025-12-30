import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Header from '../components/Header'
import { FaCheckCircle, FaShoppingBag, FaMapMarkerAlt, FaPhone, FaEnvelope, FaBox, FaCreditCard, FaCalendar, FaHome, FaArrowRight } from 'react-icons/fa'

export default function OrderConfirmation(){
  const router = useRouter()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const orderId = router.query.orderId
    if (!orderId) {
      router.push('/')
      return
    }
    
    try{
      const orders = JSON.parse(localStorage.getItem('orders') || '[]')
      const foundOrder = orders.find(o => o.orderId === orderId)
      if (foundOrder) {
        setOrder(foundOrder)
      } else {
        router.push('/')
      }
    }catch(_){
      router.push('/')
    } finally {
      setLoading(false)
    }
  }, [router.query.orderId])

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
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <div style={{minHeight: '100vh', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div>Loading...</div>
        </div>
      </>
    )
  }

  if (!order) {
    return (
      <>
        <Header />
        <div style={{minHeight: '100vh', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{textAlign: 'center'}}>
            <h2 style={{fontWeight: '500'}}>Order not found</h2>
            <button 
              onClick={() => router.push('/')} 
              style={{
                marginTop: '20px', 
                padding: '12px 24px', 
                background: '#f55100', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: 'pointer',
                fontWeight: '400'
              }}
            >
              Go to Home
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div style={{minHeight: '100vh', padding: '40px 20px', background: 'linear-gradient(to bottom, #f8f9fa 0%, #f5f5f5 100%)'}}>
        <div style={{maxWidth: '1000px', margin: '0 auto'}}>
          {/* Success Header */}
          <div style={{
            background: '#fff',
            borderRadius: '20px',
            padding: '48px 40px',
            border: '1px solid rgba(1,47,52,.08)',
            textAlign: 'center',
            marginBottom: '32px',
            boxShadow: '0 4px 20px rgba(0,0,0,.06)'
          }}>
            <div style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 28px',
              boxShadow: '0 8px 24px rgba(37,211,102,.25)',
              animation: 'pulse 2s ease-in-out infinite'
            }}>
              <FaCheckCircle style={{fontSize: '48px', color: '#fff'}} />
            </div>
            
            <h1 style={{
              fontSize: '36px',
              fontWeight: '500',
              color: '#012f34',
              marginBottom: '12px',
              letterSpacing: '-0.5px'
            }}>
              Order Confirmed!
            </h1>
            
            <p style={{
              fontSize: '17px',
              color: 'rgba(0,47,52,.7)',
              marginBottom: '32px',
              lineHeight: '1.6',
              maxWidth: '600px',
              margin: '0 auto 32px'
            }}>
              Thank you for your order! We've received your order and will begin processing it right away. You'll receive a confirmation email shortly.
            </p>
            
            <div style={{
              background: 'linear-gradient(135deg, rgba(245,81,0,.08) 0%, rgba(255,107,43,.08) 100%)',
              borderRadius: '16px',
              padding: '24px 32px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '16px',
              border: '1px solid rgba(245,81,0,.15)'
            }}>
              <div>
                <div style={{fontSize: '13px', color: 'rgba(0,47,52,.6)', marginBottom: '6px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Order ID</div>
                <div style={{fontSize: '24px', fontWeight: '500', color: '#f55100', fontFamily: 'monospace', letterSpacing: '1px'}}>{order.orderId}</div>
              </div>
              <div style={{width: '1px', height: '40px', background: 'rgba(245,81,0,.2)'}}></div>
              <div>
                <div style={{fontSize: '13px', color: 'rgba(0,47,52,.6)', marginBottom: '6px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Order Date</div>
                <div style={{fontSize: '16px', fontWeight: '500', color: '#012f34'}}>{formatDate(order.orderDate)}</div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
            marginBottom: '32px'
          }}>
            {/* Order Summary Card */}
            <div style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '28px',
              border: '1px solid rgba(1,47,52,.08)',
              boxShadow: '0 4px 20px rgba(0,0,0,.06)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '24px',
                paddingBottom: '20px',
                borderBottom: '1px solid rgba(1,47,52,.1)'
              }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(245,81,0,.1) 0%, rgba(255,107,43,.1) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FaShoppingBag style={{fontSize: '20px', color: '#f55100'}} />
                </div>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '500',
                  color: '#012f34',
                  margin: 0
                }}>
                  Order Summary
                </h2>
              </div>
              
              <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <span style={{fontSize: '14px', color: 'rgba(0,47,52,.7)'}}>Items</span>
                  <span style={{fontSize: '16px', fontWeight: '500', color: '#012f34'}}>{order.items.length} {order.items.length === 1 ? 'item' : 'items'}</span>
                </div>
                <div style={{height: '1px', background: 'rgba(1,47,52,.1)'}}></div>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <span style={{fontSize: '14px', color: 'rgba(0,47,52,.7)'}}>Payment Method</span>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <FaCreditCard style={{fontSize: '14px', color: '#f55100'}} />
                    <span style={{fontSize: '16px', fontWeight: '500', color: '#012f34'}}>
                      {order.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 'Bank Transfer'}
                    </span>
                  </div>
                </div>
                <div style={{height: '1px', background: 'rgba(1,47,52,.1)'}}></div>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <span style={{fontSize: '14px', color: 'rgba(0,47,52,.7)'}}>Status</span>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#f55100',
                    background: 'rgba(245,81,0,.1)',
                    padding: '6px 12px',
                    borderRadius: '20px'
                  }}>
                    {order.status || 'Pending'}
                  </span>
                </div>
                <div style={{
                  marginTop: '8px',
                  padding: '16px',
                  background: 'linear-gradient(135deg, rgba(245,81,0,.05) 0%, rgba(255,107,43,.05) 100%)',
                  borderRadius: '12px',
                  border: '1px solid rgba(245,81,0,.1)'
                }}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <span style={{fontSize: '16px', fontWeight: '500', color: '#012f34'}}>Total Amount</span>
                    <span style={{fontSize: '24px', fontWeight: '500', color: '#f55100'}}>{formatPrice(order.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Address Card */}
            <div style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '28px',
              border: '1px solid rgba(1,47,52,.08)',
              boxShadow: '0 4px 20px rgba(0,0,0,.06)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '24px',
                paddingBottom: '20px',
                borderBottom: '1px solid rgba(1,47,52,.1)'
              }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(58,119,255,.1) 0%, rgba(88,144,255,.1) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FaMapMarkerAlt style={{fontSize: '20px', color: '#3a77ff'}} />
                </div>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '500',
                  color: '#012f34',
                  margin: 0
                }}>
                  Shipping Address
                </h2>
              </div>
              
              <div style={{fontSize: '15px', color: '#012f34', lineHeight: '1.8'}}>
                <div style={{fontWeight: '500', marginBottom: '8px', fontSize: '16px'}}>{order.shipping.fullName}</div>
                <div style={{color: 'rgba(0,47,52,.8)', marginBottom: '4px', display: 'flex', alignItems: 'flex-start', gap: '8px'}}>
                  <FaHome style={{fontSize: '14px', marginTop: '4px', color: 'rgba(0,47,52,.5)'}} />
                  <span>{order.shipping.address}</span>
                </div>
                <div style={{color: 'rgba(0,47,52,.8)', marginBottom: '12px'}}>
                  {order.shipping.city}, {order.shipping.postalCode}
                </div>
                <div style={{
                  paddingTop: '16px',
                  borderTop: '1px solid rgba(1,47,52,.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(0,47,52,.8)'}}>
                    <FaPhone style={{fontSize: '14px', color: 'rgba(0,47,52,.5)'}} />
                    <span>{order.shipping.phone}</span>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(0,47,52,.8)'}}>
                    <FaEnvelope style={{fontSize: '14px', color: 'rgba(0,47,52,.5)'}} />
                    <span>{order.shipping.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items Card */}
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '28px',
            border: '1px solid rgba(1,47,52,.08)',
            boxShadow: '0 4px 20px rgba(0,0,0,.06)',
            marginBottom: '32px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '24px',
              paddingBottom: '20px',
              borderBottom: '1px solid rgba(1,47,52,.1)'
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(245,81,0,.1) 0%, rgba(255,107,43,.1) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FaBox style={{fontSize: '20px', color: '#f55100'}} />
              </div>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '500',
                color: '#012f34',
                margin: 0
              }}>
                Order Items
              </h2>
            </div>
            
            <div style={{display: 'grid', gap: '16px'}}>
              {order.items.map((item, index) => (
                <div key={index} style={{
                  display: 'flex',
                  gap: '16px',
                  padding: '16px',
                  background: '#f8f9fa',
                  borderRadius: '12px',
                  border: '1px solid rgba(1,47,52,.08)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f0f2f5'
                  e.currentTarget.style.borderColor = 'rgba(1,47,52,.12)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f8f9fa'
                  e.currentTarget.style.borderColor = 'rgba(1,47,52,.08)'
                }}
                >
                  <img 
                    src={item.image || '/images/products/img1.jpg'} 
                    alt={item.title}
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '10px',
                      objectFit: 'cover',
                      border: '1px solid rgba(1,47,52,.08)'
                    }}
                  />
                  <div style={{flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div>
                      <div style={{fontWeight: '500', fontSize: '16px', color: '#012f34', marginBottom: '6px'}}>
                        {item.title}
                      </div>
                      <div style={{fontSize: '14px', color: 'rgba(0,47,52,.6)'}}>
                        {item.location || 'Location not specified'}
                      </div>
                    </div>
                    <div style={{
                      fontSize: '20px',
                      fontWeight: '500',
                      color: '#f55100',
                      textAlign: 'right'
                    }}>
                      {formatPrice(item.price)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => router.push('/')}
              style={{
                padding: '14px 32px',
                borderRadius: '12px',
                background: '#fff',
                border: '2px solid rgba(1,47,52,.2)',
                color: '#012f34',
                fontWeight: '400',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f8f9fa'
                e.currentTarget.style.borderColor = 'rgba(1,47,52,.3)'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#fff'
                e.currentTarget.style.borderColor = 'rgba(1,47,52,.2)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              Continue Shopping
            </button>
            <button
              onClick={() => router.push('/orders')}
              style={{
                padding: '14px 32px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #f55100 0%, #ff6b2b 100%)',
                border: 'none',
                color: '#fff',
                fontWeight: '400',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 4px 16px rgba(245,81,0,.3)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(245,81,0,.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(245,81,0,.3)'
              }}
            >
              View My Orders
              <FaArrowRight style={{fontSize: '14px'}} />
            </button>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        
        @media (max-width: 768px) {
          div[style*="grid-template-columns: '1fr 1fr'"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  )
}
