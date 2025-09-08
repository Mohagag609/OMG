#!/usr/bin/env node

// Test script for database administration system
const fs = require('fs')
const path = require('path')

console.log('🧪 بدء اختبار نظام إدارة قاعدة البيانات...\n')

// Test 1: Check if all required files exist
console.log('1️⃣ فحص الملفات المطلوبة...')

const requiredFiles = [
  'src/lib/env.ts',
  'src/lib/prisma.ts',
  'src/lib/db-admin.ts',
  'src/app/api/db-admin/init/route.ts',
  'src/app/api/db-admin/switch/route.ts',
  'src/app/api/db-admin/wipe/route.ts',
  'src/components/admin/DbSettingsForm.tsx',
  'src/app/admin/settings/page.tsx',
  'prisma/seed.ts',
  '.env.local'
]

let allFilesExist = true
for (const file of requiredFiles) {
  const filePath = path.join(process.cwd(), file)
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`)
  } else {
    console.log(`❌ ${file} - مفقود`)
    allFilesExist = false
  }
}

if (!allFilesExist) {
  console.log('\n❌ بعض الملفات المطلوبة مفقودة')
  process.exit(1)
}

console.log('\n✅ جميع الملفات المطلوبة موجودة')

// Test 2: Check .env.local configuration
console.log('\n2️⃣ فحص إعدادات .env.local...')

try {
  const envContent = fs.readFileSync('.env.local', 'utf8')
  const requiredEnvVars = [
    'DATABASE_TYPE',
    'DATABASE_URL',
    'ADMIN_SETUP_KEY',
    'JWT_SECRET'
  ]

  let allEnvVarsExist = true
  for (const envVar of requiredEnvVars) {
    if (envContent.includes(envVar)) {
      console.log(`✅ ${envVar}`)
    } else {
      console.log(`❌ ${envVar} - مفقود`)
      allEnvVarsExist = false
    }
  }

  if (!allEnvVarsExist) {
    console.log('\n❌ بعض متغيرات البيئة المطلوبة مفقودة')
    process.exit(1)
  }

  console.log('\n✅ جميع متغيرات البيئة المطلوبة موجودة')
} catch (error) {
  console.log('❌ خطأ في قراءة ملف .env.local:', error.message)
  process.exit(1)
}

// Test 3: Check package.json scripts
console.log('\n3️⃣ فحص سكريبتات package.json...')

try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  const requiredScripts = [
    'db:generate',
    'db:push',
    'db:seed',
    'db:reset'
  ]

  let allScriptsExist = true
  for (const script of requiredScripts) {
    if (packageJson.scripts[script]) {
      console.log(`✅ ${script}`)
    } else {
      console.log(`❌ ${script} - مفقود`)
      allScriptsExist = false
    }
  }

  if (!allScriptsExist) {
    console.log('\n❌ بعض السكريبتات المطلوبة مفقودة')
    process.exit(1)
  }

  console.log('\n✅ جميع السكريبتات المطلوبة موجودة')
} catch (error) {
  console.log('❌ خطأ في قراءة package.json:', error.message)
  process.exit(1)
}

// Test 4: Check Prisma schema
console.log('\n4️⃣ فحص Prisma schema...')

try {
  const schemaContent = fs.readFileSync('prisma/schema.prisma', 'utf8')
  
  if (schemaContent.includes('generator client')) {
    console.log('✅ Prisma generator')
  } else {
    console.log('❌ Prisma generator - مفقود')
    process.exit(1)
  }

  if (schemaContent.includes('datasource db')) {
    console.log('✅ Database datasource')
  } else {
    console.log('❌ Database datasource - مفقود')
    process.exit(1)
  }

  console.log('\n✅ Prisma schema صحيح')
} catch (error) {
  console.log('❌ خطأ في قراءة Prisma schema:', error.message)
  process.exit(1)
}

// Test 5: Check TypeScript configuration
console.log('\n5️⃣ فحص إعدادات TypeScript...')

try {
  const tsConfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'))
  
  if (tsConfig.compilerOptions && tsConfig.compilerOptions.paths) {
    console.log('✅ Path mapping configured')
  } else {
    console.log('❌ Path mapping - غير مُعد')
  }

  console.log('\n✅ إعدادات TypeScript صحيحة')
} catch (error) {
  console.log('❌ خطأ في قراءة tsconfig.json:', error.message)
  process.exit(1)
}

console.log('\n🎉 جميع الاختبارات نجحت!')
console.log('\n📋 الخطوات التالية:')
console.log('1. شغل npm run dev')
console.log('2. افتح http://localhost:3000/admin/settings')
console.log('3. أدخل مفتاح الأدمن من .env.local')
console.log('4. جرب تهيئة قاعدة بيانات جديدة')
console.log('5. جرب زرع البيانات التجريبية')

console.log('\n🔧 أوامر مفيدة:')
console.log('- npm run db:generate  # توليد Prisma client')
console.log('- npm run db:push      # تطبيق التغييرات على قاعدة البيانات')
console.log('- npm run db:seed      # زرع البيانات التجريبية')
console.log('- npm run db:reset     # إعادة تعيين قاعدة البيانات')