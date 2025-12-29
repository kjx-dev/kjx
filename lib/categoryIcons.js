/**
 * Centralized category icon utility
 * Ensures consistent category icons across the entire website
 */

import { 
  FaTags, FaMobileAlt, FaCar, FaMotorcycle, FaHome, FaTv, FaTabletAlt, 
  FaMapMarkerAlt, FaBriefcase, FaPaintRoller, FaChair, FaLaptop, FaHeadphones, 
  FaCamera, FaGamepad, FaBook, FaDumbbell, FaUser, FaBaby, FaDog, FaIndustry, 
  FaTools, FaKey
} from 'react-icons/fa'
import { getShortCategoryName } from './categoryNames'

export function getCategoryIcon(category) {
  try {
    if (!category) return FaTags
    
    // Get the display label (short name) to match icons consistently
    const displayLabel = getShortCategoryName(category.label, category.k || category.name || '')
    const label = String(displayLabel || category.label || '').toLowerCase()
    const iconName = String(category.icon || '').toLowerCase()
    const key = String(category.k || category.name || '').toLowerCase()
    
    // Match icons based on short category names - check exact matches first
    if (label === 'mobiles' || label.includes('mobile') || iconName.includes('mobile') || iconName.includes('phone') || key.includes('mobile') || key.includes('phone')) return FaMobileAlt
    if (label === 'vehicles' || label.includes('vehicle') || iconName.includes('car') || iconName.includes('vehicle') || key.includes('car') || key.includes('vehicle')) return FaCar
    if (label === 'bikes' || label.includes('bike') || iconName.includes('motor') || iconName.includes('moter') || iconName.includes('bike') || key.includes('motor') || key.includes('bike')) return FaMotorcycle
    if (label.includes('property for rent') || (label.includes('property') && label.includes('rent')) || iconName.includes('key') || key.includes('rent')) return FaKey
    if (label.includes('property for sale') || (label.includes('property') && label.includes('sale')) || iconName.includes('house') || iconName.includes('home') || key.includes('house') || (key.includes('property') && !key.includes('rent'))) return FaHome
    if (label === 'electronics' || label.includes('electronic') || iconName.includes('tv') || iconName.includes('video') || iconName.includes('audio') || iconName.includes('electronics') || iconName.includes('camera') || key.includes('tv') || key.includes('video') || key.includes('audio')) return FaTv
    if (label === 'tablets' || label.includes('tablet') || iconName.includes('tablet') || key.includes('tablet')) return FaTabletAlt
    if (label.includes('land') || label.includes('plot') || iconName.includes('map') || iconName.includes('location') || iconName.includes('land') || iconName.includes('plot') || key.includes('land') || key.includes('plot')) return FaMapMarkerAlt
    if (label === 'jobs' || label.includes('job') || iconName.includes('briefcase') || iconName.includes('job') || key.includes('job')) return FaBriefcase
    if (label === 'services' || label.includes('service') || iconName.includes('paint') || iconName.includes('service') || key.includes('service')) return FaPaintRoller
    if (label === 'furniture' || label.includes('furniture') || iconName.includes('chair') || iconName.includes('furniture') || key.includes('furniture')) return FaChair
    if (label === 'animals' || label.includes('animal') || iconName.includes('dove') || iconName.includes('animal') || key.includes('animal')) return FaDog
    if (label.includes('fashion') || label.includes('beauty') || iconName.includes('dress') || iconName.includes('fashion') || iconName.includes('beauty') || iconName.includes('clothing') || key.includes('fashion')) return FaUser
    if (label.includes('books') || label.includes('sport') || label.includes('hobby') || iconName.includes('book') || iconName.includes('sport') || iconName.includes('hobby') || key.includes('book') || key.includes('sport')) return FaBook
    if (label === 'kids' || label.includes('kid') || iconName.includes('child') || iconName.includes('kid') || iconName.includes('baby') || key.includes('kid') || key.includes('children')) return FaBaby
    if (label === 'business' || label.includes('business') || label.includes('industrial') || iconName.includes('industry') || iconName.includes('business') || key.includes('business') || key.includes('industrial')) return FaIndustry
    if (iconName.includes('laptop') || iconName.includes('computer') || key.includes('laptop') || key.includes('computer')) return FaLaptop
    if (iconName.includes('headphone') || iconName.includes('audio') || key.includes('headphone')) return FaHeadphones
    if (iconName.includes('camera') || key.includes('camera')) return FaCamera
    if (iconName.includes('game') || iconName.includes('console') || key.includes('game')) return FaGamepad
    if (iconName.includes('sport') || iconName.includes('fitness') || iconName.includes('dumbbell') || key.includes('fitness')) return FaDumbbell
    if (iconName.includes('tool') || key.includes('tool')) return FaTools
    
    return FaTags
  } catch (error) {
    console.error('Error in getCategoryIcon:', error)
    return FaTags
  }
}

