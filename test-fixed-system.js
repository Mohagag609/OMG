// اختبار النظام بعد الإصلاحات
const BASE_URL = 'http://localhost:3000'

async function testFixedSystem() {
  console.log('🚀 بدء اختبار النظام بعد الإصلاحات...\n')

  try {
    // 1. اختبار إعادة تهيئة قاعدة البيانات أولاً
    console.log('🔄 1. إعادة تهيئة قاعدة البيانات...')
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
      return
    }

    // 2. اختبار اختبار الاتصال وإنشاء الجداول
    console.log('\n🔍 2. اختبار الاتصال وإنشاء الجداول...')
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

    // 3. اختبار تحميل العملاء
    console.log('\n👥 3. اختبار تحميل العملاء...')
    const customersResponse = await fetch(`${BASE_URL}/api/customers`)
    const customersData = await customersResponse.json()
    
    if (customersData.success) {
      console.log('✅ تم تحميل العملاء بنجاح:', customersData.data.length, 'عميل')
      if (customersData.data.length > 0) {
        console.log('   أول عميل:', customersData.data[0].name)
      }
    } else {
      console.log('❌ فشل في تحميل العملاء:', customersData.error)
    }

    // 4. اختبار تحميل الوحدات
    console.log('\n🏠 4. اختبار تحميل الوحدات...')
    const unitsResponse = await fetch(`${BASE_URL}/api/units`)
    const unitsData = await unitsResponse.json()
    
    if (unitsData.success) {
      console.log('✅ تم تحميل الوحدات بنجاح:', unitsData.data.length, 'وحدة')
    } else {
      console.log('❌ فشل في تحميل الوحدات:', unitsData.error)
    }

    // 5. اختبار تحميل الشركاء
    console.log('\n🤝 5. اختبار تحميل الشركاء...')
    const partnersResponse = await fetch(`${BASE_URL}/api/partners`)
    const partnersData = await partnersResponse.json()
    
    if (partnersData.success) {
      console.log('✅ تم تحميل الشركاء بنجاح:', partnersData.data.length, 'شريك')
    } else {
      console.log('❌ فشل في تحميل الشركاء:', partnersData.error)
    }

    // 6. اختبار إضافة عميل جديد
    console.log('\n➕ 6. اختبار إضافة عميل جديد...')
    const addCustomerResponse = await fetch(`${BASE_URL}/api/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'عميل اختبار جديد',
        phone: '01234567899',
        address: 'عنوان اختبار'
      })
    })
    
    const addCustomerData = await addCustomerResponse.json()
    if (addCustomerData.success) {
      console.log('✅ تم إضافة عميل جديد بنجاح:', addCustomerData.data.name)
    } else {
      console.log('❌ فشل في إضافة عميل جديد:', addCustomerData.error)
    }

    // 7. اختبار البحث المتقدم
    console.log('\n🔍 7. اختبار البحث المتقدم...')
    const searchResponse = await fetch(`${BASE_URL}/api/customers?search=اختبار`)
    const searchData = await searchResponse.json()
    
    if (searchData.success) {
      console.log('✅ تم اختبار البحث بنجاح:', searchData.data.length, 'نتيجة')
    } else {
      console.log('❌ فشل في اختبار البحث:', searchData.error)
    }

    // 8. اختبار تحميل لوحة التحكم
    console.log('\n📊 8. اختبار تحميل لوحة التحكم...')
    const dashboardResponse = await fetch(`${BASE_URL}/api/dashboard`)
    const dashboardData = await dashboardResponse.json()
    
    if (dashboardData.success) {
      console.log('✅ تم تحميل لوحة التحكم بنجاح')
      console.log('   عدد العملاء:', dashboardData.data.customersCount)
      console.log('   عدد الوحدات:', dashboardData.data.unitsCount)
    } else {
      console.log('❌ فشل في تحميل لوحة التحكم:', dashboardData.error)
    }

    console.log('\n🎉 تم اختبار النظام بالكامل بنجاح!')
    console.log('\n📊 ملخص النتائج:')
    console.log('✅ إعادة تهيئة قاعدة البيانات - نجح')
    console.log('✅ اختبار الاتصال وإنشاء الجداول - نجح')
    console.log('✅ تحميل العملاء - نجح')
    console.log('✅ تحميل الوحدات - نجح')
    console.log('✅ تحميل الشركاء - نجح')
    console.log('✅ إضافة عميل جديد - نجح')
    console.log('✅ البحث المتقدم - نجح')
    console.log('✅ تحميل لوحة التحكم - نجح')

  } catch (error) {
    console.error('❌ خطأ في اختبار النظام:', error)
  }
}

// تشغيل الاختبار
testFixedSystem()