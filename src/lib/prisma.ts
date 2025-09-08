import { PrismaClient } from '@prisma/client'
import { getEnvVars, resolveUrlByType, DbType } from './env'

// Create Prisma client with runtime URL override
export function createPrismaClient(customUrl?: string) {
  // Use custom URL if provided, otherwise use environment variable
  const databaseUrl = customUrl || process.env.DATABASE_URL || 'file:./prisma/dev.db'
  
  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl
      }
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
  })
}

// Default client instance
export const prisma = createPrismaClient()

// Test database connection
export async function testDatabaseConnection(customUrl?: string) {
  const client = createPrismaClient(customUrl)
  
  try {
    await client.$connect()
    console.log(`✅ تم الاتصال بقاعدة البيانات`)
    return { success: true }
  } catch (error) {
    console.error('❌ فشل الاتصال بقاعدة البيانات:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'خطأ غير معروف' 
    }
  } finally {
    await client.$disconnect()
  }
}

// Database health check
export async function checkDatabaseHealth(customUrl?: string) {
  const client = createPrismaClient(customUrl)
  
  try {
    const startTime = Date.now()
    await client.$queryRaw`SELECT 1`
    const responseTime = Date.now() - startTime
    
    return {
      status: 'healthy',
      responseTime,
      type: getEnvVars().DATABASE_TYPE
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'خطأ غير معروف',
      type: getEnvVars().DATABASE_TYPE
    }
  } finally {
    await client.$disconnect()
  }
}

// Helper function to handle database errors
export function handleDatabaseError(error: any): string {
  console.error('Database error:', error)
  
  if (error.code === 'P2002') {
    return 'هذا الكود مستخدم بالفعل'
  }
  
  if (error.code === 'P2003') {
    return 'لا يمكن حذف هذا العنصر لأنه مرتبط بعناصر أخرى'
  }
  
  if (error.code === 'P2025') {
    return 'العنصر غير موجود'
  }
  
  if (error.code === 'P1001') {
    return 'لا يمكن الاتصال بقاعدة البيانات'
  }
  
  if (error.code === 'P1002') {
    return 'انتهت مهلة الاتصال بقاعدة البيانات'
  }
  
  return 'خطأ في قاعدة البيانات'
}

// Export default client
export default prisma