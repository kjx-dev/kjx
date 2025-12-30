/**
 * Production utility functions
 * These functions help optimize the codebase for production
 */

/**
 * Safe console.log that only works in development
 */
export const devLog = (...args) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args)
  }
}

/**
 * Safe console.error that works in all environments
 * (Errors should always be logged)
 */
export const logError = (...args) => {
  console.error(...args)
}

/**
 * Safe console.warn that only works in development
 */
export const devWarn = (...args) => {
  if (process.env.NODE_ENV === 'development') {
    console.warn(...args)
  }
}

/**
 * Check if we're in production
 */
export const isProduction = () => {
  return process.env.NODE_ENV === 'production'
}

/**
 * Check if we're in development
 */
export const isDevelopment = () => {
  return process.env.NODE_ENV === 'development'
}
