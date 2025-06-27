/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true
  },
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8082',
    NEXT_PUBLIC_DETECTION_API_URL: process.env.NEXT_PUBLIC_DETECTION_API_URL || 'http://localhost:5002'
  }
}

module.exports = nextConfig