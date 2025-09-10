/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs', 'jsonwebtoken', 'sqlite3', 'pg']
  },
  webpack: (config, { isServer }) => {
    // Don't externalize bcryptjs and jsonwebtoken for server-side
    if (isServer) {
      config.externals = config.externals.filter(external =>
        external !== 'bcryptjs' && external !== 'jsonwebtoken'
      )
    }
    return config
  }
}

module.exports = nextConfig