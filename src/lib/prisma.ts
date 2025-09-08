// Prisma client with runtime URL override support
import { PrismaClient } from '@prisma/client'
import { resolveUrlByType, DbType } from './env'

// Global variable to store the Prisma client instance
declare global {
  var __prisma: PrismaClient | undefined
}

// Create Prisma client with runtime URL override
export function createPrismaClient(databaseUrl?: string): PrismaClient {
  // Use provided URL or resolve from environment
  const url = databaseUrl || process.env.DATABASE_URL || resolveUrlByType('sqlite')
  
  // Create new Prisma client with the specified URL
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: url
      }
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
  })

  return prisma
}

// Get or create global Prisma client instance
export function getPrismaClient(databaseUrl?: string): PrismaClient {
  if (process.env.NODE_ENV === 'production') {
    // In production, always create a new instance with the current URL
    return createPrismaClient(databaseUrl)
  } else {
    // In development, use global instance to prevent multiple connections
    if (!global.__prisma) {
      global.__prisma = createPrismaClient(databaseUrl)
    }
    return global.__prisma
  }
}

// Default Prisma client instance
export const prisma = getPrismaClient()

// Test database connection
export async function testDatabaseConnection(databaseUrl?: string): Promise<boolean> {
  try {
    const client = databaseUrl ? createPrismaClient(databaseUrl) : prisma
    await client.$connect()
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح')
    return true
  } catch (error) {
    console.error('❌ فشل الاتصال بقاعدة البيانات:', error)
    return false
  }
}

// Close database connection
export async function closeDatabaseConnection(): Promise<void> {
  try {
    await prisma.$disconnect()
    console.log('✅ تم إغلاق اتصال قاعدة البيانات')
  } catch (error) {
    console.error('❌ خطأ في إغلاق اتصال قاعدة البيانات:', error)
  }
}

// Switch database connection at runtime
export async function switchDatabaseConnection(
  type: DbType, 
  customUrl?: string
): Promise<PrismaClient> {
  const newUrl = resolveUrlByType(type, customUrl)
  
  // Close existing connection
  await closeDatabaseConnection()
  
  // Create new connection
  const newClient = createPrismaClient(newUrl)
  
  // Test the new connection
  const isConnected = await testDatabaseConnection(newUrl)
  if (!isConnected) {
    throw new Error(`فشل الاتصال بقاعدة البيانات الجديدة: ${newUrl}`)
  }
  
  return newClient
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
    return 'لا يمكن الاتصال بخادم قاعدة البيانات'
  }
  
  if (error.code === 'P1002') {
    return 'انتهت مهلة الاتصال بقاعدة البيانات'
  }
  
  if (error.code === 'P1003') {
    return 'قاعدة البيانات غير موجودة'
  }
  
  if (error.code === 'P1008') {
    return 'انتهت مهلة العملية'
  }
  
  if (error.code === 'P1017') {
    return 'انقطع الاتصال بقاعدة البيانات'
  }
  
  return 'خطأ في قاعدة البيانات'
}

// Helper function to check if record exists
export async function recordExists(model: any, where: any): Promise<boolean> {
  try {
    const count = await model.count({ where })
    return count > 0
  } catch (error) {
    console.error('Error checking record existence:', error)
    return false
  }
}

// Helper function to get record by ID
export async function getRecordById(model: any, id: string): Promise<any> {
  try {
    return await model.findUnique({ where: { id } })
  } catch (error) {
    console.error('Error getting record by ID:', error)
    return null
  }
}

// Helper function to create record
export async function createRecord(model: any, data: any): Promise<any> {
  try {
    return await model.create({ data })
  } catch (error) {
    console.error('Error creating record:', error)
    throw error
  }
}

// Helper function to update record
export async function updateRecord(model: any, id: string, data: any): Promise<any> {
  try {
    return await model.update({ where: { id }, data })
  } catch (error) {
    console.error('Error updating record:', error)
    throw error
  }
}

// Helper function to delete record (soft delete)
export async function deleteRecord(model: any, id: string): Promise<any> {
  try {
    return await model.update({ 
      where: { id }, 
      data: { deletedAt: new Date() } 
    })
  } catch (error) {
    console.error('Error deleting record:', error)
    throw error
  }
}

// Helper function to get all records with pagination
export async function getRecordsWithPagination(
  model: any, 
  page: number = 1, 
  limit: number = 10,
  where: any = {},
  include: any = {}
): Promise<{ data: any[]; total: number; totalPages: number }> {
  try {
    const skip = (page - 1) * limit
    const whereClause = { ...where, deletedAt: null }
    
    const [data, total] = await Promise.all([
      model.findMany({
        where: whereClause,
        include,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      model.count({ where: whereClause })
    ])
    
    const totalPages = Math.ceil(total / limit)
    
    return { data, total, totalPages }
  } catch (error) {
    console.error('Error getting records with pagination:', error)
    throw error
  }
}

// Helper function to search records
export async function searchRecords(
  model: any,
  searchTerm: string,
  searchFields: string[],
  page: number = 1,
  limit: number = 10
): Promise<{ data: any[]; total: number; totalPages: number }> {
  try {
    const skip = (page - 1) * limit
    
    // Create search conditions
    const searchConditions = searchFields.map(field => ({
      [field]: {
        contains: searchTerm,
        mode: 'insensitive'
      }
    }))
    
    const whereClause = {
      deletedAt: null,
      OR: searchConditions
    }
    
    const [data, total] = await Promise.all([
      model.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      model.count({ where: whereClause })
    ])
    
    const totalPages = Math.ceil(total / limit)
    
    return { data, total, totalPages }
  } catch (error) {
    console.error('Error searching records:', error)
    throw error
  }
}

// Graceful shutdown handler
process.on('beforeExit', async () => {
  await closeDatabaseConnection()
})

process.on('SIGINT', async () => {
  await closeDatabaseConnection()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await closeDatabaseConnection()
  process.exit(0)
})