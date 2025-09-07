// Environment variables helper
export function ensureEnvironmentVariables() {
  console.log('🔧 بدء إعداد متغيرات البيئة...')
  
  // Always set default values first
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://neondb_owner:npg_ZBrYxkMEL91f@ep-mute-violet-ad0dmo9y-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    console.log('🔧 تم تعيين DATABASE_URL الافتراضي')
  }
  
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = "estate-management-development-secret-key"
    console.log('🔧 تم تعيين JWT_SECRET الافتراضي')
  }
  
  // Try to load from config file if it exists
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
  
  console.log('🔧 متغيرات البيئة مُعدة:', {
    DATABASE_URL: process.env.DATABASE_URL ? '✅ موجود' : '❌ مفقود',
    JWT_SECRET: process.env.JWT_SECRET ? '✅ موجود' : '❌ مفقود'
  })
}