function slugify(str){
  return String(str||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')
}

function isVehicleChild(slug){
  const s = String(slug||'').toLowerCase()
  return s==='cars' || s==='auto-parts' || s==='tyres-wheels' || s==='car-care'
}

function isActiveSlug(currentSlug, itemSlug){
  return String(currentSlug||'').toLowerCase() === String(itemSlug||'').toLowerCase()
}

module.exports = { slugify, isVehicleChild, isActiveSlug }