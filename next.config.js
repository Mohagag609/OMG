/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: false,
  images: {
    unoptimized: true
  },
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs', 'jsonwebtoken', '@prisma/client']
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals.filter(external =>
        external !== 'bcryptjs' && external !== 'jsonwebtoken' && external !== '@prisma/client'
      )
    }
    return config
  },
  // تحسين الأداء
  swcMinify: true,
  compress: true,
  // تحسين الأمان
  poweredByHeader: false,
  // تحسين التطوير
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  }
}

module.exports = nextConfig