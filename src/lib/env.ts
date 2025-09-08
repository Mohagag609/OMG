// Environment variables helper for database management
export type DbType = 'sqlite' | 'postgresql-local' | 'postgresql-cloud'

export interface DatabaseConfig {
  type: DbType
  url: string
  adminKey: string
  netlify?: {
    authToken: string
    siteId: string
    buildHookUrl: string
  }
}

// Environment variables validation and parsing
export function getEnvironmentConfig(): DatabaseConfig {
  const config: DatabaseConfig = {
    type: (process.env.DATABASE_TYPE as DbType) || 'sqlite',
    url: process.env.DATABASE_URL || '',
    adminKey: process.env.ADMIN_SETUP_KEY || '',
    netlify: {
      authToken: process.env.NETLIFY_AUTH_TOKEN || '',
      siteId: process.env.NETLIFY_SITE_ID || '',
      buildHookUrl: process.env.BUILD_HOOK_URL || ''
    }
  }

  // Validate required environment variables
  if (!config.url) {
    throw new Error('DATABASE_URL is required')
  }

  if (!config.adminKey) {
    throw new Error('ADMIN_SETUP_KEY is required for database management')
  }

  return config
}

// Resolve database URL by type
export function resolveUrlByType(type: DbType, customUrl?: string): string {
  if (customUrl) {
    return customUrl
  }

  switch (type) {
    case 'sqlite':
      return process.env.SQLITE_DATABASE_URL || 'file:./prisma/dev.db'
    
    case 'postgresql-local':
      return process.env.POSTGRESQL_LOCAL_DATABASE_URL || 'postgresql://postgres:password@localhost:5432/estate_management'
    
    case 'postgresql-cloud':
      return process.env.POSTGRESQL_CLOUD_DATABASE_URL || ''
    
    default:
      throw new Error(`Unsupported database type: ${type}`)
  }
}

// Validate database URL format
export function validateDatabaseUrl(url: string, type: DbType): boolean {
  try {
    if (type === 'sqlite') {
      return url.startsWith('file:')
    }
    
    if (type === 'postgresql-local' || type === 'postgresql-cloud') {
      return url.startsWith('postgresql://')
    }
    
    return false
  } catch {
    return false
  }
}

// Parse PostgreSQL connection details
export function parsePostgresUrl(url: string): {
  host: string
  port: number
  username: string
  password: string
  database: string
  ssl?: boolean
} | null {
  try {
    const urlObj = new URL(url)
    
    return {
      host: urlObj.hostname,
      port: parseInt(urlObj.port) || 5432,
      username: urlObj.username,
      password: urlObj.password,
      database: urlObj.pathname.slice(1),
      ssl: urlObj.searchParams.get('sslmode') === 'require'
    }
  } catch {
    return null
  }
}

// Build PostgreSQL URL from components
export function buildPostgresUrl(
  host: string,
  port: number,
  username: string,
  password: string,
  database: string,
  ssl: boolean = false
): string {
  const sslMode = ssl ? '?sslmode=require' : ''
  return `postgresql://${username}:${password}@${host}:${port}/${database}${sslMode}`
}

// Check if running in production
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

// Check if running in development
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

// Get current environment
export function getCurrentEnvironment(): 'development' | 'production' | 'test' {
  return (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development'
}

// Legacy function for backward compatibility
export function ensureEnvironmentVariables() {
  console.log('🔧 بدء إعداد متغيرات البيئة...')
  
  // Try to load from config file first
  try {
    const fs = require('fs')
    const path = require('path')
    const configFile = path.join(process.cwd(), 'config/database-config.json')
    
    if (fs.existsSync(configFile)) {
      const configData = fs.readFileSync(configFile, 'utf8')
      const config = JSON.parse(configData)
      
      if (config.connectionString) {
        process.env.DATABASE_URL = config.connectionString
        console.log('🔧 تم تحديث DATABASE_URL من ملف الإعدادات:', config.type)
      }
    }
  } catch (error) {
    console.log('⚠️ لم يتم العثور على ملف الإعدادات أو خطأ في القراءة')
  }
  
  // Only set default values if not already set
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "file:./prisma/dev.db"
    console.log('🔧 تم تعيين DATABASE_URL الافتراضي')
  }
  
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = "estate-management-development-secret-key"
    console.log('🔧 تم تعيين JWT_SECRET الافتراضي')
  }
  
  console.log('🔧 متغيرات البيئة مُعدة:', {
    DATABASE_URL: process.env.DATABASE_URL ? '✅ موجود' : '❌ مفقود',
    JWT_SECRET: process.env.JWT_SECRET ? '✅ موجود' : '❌ مفقود'
  })
}