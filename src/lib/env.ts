// Environment variables helper
export type DbType = 'sqlite' | 'postgresql-local' | 'postgresql-cloud'

// Environment variables validation and management
export function ensureEnvironmentVariables() {
  console.log('🔧 بدء إعداد متغيرات البيئة...')
  
  // Try to load from config file first
  try {
    const fs = require('fs')
    const path = require('path')
    const configFile = path.join(process.cwd(), 'database-config.json')
    
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

// Get environment variables with validation
export function getEnvVars() {
  return {
    // Database configuration
    DATABASE_TYPE: process.env.DATABASE_TYPE as DbType || 'sqlite',
    DATABASE_URL: process.env.DATABASE_URL || '',
    
    // Database URLs for different types
    SQLITE_DATABASE_URL: process.env.SQLITE_DATABASE_URL || 'file:./prisma/dev.db',
    POSTGRESQL_LOCAL_DATABASE_URL: process.env.POSTGRESQL_LOCAL_DATABASE_URL || 'postgresql://postgres:password@localhost:5432/estate_management',
    POSTGRESQL_CLOUD_DATABASE_URL: process.env.POSTGRESQL_CLOUD_DATABASE_URL || '',
    
    // Admin security
    ADMIN_SETUP_KEY: process.env.ADMIN_SETUP_KEY || 'admin-setup-key-change-me',
    
    // Netlify configuration (for production)
    NETLIFY_AUTH_TOKEN: process.env.NETLIFY_AUTH_TOKEN || '',
    NETLIFY_SITE_ID: process.env.NETLIFY_SITE_ID || '',
    BUILD_HOOK_URL: process.env.BUILD_HOOK_URL || '',
    
    // Other
    JWT_SECRET: process.env.JWT_SECRET || 'estate-management-development-secret-key',
    NODE_ENV: process.env.NODE_ENV || 'development'
  }
}

// Resolve database URL by type
export function resolveUrlByType(type: DbType, customUrl?: string): string {
  const env = getEnvVars()
  
  if (customUrl) {
    return customUrl
  }
  
  switch (type) {
    case 'sqlite':
      return env.SQLITE_DATABASE_URL
    case 'postgresql-local':
      return env.POSTGRESQL_LOCAL_DATABASE_URL
    case 'postgresql-cloud':
      return env.POSTGRESQL_CLOUD_DATABASE_URL
    default:
      return env.SQLITE_DATABASE_URL
  }
}

// Validate required environment variables
export function validateEnvVars() {
  const env = getEnvVars()
  const errors: string[] = []
  
  if (!env.DATABASE_URL) {
    errors.push('DATABASE_URL is required')
  }
  
  if (!env.ADMIN_SETUP_KEY) {
    errors.push('ADMIN_SETUP_KEY is required')
  }
  
  if (env.NODE_ENV === 'production') {
    if (!env.NETLIFY_AUTH_TOKEN) {
      errors.push('NETLIFY_AUTH_TOKEN is required for production')
    }
    if (!env.NETLIFY_SITE_ID) {
      errors.push('NETLIFY_SITE_ID is required for production')
    }
    if (!env.BUILD_HOOK_URL) {
      errors.push('BUILD_HOOK_URL is required for production')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}