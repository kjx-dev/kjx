import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Header from '../components/Header'
import { FaLock, FaCreditCard, FaMapMarkerAlt, FaUser, FaPhone, FaEnvelope, FaHome } from 'react-icons/fa'

export default function Checkout(){
  const router = useRouter()
  const [cart, setCart] = useState([])
  const [auth, setAuth] = useState({ email:'', isAuthenticated:false, name:'', phone:'' })
  const [hydrated, setHydrated] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    paymentMethod: 'cash_on_delivery',
    notes: ''
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    setHydrated(true)
    const email = localStorage.getItem('email') || ''
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
    const name = localStorage.getItem('name') || ''
    const phone = localStorage.getItem('phone') || ''
    setAuth({ email, isAuthenticated, name, phone })
    
    if (!isAuthenticated || !email) { 
      router.push('/login')
      return 
    }
    
    try{
      const cartData = JSON.parse(localStorage.getItem('cart') || '[]')
      if (cartData.length === 0) {
        router.push('/cart')
        return
      }
      setCart(cartData)
      // Pre-fill form with user data
      setFormData(prev => ({
        ...prev,
        fullName: name || '',
        email: email || '',
        phone: phone || ''
      }))
    }catch(_){
      router.push('/cart')
    }
  }, [router])

  function handleInputChange(e){
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  function validateForm(){
    const newErrors = {}
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email address'
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required'
    if (!formData.address.trim()) newErrors.address = 'Address is required'
    if (!formData.city.trim()) newErrors.city = 'City is required'
    if (!formData.postalCode.trim()) newErrors.postalCode = 'Postal code is required'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function placeOrder(){
    if (!validateForm()) {
      return
    }
    
    if (submitting) return
    
    setSubmitting(true)
    
    try{
      // Get buyer user ID
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
      
      const buyerId = getUserId()
      
      // Create order data
      const orderData = {
        items: cart,
        buyer_id: buyerId,
        shipping: {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode
        },
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
        total: total,
        orderDate: new Date().toISOString()
      }
      
      // Save order to localStorage (in a real app, this would go to a database)
      const orders = JSON.parse(localStorage.getItem('orders') || '[]')
      const orderId = 'ORD-' + Date.now()
      orders.push({ orderId, ...orderData, status: 'pending' })
      localStorage.setItem('orders', JSON.stringify(orders))
      
      // Clear cart
      localStorage.setItem('cart', '[]')
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cartUpdated'))
      }
      
      // Show success message
      try{ 
        if (typeof window !== 'undefined' && window.swal){ 
          await window.swal('Order Placed!', 'Your order has been placed successfully. Order ID: ' + orderId, 'success') 
        } 
      }catch(_){ }
      
      // Redirect to order confirmation or home
      router.push('/order-confirmation?orderId=' + encodeURIComponent(orderId))
    }catch(e){
      console.error('Error placing order:', e)
      try{ 
        if (typeof window !== 'undefined' && window.swal){ 
          await window.swal('Error', 'Failed to place order. Please try again.', 'error') 
        } 
      }catch(_){ }
      setSubmitting(false)
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

  const subtotal = cart.reduce((sum, item) => {
    const price = Number(String(item.price||'0').replace(/[^0-9.-]/g,'')) || 0
    return sum + price
  }, 0)
  
  const shipping = 200 // Fixed shipping cost
  const total = subtotal + shipping

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

  if (cart.length === 0) {
    return (
      <>
        <Header />
        <div style={{minHeight: '100vh', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{textAlign: 'center'}}>
            <h2>Your cart is empty</h2>
            <button onClick={() => router.push('/cart')} style={{marginTop: '20px', padding: '12px 24px', background: '#f55100', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer'}}>
              Go to Cart
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div style={{minHeight: '100vh', padding: '20px', background: '#f5f5f5'}}>
        <div style={{maxWidth: '1200px', margin: '0 auto'}}>
          <div style={{marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px'}}>
            <FaLock style={{color: '#f55100', fontSize: '24px'}} />
            <h1 style={{fontSize: '28px', fontWeight: '600', color: '#012f34', margin: 0}}>Secure Checkout</h1>
          </div>
          
          <div style={{display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px'}}>
            {/* Left Column - Shipping & Payment */}
            <div style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
              {/* Shipping Information */}
              <div style={{
                background: '#fff',
                borderRadius: '12px',
                padding: '24px',
                border: '1px solid rgba(1,47,52,.1)'
              }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  marginBottom: '20px',
                  color: '#012f34',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <FaMapMarkerAlt style={{color: '#f55100'}} />
                  Shipping Information
                </h2>
                
                <div style={{display: 'grid', gap: '16px'}}>
                  <div>
                    <label style={{display: 'block', marginBottom: '8px', fontWeight: '500', color: '#012f34'}}>
                      Full Name <span style={{color: '#b00020'}}>*</span>
                    </label>
                    <div style={{position: 'relative'}}>
                      <FaUser style={{position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(1,47,52,.4)'}} />
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        style={{
                          width: '100%',
                          padding: '12px 12px 12px 40px',
                          border: errors.fullName ? '2px solid #b00020' : '1px solid rgba(1,47,52,.2)',
                          borderRadius: '8px',
                          fontSize: '16px',
                          outline: 'none'
                        }}
                      />
                    </div>
                    {errors.fullName && <div style={{color: '#b00020', fontSize: '14px', marginTop: '4px'}}>{errors.fullName}</div>}
                  </div>
                  
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
                    <div>
                      <label style={{display: 'block', marginBottom: '8px', fontWeight: '500', color: '#012f34'}}>
                        Email <span style={{color: '#b00020'}}>*</span>
                      </label>
                      <div style={{position: 'relative'}}>
                        <FaEnvelope style={{position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(1,47,52,.4)'}} />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="your@email.com"
                          style={{
                            width: '100%',
                            padding: '12px 12px 12px 40px',
                            border: errors.email ? '2px solid #b00020' : '1px solid rgba(1,47,52,.2)',
                            borderRadius: '8px',
                            fontSize: '16px',
                            outline: 'none'
                          }}
                        />
                      </div>
                      {errors.email && <div style={{color: '#b00020', fontSize: '14px', marginTop: '4px'}}>{errors.email}</div>}
                    </div>
                    
                    <div>
                      <label style={{display: 'block', marginBottom: '8px', fontWeight: '500', color: '#012f34'}}>
                        Phone <span style={{color: '#b00020'}}>*</span>
                      </label>
                      <div style={{position: 'relative'}}>
                        <FaPhone style={{position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(1,47,52,.4)'}} />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="+92 300 1234567"
                          style={{
                            width: '100%',
                            padding: '12px 12px 12px 40px',
                            border: errors.phone ? '2px solid #b00020' : '1px solid rgba(1,47,52,.2)',
                            borderRadius: '8px',
                            fontSize: '16px',
                            outline: 'none'
                          }}
                        />
                      </div>
                      {errors.phone && <div style={{color: '#b00020', fontSize: '14px', marginTop: '4px'}}>{errors.phone}</div>}
                    </div>
                  </div>
                  
                  <div>
                    <label style={{display: 'block', marginBottom: '8px', fontWeight: '500', color: '#012f34'}}>
                      Address <span style={{color: '#b00020'}}>*</span>
                    </label>
                    <div style={{position: 'relative'}}>
                      <FaHome style={{position: 'absolute', left: '12px', top: '12px', color: 'rgba(1,47,52,.4)'}} />
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Street address, house number"
                        rows={3}
                        style={{
                          width: '100%',
                          padding: '12px 12px 12px 40px',
                          border: errors.address ? '2px solid #b00020' : '1px solid rgba(1,47,52,.2)',
                          borderRadius: '8px',
                          fontSize: '16px',
                          outline: 'none',
                          resize: 'vertical'
                        }}
                      />
                    </div>
                    {errors.address && <div style={{color: '#b00020', fontSize: '14px', marginTop: '4px'}}>{errors.address}</div>}
                  </div>
                  
                  <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px'}}>
                    <div>
                      <label style={{display: 'block', marginBottom: '8px', fontWeight: '500', color: '#012f34'}}>
                        City <span style={{color: '#b00020'}}>*</span>
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="Karachi"
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: errors.city ? '2px solid #b00020' : '1px solid rgba(1,47,52,.2)',
                          borderRadius: '8px',
                          fontSize: '16px',
                          outline: 'none'
                        }}
                      />
                      {errors.city && <div style={{color: '#b00020', fontSize: '14px', marginTop: '4px'}}>{errors.city}</div>}
                    </div>
                    
                    <div>
                      <label style={{display: 'block', marginBottom: '8px', fontWeight: '500', color: '#012f34'}}>
                        Postal Code <span style={{color: '#b00020'}}>*</span>
                      </label>
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        placeholder="75000"
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: errors.postalCode ? '2px solid #b00020' : '1px solid rgba(1,47,52,.2)',
                          borderRadius: '8px',
                          fontSize: '16px',
                          outline: 'none'
                        }}
                      />
                      {errors.postalCode && <div style={{color: '#b00020', fontSize: '14px', marginTop: '4px'}}>{errors.postalCode}</div>}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Payment Method */}
              <div style={{
                background: '#fff',
                borderRadius: '12px',
                padding: '24px',
                border: '1px solid rgba(1,47,52,.1)'
              }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  marginBottom: '20px',
                  color: '#012f34',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <FaCreditCard style={{color: '#f55100'}} />
                  Payment Method
                </h2>
                
                <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '16px',
                    border: formData.paymentMethod === 'cash_on_delivery' ? '2px solid #f55100' : '1px solid rgba(1,47,52,.2)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: formData.paymentMethod === 'cash_on_delivery' ? 'rgba(245,81,0,.05)' : '#fff'
                  }}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash_on_delivery"
                      checked={formData.paymentMethod === 'cash_on_delivery'}
                      onChange={handleInputChange}
                      style={{marginRight: '12px', width: '18px', height: '18px', cursor: 'pointer'}}
                    />
                    <div style={{flex: 1}}>
                      <div style={{fontWeight: '600', color: '#012f34'}}>Cash on Delivery</div>
                      <div style={{fontSize: '14px', color: 'rgba(0,47,52,.64)'}}>Pay when you receive the order</div>
                    </div>
                  </label>
                  
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '16px',
                    border: formData.paymentMethod === 'bank_transfer' ? '2px solid #f55100' : '1px solid rgba(1,47,52,.2)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: formData.paymentMethod === 'bank_transfer' ? 'rgba(245,81,0,.05)' : '#fff'
                  }}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank_transfer"
                      checked={formData.paymentMethod === 'bank_transfer'}
                      onChange={handleInputChange}
                      style={{marginRight: '12px', width: '18px', height: '18px', cursor: 'pointer'}}
                    />
                    <div style={{flex: 1}}>
                      <div style={{fontWeight: '600', color: '#012f34'}}>Bank Transfer</div>
                      <div style={{fontSize: '14px', color: 'rgba(0,47,52,.64)'}}>Transfer payment to our bank account</div>
                    </div>
                  </label>
                </div>
              </div>
              
              {/* Order Notes */}
              <div style={{
                background: '#fff',
                borderRadius: '12px',
                padding: '24px',
                border: '1px solid rgba(1,47,52,.1)'
              }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  marginBottom: '16px',
                  color: '#012f34'
                }}>
                  Order Notes (Optional)
                </h2>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Any special instructions for your order..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid rgba(1,47,52,.2)',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
            
            {/* Right Column - Order Summary */}
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
              
              <div style={{marginBottom: '20px'}}>
                {cart.map((item, index) => (
                  <div key={item.post_id || index} style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '12px 0',
                    borderBottom: index < cart.length - 1 ? '1px solid rgba(1,47,52,.1)' : 'none'
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
              
              <div style={{
                height: '1px',
                background: 'rgba(1,47,52,.1)',
                margin: '16px 0'
              }}></div>
              
              <div style={{display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '16px', color: 'rgba(0,47,52,.8)'}}>
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '16px', color: 'rgba(0,47,52,.8)'}}>
                  <span>Shipping</span>
                  <span>{formatPrice(shipping)}</span>
                </div>
                <div style={{
                  height: '1px',
                  background: 'rgba(1,47,52,.1)',
                  margin: '8px 0'
                }}></div>
                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: '700', color: '#012f34'}}>
                  <span>Total</span>
                  <span style={{color: '#f55100'}}>{formatPrice(total)}</span>
                </div>
              </div>
              
              <button
                onClick={placeOrder}
                disabled={submitting}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '8px',
                  background: submitting ? 'rgba(245,81,0,.5)' : 'linear-gradient(135deg, #f55100 0%, #ff6b2b 100%)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: '600',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: submitting ? 'none' : '0 4px 12px rgba(245,81,0,.3)',
                  transition: 'all 0.2s ease'
                }}
              >
                <FaLock />
                {submitting ? 'Placing Order...' : 'Place Order'}
              </button>
              
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: 'rgba(245,81,0,.05)',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'rgba(0,47,52,.64)',
                textAlign: 'center'
              }}>
                <FaLock style={{marginRight: '6px'}} />
                Your payment information is secure and encrypted
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

