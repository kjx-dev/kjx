function computeStrength(s){
  const v = String(s||'')
  let score = 0
  if (v.length >= 8) score++
  if (/[A-Z]/.test(v)) score++
  if (/[a-z]/.test(v)) score++
  if (/[0-9]/.test(v)) score++
  if (/[^A-Za-z0-9]/.test(v)) score++
  const labels = ['Very Weak','Weak','Fair','Good','Strong','Very Strong']
  const colors = ['#b00020','#d32f2f','#f57c00','#fbc02d','#388e3c','#2e7d32']
  const idx = Math.min(score, labels.length-1)
  return { score, label: labels[idx], color: colors[idx] }
}
function passwordComplexity(p){
  const s = String(p||'')
  const long = s.length >= 8
  const upper = /[A-Z]/.test(s)
  const lower = /[a-z]/.test(s)
  const digit = /[0-9]/.test(s)
  const special = /[^A-Za-z0-9]/.test(s)
  return long && upper && lower && digit && special
}
module.exports = { computeStrength, passwordComplexity }