// Environment variables helper
export function ensureEnvironmentVariables() {
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