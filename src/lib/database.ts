import { PrismaClient } from '@prisma/client'

// Create Prisma client
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
})

// Database connection test
export async function testDatabaseConnection() {
  try {
    await prisma.$connect()
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح')
    return { success: true }
  } catch (error) {
    console.error('❌ فشل الاتصال بقاعدة البيانات:', error)
    return { success: false, error: error instanceof Error ? error.message : 'خطأ غير معروف' }
  }
}

// Database health check
export async function checkDatabaseHealth() {
  try {
    const startTime = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const responseTime = Date.now() - startTime
    
    return {
      status: 'healthy',
      responseTime,
      database: 'PostgreSQL (Neon)'
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'خطأ غير معروف',
      database: 'PostgreSQL (Neon)'
    }
  }
}