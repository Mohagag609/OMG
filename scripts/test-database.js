#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')

async function testDatabase() {
  // Load environment variables
  require('dotenv').config()
  
  // Use DATABASE_URL directly if available, otherwise set based on DATABASE_TYPE
  let databaseUrl = process.env.DATABASE_URL
  
  if (!databaseUrl) {
    const dbType = process.env.DATABASE_TYPE || 'sqlite'
    
    if (dbType === 'sqlite') {
      databaseUrl = process.env.SQLITE_DATABASE_URL || 'file:./dev.db'
    } else if (dbType === 'postgresql-local') {
      databaseUrl = process.env.POSTGRESQL_LOCAL_DATABASE_URL || 'postgresql://postgres:password@localhost:5432/estate_management'
    } else if (dbType === 'postgresql-cloud') {
      databaseUrl = process.env.POSTGRESQL_CLOUD_DATABASE_URL || 'postgresql://neondb_owner:npg_iIXv7WPbcQj2@ep-square-sky-adjw0es3-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
    }
    
    // Set DATABASE_URL for Prisma
    process.env.DATABASE_URL = databaseUrl
  }
  
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
    try {
      // Try PostgreSQL version first
      const dbInfo = await prisma.$queryRaw`SELECT version() as version`
      console.log(`📊 إصدار قاعدة البيانات:`, dbInfo)
    } catch (error) {
      // Fallback to SQLite version
      try {
        const dbInfo = await prisma.$queryRaw`SELECT sqlite_version() as version`
        console.log(`📊 إصدار قاعدة البيانات:`, dbInfo)
      } catch (sqliteError) {
        console.log(`📊 نوع قاعدة البيانات: غير محدد`)
      }
    }
    
    console.log('🎉 جميع الاختبارات نجحت!')
    
  } catch (error) {
    console.error('❌ فشل الاختبار:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabase()