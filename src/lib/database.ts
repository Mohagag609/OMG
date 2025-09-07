import { PrismaClient } from '@prisma/client'

export type DatabaseType = 'sqlite' | 'postgresql'

export interface DatabaseConfig {
  type: DatabaseType
  url: string
  name: string
  description: string
}

export const DATABASE_CONFIGS: Record<DatabaseType, DatabaseConfig> = {
  sqlite: {
    type: 'sqlite',
    url: 'file:./dev.db',
    name: 'SQLite (محلي)',
    description: 'قاعدة بيانات محلية سريعة ومناسبة للتطوير'
  },
  postgresql: {
    type: 'postgresql',
    url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/estate_management',
    name: 'PostgreSQL (محلي)',
    description: 'قاعدة بيانات قوية ومناسبة للإنتاج'
  }
}

export function getDatabaseConfig(): DatabaseConfig {
  const dbType = (process.env.DATABASE_TYPE as DatabaseType) || 'sqlite'
  return DATABASE_CONFIGS[dbType]
}

export function createPrismaClient() {
  const config = getDatabaseConfig()
  
  return new PrismaClient({
    datasources: {
      db: {
        url: config.url
      }
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
  })
}

// Export default client
export const prisma = createPrismaClient()

// Database connection test
export async function testDatabaseConnection() {
  try {
    await prisma.$connect()
    const config = getDatabaseConfig()
    console.log(`✅ تم الاتصال بقاعدة البيانات: ${config.name}`)
    return { success: true, config }
  } catch (error) {
    console.error('❌ فشل الاتصال بقاعدة البيانات:', error)
    return { success: false, error: error.message }
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
      config: getDatabaseConfig()
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      config: getDatabaseConfig()
    }
  }
}