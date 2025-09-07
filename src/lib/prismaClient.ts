// Prisma Client helper with dynamic database URL
import { PrismaClient } from '@prisma/client'
import { getCurrentDatabaseUrl } from './databaseConfig'

let prismaInstance: PrismaClient | null = null

// Create Prisma client with current database URL
export async function createPrismaClient(): Promise<PrismaClient> {
  try {
    // Get current database URL from config
    const databaseUrl = await getCurrentDatabaseUrl()
    console.log('🔗 استخدام رابط قاعدة البيانات:', databaseUrl.substring(0, 50) + '...')
    
    // Create new Prisma client with current database URL
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl
        }
      }
    })
    
    // Test connection
    await prisma.$connect()
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح')
    
    return prisma
  } catch (error: any) {
    console.error('❌ خطأ في الاتصال بقاعدة البيانات:', error?.message || error)
    throw new Error(`فشل في الاتصال بقاعدة البيانات: ${error?.message || error}`)
  }
}

// Get or create singleton Prisma client
export async function getPrismaClient(): Promise<PrismaClient> {
  if (!prismaInstance) {
    prismaInstance = await createPrismaClient()
  }
  return prismaInstance
}

// Disconnect Prisma client
export async function disconnectPrisma(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect()
    prismaInstance = null
    console.log('🔌 تم قطع الاتصال بقاعدة البيانات')
  }
}

// Reset Prisma client (useful when database URL changes)
export async function resetPrismaClient(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect()
    prismaInstance = null
    console.log('🔄 تم إعادة تعيين Prisma Client')
  }
}