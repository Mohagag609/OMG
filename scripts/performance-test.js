#!/usr/bin/env node

// اختبار الأداء لمدير الاستثمار العقاري
const http = require('http')
const https = require('https')
const { performance } = require('perf_hooks')

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000'
const CONCURRENT_USERS = parseInt(process.env.CONCURRENT_USERS) || 10
const REQUESTS_PER_USER = parseInt(process.env.REQUESTS_PER_USER) || 100
const TEST_DURATION = parseInt(process.env.TEST_DURATION) || 60 // seconds

let authToken = ''
const results = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  responseTimes: [],
  errors: [],
  startTime: 0,
  endTime: 0
}

console.log('🚀 بدء اختبار الأداء...')
console.log(`📊 المستخدمون المتزامنون: ${CONCURRENT_USERS}`)
console.log(`📝 الطلبات لكل مستخدم: ${REQUESTS_PER_USER}`)
console.log(`⏱️ مدة الاختبار: ${TEST_DURATION} ثانية`)
console.log(`🌐 الخادم: ${BASE_URL}`)
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

// دالة مساعدة لإرسال الطلبات
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL)
    const startTime = performance.now()
    
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
        const endTime = performance.now()
        const responseTime = endTime - startTime
        
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: body,
          responseTime: responseTime
        })
      })
    })

    req.on('error', (error) => {
      const endTime = performance.now()
      const responseTime = endTime - startTime
      
      reject({
        error: error,
        responseTime: responseTime
      })
    })

    if (data) {
      req.write(JSON.stringify(data))
    }

    req.end()
  })
}

// تسجيل الدخول للحصول على التوكن
async function login() {
  try {
    const response = await makeRequest('POST', '/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    })

    if (response.status === 200) {
      const data = JSON.parse(response.data)
      authToken = data.token
      console.log('✅ تسجيل الدخول نجح')
      return true
    } else {
      console.log('❌ تسجيل الدخول فشل')
      return false
    }
  } catch (error) {
    console.log('❌ خطأ في تسجيل الدخول:', error.message)
    return false
  }
}

// اختبار نقطة API واحدة
async function testEndpoint(method, path, data = null) {
  try {
    const response = await makeRequest(method, path, data)
    
    results.totalRequests++
    results.responseTimes.push(response.responseTime)
    
    if (response.status >= 200 && response.status < 300) {
      results.successfulRequests++
    } else {
      results.failedRequests++
      results.errors.push({
        endpoint: path,
        status: response.status,
        responseTime: response.responseTime
      })
    }
    
    return response
  } catch (error) {
    results.totalRequests++
    results.failedRequests++
    results.responseTimes.push(error.responseTime)
    results.errors.push({
      endpoint: path,
      error: error.error.message,
      responseTime: error.responseTime
    })
    
    return null
  }
}

// محاكاة مستخدم واحد
async function simulateUser(userId) {
  const endpoints = [
    { method: 'GET', path: '/api/dashboard' },
    { method: 'GET', path: '/api/customers' },
    { method: 'GET', path: '/api/units' },
    { method: 'GET', path: '/api/contracts' },
    { method: 'GET', path: '/api/monitoring/health' },
    { method: 'GET', path: '/api/audit' },
    { method: 'GET', path: '/api/notifications' },
    { method: 'POST', path: '/api/customers', data: {
      name: `عميل ${userId}`,
      phone: `0123456789${userId}`,
      nationalId: `1234567890123${userId}`,
      address: `عنوان ${userId}`,
      status: 'active',
      notes: `ملاحظات ${userId}`
    }},
    { method: 'POST', path: '/api/units', data: {
      code: `UNIT-${userId}`,
      name: `وحدة ${userId}`,
      unitType: 'apartment',
      area: '120',
      floor: '5',
      building: `مبنى ${userId}`,
      totalPrice: 500000,
      status: 'available',
      notes: `ملاحظات ${userId}`
    }}
  ]

  for (let i = 0; i < REQUESTS_PER_USER; i++) {
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)]
    await testEndpoint(endpoint.method, endpoint.path, endpoint.data)
    
    // تأخير عشوائي بين الطلبات
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100))
  }
}

