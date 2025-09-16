/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: false,
  images: {
    unoptimized: true
  },
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs', 'jsonwebtoken'],
    // FIXED: Enable modern bundling optimizations
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu']
  },
  // FIXED: Enhanced compiler options for better performance
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
  // FIXED: Optimize bundle splitting
  webpack: (config, { isServer, dev }) => {
    // Don't externalize bcryptjs and jsonwebtoken for server-side
    if (isServer) {
      config.externals = config.externals.filter(external =>
        external !== 'bcryptjs' && external !== 'jsonwebtoken'
      )
    }

    // FIXED: Optimize bundle splitting for better caching
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          ui: {
            test: /[\\/]src[\\/]components[\\/]ui[\\/]/,
            name: 'ui',
            chunks: 'all',
            priority: 20,
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      }
    }

    // FIXED: Add performance optimizations
    config.optimization.usedExports = true
    config.optimization.sideEffects = false

    return config
  },
  // FIXED: Add headers for better caching
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
  // إعدادات Netlify
  output: 'export',
  distDir: 'out',
}

module.exports = nextConfig