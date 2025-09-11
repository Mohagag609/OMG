const { PrismaClient } = require('@prisma/client')

async function setupDatabase() {
  console.log('Setting up database...')

  // في بيئة الإنتاج (Netlify)، استخدم DATABASE_URL مباشرة
  if (process.env.NODE_ENV === 'production') {
    try {
      console.log('🔍 إعداد قاعدة البيانات للإنتاج...')
      
      const prisma = new PrismaClient()
      await prisma.$queryRaw`SELECT 1`
      console.log('✅ قاعدة البيانات متاحة')
      await prisma.$disconnect()

      // تطبيق Schema
      const { execSync } = require('child_process')
      execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' })

      console.log('✅ تم إعداد قاعدة البيانات بنجاح!')
      return
    } catch (error) {
      console.error('❌ فشل في إعداد قاعدة البيانات:', error.message)
      console.log('💡 تأكد من أن DATABASE_URL صحيح في متغيرات البيئة')
      process.exit(1)
    }
  }

  // في بيئة التطوير، استخدم DATABASE_URL من متغيرات البيئة
  try {
    console.log('🔍 محاولة الاتصال بقاعدة البيانات...')
    
    const prisma = new PrismaClient()
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ قاعدة البيانات متاحة')
    await prisma.$disconnect()

    const { execSync } = require('child_process')
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' })

    console.log('✅ تم إعداد قاعدة البيانات بنجاح!')

  } catch (error) {
    console.error('❌ فشل في إعداد قاعدة البيانات:', error.message)
    console.log('💡 تأكد من أن DATABASE_URL صحيح في متغيرات البيئة')
    console.log('💡 جرب: npm run db:setup:local')
    process.exit(1)
  }
}

setupDatabase()