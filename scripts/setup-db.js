const { PrismaClient } = require('@prisma/client')

async function setupDatabase() {
  console.log('Setting up database...')

  try {
    // محاولة الاتصال بقاعدة البيانات المحلية أولاً
    console.log('🔍 محاولة الاتصال بقاعدة البيانات المحلية...')
    
    const localPrisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    })

    // اختبار الاتصال المحلي
    await localPrisma.$queryRaw`SELECT 1`
    console.log('✅ قاعدة البيانات المحلية متاحة')
    await localPrisma.$disconnect()

    // تطبيق Schema على قاعدة البيانات المحلية
    const { execSync } = require('child_process')
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' })

    console.log('✅ تم إعداد قاعدة البيانات المحلية بنجاح!')

  } catch (localError) {
    console.log('⚠️ قاعدة البيانات المحلية غير متاحة، محاولة الاتصال بالسحابية...')
    
    try {
      // محاولة الاتصال بقاعدة البيانات السحابية
      const cloudPrisma = new PrismaClient({
        datasources: {
          db: {
            url: process.env.NEON_DATABASE_URL
          }
        }
      })

      // اختبار الاتصال السحابي
      await cloudPrisma.$queryRaw`SELECT 1`
      console.log('✅ قاعدة البيانات السحابية (Neon) متاحة')
      await cloudPrisma.$disconnect()

      // تطبيق Schema على قاعدة البيانات السحابية
      const { execSync } = require('child_process')
      process.env.DATABASE_URL = process.env.NEON_DATABASE_URL
      execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' })

      console.log('✅ تم إعداد قاعدة البيانات السحابية بنجاح!')

    } catch (cloudError) {
      console.error('❌ فشل في الاتصال بجميع قواعد البيانات:')
      console.error('   المحلية:', localError.message)
      console.error('   السحابية:', cloudError.message)
      console.log('\n💡 التوصيات:')
      console.log('   1. تأكد من تشغيل PostgreSQL محلياً')
      console.log('   2. تحقق من إعدادات NEON_DATABASE_URL')
      console.log('   3. جرب: npm run db:setup:local')
      process.exit(1)
    }
  }
}

setupDatabase()