import { useRouter } from 'next/router'
import { FaStore, FaEnvelope, FaPhone, FaBox, FaShoppingBag, FaEye } from 'react-icons/fa'

export default function SellerHero({ seller, totalPosts, activePosts, totalViews }) {
  const router = useRouter()

  if (!seller) return null

  return (
    <div style={{
      background:'linear-gradient(135deg, #f55100 0%, #e44c00 100%)',
      padding:'40px 16px',
      marginBottom:'32px',
      position:'relative',
      overflow:'hidden'
    }}>
      <div style={{
        maxWidth:'1200px',
        margin:'0 auto',
        position:'relative',
        zIndex:1
      }}>
        <button 
          onClick={() => router.back()}
          style={{
            padding:'10px 18px',
            borderRadius:'10px',
            border:'none',
            background:'rgba(255,255,255,0.2)',
            backdropFilter:'blur(10px)',
            color:'#fff',
            cursor:'pointer',
            fontSize:'14px',
            marginBottom:'24px',
            display:'inline-flex',
            alignItems:'center',
            gap:'8px',
            fontWeight:500,
            transition:'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.3)'
            e.currentTarget.style.transform = 'translateX(-4px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
            e.currentTarget.style.transform = 'translateX(0)'
          }}
        >
          <i className="fa-solid fa-arrow-left"></i>
          <span>Back</span>
        </button>
        
        <div style={{
          display:'flex',
          alignItems:'center',
          gap:'24px',
          flexWrap:'wrap'
        }}>
          <div style={{
            width:'100px',
            height:'100px',
            borderRadius:'50%',
            background:'rgba(255,255,255,0.2)',
            backdropFilter:'blur(10px)',
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            fontSize:'40px',
            color:'#fff',
            border:'3px solid rgba(255,255,255,0.3)',
            flexShrink:0
          }}>
            <FaStore />
          </div>
          <div style={{flex:1, minWidth:'200px'}}>
            <h1 style={{
              fontSize:'32px',
              fontWeight:400,
              color:'#fff',
              marginBottom:'8px',
              textShadow:'0 2px 10px rgba(0,0,0,0.2)'
            }}>
              {seller.name || 'Seller'}'s Store
            </h1>
            {seller.email && (
              <div style={{
                display:'flex',
                alignItems:'center',
                gap:'8px',
                color:'rgba(255,255,255,0.9)',
                fontSize:'15px',
                marginBottom:'4px'
              }}>
                <FaEnvelope style={{fontSize:'14px'}} />
                <span>{seller.email}</span>
              </div>
            )}
            {seller.phone && (
              <div style={{
                display:'flex',
                alignItems:'center',
                gap:'8px',
                color:'rgba(255,255,255,0.9)',
                fontSize:'15px'
              }}>
                <FaPhone style={{fontSize:'14px'}} />
                <span>{seller.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{
          display:'grid',
          gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))',
          gap:'16px',
          marginTop:'32px'
        }}>
          <div style={{
            background:'rgba(255,255,255,0.15)',
            backdropFilter:'blur(10px)',
            borderRadius:'12px',
            padding:'20px',
            border:'1px solid rgba(255,255,255,0.2)'
          }}>
            <div style={{
              display:'flex',
              alignItems:'center',
              gap:'12px',
              marginBottom:'8px'
            }}>
              <FaBox style={{fontSize:'20px', color:'#fff'}} />
              <span style={{fontSize:'14px', color:'rgba(255,255,255,0.9)', fontWeight:400}}>Total Posts</span>
            </div>
            <div style={{fontSize:'28px', fontWeight:700, color:'#fff'}}>{totalPosts}</div>
          </div>
          <div style={{
            background:'rgba(255,255,255,0.15)',
            backdropFilter:'blur(10px)',
            borderRadius:'12px',
            padding:'20px',
            border:'1px solid rgba(255,255,255,0.2)'
          }}>
            <div style={{
              display:'flex',
              alignItems:'center',
              gap:'12px',
              marginBottom:'8px'
            }}>
              <FaShoppingBag style={{fontSize:'20px', color:'#fff'}} />
              <span style={{fontSize:'14px', color:'rgba(255,255,255,0.9)', fontWeight:400}}>Active</span>
            </div>
            <div style={{fontSize:'28px', fontWeight:700, color:'#fff'}}>{activePosts}</div>
          </div>
          <div style={{
            background:'rgba(255,255,255,0.15)',
            backdropFilter:'blur(10px)',
            borderRadius:'12px',
            padding:'20px',
            border:'1px solid rgba(255,255,255,0.2)'
          }}>
            <div style={{
              display:'flex',
              alignItems:'center',
              gap:'12px',
              marginBottom:'8px'
            }}>
              <FaEye style={{fontSize:'20px', color:'#fff'}} />
              <span style={{fontSize:'14px', color:'rgba(255,255,255,0.9)', fontWeight:400}}>Total Views</span>
            </div>
            <div style={{fontSize:'28px', fontWeight:700, color:'#fff'}}>{totalViews.toLocaleString()}</div>
          </div>
        </div>
      </div>
      
      {/* Decorative circles */}
      <div style={{
        position:'absolute',
        top:'-50px',
        right:'-50px',
        width:'200px',
        height:'200px',
        borderRadius:'50%',
        background:'rgba(255,255,255,0.1)',
        zIndex:0
      }}></div>
      <div style={{
        position:'absolute',
        bottom:'-30px',
        left:'-30px',
        width:'150px',
        height:'150px',
        borderRadius:'50%',
        background:'rgba(255,255,255,0.08)',
        zIndex:0
      }}></div>
    </div>
  )
}

