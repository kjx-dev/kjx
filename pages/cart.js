import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Header from '../components/Header'
import { FaTrash, FaShoppingCart, FaArrowRight } from 'react-icons/fa'

export default function Cart(){
  const router = useRouter()
  const [cart, setCart] = useState([])
  const [auth, setAuth] = useState({ email:'', isAuthenticated:false, name:'' })
  const [hydrated, setHydrated] = useState(false)

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
    try{
      const cartData = JSON.parse(localStorage.getItem('cart') || '[]')
      setCart(cartData)
    }catch(_){
      setCart([])
    }
  }, [router])

  function removeFromCart(postId){
    try{
      const updatedCart = cart.filter(item => item.post_id !== postId)
      setCart(updatedCart)
      localStorage.setItem('cart', JSON.stringify(updatedCart))
      // Dispatch event to update cart count in header
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cartUpdated'))
      }
    }catch(_){}
  }

  function formatPrice(val){
    try{
      if (val == null) return ''
      const num = Number(String(val).replace(/[^0-9.-]/g,''))
      if (isNaN(num)) return String(val)
      return 'Rs ' + num.toLocaleString('en-PK')
    }catch(e){ return String(val||'') }
  }

  const total = cart.reduce((sum, item) => {
    const price = Number(String(item.price||'0').replace(/[^0-9.-]/g,'')) || 0
    return sum + price
  }, 0)

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
          <h1 style={{fontSize: '28px', fontWeight: '600', marginBottom: '24px', color: '#012f34'}}>
            <FaShoppingCart style={{marginRight: '10px', display: 'inline'}} />
            Shopping Cart
          </h1>
          
          {cart.length === 0 ? (
            <div style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '60px 20px',
              textAlign: 'center',
              border: '1px solid rgba(1,47,52,.1)'
            }}>
              <FaShoppingCart style={{fontSize: '64px', color: 'rgba(1,47,52,.3)', marginBottom: '20px'}} />
              <h2 style={{fontSize: '24px', fontWeight: '600', marginBottom: '12px', color: '#012f34'}}>Your cart is empty</h2>
              <p style={{color: 'rgba(0,47,52,.64)', marginBottom: '24px'}}>Add items to your cart to continue shopping</p>
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
                Continue Shopping
              </button>
            </div>
          ) : (
            <div style={{display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px'}}>
              <div>
                <div style={{
                  background: '#fff',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid rgba(1,47,52,.1)'
                }}>
                  {cart.map((item, index) => (
                    <div key={item.post_id || index} style={{
                      display: 'flex',
                      gap: '16px',
                      padding: '20px 0',
                      borderBottom: index < cart.length - 1 ? '1px solid rgba(1,47,52,.1)' : 'none'
                    }}>
                      <div style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        background: '#f0f0f0',
                        flexShrink: 0
                      }}>
                        <img 
                          src={item.image || '/images/products/img1.jpg'} 
                          alt={item.title}
                          style={{width: '100%', height: '100%', objectFit: 'cover'}}
                        />
                      </div>
                      <div style={{flex: 1}}>
                        <h3 style={{
                          fontSize: '18px',
                          fontWeight: '600',
                          marginBottom: '8px',
                          color: '#012f34',
                          cursor: 'pointer'
                        }}
                        onClick={() => router.push('/product/' + item.post_id)}
                        >
                          {item.title}
                        </h3>
                        <p style={{color: 'rgba(0,47,52,.64)', marginBottom: '8px', fontSize: '14px'}}>
                          {item.location || 'Location not specified'}
                        </p>
                        <div style={{
                          fontSize: '20px',
                          fontWeight: '700',
                          color: '#f55100',
                          marginBottom: '12px'
                        }}>
                          {formatPrice(item.price)}
                        </div>
                        <button
                          onClick={() => removeFromCart(item.post_id)}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            background: 'transparent',
                            border: '1px solid rgba(1,47,52,.2)',
                            color: '#b00020',
                            cursor: 'pointer',
                            fontSize: '14px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <FaTrash /> Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div style={{
                background: '#fff',
                borderRadius: '12px',
                padding: '24px',
                border: '1px solid rgba(1,47,52,.1)',
                height: 'fit-content',
                position: 'sticky',
                top: '20px'
              }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  marginBottom: '20px',
                  color: '#012f34'
                }}>
                  Order Summary
                </h2>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                  fontSize: '16px',
                  color: 'rgba(0,47,52,.8)'
                }}>
                  <span>Subtotal ({cart.length} {cart.length === 1 ? 'item' : 'items'})</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div style={{
                  height: '1px',
                  background: 'rgba(1,47,52,.1)',
                  margin: '16px 0'
                }}></div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '24px',
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#012f34'
                }}>
                  <span>Total</span>
                  <span style={{color: '#f55100'}}>{formatPrice(total)}</span>
                </div>
                <button
                  onClick={() => router.push('/checkout')}
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #f55100 0%, #ff6b2b 100%)',
                    color: '#fff',
                    border: 'none',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(245,81,0,.3)'
                  }}
                >
                  Proceed to Checkout <FaArrowRight />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

