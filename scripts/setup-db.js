const { PrismaClient } = require('@prisma/client')

async function setupDatabase() {
  console.log('Setting up database...')

  // تحميل متغيرات البيئة
  loadEnvironmentVariables();

  // في بيئة الإنتاج (Netlify/Vercel)، استخدم DATABASE_URL مباشرة
  if (process.env.NODE_ENV === 'production' || process.env.NETLIFY) {
    try {
      console.log('🔍 إعداد قاعدة البيانات للإنتاج...')
      
      // في بيئة Netlify، استخدم PostgreSQL دائماً
      const schemaPath = process.env.NETLIFY ? 'prisma/schema.postgres.prisma' : (process.env.PRISMA_SCHEMA_PATH || 'prisma/schema.postgres.prisma')
      const isSqlite = schemaPath.includes('sqlite')
      
      console.log(`🌐 بيئة النشر: ${process.env.NETLIFY ? 'Netlify' : 'Production'}`)
      console.log(`📁 مسار السكيما: ${schemaPath}`)
      
      // اختبار الاتصال بقاعدة البيانات
      console.log('🔍 اختبار الاتصال بقاعدة البيانات...')
      
      // في بيئة Netlify، تأكد من وجود DATABASE_URL
      if (process.env.NETLIFY && !process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL غير محدد في بيئة Netlify')
      }
      
      console.log('✅ متغيرات البيئة صحيحة')

      // تطبيق Schema باستخدام الملف الصحيح
      const { execSync } = require('child_process')
      
      // في بيئة Netlify، استخدم db push بدلاً من migrate deploy
      if (process.env.NETLIFY) {
        console.log('🌐 بيئة Netlify - استخدام db push')
        const pushCmd = `npx prisma db push --schema=${schemaPath} --accept-data-loss`
        execSync(pushCmd, { stdio: 'inherit' })
      } else {
        const migrateCmd = isSqlite 
          ? `npx prisma migrate deploy --schema=${schemaPath}`
          : `npx prisma migrate deploy --schema=${schemaPath}`
        
        execSync(migrateCmd, { stdio: 'inherit' })
      }

      console.log('✅ تم إعداد قاعدة البيانات بنجاح!')
      return
    } catch (error) {
      console.error('❌ فشل في إعداد قاعدة البيانات:', error.message)
      console.log('💡 تأكد من إعداد متغيرات البيئة: DATABASE_URL و PRISMA_SCHEMA_PATH')
      console.log('💡 في بيئة Netlify، تأكد من إضافة DATABASE_URL في لوحة التحكم')
      process.exit(1)
    }
  }

  // في بيئة التطوير، استخدم SQLite افتراضياً
  try {
    console.log('🔍 إعداد قاعدة البيانات للتطوير المحلي...')
    
    // استخدام SQLite للتطوير المحلي
    process.env.DATABASE_URL = "file:./dev.db"
    const localPrisma = new PrismaClient()

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
      // استخدام PostgreSQL للسحابية
      process.env.DATABASE_URL = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL
      const cloudPrisma = new PrismaClient()

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

/**
 * تحميل متغيرات البيئة
 * Load environment variables
 */
function loadEnvironmentVariables() {
  const fs = require('fs');
  const path = require('path');
  
  const envFiles = ['.env.netlify', '.env.production', '.env.local', '.env'];
  
  for (const envFile of envFiles) {
    const envPath = path.join(process.cwd(), envFile);
    if (fs.existsSync(envPath)) {
      console.log(`📄 تحميل متغيرات البيئة من: ${envFile}`);
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envLines = envContent.split('\n');
      
      for (const line of envLines) {
        if (line.trim() && !line.startsWith('#')) {
          const [key, ...valueParts] = line.split('=');
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          if (key && value) {
            process.env[key] = value;
          }
        }
      }
      break;
    }
  }
}

setupDatabase()