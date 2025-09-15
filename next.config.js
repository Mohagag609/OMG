/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: false,
  images: {
    unoptimized: true
  },
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs', 'jsonwebtoken']
  },
  // إعدادات Netlify - تعطيل static export مؤقتاً
  // output: 'export',
  distDir: '.next',
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