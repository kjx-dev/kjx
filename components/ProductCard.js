import { useRouter } from 'next/router'
import Image from 'next/image'
import { FaMapMarkerAlt, FaEye } from 'react-icons/fa'

function getTimeAgo(dateString) {
  if (!dateString) return 'Recently'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Recently'
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)
    
    if (isNaN(diffInSeconds) || diffInSeconds < 0) return 'Recently'
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
    }
    if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days} ${days === 1 ? 'day' : 'days'} ago`
    }
    if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000)
      return `${months} ${months === 1 ? 'month' : 'months'} ago`
    }
    const years = Math.floor(diffInSeconds / 31536000)
    return `${years} ${years === 1 ? 'year' : 'years'} ago`
  } catch (_) {
    return 'Recently'
  }
}

export default function ProductCard({ post }) {
  const router = useRouter()
  // Check for product type - handle different possible values and formats
  const postTypeValue = post?.post_type || post?.postType || 'ad'
  const postType = String(postTypeValue || 'ad').toLowerCase().trim()
  const isProduct = postType === 'product'
  
  return (
    <div
      onClick={() => router.push(`/product/${post.id}`)}
      style={{
        background:'#fff',
        border:'1px solid rgba(1,47,52,.08)',
        borderRadius:'16px',
        overflow:'hidden',
        cursor:'pointer',
        transition:'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow:'0 2px 12px rgba(0,0,0,.06)',
        position:'relative'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-8px)'
        e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,.12)'
        e.currentTarget.style.borderColor = 'rgba(245, 81, 0, 0.3)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,.06)'
        e.currentTarget.style.borderColor = 'rgba(1,47,52,.08)'
      }}
    >
      <div style={{
        position:'relative', 
        width:'100%', 
        height:'220px', 
        background:'linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%)',
        overflow:'hidden'
      }}>
        <Image
          src={post.image}
          alt={post.title}
          fill
          loading="lazy"
          sizes="(max-width: 768px) 100vw, 280px"
          unoptimized
          style={{
            objectFit:'cover',
            transition:'transform 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
          }}
        />
        <div style={{
          position:'absolute',
          top:0,
          left:0,
          right:0,
          bottom:0,
          background:'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.1) 100%)'
        }}></div>
        {post.status === 'active' && (
          <span style={{
            position:'absolute',
            top:'12px',
            left:'12px',
            background:'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color:'#fff',
            padding:'6px 12px',
            borderRadius:'20px',
            fontSize:'11px',
            fontWeight:600,
            textTransform:'uppercase',
            letterSpacing:'0.5px',
            boxShadow:'0 2px 8px rgba(16, 185, 129, 0.3)'
          }}>
            Active
          </span>
        )}
        {isProduct && (
          <span style={{
            position:'absolute',
            top:'12px',
            right:'12px',
            background:'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color:'#fff',
            padding:'6px 12px',
            borderRadius:'20px',
            fontSize:'11px',
            fontWeight:600,
            textTransform:'uppercase',
            letterSpacing:'0.5px',
            boxShadow:'0 2px 8px rgba(59, 130, 246, 0.3)'
          }}>
            Product
          </span>
        )}
        {post.views > 0 && (
          <div style={{
            position:'absolute',
            bottom:'12px',
            right:'12px',
            background:'rgba(0,0,0,0.6)',
            backdropFilter:'blur(10px)',
            color:'#fff',
            padding:'4px 10px',
            borderRadius:'12px',
            fontSize:'11px',
            fontWeight:500,
            display:'flex',
            alignItems:'center',
            gap:'6px'
          }}>
            <FaEye style={{fontSize:'10px'}} />
            <span>{post.views}</span>
          </div>
        )}
      </div>
      <div style={{padding:'20px'}}>
        <h3 style={{
          fontSize:'17px',
          fontWeight:600,
          color:'#012f34',
          marginBottom:'12px',
          overflow:'hidden',
          textOverflow:'ellipsis',
          display:'-webkit-box',
          WebkitLineClamp:2,
          WebkitBoxOrient:'vertical',
          lineHeight:'1.4',
          minHeight:'48px'
        }}>
          {post.title}
        </h3>
        {post.price && (
          <p style={{
            fontSize:'22px',
            fontWeight:700,
            color:'#f55100',
            marginBottom:'12px',
            background:'linear-gradient(135deg, #f55100 0%, #ff6b35 100%)',
            WebkitBackgroundClip:'text',
            WebkitTextFillColor:'transparent',
            backgroundClip:'text'
          }}>
            Rs {post.price.toLocaleString()}
          </p>
        )}
        {post.location && (
          <p style={{
            fontSize:'13px',
            color:'rgba(0,47,52,.65)',
            marginBottom:'12px',
            display:'flex',
            alignItems:'center',
            gap:'8px',
            fontWeight:500
          }}>
            <FaMapMarkerAlt style={{fontSize:'12px', color:'#f55100'}} />
            <span>{post.location}</span>
          </p>
        )}
        <div style={{
          display:'flex',
          alignItems:'center',
          justifyContent:'space-between',
          paddingTop:'12px',
          borderTop:'1px solid rgba(1,47,52,.08)'
        }}>
          <p style={{
            fontSize:'12px',
            color:'rgba(0,47,52,.5)',
            margin:0,
            fontWeight:500
          }}>
            {getTimeAgo(post.created_at)}
          </p>
          {post.category && (
            <span style={{
              fontSize:'11px',
              color:'rgba(0,47,52,.6)',
              background:'rgba(245, 81, 0, 0.1)',
              padding:'4px 10px',
              borderRadius:'12px',
              fontWeight:500
            }}>
              {post.category}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

