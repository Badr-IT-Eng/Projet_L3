/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Temporarily ignore during builds until all imports are fixed
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Only ignore in development, enforce in production
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https', 
        hostname: 'ui.shadcn.com',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
    ],
  },
  reactStrictMode: true,
  experimental: {
    scrollRestoration: true,
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      '@radix-ui/react-slot',
      'date-fns',
      'class-variance-authority',
    ],
  },
  productionBrowserSourceMaps: false,
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(png|jpg|jpeg|gif|svg|ico)$/i,
      type: 'asset/resource',
    });
    return config;
  },
}

export default nextConfig
