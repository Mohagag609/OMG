#!/usr/bin/env node

const { execSync } = require('child_process')
const path = require('path')

console.log('🔄 إعادة تهيئة قاعدة البيانات باستخدام Prisma...')

try {
  // Navigate to project root
  const projectRoot = path.join(__dirname, '..')
  process.chdir(projectRoot)

  console.log('📁 المجلد الحالي:', process.cwd())

  // Reset the database
  console.log('🗑️ حذف جميع البيانات...')
  execSync('npx prisma db push --force-reset', { 
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_x5qvmpzF3hjX@ep-dawn-cell-adylfb98-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" }
  })

  console.log('✅ تم حذف جميع البيانات بنجاح')

  // Generate Prisma client
  console.log('🔧 إعادة توليد Prisma Client...')
  execSync('npx prisma generate', { stdio: 'inherit' })

  console.log('✅ تم إعادة توليد Prisma Client')

  // Run seed script if it exists
  console.log('🌱 تشغيل سكريبت البذور...')
  try {
    execSync('npx prisma db seed', { stdio: 'inherit' })
    console.log('✅ تم تشغيل سكريبت البذور')
  } catch (error) {
    console.log('⚠️ لم يتم العثور على سكريبت البذور، سيتم إنشاء البيانات الأساسية...')
    
    // Create basic data using our script
    const { quickReset } = require('./quick-reset.js')
    await quickReset()
  }

  console.log('🎉 تمت إعادة تهيئة قاعدة البيانات بنجاح!')

} catch (error) {
  console.error('❌ خطأ في إعادة تهيئة قاعدة البيانات:', error.message)
  process.exit(1)
}