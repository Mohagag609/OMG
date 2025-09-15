/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: false,
  images: {
    unoptimized: true
  },
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs', 'jsonwebtoken']
  },
  // إعدادات Netlify
  output: 'export',
  distDir: 'out',
  // Exclude API routes from static export
  exportPathMap: async function (defaultPathMap) {
    const pathMap = {}
    for (const [path, config] of Object.entries(defaultPathMap)) {
      if (!path.startsWith('/api/')) {
        pathMap[path] = config
      }
    }
    return pathMap
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