const { execSync } = require('child_process')

console.log('🔧 إعداد البناء للإنتاج...')

try {
  // تحديد نوع قاعدة البيانات من متغيرات البيئة
  const schemaPath = process.env.PRISMA_SCHEMA_PATH || 'prisma/schema.postgres.prisma'
  const isSqlite = schemaPath.includes('sqlite')
  
  // في بيئة Netlify، تأكد من استخدام PostgreSQL
  if (process.env.NETLIFY) {
    console.log('🌐 تم اكتشاف بيئة Netlify - استخدام PostgreSQL')
    const netlifySchemaPath = 'prisma/schema.postgres.prisma'
    if (schemaPath !== netlifySchemaPath) {
      console.log(`🔄 تغيير مسار السكيما من ${schemaPath} إلى ${netlifySchemaPath}`)
      process.env.PRISMA_SCHEMA_PATH = netlifySchemaPath
    }
  }
  
  console.log(`📊 استخدام قاعدة البيانات: ${isSqlite ? 'SQLite' : 'PostgreSQL'}`)
  console.log(`📁 مسار السكيما: ${schemaPath}`)

  // تشغيل prisma generate مع السكيما الصحيحة
  console.log('📦 توليد Prisma Client...')
  const generateCmd = `npx prisma generate --schema=${schemaPath}`
  execSync(generateCmd, { stdio: 'inherit' })

  // في بيئة Netlify، استخدم db push بدلاً من migrate deploy
  if (process.env.NETLIFY) {
    console.log('🌐 بيئة Netlify - تطبيق Schema باستخدام db push')
    const pushCmd = `npx prisma db push --schema=${schemaPath} --accept-data-loss`
    try {
      execSync(pushCmd, { stdio: 'inherit' })
      console.log('✅ تم تطبيق Schema بنجاح')
    } catch (pushError) {
      console.log('⚠️ تحذير: فشل في تطبيق Schema:', pushError.message)
      console.log('ℹ️ سيتم المتابعة مع generate فقط')
    }
  } else {
    // ملاحظة: migrate deploy يحتاج إلى DATABASE_URL
    // في مرحلة البناء، نحتاج فقط إلى generate
    console.log('ℹ️ تم تخطي migrate deploy (يحتاج إلى DATABASE_URL)')
  }

  // تشغيل next build
  console.log('🏗️ بناء التطبيق...')
  execSync('npx next build', { stdio: 'inherit' })

  console.log('✅ تم البناء بنجاح!')
} catch (error) {
  console.error('❌ فشل في البناء:', error.message)
  console.log('💡 تأكد من إعداد متغيرات البيئة: DATABASE_URL و PRISMA_SCHEMA_PATH')
  process.exit(1)
}