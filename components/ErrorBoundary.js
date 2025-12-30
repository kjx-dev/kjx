import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
    // In production, you could send to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          background: '#f5f5f5'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '40px',
            maxWidth: '600px',
            textAlign: 'center',
            border: '1px solid rgba(1,47,52,.1)'
          }}>
            <h1 style={{ fontSize: '24px', fontWeight: '500', color: '#012f34', marginBottom: '16px' }}>
              Something went wrong
            </h1>
            <p style={{ color: 'rgba(0,47,52,.7)', marginBottom: '24px' }}>
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.reload()
              }}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                background: '#f55100',
                color: '#fff',
                border: 'none',
                fontWeight: '400',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
