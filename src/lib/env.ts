// Environment variables helper
export function ensureEnvironmentVariables() {
  // Try to load from config file first
  try {
    const { getCurrentDatabaseUrl } = require('./databaseConfig')
    const configUrl = getCurrentDatabaseUrl()
    if (configUrl) {
      process.env.DATABASE_URL = configUrl
      console.log('🔧 تم تحميل DATABASE_URL من ملف الإعدادات')
    }
  } catch (error) {
    console.log('⚠️ لم يتم العثور على ملف الإعدادات، استخدام القيم الافتراضية')
  }
  
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://neondb_owner:npg_ZBrYxkMEL91f@ep-mute-violet-ad0dmo9y-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
  }
  
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = "estate-management-development-secret-key"
  }
  
  console.log('🔧 متغيرات البيئة مُعدة:', {
    DATABASE_URL: process.env.DATABASE_URL ? '✅ موجود' : '❌ مفقود',
    JWT_SECRET: process.env.JWT_SECRET ? '✅ موجود' : '❌ مفقود'
  })
}