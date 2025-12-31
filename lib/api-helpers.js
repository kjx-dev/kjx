/**
 * API Helper utilities for common optimizations
 */

/**
 * Set cache headers for API responses
 * @param {Response} res - Express response object
 * @param {number} maxAge - Cache max age in seconds (default: 60)
 * @param {boolean} isPublic - Whether cache is public (default: false)
 */
export function setCacheHeaders(res, maxAge = 60, isPublic = false) {
  const cacheControl = isPublic 
    ? `public, max-age=${maxAge}, s-maxage=${maxAge}`
    : `private, max-age=${maxAge}`
  
  res.setHeader('Cache-Control', cacheControl)
  res.setHeader('Vary', 'Accept-Encoding')
}

/**
 * Set no-cache headers for dynamic content
 * @param {Response} res - Express response object
 */
export function setNoCacheHeaders(res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
}

/**
 * Optimize response by removing unnecessary fields
 * @param {Object} data - Response data
 * @param {Array} fieldsToRemove - Fields to remove from response
 */
export function optimizeResponse(data, fieldsToRemove = ['password_hash']) {
  if (Array.isArray(data)) {
    return data.map(item => optimizeResponse(item, fieldsToRemove))
  }
  
  if (data && typeof data === 'object') {
    const optimized = { ...data }
    fieldsToRemove.forEach(field => {
      delete optimized[field]
    })
    return optimized
  }
  
  return data
}

/**
 * Parse and validate pagination parameters
 * @param {Object} query - Request query object
 * @returns {Object} - { page, limit, skip }
 */
export function parsePagination(query) {
  const page = Math.max(1, parseInt(String(query.page || '1'), 10) || 1)
  const limit = Math.max(1, Math.min(100, parseInt(String(query.limit || '10'), 10) || 10))
  const skip = (page - 1) * limit
  
  return { page, limit, skip }
}

/**
 * Escape SQL string to prevent injection
 * @param {string} str - String to escape
 * @returns {string} - Escaped string
 */
export function escapeSQL(str) {
  if (!str) return ''
  return String(str).replace(/'/g, "''")
}
