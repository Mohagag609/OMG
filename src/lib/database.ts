import { PrismaClient } from '@prisma/client'

export type DatabaseType = 'sqlite' | 'postgresql-local' | 'postgresql-cloud'

export interface DatabaseConfig {
  type: DatabaseType
  url: string
  name: string
  description: string
  icon: string
}

export const DATABASE_CONFIGS: Record<DatabaseType, DatabaseConfig> = {
  sqlite: {
    type: 'sqlite',
    url: process.env.SQLITE_DATABASE_URL || 'file:./dev.db',
    name: 'SQLite (محلي)',
    description: 'قاعدة بيانات محلية سريعة ومناسبة للتطوير',
    icon: '📁'
  },
  'postgresql-local': {
    type: 'postgresql-local',
    url: process.env.POSTGRESQL_LOCAL_DATABASE_URL || 'postgresql://postgres:password@localhost:5432/estate_management',
    name: 'PostgreSQL (محلي)',
    description: 'قاعدة بيانات محلية قوية للاختبار والتطوير',
    icon: '🏠'
  },
  'postgresql-cloud': {
    type: 'postgresql-cloud',
    url: process.env.POSTGRESQL_CLOUD_DATABASE_URL || 'postgresql://neondb_owner:npg_iIXv7WPbcQj2@ep-square-sky-adjw0es3-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    name: 'PostgreSQL (سحابي)',
    description: 'قاعدة بيانات سحابية للإنتاج والنشر',
    icon: '☁️'
  }
}

export function getDatabaseConfig(): DatabaseConfig {
  const dbType = (process.env.DATABASE_TYPE as DatabaseType) || 'sqlite'
  return DATABASE_CONFIGS[dbType]
}

export function createPrismaClient() {
  const config = getDatabaseConfig()
  
  // Set DATABASE_URL environment variable for Prisma
  process.env.DATABASE_URL = config.url
  
  console.log(`🔗 Connecting to database: ${config.name} (${config.type})`)
  console.log(`📡 Database URL: ${config.url.replace(/\/\/.*@/, '//***:***@')}`)
  
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
      config: getDatabaseConfig()
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'خطأ غير معروف',
      config: getDatabaseConfig()
    }
  }
}