#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')

async function testDatabase() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔄 اختبار الاتصال بقاعدة البيانات...')
    
    // Test connection
    await prisma.$connect()
    console.log('✅ تم الاتصال بنجاح')
    
    // Test query
    const userCount = await prisma.user.count()
    console.log(`👥 عدد المستخدمين: ${userCount}`)
    
    const customerCount = await prisma.customer.count()
    console.log(`🏢 عدد العملاء: ${customerCount}`)
    
    // Get database info
    const dbInfo = await prisma.$queryRaw`SELECT version() as version`
    console.log(`📊 إصدار قاعدة البيانات:`, dbInfo)
    
    console.log('🎉 جميع الاختبارات نجحت!')
    
  } catch (error) {
    console.error('❌ فشل الاختبار:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabase()