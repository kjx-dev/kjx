import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Header from '../components/Header'
import { FaCheckCircle, FaShoppingBag, FaMapMarkerAlt, FaPhone, FaEnvelope } from 'react-icons/fa'

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
            <h2>Order not found</h2>
            <button onClick={() => router.push('/')} style={{marginTop: '20px', padding: '12px 24px', background: '#f55100', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer'}}>
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
      <div style={{minHeight: '100vh', padding: '40px 20px', background: '#f5f5f5'}}>
        <div style={{maxWidth: '800px', margin: '0 auto'}}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '40px',
            border: '1px solid rgba(1,47,52,.1)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              boxShadow: '0 4px 20px rgba(37,211,102,.3)'
            }}>
              <FaCheckCircle style={{fontSize: '40px', color: '#fff'}} />
            </div>
            
            <h1 style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#012f34',
              marginBottom: '12px'
            }}>
              Order Confirmed!
            </h1>
            
            <p style={{
              fontSize: '18px',
              color: 'rgba(0,47,52,.64)',
              marginBottom: '32px'
            }}>
              Thank you for your order. We've received your order and will begin processing it right away.
            </p>
            
            <div style={{
              background: 'rgba(245,81,0,.05)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '32px',
              textAlign: 'left'
            }}>
              <div style={{fontSize: '14px', color: 'rgba(0,47,52,.64)', marginBottom: '8px'}}>Order ID</div>
              <div style={{fontSize: '20px', fontWeight: '700', color: '#f55100'}}>{order.orderId}</div>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px',
              marginBottom: '32px',
              textAlign: 'left'
            }}>
              <div style={{
                background: '#f9f9f9',
                borderRadius: '12px',
                padding: '20px'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  marginBottom: '16px',
                  color: '#012f34',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <FaShoppingBag style={{color: '#f55100'}} />
                  Order Details
                </h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: 'rgba(0,47,52,.8)'}}>
                  <div><strong>Items:</strong> {order.items.length}</div>
                  <div><strong>Total:</strong> {formatPrice(order.total)}</div>
                  <div><strong>Payment:</strong> {order.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 'Bank Transfer'}</div>
                  <div><strong>Status:</strong> <span style={{color: '#f55100', fontWeight: '600'}}>Pending</span></div>
                </div>
              </div>
              
              <div style={{
                background: '#f9f9f9',
                borderRadius: '12px',
                padding: '20px'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  marginBottom: '16px',
                  color: '#012f34',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <FaMapMarkerAlt style={{color: '#f55100'}} />
                  Shipping Address
                </h3>
                <div style={{fontSize: '14px', color: 'rgba(0,47,52,.8)', lineHeight: '1.6'}}>
                  <div style={{fontWeight: '600', marginBottom: '4px'}}>{order.shipping.fullName}</div>
                  <div>{order.shipping.address}</div>
                  <div>{order.shipping.city}, {order.shipping.postalCode}</div>
                  <div style={{marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px'}}>
                    <FaPhone style={{fontSize: '12px'}} />
                    {order.shipping.phone}
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                    <FaEnvelope style={{fontSize: '12px'}} />
                    {order.shipping.email}
                  </div>
                </div>
              </div>
            </div>
            
            <div style={{
              background: '#fff',
              border: '1px solid rgba(1,47,52,.1)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '32px',
              textAlign: 'left'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                marginBottom: '12px',
                color: '#012f34'
              }}>
                Order Items
              </h3>
              <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                {order.items.map((item, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '12px',
                    background: '#f9f9f9',
                    borderRadius: '8px'
                  }}>
                    <img 
                      src={item.image || '/images/products/img1.jpg'} 
                      alt={item.title}
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '6px',
                        objectFit: 'cover'
                      }}
                    />
                    <div style={{flex: 1}}>
                      <div style={{fontWeight: '500', fontSize: '14px', color: '#012f34', marginBottom: '4px'}}>
                        {item.title}
                      </div>
                      <div style={{fontSize: '16px', fontWeight: '700', color: '#f55100'}}>
                        {formatPrice(item.price)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div style={{display: 'flex', gap: '12px', justifyContent: 'center'}}>
              <button
                onClick={() => router.push('/')}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  background: '#fff',
                  border: '2px solid rgba(1,47,52,.2)',
                  color: '#012f34',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Continue Shopping
              </button>
              <button
                onClick={() => router.push('/manage')}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #f55100 0%, #ff6b2b 100%)',
                  border: 'none',
                  color: '#fff',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '16px',
                  boxShadow: '0 4px 12px rgba(245,81,0,.3)'
                }}
              >
                View My Orders
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

