const { PrismaClient } = require('@prisma/client')

async function setupDatabase() {
  console.log('Setting up database...')

  // في بيئة الإنتاج (Netlify/Vercel)، استخدم DATABASE_URL مباشرة
  if (process.env.NODE_ENV === 'production' || process.env.NETLIFY) {
    try {
      console.log('🔍 إعداد قاعدة البيانات للإنتاج...')
      
      // في بيئة Netlify، استخدم PostgreSQL دائماً
      const schemaPath = process.env.NETLIFY ? 'prisma/schema.postgres.prisma' : (process.env.PRISMA_SCHEMA_PATH || 'prisma/schema.postgres.prisma')
      const isSqlite = schemaPath.includes('sqlite')
      
      console.log(`🌐 بيئة النشر: ${process.env.NETLIFY ? 'Netlify' : 'Production'}`)
      console.log(`📁 مسار السكيما: ${schemaPath}`)
      
      const prisma = new PrismaClient()
      await prisma.$queryRaw`SELECT 1`
      console.log('✅ قاعدة البيانات متاحة')
      await prisma.$disconnect()

      // تطبيق Schema باستخدام الملف الصحيح
      const { execSync } = require('child_process')
      
      // في بيئة Netlify، استخدم db push بدلاً من migrate deploy
      if (process.env.NETLIFY) {
        console.log('🌐 بيئة Netlify - استخدام db push')
        const pushCmd = 'npx prisma db push --schema=prisma/schema.postgres.prisma --accept-data-loss'
        execSync(pushCmd, { stdio: 'inherit' })
      } else {
        const migrateCmd = isSqlite 
          ? 'npx prisma migrate deploy --schema=prisma/schema.sqlite.prisma'
          : 'npx prisma migrate deploy --schema=prisma/schema.postgres.prisma'
        
        execSync(migrateCmd, { stdio: 'inherit' })
      }

      console.log('✅ تم إعداد قاعدة البيانات بنجاح!')
      return
    } catch (error) {
      console.error('❌ فشل في إعداد قاعدة البيانات:', error.message)
      console.log('💡 تأكد من إعداد متغيرات البيئة: DATABASE_URL و PRISMA_SCHEMA_PATH')
      process.exit(1)
    }
  }

  // في بيئة التطوير، استخدم SQLite افتراضياً
  try {
    console.log('🔍 إعداد قاعدة البيانات للتطوير المحلي...')
    
    // استخدام SQLite للتطوير المحلي
    const localPrisma = new PrismaClient({
      datasources: {
        db: {
          url: "file:./dev.db"
        }
      }
    })

    await localPrisma.$queryRaw`SELECT 1`
    console.log('✅ قاعدة البيانات المحلية متاحة')
    await localPrisma.$disconnect()

    const { execSync } = require('child_process')
    // استخدام schema.sqlite.prisma مع DATABASE_URL
    process.env.DATABASE_URL = "file:./dev.db"
    execSync('npx prisma db push --schema=prisma/schema.sqlite.prisma --accept-data-loss', { stdio: 'inherit' })

    console.log('✅ تم إعداد قاعدة البيانات المحلية بنجاح!')

  } catch (localError) {
    console.log('⚠️ قاعدة البيانات المحلية غير متاحة، محاولة الاتصال بالسحابية...')
    
    try {
      const cloudPrisma = new PrismaClient({
        datasources: {
          db: {
            url: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL
          }
        }
      })

      await cloudPrisma.$queryRaw`SELECT 1`
      console.log('✅ قاعدة البيانات السحابية متاحة')
      await cloudPrisma.$disconnect()

      const { execSync } = require('child_process')
      // استخدام schema.postgres.prisma
      execSync('npx prisma db push --schema=prisma/schema.postgres.prisma --accept-data-loss', { stdio: 'inherit' })

      console.log('✅ تم إعداد قاعدة البيانات السحابية بنجاح!')

    } catch (cloudError) {
      console.error('❌ فشل في الاتصال بجميع قواعد البيانات:')
      console.error('   المحلية:', localError.message)
      console.error('   السحابية:', cloudError.message)
      console.log('\n💡 التوصيات:')
      console.log('   1. تأكد من إعداد متغيرات البيئة')
      console.log('   2. جرب: npm run env:setup')
      console.log('   3. أو استخدم صفحة إعدادات قاعدة البيانات')
      process.exit(1)
    }
  }
}

setupDatabase()