/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: false,
  images: {
    unoptimized: true
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client']
  },
  // تحسين الأداء
  swcMinify: true,
  // تحسين الأمان
  poweredByHeader: false,
  // تحسين التطوير
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
}

module.exports = nextConfig