/**
 * Centralized category utilities
 * Ensures consistent category display, order, and icons across the entire website
 */

import { getShortCategoryName } from './categoryNames'
import { getCategoryIcon } from './categoryIcons'

// Define the standard category order
const CATEGORY_ORDER = [
  'mobile-phones',
  'cars',
  'motercycles',
  'bikes',
  'house',
  'property',
  'tv-video-audio',
  'electronics',
  'tablets',
  'land-plots',
  'jobs',
  'services',
  'furniture',
  'fashion',
  'beauty',
  'animals',
  'books',
  'sports',
  'kids',
  'business',
  'industrial'
]

function slugify(str) {
  return String(str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

/**
 * Get categories in a consistent order for display
 * @param {Array} catTiles - Array of category tiles from API
 * @param {Array} groups - Array of category groups (optional, for sell page)
 * @returns {Array} Sorted and formatted categories
 */
export function getOrderedCategories(catTiles = [], groups = []) {
  let categoriesToSort = []
  
  // Prefer catTiles if available, otherwise use groups
  if (Array.isArray(catTiles) && catTiles.length > 0) {
    // Remove duplicates
    const seen = new Set()
    const uniq = []
    for (const t of catTiles) {
      if (!t || !t.k) continue
      const key = String(t.label || t.k || '').toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      uniq.push(t)
    }
    categoriesToSort = uniq
  } else if (Array.isArray(groups) && groups.length > 0) {
    // Fallback: use groups if available
    categoriesToSort = groups.map(g => {
      const tileMatch = catTiles.find(t => t.k === g.parent.name || t.label === g.parent.name)
      const baseLabel = tileMatch ? (tileMatch.shortLabel || tileMatch.label) : g.parent.name
      return {
        k: g.parent.name,
        label: g.parent.name,
        shortLabel: tileMatch ? tileMatch.shortLabel : null,
        icon: tileMatch ? tileMatch.icon : g.parent.icon,
        category_id: g.parent.category_id
      }
    })
  } else {
    return []
  }

  // Sort by predefined order
  const sorted = categoriesToSort.sort((a, b) => {
    const slugA = slugify(a.k || a.label || '')
    const slugB = slugify(b.k || b.label || '')
    const indexA = CATEGORY_ORDER.findIndex(order => slugA.includes(order) || order.includes(slugA))
    const indexB = CATEGORY_ORDER.findIndex(order => slugB.includes(order) || order.includes(slugB))
    
    if (indexA === -1 && indexB === -1) return 0
    if (indexA === -1) return 1
    if (indexB === -1) return -1
    return indexA - indexB
  })

  // Format categories consistently
  return sorted.map(t => ({
    k: t.k,
    label: t.label,
    shortLabel: t.shortLabel,
    icon: t.icon,
    displayLabel: getShortCategoryName(t.shortLabel || t.label, t.k),
    category_id: t.category_id,
    name: t.k || t.label
  }))
}

/**
 * Get category icon component
 * @param {Object} category - Category object
 * @returns {Component} React icon component
 */
export function getCategoryIconComponent(category) {
  if (!category) return null
  const iconData = {
    icon: category.icon || 'fa-tags',
    label: category.displayLabel || category.shortLabel || category.label || category.name,
    k: category.k || category.name
  }
  return getCategoryIcon(iconData)
}

