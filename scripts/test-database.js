const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testDatabase() {
  console.log('🔄 اختبار الاتصال بقاعدة البيانات...')
  
  try {
    // Test connection
    await prisma.$connect()
    console.log('✅ تم الاتصال بنجاح')
    
    // Test users count
    const userCount = await prisma.user.count()
    console.log(`👥 عدد المستخدمين: ${userCount}`)
    
    // Test customers count
    const customerCount = await prisma.customer.count()
    console.log(`🏢 عدد العملاء: ${customerCount}`)
    
    // Test units count
    const unitCount = await prisma.unit.count()
    console.log(`🏠 عدد الوحدات: ${unitCount}`)
    
    // Test database version
    const version = await prisma.$queryRaw`SELECT sqlite_version() as version`
    console.log(`📊 إصدار قاعدة البيانات:`, version)
    
    console.log('🎉 جميع الاختبارات نجحت!')
    
  } catch (error) {
    console.error('❌ فشل في اختبار قاعدة البيانات:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabase()