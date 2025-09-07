/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: false, // إصلاح مشكلة API routes
  images: {
    unoptimized: true
  },
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs', 'jsonwebtoken', '@prisma/client']
  },
  webpack: (config, { isServer }) => {
    // Don't externalize bcryptjs and jsonwebtoken for server-side
    if (isServer) {
      config.externals = config.externals.filter(external =>
        external !== 'bcryptjs' && external !== 'jsonwebtoken' && external !== '@prisma/client'
      )
    }
    return config
  }
}

module.exports = nextConfig