import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { useRouter } from 'next/router'

export default function AdsTab({ error, setError }) {
  const router = useRouter()
  const [ads, setAds] = useState([])
  const [adsLoading, setAdsLoading] = useState(false)
  const [adsTab, setAdsTab] = useState('all')
  const [adsSearch, setAdsSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [usersMap, setUsersMap] = useState({})
  const [categories, setCategories] = useState([])
  const [categoriesMap, setCategoriesMap] = useState({})
  const [togglingStatus, setTogglingStatus] = useState({})
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [totalAds, setTotalAds] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  const searchTimeoutRef = useRef(null)
  const usersMapRef = useRef({})

  useEffect(() => {
    fetchCategories()
    fetchUsers() // Fetch users once and cache
    fetchAds(1) // Initial fetch
  }, [])

  // Debounce search input
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(adsSearch)
      setCurrentPage(1) // Reset to first page on search
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [adsSearch])

  // Reset to page 1 when category filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedCategory])

  async function fetchCategories() {
    try {
      const response = await fetch('/api/v1/category')
      const data = await response.json()
      
      if (data.data && Array.isArray(data.data.categories)) {
        setCategories(data.data.categories)
        const map = {}
        data.data.categories.forEach(cat => {
          map[cat.category_id] = cat.name
        })
        setCategoriesMap(map)
      }
    } catch (err) {
      console.error('Error loading categories:', err)
    }
  }

  async function fetchUsers() {
    try {
      const response = await fetch('/api/v1/users')
      const data = await response.json()
      
      if (data.data && Array.isArray(data.data)) {
        const map = {}
        data.data.forEach(u => {
          map[u.user_id] = u
        })
        usersMapRef.current = map
        setUsersMap(map)
      }
    } catch (err) {
      console.error('Error loading users:', err)
    }
  }

  useEffect(() => {
    async function fetchAdsData() {
      try {
        setAdsLoading(true)
        setError('')
        
        // Fetch paginated posts - admin can see all posts including pending
        const postsResponse = await fetch(`/api/v1/posts?page=${currentPage}&limit=${itemsPerPage}&showAll=true`)
        const postsData = await postsResponse.json()
        
        if (postsData.data && Array.isArray(postsData.data)) {
          const mappedAds = postsData.data.map(post => ({
            id: post.post_id,
            post_id: post.post_id,
            title: post.title,
            content: post.content,
            image: (Array.isArray(post.images) && post.images.length ? post.images[0].url : 'https://picsum.photos/seed/product/300/200'),
            price: post.price || '',
            location: post.location || '',
            category_id: post.category_id,
            user_id: post.user_id,
            created_at: post.created_at,
            status: post.status || 'pending',
            images: post.images || []
          }))
          
          setAds(mappedAds)
          setTotalAds(postsData.total || 0)
          setHasMore(postsData.has_more || false)
        } else {
          setAds([])
          setTotalAds(0)
          setHasMore(false)
        }
      } catch (err) {
        console.error('Error loading ads:', err)
        setError('Error loading ads: ' + (err.message || 'Unknown error'))
        setAds([])
        setTotalAds(0)
        setHasMore(false)
      } finally {
        setAdsLoading(false)
      }
    }
    
    fetchAdsData()
  }, [currentPage, itemsPerPage, setError])

  const fetchAds = useCallback(async (page) => {
    try {
      setAdsLoading(true)
      setError('')
      
      // Fetch paginated posts - admin can see all posts including pending
      const postsResponse = await fetch(`/api/v1/posts?page=${page || currentPage}&limit=${itemsPerPage}&showAll=true`)
      const postsData = await postsResponse.json()
      
      if (postsData.data && Array.isArray(postsData.data)) {
        const mappedAds = postsData.data.map(post => ({
          id: post.post_id,
          post_id: post.post_id,
          title: post.title,
          content: post.content,
          image: (Array.isArray(post.images) && post.images.length ? post.images[0].url : 'https://picsum.photos/seed/product/300/200'),
          price: post.price || '',
          location: post.location || '',
          category_id: post.category_id,
          user_id: post.user_id,
          created_at: post.created_at,
          status: post.status || 'pending',
          images: post.images || []
        }))
        
        setAds(mappedAds)
        setTotalAds(postsData.total || 0)
        setHasMore(postsData.has_more || false)
      } else {
        setAds([])
        setTotalAds(0)
        setHasMore(false)
      }
    } catch (err) {
      console.error('Error loading ads:', err)
      setError('Error loading ads: ' + (err.message || 'Unknown error'))
      setAds([])
      setTotalAds(0)
      setHasMore(false)
    } finally {
      setAdsLoading(false)
    }
  }, [currentPage, itemsPerPage, setError])

  // Filter ads with useMemo for performance
  const filteredAds = useMemo(() => {
    let result = [...ads]
    
    // Filter by status tab
    if (adsTab === 'pending') {
      result = result.filter(ad => (ad.status || 'pending') === 'pending')
    } else if (adsTab === 'active') {
      result = result.filter(ad => (ad.status || 'pending') === 'active')
    } else if (adsTab === 'inactive') {
      result = result.filter(ad => (ad.status || 'pending') === 'inactive')
    }
    // 'all' shows everything
    
    // Filter by category
    if (selectedCategory !== 'all') {
      const categoryId = parseInt(selectedCategory, 10)
      if (!isNaN(categoryId)) {
        result = result.filter(ad => ad.category_id === categoryId)
      }
    }
    
    // Filter by search
    if (debouncedSearch.trim()) {
      const searchLower = debouncedSearch.toLowerCase()
      result = result.filter(ad => 
        ad.title?.toLowerCase().includes(searchLower) ||
        ad.content?.toLowerCase().includes(searchLower)
      )
    }
    
    return result
  }, [ads, selectedCategory, debouncedSearch, adsTab])

  const handleToggleStatus = useCallback(async (ad, forceStatus = null) => {
    const newStatus = forceStatus || (ad.status === 'active' ? 'inactive' : 'active')
    
    try {
      setTogglingStatus(prev => ({ ...prev, [ad.post_id]: true }))
      setError('')
      
      const response = await fetch(`/api/v1/posts/${ad.post_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (response.ok) {
        // Update local state
        setAds(prev => prev.map(a => 
          a.post_id === ad.post_id ? { ...a, status: newStatus } : a
        ))
        setError('')
        if (typeof window !== 'undefined' && window.swal) {
          window.swal('Success', `Ad ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`, 'success')
        } else {
          alert(`Ad ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`)
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to update ad status')
      }
    } catch (err) {
      console.error('Error toggling ad status:', err)
      setError('Error updating ad status: ' + (err.message || 'Unknown error'))
      if (typeof window !== 'undefined' && window.swal) {
        window.swal('Error', err.message || 'Failed to update ad status', 'error')
      } else {
        alert('Error updating ad status: ' + err.message)
      }
    } finally {
      setTogglingStatus(prev => ({ ...prev, [ad.post_id]: false }))
    }
  }, [setError])

  const handleDelete = useCallback(async (ad) => {
    if (!confirm('Are you sure you want to delete this ad?')) {
      return
    }

    try {
      const response = await fetch(`/api/v1/posts/${ad.post_id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        // Refresh current page
        await fetchAds(currentPage)
        setError('')
        if (typeof window !== 'undefined' && window.swal) {
          window.swal('Success', 'Ad deleted successfully', 'success')
        } else {
          alert('Ad deleted successfully')
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to delete ad')
      }
    } catch (err) {
      console.error('Error deleting ad:', err)
      setError('Error deleting ad: ' + (err.message || 'Unknown error'))
      if (typeof window !== 'undefined' && window.swal) {
        window.swal('Error', err.message || 'Failed to delete ad', 'error')
      } else {
        alert('Error deleting ad: ' + err.message)
      }
    }
  }, [currentPage, fetchAds, setError])

  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }, [])

  // Calculate pagination info
  const totalPages = Math.ceil(totalAds / itemsPerPage)
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalAds)

  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [totalPages])

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 7
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i)
        pages.push('ellipsis')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 3) {
        pages.push(1)
        pages.push('ellipsis')
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push('ellipsis')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
        pages.push('ellipsis')
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  return (
    <div style={{background: '#fff', borderRadius: '8px', border: '1px solid rgba(1,47,52,.2)', overflow: 'hidden'}}>
      <div style={{padding: '20px', borderBottom: '1px solid rgba(1,47,52,.1)'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px'}}>
          <div>
            <h2 style={{fontSize: '20px', fontWeight: '500', margin: 0}}>Manage All Ads</h2>
            <p style={{fontSize: '14px', color: '#666', margin: '8px 0 0 0'}}>
              View and manage all ads from all users
              {totalAds > 0 && (
                <span style={{marginLeft: '8px', color: '#012f34', fontWeight: '500'}}>
                  ({totalAds.toLocaleString()} total)
                </span>
              )}
            </p>
          </div>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value))
              setCurrentPage(1)
            }}
            style={{
              padding: '8px 12px',
              border: '1px solid rgba(1,47,52,.2)',
              borderRadius: '4px',
              fontSize: '14px',
              backgroundColor: '#fff',
              cursor: 'pointer'
            }}
          >
            <option value="10">10 per page</option>
            <option value="20">20 per page</option>
            <option value="50">50 per page</option>
          </select>
        </div>
      </div>
      
      {adsLoading ? (
        <div style={{padding: '60px 20px', textAlign: 'center', color: '#666'}}>
          <div style={{
            display: 'inline-block',
            width: '32px',
            height: '32px',
            border: '3px solid rgba(1,47,52,.1)',
            borderTopColor: '#3a77ff',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            marginBottom: '12px'
          }}></div>
          <div style={{fontSize: '14px'}}>Loading ads...</div>
        </div>
      ) : (
        <div style={{padding: '20px'}}>
          {/* Search and Filter */}
          <div style={{marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap'}}>
            <input
              type="text"
              placeholder="Search ads by title or content..."
              value={adsSearch}
              onChange={(e) => setAdsSearch(e.target.value)}
              style={{
                flex: '1',
                minWidth: '200px',
                padding: '10px 12px',
                border: '1px solid rgba(1,47,52,.2)',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '10px 12px',
                border: '1px solid rgba(1,47,52,.2)',
                borderRadius: '4px',
                fontSize: '14px',
                minWidth: '180px',
                backgroundColor: '#fff',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.category_id} value={cat.category_id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <div style={{display: 'flex', gap: '8px'}}>
              {['all', 'pending', 'active', 'inactive'].map(kind => {
                const isActive = adsTab === kind
                return (
                  <button
                    key={kind}
                    className="manage-tab-btn"
                    onClick={() => setAdsTab(kind)}
                    aria-pressed={isActive}
                  >
                    {kind === 'all' ? 'All' : kind.charAt(0).toUpperCase() + kind.slice(1)}
                    {kind === 'pending' && (
                      <span style={{
                        marginLeft: '6px',
                        background: '#ff9800',
                        color: '#fff',
                        borderRadius: '10px',
                        padding: '2px 6px',
                        fontSize: '10px',
                        fontWeight: '600'
                      }}>
                        {ads.filter(a => (a.status || 'pending') === 'pending').length}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Results Info */}
          {(selectedCategory !== 'all' || debouncedSearch.trim()) && filteredAds.length > 0 && (
            <div style={{
              marginBottom: '16px',
              padding: '10px 14px',
              background: '#e3f2fd',
              border: '1px solid rgba(58,119,255,.2)',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#1565c0'
            }}>
              Showing {filteredAds.length} {filteredAds.length === 1 ? 'result' : 'results'} on this page
              {(selectedCategory !== 'all' || debouncedSearch.trim()) && ` (filtered from ${totalAds} total)`}
            </div>
          )}

          {/* Ads List */}
          <div style={{display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '400px'}}>
            {filteredAds.length === 0 ? (
              <div style={{padding: '60px 20px', textAlign: 'center', color: '#666'}}>
                <div style={{fontSize: '16px', marginBottom: '8px', color: '#012f34'}}>
                  No ads found
                </div>
                <div style={{fontSize: '14px'}}>
                  {selectedCategory !== 'all' || debouncedSearch.trim() 
                    ? 'Try adjusting your filters' 
                    : 'No ads available yet'}
                </div>
              </div>
            ) : (
              filteredAds.map((ad) => {
                const user = usersMap[ad.user_id] || {}
                const imgSrc = ad.image || 'https://picsum.photos/seed/product/300/200'
                
                return (
                  <div key={ad.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: '1px solid rgba(1,47,52,.2)',
                    borderRadius: '6px',
                    padding: '16px',
                    gap: '16px',
                    transition: 'box-shadow 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                  >
                    <div style={{display: 'flex', alignItems: 'center', gap: '16px', flex: '1'}}>
                      <img 
                        src={imgSrc} 
                        alt={ad.title} 
                        loading="lazy" 
                        style={{
                          width: '120px',
                          height: '90px',
                          objectFit: 'cover',
                          borderRadius: '4px',
                          flexShrink: 0
                        }} 
                      />
                      <div style={{flex: '1', minWidth: 0}}>
                        <h3 style={{fontWeight: '500', margin: '0 0 4px 0', fontSize: '16px'}}>
                          {ad.title}
                        </h3>
                        <p style={{color: 'rgba(0,47,52,.64)', fontSize: '14px', margin: '0 0 8px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>
                          {ad.content}
                        </p>
                        <div style={{display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: 'rgba(0,47,52,.64)'}}>
                          <span style={{
                            background: ad.status === 'active' ? '#e8f5e9' : ad.status === 'pending' ? '#fff3e0' : '#ffebee',
                            color: ad.status === 'active' ? '#2e7d32' : ad.status === 'pending' ? '#e65100' : '#c62828',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            fontSize: '11px'
                          }}>
                            {ad.status === 'active' ? '✓ Active' : ad.status === 'pending' ? '⏳ Pending' : '✗ Inactive'}
                          </span>
                          {categoriesMap[ad.category_id] && (
                            <span style={{
                              background: '#e3f2fd',
                              color: '#1565c0',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontWeight: '500'
                            }}>
                              <strong>Category:</strong> {categoriesMap[ad.category_id]}
                            </span>
                          )}
                          {ad.price && (
                            <span><strong>Price:</strong> {ad.price}</span>
                          )}
                          {ad.location && (
                            <span><strong>Location:</strong> {ad.location}</span>
                          )}
                          <span><strong>User:</strong> {user.name || user.username || user.email || 'Unknown'}</span>
                          <span><strong>Email:</strong> {user.email || 'N/A'}</span>
                          {ad.created_at && (
                            <span><strong>Created:</strong> {formatDate(ad.created_at)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap'}}>
                        {(ad.status || 'pending') === 'pending' && (
                          <button
                            className="btn btn--primary btn--md"
                            onClick={() => handleToggleStatus({ ...ad, status: 'active' }, 'active')}
                            disabled={togglingStatus[ad.post_id]}
                            style={{
                              opacity: togglingStatus[ad.post_id] ? 0.6 : 1,
                              cursor: togglingStatus[ad.post_id] ? 'not-allowed' : 'pointer',
                              minWidth: '100px',
                              background: '#4caf50',
                              borderColor: '#4caf50'
                            }}
                          >
                            {togglingStatus[ad.post_id] ? 'Approving...' : 'Approve'}
                          </button>
                        )}
                        {(ad.status || 'pending') !== 'pending' && (
                          <button
                            className={ad.status === 'active' ? "btn btn--secondary btn--md" : "btn btn--primary btn--md"}
                            onClick={() => handleToggleStatus(ad)}
                            disabled={togglingStatus[ad.post_id]}
                            style={{
                              opacity: togglingStatus[ad.post_id] ? 0.6 : 1,
                              cursor: togglingStatus[ad.post_id] ? 'not-allowed' : 'pointer',
                              minWidth: '100px'
                            }}
                          >
                            {togglingStatus[ad.post_id] 
                              ? 'Updating...' 
                              : ad.status === 'active' 
                                ? 'Deactivate' 
                                : 'Activate'}
                          </button>
                        )}
                        <button
                          className="btn btn--outline btn--md"
                          onClick={() => router.push(`/product/${ad.post_id}`)}
                        >
                          View
                        </button>
                        <button
                          className="btn btn--secondary btn--md"
                          onClick={() => router.push(`/sell?editId=${ad.post_id}&source=db`)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn--danger btn--md"
                          onClick={() => handleDelete(ad)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{
              marginTop: '24px',
              paddingTop: '20px',
              borderTop: '1px solid rgba(1,47,52,.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{fontSize: '14px', color: 'rgba(0,47,52,.64)'}}>
                Showing {startItem} to {endItem} of {totalAds.toLocaleString()} ads
              </div>
              
              <div style={{display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap'}}>
                <button
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1}
                  className="btn btn--outline btn--md"
                  style={{
                    opacity: currentPage === 1 ? 0.5 : 1,
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    minWidth: '80px'
                  }}
                >
                  First
                </button>
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="btn btn--outline btn--md"
                  style={{
                    opacity: currentPage === 1 ? 0.5 : 1,
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    minWidth: '80px'
                  }}
                >
                  Previous
                </button>
                
                {getPageNumbers().map((page, idx) => (
                  page === 'ellipsis' ? (
                    <span key={`ellipsis-${idx}`} style={{padding: '0 8px', color: 'rgba(0,47,52,.64)'}}>...</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={currentPage === page ? "btn btn--primary btn--md" : "btn btn--outline btn--md"}
                      style={{
                        minWidth: '40px'
                      }}
                    >
                      {page}
                    </button>
                  )
                ))}
                
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="btn btn--outline btn--md"
                  style={{
                    opacity: currentPage === totalPages ? 0.5 : 1,
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    minWidth: '80px'
                  }}
                >
                  Next
                </button>
                <button
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="btn btn--outline btn--md"
                  style={{
                    opacity: currentPage === totalPages ? 0.5 : 1,
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    minWidth: '80px'
                  }}
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
