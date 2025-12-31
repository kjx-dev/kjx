function getHeaderState(auth){
  const showProfile = !!(auth && auth.email && auth.isAuthenticated)
  return { showProfile }
}

module.exports = { getHeaderState }