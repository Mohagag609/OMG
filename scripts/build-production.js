const { execSync } = require('child_process')

console.log('🔧 إعداد البناء للإنتاج...')

try {
  // تأكد من أن Prisma schema صحيح
  const fs = require('fs')
  const schemaPath = 'prisma/schema.prisma'
  const schema = fs.readFileSync(schemaPath, 'utf8')
  
  if (!schema.includes('provider = "postgresql"')) {
    console.log('❌ Prisma schema يجب أن يستخدم PostgreSQL للإنتاج')
    process.exit(1)
  }

  // تشغيل prisma generate
  console.log('📦 توليد Prisma Client...')
  execSync('npx prisma generate', { stdio: 'inherit' })

  // في الإنتاج، تطبيق Schema على قاعدة البيانات
  if (process.env.NODE_ENV === 'production') {
    console.log('🗄️ تطبيق Schema على قاعدة البيانات...')
    try {
      execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' })
      console.log('✅ تم تطبيق Schema بنجاح')
    } catch (error) {
      console.log('⚠️ تحذير: فشل في تطبيق Schema، سيتم المتابعة...')
    }
  }

  // تشغيل next build
  console.log('🏗️ بناء التطبيق...')
  execSync('npx next build', { stdio: 'inherit' })

  console.log('✅ تم البناء بنجاح!')
} catch (error) {
  console.error('❌ فشل في البناء:', error.message)
  process.exit(1)
}