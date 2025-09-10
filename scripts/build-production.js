const { execSync } = require('child_process')

console.log('🔧 إعداد البناء للإنتاج...')

try {
  // تحديد نوع قاعدة البيانات من متغيرات البيئة
  const schemaPath = process.env.PRISMA_SCHEMA_PATH || 'prisma/schema.postgres.prisma'
  const isSqlite = schemaPath.includes('sqlite')
  
  console.log(`📊 استخدام قاعدة البيانات: ${isSqlite ? 'SQLite' : 'PostgreSQL'}`)
  console.log(`📁 مسار السكيما: ${schemaPath}`)

  // تشغيل prisma generate مع السكيما الصحيحة
  console.log('📦 توليد Prisma Client...')
  const generateCmd = `npx prisma generate --schema=${schemaPath}`
  execSync(generateCmd, { stdio: 'inherit' })

  // تشغيل prisma migrate deploy
  console.log('🔄 تطبيق migrations...')
  const migrateCmd = `npx prisma migrate deploy --schema=${schemaPath}`
  execSync(migrateCmd, { stdio: 'inherit' })

  // تشغيل next build
  console.log('🏗️ بناء التطبيق...')
  execSync('npx next build', { stdio: 'inherit' })

  console.log('✅ تم البناء بنجاح!')
} catch (error) {
  console.error('❌ فشل في البناء:', error.message)
  console.log('💡 تأكد من إعداد متغيرات البيئة: DATABASE_URL و PRISMA_SCHEMA_PATH')
  process.exit(1)
}