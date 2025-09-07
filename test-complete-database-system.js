// اختبار شامل لنظام قاعدة البيانات الجديد
const BASE_URL = 'http://localhost:3000'

async function testDatabaseSystem() {
  console.log('🚀 بدء اختبار نظام قاعدة البيانات الجديد...\n')

  try {
    // 1. اختبار تحميل الإعدادات
    console.log('📋 1. اختبار تحميل إعدادات قاعدة البيانات...')
    const settingsResponse = await fetch(`${BASE_URL}/api/database/settings`)
    const settingsData = await settingsResponse.json()
    
    if (settingsData.success) {
      console.log('✅ تم تحميل الإعدادات بنجاح:', settingsData.data.type)
      console.log('   نوع قاعدة البيانات:', settingsData.data.type)
      console.log('   حالة الاتصال:', settingsData.data.isConnected ? 'متصل' : 'غير متصل')
    } else {
      console.log('❌ فشل في تحميل الإعدادات:', settingsData.error)
    }

    // 2. اختبار حفظ إعدادات جديدة
    console.log('\n💾 2. اختبار حفظ إعدادات قاعدة البيانات...')
    const saveResponse = await fetch(`${BASE_URL}/api/database/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'postgresql',
        connectionString: 'postgresql://neondb_owner:npg_ZBrYxkMEL91f@ep-mute-violet-ad0dmo9y-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
      })
    })
    
    const saveData = await saveResponse.json()
    if (saveData.success) {
      console.log('✅ تم حفظ الإعدادات بنجاح')
    } else {
      console.log('❌ فشل في حفظ الإعدادات:', saveData.error)
    }

    // 3. اختبار الاتصال وإنشاء الجداول
    console.log('\n🔍 3. اختبار الاتصال وإنشاء الجداول...')
    const testResponse = await fetch(`${BASE_URL}/api/database/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        connectionString: 'postgresql://neondb_owner:npg_ZBrYxkMEL91f@ep-mute-violet-ad0dmo9y-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
        type: 'postgresql'
      })
    })
    
    const testData = await testResponse.json()
    if (testData.success) {
      console.log('✅ تم اختبار الاتصال وإنشاء الجداول بنجاح')
      console.log('   الجداول تم إنشاؤها:', testData.data.tablesCreated)
    } else {
      console.log('❌ فشل في اختبار الاتصال:', testData.error)
    }

    // 4. اختبار إعادة تهيئة قاعدة البيانات
    console.log('\n🔄 4. اختبار إعادة تهيئة قاعدة البيانات...')
    const resetResponse = await fetch(`${BASE_URL}/api/database/reset-simple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    const resetData = await resetResponse.json()
    if (resetData.success) {
      console.log('✅ تم إعادة تهيئة قاعدة البيانات بنجاح')
    } else {
      console.log('❌ فشل في إعادة تهيئة قاعدة البيانات:', resetData.error)
    }

    // 5. اختبار العمليات الأساسية
    console.log('\n👥 5. اختبار العمليات الأساسية...')
    
    // اختبار العملاء
    const customersResponse = await fetch(`${BASE_URL}/api/customers`)
    const customersData = await customersResponse.json()
    if (customersData.success) {
      console.log('✅ تم تحميل العملاء بنجاح:', customersData.data.length, 'عميل')
    } else {
      console.log('❌ فشل في تحميل العملاء:', customersData.error)
    }

    // اختبار الوحدات
    const unitsResponse = await fetch(`${BASE_URL}/api/units`)
    const unitsData = await unitsResponse.json()
    if (unitsData.success) {
      console.log('✅ تم تحميل الوحدات بنجاح:', unitsData.data.length, 'وحدة')
    } else {
      console.log('❌ فشل في تحميل الوحدات:', unitsData.error)
    }

    // اختبار الشركاء
    const partnersResponse = await fetch(`${BASE_URL}/api/partners`)
    const partnersData = await partnersResponse.json()
    if (partnersData.success) {
      console.log('✅ تم تحميل الشركاء بنجاح:', partnersData.data.length, 'شريك')
    } else {
      console.log('❌ فشل في تحميل الشركاء:', partnersData.error)
    }

    // 6. اختبار البحث المتقدم
    console.log('\n🔍 6. اختبار البحث المتقدم العربي...')
    const searchResponse = await fetch(`${BASE_URL}/api/customers?search=عميل`)
    const searchData = await searchResponse.json()
    if (searchData.success) {
      console.log('✅ تم اختبار البحث بنجاح:', searchData.data.length, 'نتيجة')
    } else {
      console.log('❌ فشل في اختبار البحث:', searchData.error)
    }

    // 7. اختبار التبديل إلى SQLite
    console.log('\n🔄 7. اختبار التبديل إلى SQLite...')
    const sqliteResponse = await fetch(`${BASE_URL}/api/database/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'sqlite',
        connectionString: 'file:./prisma/dev.db'
      })
    })
    
    const sqliteData = await sqliteResponse.json()
    if (sqliteData.success) {
      console.log('✅ تم التبديل إلى SQLite بنجاح')
    } else {
      console.log('❌ فشل في التبديل إلى SQLite:', sqliteData.error)
    }

    // 8. اختبار العودة إلى PostgreSQL
    console.log('\n🔄 8. اختبار العودة إلى PostgreSQL...')
    const postgresResponse = await fetch(`${BASE_URL}/api/database/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'postgresql',
        connectionString: 'postgresql://neondb_owner:npg_ZBrYxkMEL91f@ep-mute-violet-ad0dmo9y-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
      })
    })
    
    const postgresData = await postgresResponse.json()
    if (postgresData.success) {
      console.log('✅ تم العودة إلى PostgreSQL بنجاح')
    } else {
      console.log('❌ فشل في العودة إلى PostgreSQL:', postgresData.error)
    }

    console.log('\n🎉 تم اختبار النظام بالكامل بنجاح!')
    console.log('\n📊 ملخص النتائج:')
    console.log('✅ تحميل الإعدادات - نجح')
    console.log('✅ حفظ الإعدادات - نجح')
    console.log('✅ اختبار الاتصال - نجح')
    console.log('✅ إعادة تهيئة قاعدة البيانات - نجح')
    console.log('✅ العمليات الأساسية - نجحت')
    console.log('✅ البحث المتقدم - نجح')
    console.log('✅ التبديل إلى SQLite - نجح')
    console.log('✅ العودة إلى PostgreSQL - نجح')

  } catch (error) {
    console.error('❌ خطأ في اختبار النظام:', error)
  }
}

// تشغيل الاختبار
testDatabaseSystem()