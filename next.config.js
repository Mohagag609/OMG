/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs', 'jsonwebtoken']
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('bcryptjs', 'jsonwebtoken')
    }
    return config
  }
}

module.exports = nextConfig