// تشغيل اختبار الأداء
async function runPerformanceTest() {
  results.startTime = performance.now()
  
  // إنشاء مصفوفة من الوعود لمحاكاة المستخدمين المتزامنين
  const userPromises = []
  for (let i = 0; i < CONCURRENT_USERS; i++) {
    userPromises.push(simulateUser(i))
  }
  
  // انتظار انتهاء جميع المستخدمين أو انتهاء الوقت المحدد
  const timeoutPromise = new Promise(resolve => {
    setTimeout(resolve, TEST_DURATION * 1000)
  })
  
  await Promise.race([
    Promise.all(userPromises),
    timeoutPromise
  ])
  
  results.endTime = performance.now()
  
  // حساب الإحصائيات
  const totalTime = (results.endTime - results.startTime) / 1000
  const requestsPerSecond = results.totalRequests / totalTime
  const averageResponseTime = results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length
  const minResponseTime = Math.min(...results.responseTimes)
  const maxResponseTime = Math.max(...results.responseTimes)
  const successRate = (results.successfulRequests / results.totalRequests) * 100
  
  // ترتيب أوقات الاستجابة
  const sortedResponseTimes = results.responseTimes.sort((a, b) => a - b)
  const p50 = sortedResponseTimes[Math.floor(sortedResponseTimes.length * 0.5)]
  const p90 = sortedResponseTimes[Math.floor(sortedResponseTimes.length * 0.9)]
  const p95 = sortedResponseTimes[Math.floor(sortedResponseTimes.length * 0.95)]
  const p99 = sortedResponseTimes[Math.floor(sortedResponseTimes.length * 0.99)]
  
  // عرض النتائج
  console.log('\n📊 نتائج اختبار الأداء:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`⏱️ إجمالي الوقت: ${totalTime.toFixed(2)} ثانية`)
  console.log(`📝 إجمالي الطلبات: ${results.totalRequests}`)
  console.log(`✅ الطلبات الناجحة: ${results.successfulRequests}`)
  console.log(`❌ الطلبات الفاشلة: ${results.failedRequests}`)
  console.log(`📈 معدل النجاح: ${successRate.toFixed(2)}%`)
  console.log(`🚀 الطلبات في الثانية: ${requestsPerSecond.toFixed(2)}`)
  console.log(`⚡ متوسط وقت الاستجابة: ${averageResponseTime.toFixed(2)} مللي ثانية`)
  console.log(`🏃 أسرع استجابة: ${minResponseTime.toFixed(2)} مللي ثانية`)
  console.log(`🐌 أبطأ استجابة: ${maxResponseTime.toFixed(2)} مللي ثانية`)
  console.log(`📊 P50 (الوسيط): ${p50.toFixed(2)} مللي ثانية`)
  console.log(`📊 P90: ${p90.toFixed(2)} مللي ثانية`)
  console.log(`📊 P95: ${p95.toFixed(2)} مللي ثانية`)
  console.log(`📊 P99: ${p99.toFixed(2)} مللي ثانية`)
  
  // عرض الأخطاء
  if (results.errors.length > 0) {
    console.log('\n❌ الأخطاء:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    results.errors.slice(0, 10).forEach((error, index) => {
      console.log(`${index + 1}. ${error.endpoint} - ${error.status || error.error} (${error.responseTime.toFixed(2)}ms)`)
    })
    
    if (results.errors.length > 10) {
      console.log(`... و ${results.errors.length - 10} خطأ آخر`)
    }
  }
  
  // تقييم الأداء
  console.log('\n🎯 تقييم الأداء:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  if (successRate >= 99) {
    console.log('✅ معدل النجاح ممتاز (≥99%)')
  } else if (successRate >= 95) {
    console.log('✅ معدل النجاح جيد جداً (≥95%)')
  } else if (successRate >= 90) {
    console.log('⚠️ معدل النجاح مقبول (≥90%)')
  } else {
    console.log('❌ معدل النجاح ضعيف (<90%)')
  }
  
  if (averageResponseTime <= 200) {
    console.log('✅ متوسط وقت الاستجابة ممتاز (≤200ms)')
  } else if (averageResponseTime <= 500) {
    console.log('✅ متوسط وقت الاستجابة جيد (≤500ms)')
  } else if (averageResponseTime <= 1000) {
    console.log('⚠️ متوسط وقت الاستجابة مقبول (≤1000ms)')
  } else {
    console.log('❌ متوسط وقت الاستجابة ضعيف (>1000ms)')
  }
  
  if (requestsPerSecond >= 100) {
    console.log('✅ معدل الطلبات ممتاز (≥100 req/s)')
  } else if (requestsPerSecond >= 50) {
    console.log('✅ معدل الطلبات جيد (≥50 req/s)')
  } else if (requestsPerSecond >= 20) {
    console.log('⚠️ معدل الطلبات مقبول (≥20 req/s)')
  } else {
    console.log('❌ معدل الطلبات ضعيف (<20 req/s)')
  }
  
  console.log('\n🎉 انتهى اختبار الأداء!')
}

// تشغيل الاختبار
async function main() {
  const loginSuccess = await login()
  if (!loginSuccess) {
    console.log('❌ فشل في تسجيل الدخول. إنهاء الاختبار.')
    process.exit(1)
  }
  
  await runPerformanceTest()
}

main().catch(console.error)