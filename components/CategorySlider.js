import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { FaHeart, FaRegHeart, FaMapMarkerAlt } from 'react-icons/fa'

function slugify(str) {
  return String(str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function categoryImage(cat) {
  const s = String(cat || '').toLowerCase()
  if (s.includes('mobile') || s.includes('phone')) return 'https://picsum.photos/seed/phone/800/600'
  if (s.includes('car')) return 'https://picsum.photos/seed/car/800/600'
  if (s.includes('motor')) return 'https://picsum.photos/seed/motorcycle/800/600'
  if (s.includes('house') || s.includes('property') || s.includes('land')) return 'https://picsum.photos/seed/property/800/600'
  return 'https://picsum.photos/seed/product/800/600'
}

function getTimeAgo(dateString) {
  if (!dateString) return 'Recently'
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
    }
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days} ${days === 1 ? 'day' : 'days'} ago`
    }
    if (diffInSeconds < 2592000) {
      const weeks = Math.floor(diffInSeconds / 604800)
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`
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

export default function CategorySlider({ heading, category, favorites, onToggleFavorite, userId }) {
  const router = useRouter()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const favSet = favorites instanceof Set ? favorites : new Set()

  useEffect(() => {
    if (!category) {
      setLoading(false)
      return
    }

    async function loadCategoryProducts() {
      setLoading(true)
      try {
        const categorySlug = slugify(category)
        const res = await fetch(`/api/v1/category/${encodeURIComponent(categorySlug)}`)
        const data = await res.json()
        const raw = (data.data?.products) || []

        let statusMap = {}
        try {
          statusMap = JSON.parse(localStorage.getItem('post_statuses') || '{}') || {}
        } catch (_) {
          statusMap = {}
        }

        const list = raw.map((p, i) => {
          const withImg = Array.isArray(p.images) && p.images.length ? { ...p, image: p.images[0].url } : p
          const needsReplace = !withImg.image || withImg.image === '/images/products/img1.jpg'
          const base = needsReplace ? { ...withImg, image: categoryImage(category) } : withImg
          const id = base.id || base.post_id || (i + 1)
          const slug = base.slug || (slugify(base.title || base.name) + '-' + id)
          const key = 'db:' + String(id)
          const status = String(statusMap[key] || 'active')

          return {
            id,
            post_id: base.post_id || base.id || id,
            slug,
            name: base.title || base.name || 'Item',
            description: base.content || base.description || '',
            image: base.image,
            price: base.price || '',
            location: base.location || '',
            profilePhone: base.profilePhone || '',
            category: category,
            status,
            created_at: base.created_at || null
          }
        })

        const merged = list.filter(p => String(p.status || 'active') === 'active')
        // Limit to 4 products for category slider
        setProducts(merged.slice(0, 4))
      } catch (e) {
        console.error('Error loading category products:', e)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    loadCategoryProducts()
  }, [category])

  function productDetail(product) {
    if (!product) return
    localStorage.setItem('productName', product.name)
    localStorage.setItem('name', product.profileName || '')
    localStorage.setItem('description', product.description)
    localStorage.setItem('image', product.image)
    localStorage.setItem('price', product.price)
    localStorage.setItem('location', product.location)
    localStorage.setItem('phone', product.profilePhone)
    localStorage.setItem('phoneShow', product.phoneShow || 'no')
    localStorage.setItem('category', product.category || '')
    router.push('/product/' + encodeURIComponent(product.slug))
  }

  // Show only 4 products, no pagination needed

  const categorySlugForLoading = slugify(category)
  const categoryUrlForLoading = `/category/${categorySlugForLoading}`

  if (loading) {
    return (
      <div className="fresh__recomandation" aria-labelledby={`category-title-${categorySlugForLoading}`}>
        <div className="fresh__recomandation-container">
          <div className="category-slider-header">
            <h1 id={`category-title-${categorySlugForLoading}`}>{heading}</h1>
            <a href={categoryUrlForLoading} className="view-more-btn" onClick={(e) => { e.preventDefault(); router.push(categoryUrlForLoading) }}>
              View More
            </a>
          </div>
          <div className="loading-products">Loading...</div>
        </div>
      </div>
    )
  }

  if (!products || products.length === 0) {
    return null
  }

  const categorySlug = slugify(category)
  const categoryUrl = `/category/${categorySlug}`

  return (
    <div className="fresh__recomandation" aria-labelledby={`category-title-${categorySlug}`}>
      <div className="fresh__recomandation-container">
        <div className="category-slider-header">
          <h1 id={`category-title-${categorySlug}`}>{heading}</h1>
          <a href={categoryUrl} className="view-more-btn" onClick={(e) => { e.preventDefault(); router.push(categoryUrl) }}>
            View More
          </a>
        </div>
        <div className="category-products-grid">
          <div className="cards__grid">
            {products.map((card, i) => {
              const isFeatured = i % 3 === 0
              return (
                <article
                  key={card.id || i}
                  className="card"
                  onClick={() => productDetail(card)}
                  aria-label={card.name}
                >
                  <div className="img__featured">
                    <Image
                      src={card.image}
                      alt={card.name}
                      fill
                      loading="lazy"
                      sizes="(max-width: 768px) 100vw, 320px"
                      unoptimized
                      style={{ objectFit: 'cover' }}
                    />
                    {isFeatured && (
                      <p className="featured">featured</p>
                    )}
                  </div>
                  <div className="card__content">
                    <div className="card__content-gap">
                      <div className="name__heart">
                        <h4 className="card__price" aria-label={'Price ' + card.price}>
                          Rs {card.price}
                        </h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                            if (onToggleFavorite) {
                              onToggleFavorite(card.post_id || card.id, e)
                            }
                          }}
                          aria-label={favSet.has(String(card.post_id || card.id)) ? 'Remove from favorites' : 'Add to favorites'}
                          className="card__heart-btn"
                        >
                          {favSet.has(String(card.post_id || card.id)) ? (
                            <FaHeart 
                              aria-hidden="true" 
                              className="card__heart" 
                              style={{
                                color: '#f55100',
                                fill: '#f55100',
                                fontSize: '16px',
                                transition: 'all 0.2s ease'
                              }} 
                            />
                          ) : (
                            <FaRegHeart 
                              aria-hidden="true" 
                              className="card__heart" 
                              style={{
                                color: '#f55100',
                                opacity: 0.5,
                                fontSize: '16px',
                                transition: 'all 0.2s ease'
                              }} 
                            />
                          )}
                        </button>
                      </div>
                      <div className="card__name-wrap">
                      <h4 className="card__name">{card.name}</h4>
                      </div>
                    </div>
                    <h5 className="card__location">
                      <FaMapMarkerAlt aria-hidden="true" /> {card.location}
                    </h5>
                      <h5 className="card__location time-total">
                                    {getTimeAgo(card.created_at)}
                                  </h5>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

