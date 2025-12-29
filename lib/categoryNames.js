/**
 * Centralized category name utility
 * Ensures consistent category names across the entire website
 */

export function getShortCategoryName(label, key){
  const lbl = String(label || '').toLowerCase()
  const k = String(key || '').toLowerCase()
  
  // Map full names to short names - keep Property categories full
  if (lbl.includes('mobile') || lbl.includes('phone') || k.includes('mobile')) return 'Mobiles'
  if (lbl.includes('vehicle') || lbl.includes('car') || k.includes('car') || k.includes('vehicle')) return 'Vehicles'
  if (lbl.includes('bike') || lbl.includes('motorcycle') || lbl.includes('motor') || k.includes('motor') || k.includes('bike')) return 'Bikes'
  if (lbl.includes('electronic') || lbl.includes('tv') || lbl.includes('video') || lbl.includes('audio') || k.includes('tv') || k.includes('video')) return 'Electronics'
  if (lbl.includes('tablet') || k.includes('tablet')) return 'Tablets'
  if (lbl.includes('job') || k.includes('job')) return 'Jobs'
  if (lbl.includes('service') || k.includes('service')) return 'Services'
  if (lbl.includes('furniture') || k.includes('furniture')) return 'Furniture'
  if (lbl.includes('property for rent') || k.includes('rent')) return 'Property for Rent'
  if (lbl.includes('property for sale') || (lbl.includes('property') && k.includes('sale'))) return 'Property for Sale'
  if (lbl.includes('land') || lbl.includes('plot') || k.includes('land') || k.includes('plot')) return 'Land & Plots'
  if (lbl.includes('fashion') || lbl.includes('beauty') || k.includes('fashion')) return 'Fashion & Beauty'
  if (lbl.includes('business') || lbl.includes('industrial') || k.includes('business')) return 'Business'
  if (lbl.includes('animal') || k.includes('animal')) return 'Animals'
  if (lbl.includes('book') || lbl.includes('sport') || lbl.includes('hobby') || k.includes('book')) return 'Books & Sports'
  if (lbl.includes('kid') || k.includes('kid')) return 'Kids'
  
  // If already short or no match, return original label
  return label || key
}

