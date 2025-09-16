import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Fallback database URL
const FALLBACK_DATABASE_URL = "postgresql://neondb_owner:npg_x5qvmpzF3hjX@ep-dawn-cell-adylfb98-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || FALLBACK_DATABASE_URL
    }
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty'
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Test database connection
export async function testDatabaseConnection() {
  try {
    await prisma.$connect()
    console.log('✅ Database connection successful')
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return false
  } finally {
    try {
      await prisma.$disconnect()
    } catch (disconnectError) {
      console.error('Error disconnecting from database:', disconnectError)
    }
  }
}