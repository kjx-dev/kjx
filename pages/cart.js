import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Header from '../components/Header'
import Footer from '../components/Footer'
import Image from 'next/image'
import { FaTrash, FaShoppingCart, FaArrowRight, FaMapMarkerAlt, FaPlus, FaMinus } from 'react-icons/fa'

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
      <div style={{minHeight: '100vh', padding: '20px', background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'}}>
        <div style={{maxWidth: '1400px', margin: '0 auto'}}>
          <div style={{marginBottom: '32px'}}>
            <h1 style={{
              fontSize: '32px', 
              fontWeight: '700', 
              marginBottom: '8px', 
              color: '#012f34',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #f55100 0%, #ff6b2b 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(245,81,0,.25)'
              }}>
                <FaShoppingCart style={{color: '#fff', fontSize: '20px'}} />
              </div>
              Shopping Cart
            </h1>
            <p style={{color: 'rgba(0,47,52,.64)', fontSize: '15px', marginLeft: '60px'}}>
              {cart.length} {cart.length === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>
          
          {cart.length === 0 ? (
            <div style={{
              background: '#fff',
              borderRadius: '20px',
              padding: '80px 40px',
              textAlign: 'center',
              border: '1px solid rgba(1,47,52,.08)',
              boxShadow: '0 4px 20px rgba(0,0,0,.04)',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(245,81,0,.1) 0%, rgba(255,107,43,.1) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                border: '3px solid rgba(245,81,0,.15)'
              }}>
                <FaShoppingCart style={{fontSize: '48px', color: 'rgba(245,81,0,.4)'}} />
              </div>
              <h2 style={{fontSize: '28px', fontWeight: '700', marginBottom: '12px', color: '#012f34'}}>
                Your cart is empty
              </h2>
              <p style={{color: 'rgba(0,47,52,.64)', marginBottom: '32px', fontSize: '16px', lineHeight: '1.6'}}>
                Looks like you haven't added anything to your cart yet.<br />
                Start shopping to fill it up!
              </p>
              <button 
                onClick={() => router.push('/')}
                style={{
                  padding: '14px 32px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #f55100 0%, #ff6b2b 100%)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '16px',
                  boxShadow: '0 4px 12px rgba(245,81,0,.3)',
                  transition: 'all 0.2s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(245,81,0,.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(245,81,0,.3)'
                }}
              >
                Continue Shopping <FaArrowRight />
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid', 
              gridTemplateColumns: '1fr 420px', 
              gap: '28px', 
              alignItems: 'start'
            }}
            className="cart-grid"
            >
              <div>
                <div style={{
                  background: '#fff',
                  borderRadius: '20px',
                  padding: '24px',
                  border: '1px solid rgba(1,47,52,.08)',
                  boxShadow: '0 4px 20px rgba(0,0,0,.04)'
                }}>
                  {cart.map((item, index) => (
                    <div 
                      key={item.post_id || index} 
                      style={{
                        display: 'flex',
                        gap: '20px',
                        padding: '24px 0',
                        borderBottom: index < cart.length - 1 ? '1px solid rgba(1,47,52,.08)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(245,81,0,.02)'
                        e.currentTarget.style.borderRadius = '12px'
                        e.currentTarget.style.paddingLeft = '28px'
                        e.currentTarget.style.paddingRight = '28px'
                        e.currentTarget.style.marginLeft = '-4px'
                        e.currentTarget.style.marginRight = '-4px'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.paddingLeft = '0'
                        e.currentTarget.style.paddingRight = '0'
                        e.currentTarget.style.marginLeft = '0'
                        e.currentTarget.style.marginRight = '0'
                      }}
                    >
                      <div style={{
                        width: '140px',
                        height: '140px',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                        flexShrink: 0,
                        position: 'relative',
                        boxShadow: '0 2px 8px rgba(0,0,0,.08)',
                        cursor: 'pointer'
                      }}
                      onClick={() => router.push('/product/' + item.post_id)}
                      >
                        <Image 
                          src={item.image || '/images/products/img1.jpg'} 
                          alt={item.title}
                          fill
                          style={{objectFit: 'cover'}}
                          sizes="140px"
                          unoptimized
                        />
                      </div>
                      <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
                        <div>
                          <h3 style={{
                            fontSize: '20px',
                            fontWeight: '700',
                            marginBottom: '8px',
                            color: '#012f34',
                            cursor: 'pointer',
                            lineHeight: '1.3',
                            transition: 'color 0.2s ease'
                          }}
                          onClick={() => router.push('/product/' + item.post_id)}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#f55100'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#012f34'}
                          >
                            {item.title}
                          </h3>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: 'rgba(0,47,52,.64)',
                            marginBottom: '12px',
                            fontSize: '14px'
                          }}>
                            <FaMapMarkerAlt style={{fontSize: '12px'}} />
                            <span>{item.location || 'Location not specified'}</span>
                          </div>
                          <div style={{
                            fontSize: '24px',
                            fontWeight: '700',
                            color: '#f55100',
                            marginBottom: '16px',
                            display: 'flex',
                            alignItems: 'baseline',
                            gap: '4px'
                          }}>
                            {formatPrice(item.price)}
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.post_id)}
                          style={{
                            padding: '10px 18px',
                            borderRadius: '10px',
                            background: 'transparent',
                            border: '2px solid rgba(176,0,32,.2)',
                            color: '#b00020',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            width: 'fit-content',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(176,0,32,.08)'
                            e.currentTarget.style.borderColor = '#b00020'
                            e.currentTarget.style.transform = 'translateY(-1px)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent'
                            e.currentTarget.style.borderColor = 'rgba(176,0,32,.2)'
                            e.currentTarget.style.transform = 'translateY(0)'
                          }}
                        >
                          <FaTrash style={{fontSize: '12px'}} /> Remove Item
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div style={{
                background: '#fff',
                borderRadius: '20px',
                padding: '28px',
                border: '1px solid rgba(1,47,52,.08)',
                boxShadow: '0 4px 20px rgba(0,0,0,.04)',
                height: 'fit-content',
                position: 'sticky',
                top: '20px'
              }}>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  marginBottom: '24px',
                  color: '#012f34',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #f55100 0%, #ff6b2b 100%)'
                  }}></div>
                  Order Summary
                </h2>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                  fontSize: '16px',
                  color: 'rgba(0,47,52,.8)',
                  padding: '12px 0'
                }}>
                  <span style={{fontWeight: '500'}}>Subtotal ({cart.length} {cart.length === 1 ? 'item' : 'items'})</span>
                  <span style={{fontWeight: '600', color: '#012f34'}}>{formatPrice(total)}</span>
                </div>
                <div style={{
                  height: '2px',
                  background: 'linear-gradient(90deg, transparent 0%, rgba(1,47,52,.1) 50%, transparent 100%)',
                  margin: '20px 0'
                }}></div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '28px',
                  padding: '16px',
                  background: 'linear-gradient(135deg, rgba(245,81,0,.05) 0%, rgba(255,107,43,.05) 100%)',
                  borderRadius: '12px',
                  border: '1px solid rgba(245,81,0,.1)'
                }}>
                  <span style={{fontSize: '18px', fontWeight: '700', color: '#012f34'}}>Total</span>
                  <span style={{fontSize: '28px', fontWeight: '800', color: '#f55100'}}>{formatPrice(total)}</span>
                </div>
                <button
                  onClick={() => router.push('/checkout')}
                  style={{
                    width: '100%',
                    padding: '18px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #f55100 0%, #ff6b2b 100%)',
                    color: '#fff',
                    border: 'none',
                    fontWeight: '700',
                    cursor: 'pointer',
                    fontSize: '17px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    boxShadow: '0 6px 20px rgba(245,81,0,.35)',
                    transition: 'all 0.2s ease',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(245,81,0,.45)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(245,81,0,.35)'
                  }}
                >
                  Proceed to Checkout <FaArrowRight />
                </button>
                <div style={{
                  marginTop: '20px',
                  padding: '16px',
                  background: 'rgba(1,47,52,.03)',
                  borderRadius: '12px',
                  fontSize: '13px',
                  color: 'rgba(0,47,52,.64)',
                  lineHeight: '1.6',
                  textAlign: 'center'
                }}>
                  <p style={{margin: 0}}>
                    🔒 Secure checkout • Free returns • 24/7 support
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}

