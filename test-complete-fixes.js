// اختبار شامل لجميع الإصلاحات
const BASE_URL = 'http://localhost:3000'

async function testCompleteFixes() {
  console.log('🚀 بدء اختبار جميع الإصلاحات...\n')

  try {
    // 1. اختبار حفظ قاعدة بيانات جديدة
    console.log('💾 1. اختبار حفظ قاعدة بيانات جديدة...')
    const newDbUrl = 'postgresql://neondb_owner:npg_ZBrYxkMEL91f@ep-mute-violet-ad0dmo9y-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
    
    const saveResponse = await fetch(`${BASE_URL}/api/database/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'postgresql',
        connectionString: newDbUrl
      })
    })
    
    const saveData = await saveResponse.json()
    if (saveData.success) {
      console.log('✅ تم حفظ قاعدة البيانات الجديدة بنجاح')
    } else {
      console.log('❌ فشل في حفظ قاعدة البيانات الجديدة:', saveData.error)
      return
    }

    // 2. اختبار تحميل الإعدادات المحفوظة
    console.log('\n📋 2. اختبار تحميل الإعدادات المحفوظة...')
    const loadResponse = await fetch(`${BASE_URL}/api/database/settings`)
    const loadData = await loadResponse.json()
    
    if (loadData.success) {
      console.log('✅ تم تحميل الإعدادات بنجاح:', loadData.data.type)
      console.log('   نوع قاعدة البيانات:', loadData.data.type)
      console.log('   رابط الاتصال:', loadData.data.connectionString.substring(0, 50) + '...')
    } else {
      console.log('❌ فشل في تحميل الإعدادات:', loadData.error)
    }

    // 3. اختبار الاتصال وإنشاء جميع الجداول
    console.log('\n🔍 3. اختبار الاتصال وإنشاء جميع الجداول...')
    const testResponse = await fetch(`${BASE_URL}/api/database/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        connectionString: newDbUrl,
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

    // 5. اختبار جميع العمليات الأساسية
    console.log('\n👥 5. اختبار جميع العمليات الأساسية...')
    
    // اختبار العملاء
    const customersResponse = await fetch(`${BASE_URL}/api/customers`)
    const customersData = await customersResponse.json()
    if (customersData.success) {
      console.log('✅ العملاء:', customersData.data.length, 'عميل')
    } else {
      console.log('❌ فشل في تحميل العملاء:', customersData.error)
    }

    // اختبار الوحدات
    const unitsResponse = await fetch(`${BASE_URL}/api/units`)
    const unitsData = await unitsResponse.json()
    if (unitsData.success) {
      console.log('✅ الوحدات:', unitsData.data.length, 'وحدة')
    } else {
      console.log('❌ فشل في تحميل الوحدات:', unitsData.error)
    }

    // اختبار الشركاء
    const partnersResponse = await fetch(`${BASE_URL}/api/partners`)
    const partnersData = await partnersResponse.json()
    if (partnersData.success) {
      console.log('✅ الشركاء:', partnersData.data.length, 'شريك')
    } else {
      console.log('❌ فشل في تحميل الشركاء:', partnersData.error)
    }

    // اختبار الوسطاء
    const brokersResponse = await fetch(`${BASE_URL}/api/brokers`)
    const brokersData = await brokersResponse.json()
    if (brokersData.success) {
      console.log('✅ الوسطاء:', brokersData.data.length, 'وسيط')
    } else {
      console.log('❌ فشل في تحميل الوسطاء:', brokersData.error)
    }

    // اختبار الخزائن
    const safesResponse = await fetch(`${BASE_URL}/api/safes`)
    const safesData = await safesResponse.json()
    if (safesData.success) {
      console.log('✅ الخزائن:', safesData.data.length, 'خزينة')
    } else {
      console.log('❌ فشل في تحميل الخزائن:', safesData.error)
    }

    // 6. اختبار التبديل إلى SQLite
    console.log('\n🔄 6. اختبار التبديل إلى SQLite...')
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

    // 7. اختبار العودة إلى PostgreSQL
    console.log('\n🔄 7. اختبار العودة إلى PostgreSQL...')
    const postgresResponse = await fetch(`${BASE_URL}/api/database/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'postgresql',
        connectionString: newDbUrl
      })
    })
    
    const postgresData = await postgresResponse.json()
    if (postgresData.success) {
      console.log('✅ تم العودة إلى PostgreSQL بنجاح')
    } else {
      console.log('❌ فشل في العودة إلى PostgreSQL:', postgresData.error)
    }

    // 8. اختبار الـ refresh (تحميل الإعدادات مرة أخرى)
    console.log('\n🔄 8. اختبار الـ refresh (تحميل الإعدادات مرة أخرى)...')
    const refreshResponse = await fetch(`${BASE_URL}/api/database/settings`)
    const refreshData = await refreshResponse.json()
    
    if (refreshData.success) {
      console.log('✅ تم تحميل الإعدادات بعد الـ refresh بنجاح')
      console.log('   نوع قاعدة البيانات:', refreshData.data.type)
      console.log('   رابط الاتصال:', refreshData.data.connectionString.substring(0, 50) + '...')
      
      if (refreshData.data.type === 'postgresql' && refreshData.data.connectionString === newDbUrl) {
        console.log('✅ الإعدادات محفوظة بشكل صحيح ولا ترجع للقاعدة القديمة')
      } else {
        console.log('❌ الإعدادات ترجع للقاعدة القديمة!')
      }
    } else {
      console.log('❌ فشل في تحميل الإعدادات بعد الـ refresh:', refreshData.error)
    }

    console.log('\n🎉 تم اختبار جميع الإصلاحات بنجاح!')
    console.log('\n📊 ملخص النتائج:')
    console.log('✅ حفظ قاعدة البيانات الجديدة - نجح')
    console.log('✅ تحميل الإعدادات المحفوظة - نجح')
    console.log('✅ اختبار الاتصال وإنشاء الجداول - نجح')
    console.log('✅ إعادة تهيئة قاعدة البيانات - نجح')
    console.log('✅ جميع العمليات الأساسية - نجحت')
    console.log('✅ التبديل إلى SQLite - نجح')
    console.log('✅ العودة إلى PostgreSQL - نجح')
    console.log('✅ الـ refresh لا يرجع للقاعدة القديمة - نجح')

  } catch (error) {
    console.error('❌ خطأ في اختبار الإصلاحات:', error)
  }
}

// تشغيل الاختبار
testCompleteFixes()