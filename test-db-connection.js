// اختبار اتصال قاعدة البيانات
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testDatabaseConnection() {
  try {
    console.log('🧪 اختبار اتصال قاعدة البيانات...')
    
    // اختبار الاتصال الأساسي
    await prisma.$connect()
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح')
    
    // اختبار البحث عن المستخدمين
    const users = await prisma.user.findMany()
    console.log('📊 عدد المستخدمين:', users.length)
    
    if (users.length > 0) {
      console.log('👤 المستخدمين:')
      users.forEach(user => {
        console.log(`  - ${user.username} (${user.role})`)
      })
    }
    
    // اختبار البحث عن العملاء
    const customers = await prisma.customer.findMany()
    console.log('👥 عدد العملاء:', customers.length)
    
    // اختبار البحث عن الوحدات
    const units = await prisma.unit.findMany()
    console.log('🏠 عدد الوحدات:', units.length)
    
  } catch (error) {
    console.error('❌ خطأ في قاعدة البيانات:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabaseConnection()