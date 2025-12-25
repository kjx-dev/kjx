import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Image from 'next/image'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { FaMapMarkerAlt, FaTag } from 'react-icons/fa'

export default function SellerPosts() {
  const router = useRouter()
  const { id } = router.query
  const [posts, setPosts] = useState([])
  const [seller, setSeller] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    
    async function loadSellerPosts() {
      try {
        setLoading(true)
        setError('')
        
        // Fetch seller info
        const sellerRes = await fetch(`/api/v1/users/${id}`)
        const sellerJson = await sellerRes.json()
        if (sellerRes.ok && sellerJson.data) {
          setSeller(sellerJson.data)
        }
        
        // Fetch all posts by this user
        const postsRes = await fetch(`/api/v1/posts?showAll=true&limit=100`)
        const postsJson = await postsRes.json()
        
        if (postsRes.ok && Array.isArray(postsJson.data)) {
          // Filter posts by user_id
          const userId = parseInt(String(id), 10)
          const userPosts = postsJson.data.filter(p => p.user_id === userId)
          
          // Map posts to display format
          const mappedPosts = userPosts.map(p => ({
            id: p.post_id,
            title: p.title,
            description: p.content,
            image: (Array.isArray(p.images) && p.images.length ? p.images[0].url : 'https://picsum.photos/seed/product/300/200'),
            price: p.price || '',
            location: p.location || '',
            category: p.category?.name || '',
            status: p.status || 'pending',
            post_type: p.post_type || 'ad',
            views: p.views || 0,
            phone_clicks: p.phone_clicks || 0,
            chat_clicks: p.chat_clicks || 0,
            created_at: p.created_at
          }))
          
          // Sort by created_at (newest first)
          mappedPosts.sort((a, b) => {
            const dateA = new Date(a.created_at || 0)
            const dateB = new Date(b.created_at || 0)
            return dateB - dateA
          })
          
          setPosts(mappedPosts)
        } else {
          setPosts([])
        }
      } catch (err) {
        console.error('Error loading seller posts:', err)
        setError('Failed to load posts. Please try again.')
        setPosts([])
      } finally {
        setLoading(false)
      }
    }
    
    loadSellerPosts()
  }, [id])

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

  return (
    <>
      <Head>
        <title>{seller?.name ? `${seller.name}'s Posts | OMG` : 'Seller Posts | OMG'}</title>
        <meta name="description" content={`View all ads and products posted by ${seller?.name || 'this seller'}`} />
      </Head>
      <Header />
      <div style={{minHeight:'calc(100vh - 200px)', padding:'20px 16px', maxWidth:'1200px', margin:'0 auto'}}>
        <div style={{marginBottom:'24px'}}>
          <button 
            onClick={() => router.back()}
            style={{
              padding:'8px 16px',
              borderRadius:'8px',
              border:'1px solid rgba(1,47,52,.2)',
              background:'#fff',
              color:'#012f34',
              cursor:'pointer',
              fontSize:'14px',
              marginBottom:'16px',
              display:'inline-flex',
              alignItems:'center',
              gap:'8px'
            }}
          >
            <i className="fa-solid fa-arrow-left"></i>
            <span>Back</span>
          </button>
          
          {seller && (
            <div style={{
              background:'#fff',
              border:'1px solid rgba(1,47,52,.12)',
              borderRadius:'12px',
              padding:'20px',
              marginBottom:'24px'
            }}>
              <h1 style={{fontSize:'24px', fontWeight:700, color:'#012f34', marginBottom:'8px'}}>
                {seller.name || 'Seller'}'s Posts
              </h1>
              {seller.email && (
                <p style={{color:'rgba(0,47,52,.6)', fontSize:'14px'}}>{seller.email}</p>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div style={{textAlign:'center', padding:'40px'}}>
            <i className="fa-solid fa-spinner fa-spin" style={{fontSize:'32px', color:'#3a77ff'}}></i>
            <p style={{marginTop:'16px', color:'rgba(0,47,52,.6)'}}>Loading posts...</p>
          </div>
        ) : error ? (
          <div style={{textAlign:'center', padding:'40px'}}>
            <p style={{color:'#c62828', fontSize:'16px'}}>{error}</p>
          </div>
        ) : posts.length === 0 ? (
          <div style={{textAlign:'center', padding:'40px'}}>
            <i className="fa-solid fa-inbox" style={{fontSize:'48px', color:'rgba(0,47,52,.3)'}}></i>
            <p style={{marginTop:'16px', color:'rgba(0,47,52,.6)', fontSize:'16px'}}>No posts found</p>
          </div>
        ) : (
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'20px'}}>
            {posts.map((post) => {
              const postType = String(post.post_type || 'ad').toLowerCase().trim()
              const isProduct = postType === 'product'
              
              return (
                <div
                  key={post.id}
                  onClick={() => router.push(`/product/${post.id}`)}
                  style={{
                    background:'#fff',
                    border:'1px solid rgba(1,47,52,.12)',
                    borderRadius:'12px',
                    overflow:'hidden',
                    cursor:'pointer',
                    transition:'all 0.2s ease',
                    boxShadow:'0 2px 8px rgba(0,0,0,.08)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.12)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.08)'
                  }}
                >
                  <div style={{position:'relative', width:'100%', height:'200px', background:'#f5f5f5'}}>
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      loading="lazy"
                      sizes="(max-width: 768px) 100vw, 280px"
                      unoptimized
                      style={{objectFit:'cover'}}
                    />
                    {post.status === 'active' && (
                      <span style={{
                        position:'absolute',
                        top:'8px',
                        left:'8px',
                        background:'#248f3c',
                        color:'#fff',
                        padding:'4px 8px',
                        borderRadius:4,
                        fontSize:11,
                        fontWeight:600
                      }}>
                        Active
                      </span>
                    )}
                    {isProduct && (
                      <span style={{
                        position:'absolute',
                        top:'8px',
                        right:'8px',
                        background:'#1976d2',
                        color:'#fff',
                        padding:'4px 8px',
                        borderRadius:4,
                        fontSize:11,
                        fontWeight:600
                      }}>
                        Product
                      </span>
                    )}
                  </div>
                  <div style={{padding:'16px'}}>
                    <h3 style={{
                      fontSize:'16px',
                      fontWeight:600,
                      color:'#012f34',
                      marginBottom:'8px',
                      overflow:'hidden',
                      textOverflow:'ellipsis',
                      whiteSpace:'nowrap'
                    }}>
                      {post.title}
                    </h3>
                    {post.price && (
                      <p style={{
                        fontSize:'18px',
                        fontWeight:700,
                        color:'#f55100',
                        marginBottom:'8px'
                      }}>
                        Rs {post.price.toLocaleString()}
                      </p>
                    )}
                    {post.location && (
                      <p style={{
                        fontSize:'13px',
                        color:'rgba(0,47,52,.6)',
                        marginBottom:'8px',
                        display:'flex',
                        alignItems:'center',
                        gap:'6px'
                      }}>
                        <FaMapMarkerAlt style={{fontSize:'12px'}} />
                        {post.location}
                      </p>
                    )}
                    <p style={{
                      fontSize:'11px',
                      color:'rgba(0,47,52,.5)',
                      marginTop:'8px'
                    }}>
                      {getTimeAgo(post.created_at)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <Footer />
    </>
  )
}

