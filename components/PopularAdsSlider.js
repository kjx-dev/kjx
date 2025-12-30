import { useState } from 'react'
import Image from 'next/image'
import { FaHeart, FaRegHeart, FaMapMarkerAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa'

function getTimeAgo(dateString) {
  if (!dateString || dateString === null || dateString === undefined) return 'Recently'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return 'Recently'
    }
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (isNaN(diffInSeconds) || diffInSeconds < 0) {
      return 'Recently'
    }
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      if (isNaN(minutes)) return 'Recently'
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      if (isNaN(hours)) return 'Recently'
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
    }
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400)
      if (isNaN(days)) return 'Recently'
      return `${days} ${days === 1 ? 'day' : 'days'} ago`
    }
    if (diffInSeconds < 2592000) {
      const weeks = Math.floor(diffInSeconds / 604800)
      if (isNaN(weeks)) return 'Recently'
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`
    }
    if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000)
      if (isNaN(months)) return 'Recently'
      return `${months} ${months === 1 ? 'month' : 'months'} ago`
    }
    const years = Math.floor(diffInSeconds / 31536000)
    if (isNaN(years)) return 'Recently'
    return `${years} ${years === 1 ? 'year' : 'years'} ago`
  } catch (_) {
    return 'Recently'
  }
}

export default function PopularAdsSlider({ products, onProductClick, favorites, onToggleFavorite }) {
  const itemsPerPage = 4
  const totalPages = Math.ceil((products?.length || 0) / itemsPerPage)
  const [currentPage, setCurrentPage] = useState(0)

  function nextSlide() {
    setCurrentPage((prev) => (prev + 1) % totalPages)
  }
  
  function prevSlide() {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages)
  }

  if (!Array.isArray(products) || products.length === 0) {
    return (
      <div className="fresh__recomandation" aria-labelledby="fresh-title">
        <div className="fresh__recomandation-container">
          <h1 id="fresh-title">Popular Ads</h1>
          <div className="no-products">
            <p>No products found. Be the first to post an ad!</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fresh__recomandation" aria-labelledby="fresh-title">
      <div className="fresh__recomandation-container">
        <h1 id="fresh-title">Popular Ads</h1>
        <div className="popular-ads-slider">
          <button 
            className="slider-nav slider-nav-prev" 
            onClick={prevSlide}
            aria-label="Previous ads"
            disabled={totalPages <= 1}
          >
            <FaChevronLeft />
          </button>
          <div className="slider-container">
            <div className="slider-track" style={{ transform: `translateX(-${currentPage * 100}%)` }}>
              {Array.from({ length: totalPages }).map((_, pageIndex) => {
                const pageStart = pageIndex * itemsPerPage
                const pageEnd = pageStart + itemsPerPage
                const pageItems = products.slice(pageStart, pageEnd)
                return (
                  <div key={pageIndex} className="slider-page">
                    <div className="cards__grid">
                      {pageItems.map((card, i) => {
                        const originalIndex = pageStart + i
                        // Check actual featured field from database, not index position
                        const isFeatured = card.featured === 1 || card.featured === true || (card.featured && Number(card.featured) === 1)
                        const isFav = favorites?.has(String(card.post_id || card.id))
                        return (
                          <article
                            key={card.post_id || card.id || originalIndex}
                            className="card"
                            onClick={() => onProductClick?.(originalIndex)}
                            aria-label={card.name}
                          >
                            <div className="img__featured">
                              <Image src={card.image} alt={card.name} fill loading="lazy" sizes="(max-width: 768px) 100vw, 320px" unoptimized style={{objectFit:'cover'}} />
                              {isFeatured && (
                                <p className="featured">featured</p>
                              )}
                            </div>
                            <div className="card__content">
                              <div className="card__content-gap">
                                <div className="name__heart">
                                  <h4 className="card__price" aria-label={'Price ' + card.price}>Rs {card.price}</h4>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      e.preventDefault()
                                      onToggleFavorite?.(card.post_id || card.id, e)
                                    }}
                                    aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                                    className="card__heart-btn"
                                  >
                                    {isFav ? (
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
                              <h5 className="card__location"><FaMapMarkerAlt aria-hidden="true" /> {card.location}</h5>
                              <h5 className="card__location time-total">
                                {getTimeAgo(card.created_at)}
                              </h5>
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <button 
            className="slider-nav slider-nav-next" 
            onClick={nextSlide}
            aria-label="Next ads"
            disabled={totalPages <= 1}
          >
            <FaChevronRight />
          </button>
          {totalPages > 1 && (
            <div className="slider-dots">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  className={`slider-dot ${i === currentPage ? 'active' : ''}`}
                  onClick={() => setCurrentPage(i)}
                  aria-label={`Go to page ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


