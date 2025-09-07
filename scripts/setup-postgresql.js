#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')

console.log('🐘 إعداد PostgreSQL...')

// Check if PostgreSQL is installed
try {
  execSync('psql --version', { stdio: 'pipe' })
  console.log('✅ PostgreSQL مثبت')
} catch (error) {
  console.log('❌ PostgreSQL غير مثبت. يرجى تثبيته أولاً:')
  console.log('Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib')
  console.log('macOS: brew install postgresql')
  console.log('Windows: تحميل من https://www.postgresql.org/download/')
  process.exit(1)
}

// Check if PostgreSQL service is running
try {
  execSync('pg_isready', { stdio: 'pipe' })
  console.log('✅ خدمة PostgreSQL تعمل')
} catch (error) {
  console.log('❌ خدمة PostgreSQL غير تعمل. يرجى تشغيلها:')
  console.log('Ubuntu/Debian: sudo systemctl start postgresql')
  console.log('macOS: brew services start postgresql')
  process.exit(1)
}

// Create database
const dbName = 'estate_management'
const dbUser = 'postgres'
const dbPassword = 'password'

try {
  console.log(`🔄 إنشاء قاعدة البيانات: ${dbName}`)
  
  // Create database
  execSync(`createdb -U ${dbUser} ${dbName}`, { stdio: 'pipe' })
  console.log('✅ تم إنشاء قاعدة البيانات بنجاح')
  
  // Test connection
  execSync(`psql -U ${dbUser} -d ${dbName} -c "SELECT 1;"`, { stdio: 'pipe' })
  console.log('✅ تم اختبار الاتصال بنجاح')
  
} catch (error) {
  if (error.message.includes('already exists')) {
    console.log('ℹ️ قاعدة البيانات موجودة بالفعل')
  } else {
    console.error('❌ فشل في إنشاء قاعدة البيانات:', error.message)
    console.log('\n🔧 جرب هذا الأمر يدوياً:')
    console.log(`createdb -U ${dbUser} ${dbName}`)
    process.exit(1)
  }
}

// Update .env.local
const envPath = '.env.local'
let envContent = ''

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8')
}

// Update database config
envContent = envContent.replace(/DATABASE_TYPE=.*\n/g, '')
envContent = envContent.replace(/DATABASE_URL=.*\n/g, '')

envContent += `\nDATABASE_TYPE=postgresql\n`
envContent += `DATABASE_URL="postgresql://${dbUser}:${dbPassword}@localhost:5432/${dbName}"\n`

fs.writeFileSync(envPath, envContent)
console.log('✅ تم تحديث ملف .env.local')

console.log('\n🎉 تم إعداد PostgreSQL بنجاح!')
console.log('\n📋 بيانات الاتصال:')
console.log(`- Host: localhost`)
console.log(`- Port: 5432`)
console.log(`- Database: ${dbName}`)
console.log(`- User: ${dbUser}`)
console.log(`- Password: ${dbPassword}`)

console.log('\n🚀 الخطوات التالية:')
console.log('1. npm run switch-db postgresql - للتبديل إلى PostgreSQL')
console.log('2. npm run db:push - لتطبيق المخطط')
console.log('3. npm run db:seed - لإدراج البيانات التجريبية')
console.log('4. npm run dev - لتشغيل المشروع')