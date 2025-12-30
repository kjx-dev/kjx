import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import CategoryBar from '../../components/CategoryBar'
import SellerHero from '../../components/SellerHero'
import ProductCard from '../../components/ProductCard'
import LoadingState from '../../components/LoadingState'
import ErrorState from '../../components/ErrorState'
import EmptyState from '../../components/EmptyState'
import { FaBox } from 'react-icons/fa'

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

  // Calculate stats
  const totalPosts = posts.length
  const activePosts = posts.filter(p => p.status === 'active').length
  const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0)

  return (
    <>
      <Head>
        <title>{seller?.name ? `${seller.name}'s Store | OMG` : 'Seller Store | OMG'}</title>
        <meta name="description" content={`View all ads and products posted by ${seller?.name || 'this seller'}`} />
      </Head>
      <Header />
      <CategoryBar />
      <div style={{
        minHeight:'calc(100vh - 200px)', 
        padding:'0',
        background:'linear-gradient(to bottom, #f8f9fa 0%, #ffffff 200px)',
        position:'relative'
      }}>
        {/* Hero Section */}
        <SellerHero 
          seller={seller} 
          totalPosts={totalPosts} 
          activePosts={activePosts} 
          totalViews={totalViews} 
        />

        {/* Content Section */}
        <div style={{maxWidth:'1200px', margin:'0 auto', padding:'0 16px 40px'}}>

          {loading ? (
            <LoadingState message="Loading posts..." />
          ) : error ? (
            <ErrorState message={error} />
          ) : posts.length === 0 ? (
            <EmptyState 
              icon={FaBox}
              title="No posts yet"
              message="This seller hasn't posted anything yet"
            />
          ) : (
            <>
              <div style={{
                display:'flex',
                alignItems:'center',
                justifyContent:'space-between',
                marginBottom:'24px',
                flexWrap:'wrap',
                gap:'16px'
              }}>
                <h2 style={{
                  fontSize:'24px',
                  fontWeight:700,
                  color:'#012f34',
                  margin:0
                }}>
                  All Products ({totalPosts})
                </h2>
              </div>
              <div style={{
                display:'grid', 
                gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', 
                gap:'24px'
              }}>
                {posts.map((post) => (
                  <ProductCard key={post.id} post={post} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}

