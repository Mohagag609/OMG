#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const DATABASE_TYPE = process.argv[2] || 'sqlite'

if (!['sqlite', 'postgresql'].includes(DATABASE_TYPE)) {
  console.error('❌ نوع قاعدة البيانات غير صحيح. استخدم: sqlite أو postgresql')
  process.exit(1)
}

console.log(`🔄 تبديل قاعدة البيانات إلى: ${DATABASE_TYPE}`)

// Copy the appropriate schema
const sourceSchema = path.join(__dirname, '..', 'prisma', `schema.${DATABASE_TYPE}.prisma`)
const targetSchema = path.join(__dirname, '..', 'prisma', 'schema.prisma')

if (!fs.existsSync(sourceSchema)) {
  console.error(`❌ ملف المخطط غير موجود: ${sourceSchema}`)
  process.exit(1)
}

fs.copyFileSync(sourceSchema, targetSchema)
console.log(`✅ تم نسخ مخطط ${DATABASE_TYPE} إلى schema.prisma`)

// Update .env.local
const envPath = path.join(__dirname, '..', '.env.local')
let envContent = ''

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8')
}

// Remove existing database config
envContent = envContent.replace(/DATABASE_TYPE=.*\n/g, '')
envContent = envContent.replace(/DATABASE_URL=.*\n/g, '')

// Add new database config
if (DATABASE_TYPE === 'sqlite') {
  envContent += `\nDATABASE_TYPE=sqlite\nDATABASE_URL="file:./dev.db"\n`
} else {
  envContent += `\nDATABASE_TYPE=postgresql\nDATABASE_URL="postgresql://postgres:password@localhost:5432/estate_management"\n`
}

fs.writeFileSync(envPath, envContent)
console.log(`✅ تم تحديث ملف .env.local`)

// Generate Prisma client
try {
  console.log('🔄 توليد Prisma Client...')
  execSync('npx prisma generate', { stdio: 'inherit' })
  console.log('✅ تم توليد Prisma Client بنجاح')
} catch (error) {
  console.error('❌ فشل في توليد Prisma Client:', error.message)
  process.exit(1)
}

console.log(`\n🎉 تم التبديل إلى ${DATABASE_TYPE} بنجاح!`)
console.log(`\n📋 الخطوات التالية:`)
console.log(`1. npm run db:push - لتطبيق المخطط على قاعدة البيانات`)
console.log(`2. npm run db:seed - لإدراج البيانات التجريبية`)
console.log(`3. npm run dev - لتشغيل المشروع`)