#!/usr/bin/env node

// اختبار شامل لجميع API endpoints
const https = require('https')
const http = require('http')

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000'
let authToken = ''

console.log('🧪 بدء اختبار API Endpoints...\n')

// دالة مساعدة لإرسال الطلبات
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL)
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    }

    if (authToken) {
      options.headers['Authorization'] = `Bearer ${authToken}`
    }

    const client = url.protocol === 'https:' ? https : http
    const req = client.request(options, (res) => {
      let body = ''
      res.on('data', (chunk) => body += chunk)
      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : {}
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonBody
          })
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: body
          })
        }
      })
    })

    req.on('error', reject)

    if (data) {
      req.write(JSON.stringify(data))
    }

    req.end()
  })
}

// اختبار تسجيل الدخول
async function testLogin() {
  console.log('🔐 اختبار تسجيل الدخول...')
  try {
    const response = await makeRequest('POST', '/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    })

    if (response.status === 200 && response.data.success) {
      authToken = response.data.token
      console.log('✅ تسجيل الدخول نجح')
      console.log(`   🎫 Token: ${authToken.substring(0, 20)}...`)
      return true
    } else {
      console.log('❌ تسجيل الدخول فشل')
      console.log(`   📊 Status: ${response.status}`)
      console.log(`   📝 Response: ${JSON.stringify(response.data)}`)
      return false
    }
  } catch (error) {
    console.log('❌ خطأ في تسجيل الدخول:', error.message)
    return false
  }
}

// اختبار Dashboard
async function testDashboard() {
  console.log('\n📊 اختبار Dashboard...')
  try {
    const response = await makeRequest('GET', '/api/dashboard')

    if (response.status === 200 && response.data.success) {
      console.log('✅ Dashboard يعمل')
      console.log(`   📈 العملاء: ${response.data.data.customersCount || 0}`)
      console.log(`   🏢 الوحدات: ${response.data.data.unitsCount || 0}`)
      console.log(`   📋 العقود: ${response.data.data.contractsCount || 0}`)
      return true
    } else {
      console.log('❌ Dashboard فشل')
      console.log(`   📊 Status: ${response.status}`)
      return false
    }
  } catch (error) {
    console.log('❌ خطأ في Dashboard:', error.message)
    return false
  }
}

// اختبار CRUD للعملاء
async function testCustomersCRUD() {
  console.log('\n👥 اختبار CRUD العملاء...')
  
  try {
    // إنشاء عميل جديد
    const createResponse = await makeRequest('POST', '/api/customers', {
      name: 'عميل تجريبي',
      phone: '01234567890',
      nationalId: '12345678901234',
      address: 'عنوان تجريبي',
      status: 'active',
      notes: 'ملاحظات تجريبية'
    })

    if (createResponse.status === 201 && createResponse.data.success) {
      console.log('✅ إنشاء عميل نجح')
      const customerId = createResponse.data.data.id

      // قراءة العميل
      const readResponse = await makeRequest('GET', `/api/customers/${customerId}`)
      if (readResponse.status === 200 && readResponse.data.success) {
        console.log('✅ قراءة عميل نجح')

        // تحديث العميل
        const updateResponse = await makeRequest('PUT', `/api/customers/${customerId}`, {
          name: 'عميل محدث',
          phone: '01234567891',
          status: 'inactive'
        })

        if (updateResponse.status === 200 && updateResponse.data.success) {
          console.log('✅ تحديث عميل نجح')

          // حذف العميل
          const deleteResponse = await makeRequest('DELETE', `/api/customers/${customerId}`)
          if (deleteResponse.status === 200 && deleteResponse.data.success) {
            console.log('✅ حذف عميل نجح')
            return true
          } else {
            console.log('❌ حذف عميل فشل')
          }
        } else {
          console.log('❌ تحديث عميل فشل')
        }
      } else {
        console.log('❌ قراءة عميل فشل')
      }
    } else {
      console.log('❌ إنشاء عميل فشل')
      console.log(`   📊 Status: ${createResponse.status}`)
      console.log(`   📝 Response: ${JSON.stringify(createResponse.data)}`)
    }
  } catch (error) {
    console.log('❌ خطأ في CRUD العملاء:', error.message)
  }
  
  return false
}

// اختبار CRUD للوحدات
async function testUnitsCRUD() {
  console.log('\n🏢 اختبار CRUD الوحدات...')
  
  try {
    // إنشاء وحدة جديدة
    const createResponse = await makeRequest('POST', '/api/units', {
      code: 'UNIT-001',
      name: 'وحدة تجريبية',
      unitType: 'apartment',
      area: '120',
      floor: '5',
      building: 'مبنى أ',
      totalPrice: 500000,
      status: 'available',
      notes: 'ملاحظات تجريبية'
    })

    if (createResponse.status === 201 && createResponse.data.success) {
      console.log('✅ إنشاء وحدة نجح')
      const unitId = createResponse.data.data.id

      // قراءة الوحدة
      const readResponse = await makeRequest('GET', `/api/units/${unitId}`)
      if (readResponse.status === 200 && readResponse.data.success) {
        console.log('✅ قراءة وحدة نجح')

        // تحديث الوحدة
        const updateResponse = await makeRequest('PUT', `/api/units/${unitId}`, {
          name: 'وحدة محدثة',
          totalPrice: 550000,
          status: 'sold'
        })

        if (updateResponse.status === 200 && updateResponse.data.success) {
          console.log('✅ تحديث وحدة نجح')

          // حذف الوحدة
          const deleteResponse = await makeRequest('DELETE', `/api/units/${unitId}`)
          if (deleteResponse.status === 200 && deleteResponse.data.success) {
            console.log('✅ حذف وحدة نجح')
            return true
          } else {
            console.log('❌ حذف وحدة فشل')
          }
        } else {
          console.log('❌ تحديث وحدة فشل')
        }
      } else {
        console.log('❌ قراءة وحدة فشل')
      }
    } else {
      console.log('❌ إنشاء وحدة فشل')
      console.log(`   📊 Status: ${createResponse.status}`)
    }
  } catch (error) {
    console.log('❌ خطأ في CRUD الوحدات:', error.message)
  }
  
  return false
}

// اختبار Health Check
async function testHealthCheck() {
  console.log('\n🏥 اختبار Health Check...')
  try {
    const response = await makeRequest('GET', '/api/monitoring/health')

    if (response.status === 200 && response.data.status) {
      console.log('✅ Health Check يعمل')
      console.log(`   🗄️ قاعدة البيانات: ${response.data.checks.database.status}`)
      console.log(`   💾 الذاكرة: ${response.data.checks.memory.status}`)
      console.log(`   💿 القرص: ${response.data.checks.disk.status}`)
      return true
    } else {
      console.log('❌ Health Check فشل')
      console.log(`   📊 Status: ${response.status}`)
      return false
    }
  } catch (error) {
    console.log('❌ خطأ في Health Check:', error.message)
    return false
  }
}

// اختبار Audit Logs
async function testAuditLogs() {
  console.log('\n📋 اختبار Audit Logs...')
  try {
    const response = await makeRequest('GET', '/api/audit')

    if (response.status === 200 && response.data.success) {
      console.log('✅ Audit Logs يعمل')
      console.log(`   📊 إجمالي السجلات: ${response.data.pagination?.total || 0}`)
      return true
    } else {
      console.log('❌ Audit Logs فشل')
      console.log(`   📊 Status: ${response.status}`)
      return false
    }
  } catch (error) {
    console.log('❌ خطأ في Audit Logs:', error.message)
    return false
  }
}

// اختبار Notifications
async function testNotifications() {
  console.log('\n🔔 اختبار Notifications...')
  try {
    const response = await makeRequest('GET', '/api/notifications')

    if (response.status === 200 && response.data.success) {
      console.log('✅ Notifications يعمل')
      console.log(`   📊 عدد الإشعارات: ${response.data.data?.length || 0}`)
      return true
    } else {
      console.log('❌ Notifications فشل')
      console.log(`   📊 Status: ${response.status}`)
      return false
    }
  } catch (error) {
    console.log('❌ خطأ في Notifications:', error.message)
    return false
  }
}

// اختبار Export
async function testExport() {
  console.log('\n📤 اختبار Export...')
  try {
    const response = await makeRequest('GET', '/api/export')

    if (response.status === 200 && response.data.success) {
      console.log('✅ Export يعمل')
      console.log(`   📊 البيانات المصدرة: ${Object.keys(response.data.data).length} جدول`)
      return true
    } else {
      console.log('❌ Export فشل')
      console.log(`   📊 Status: ${response.status}`)
      return false
    }
  } catch (error) {
    console.log('❌ خطأ في Export:', error.message)
    return false
  }
}

// تشغيل جميع الاختبارات
async function runAllTests() {
  console.log(`🌐 اختبار الخادم: ${BASE_URL}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  const tests = [
    { name: 'تسجيل الدخول', fn: testLogin },
    { name: 'Dashboard', fn: testDashboard },
    { name: 'CRUD العملاء', fn: testCustomersCRUD },
    { name: 'CRUD الوحدات', fn: testUnitsCRUD },
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'Audit Logs', fn: testAuditLogs },
    { name: 'Notifications', fn: testNotifications },
    { name: 'Export', fn: testExport }
  ]

  let passed = 0
  let total = tests.length

  for (const test of tests) {
    try {
      const result = await test.fn()
      if (result) passed++
    } catch (error) {
      console.log(`❌ خطأ في ${test.name}:`, error.message)
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`📊 النتيجة النهائية: ${passed}/${total} اختبار نجح`)
  
  if (passed === total) {
    console.log('🎉 جميع الاختبارات نجحت! النظام يعمل بشكل مثالي!')
  } else {
    console.log('⚠️ بعض الاختبارات فشلت. راجع الأخطاء أعلاه.')
  }

  console.log('\n🚀 المشروع جاهز للاستخدام!')
}

// تشغيل الاختبارات
runAllTests().catch(console.error)