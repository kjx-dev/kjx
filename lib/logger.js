/**
 * Logger utility - only logs in development mode
 * In production, console.log and console.warn are suppressed
 */

const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args)
    }
  },
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args)
    }
  },
  error: (...args) => {
    // Always log errors, even in production
    console.error(...args)
  },
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args)
    }
  }
}

export default logger
