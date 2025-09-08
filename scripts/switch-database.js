#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const DATABASE_TYPE = process.argv[2] || 'sqlite'

if (!['sqlite', 'postgresql-local', 'postgresql-cloud'].includes(DATABASE_TYPE)) {
  console.error('❌ نوع قاعدة البيانات غير صحيح. استخدم: sqlite أو postgresql-local أو postgresql-cloud')
  process.exit(1)
}

console.log(`🔄 تبديل قاعدة البيانات إلى: ${DATABASE_TYPE}`)

// Copy the appropriate schema
let sourceSchema
if (DATABASE_TYPE === 'sqlite') {
  sourceSchema = path.join(__dirname, '..', 'prisma', 'schema.sqlite.prisma')
} else if (DATABASE_TYPE === 'postgresql-local' || DATABASE_TYPE === 'postgresql-cloud') {
  sourceSchema = path.join(__dirname, '..', 'prisma', 'schema.postgresql.prisma')
}

const targetSchema = path.join(__dirname, '..', 'prisma', 'schema.prisma')

if (!fs.existsSync(sourceSchema)) {
  console.error(`❌ ملف المخطط غير موجود: ${sourceSchema}`)
  process.exit(1)
}

fs.copyFileSync(sourceSchema, targetSchema)
console.log(`✅ تم نسخ مخطط ${DATABASE_TYPE} إلى schema.prisma`)

// Update .env
const envPath = path.join(__dirname, '..', '.env')
let envContent = ''

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8')
}

// Update DATABASE_TYPE
envContent = envContent.replace(/DATABASE_TYPE="[^"]*"/, `DATABASE_TYPE="${DATABASE_TYPE}"`)

fs.writeFileSync(envPath, envContent)
console.log(`✅ تم تحديث ملف .env`)

// Generate Prisma client
try {
  console.log('🔄 توليد Prisma Client...')
  execSync('npx prisma generate', { stdio: 'inherit' })
  console.log('✅ تم توليد Prisma Client بنجاح')
} catch (error) {
  console.error('❌ فشل في توليد Prisma Client:', error.message)
  // In production, don't exit to allow build to continue
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️  Continuing build despite Prisma generation error in production')
  } else {
    process.exit(1)
  }
}

console.log(`\n🎉 تم التبديل إلى ${DATABASE_TYPE} بنجاح!`)
console.log(`\n📋 الخطوات التالية:`)
console.log(`1. npm run db:push - لتطبيق المخطط على قاعدة البيانات`)
console.log(`2. npm run db:seed - لإدراج البيانات التجريبية`)
console.log(`3. npm run dev - لتشغيل المشروع`)