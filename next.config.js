/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output mode for optimized deployments
  // This creates a minimal .next/standalone folder with only essential files
  output: 'standalone',
  
  // Optional: Optimize images if using next/image
  images: {
    // Add your image domains if needed
    // domains: ['example.com'],
  },
  
  // Ensure proper module resolution
  webpack: (config) => {
    return config
  },
}

module.exports = nextConfig

