/** @type {import('next').NextConfig} */
const nextConfig = {
  // SECURITY: Disable source maps in production
  productionBrowserSourceMaps: false,

  // SECURITY: Remove powered-by header
  poweredByHeader: false,

  // SECURITY: Strict mode for React
  reactStrictMode: true,

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://www.netten.app',
  },

  // Image optimization
  images: {
    domains: ['netten.app', 'www.netten.app'],
  },
}

module.exports = nextConfig
