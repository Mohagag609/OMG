const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testDatabase() {
  try {
    console.log('🔍 اختبار اتصال قاعدة البيانات...')
    
    // اختبار الاتصال الأساسي
    await prisma.$connect()
    console.log('✅ الاتصال بقاعدة البيانات نجح')
    
    // اختبار الجداول
    console.log('📊 فحص الجداول...')
    
    try {
      const customers = await prisma.customer.count()
      console.log(`✅ جدول العملاء: ${customers} عميل`)
    } catch (error) {
      console.log('❌ خطأ في جدول العملاء:', error.message)
    }
    
    try {
      const units = await prisma.unit.count()
      console.log(`✅ جدول الوحدات: ${units} وحدة`)
    } catch (error) {
      console.log('❌ خطأ في جدول الوحدات:', error.message)
    }
    
    try {
      const users = await prisma.user.count()
      console.log(`✅ جدول المستخدمين: ${users} مستخدم`)
    } catch (error) {
      console.log('❌ خطأ في جدول المستخدمين:', error.message)
    }
    
    try {
      const contracts = await prisma.contract.count()
      console.log(`✅ جدول العقود: ${contracts} عقد`)
    } catch (error) {
      console.log('❌ خطأ في جدول العقود:', error.message)
    }
    
    try {
      const vouchers = await prisma.voucher.count()
      console.log(`✅ جدول السندات: ${vouchers} سند`)
    } catch (error) {
      console.log('❌ خطأ في جدول السندات:', error.message)
    }
    
    // اختبار استعلام معقد
    console.log('🔍 اختبار استعلام معقد...')
    try {
      const dashboardData = await prisma.customer.findMany({
        take: 1,
        include: {
          contracts: true
        }
      })
      console.log('✅ الاستعلامات المعقدة تعمل')
    } catch (error) {
      console.log('❌ خطأ في الاستعلامات المعقدة:', error.message)
    }
    
  } catch (error) {
    console.error('❌ خطأ عام في قاعدة البيانات:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabase()