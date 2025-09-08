// اختبارات API شاملة لمدير الاستثمار العقاري

const request = require('supertest')
const app = require('../src/app')

describe('API Tests', () => {
  let authToken = ''
  let testCustomerId = ''
  let testUnitId = ''
  let testContractId = ''

  beforeAll(async () => {
    // تسجيل الدخول للحصول على التوكن
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123'
      })
    
    if (loginResponse.status === 200) {
      authToken = loginResponse.body.token
    }
  })

  describe('Authentication', () => {
    test('POST /api/auth/login - تسجيل الدخول الصحيح', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123'
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.token).toBeDefined()
      expect(response.body.user).toBeDefined()
      expect(response.body.user.username).toBe('admin')
      expect(response.body.user.role).toBe('admin')
    })

    test('POST /api/auth/login - تسجيل الدخول الخاطئ', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'wrongpassword'
        })

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeDefined()
    })

    test('GET /api/auth/verify - التحقق من التوكن الصحيح', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.user).toBeDefined()
    })

    test('GET /api/auth/verify - التحقق من التوكن الخاطئ', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer invalid-token')

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
    })
  })

  describe('Dashboard', () => {
    test('GET /api/dashboard - عرض لوحة التحكم', async () => {
      const response = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(response.body.data.customersCount).toBeDefined()
      expect(response.body.data.unitsCount).toBeDefined()
      expect(response.body.data.contractsCount).toBeDefined()
    })

    test('GET /api/dashboard - بدون توكن', async () => {
      const response = await request(app)
        .get('/api/dashboard')

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
    })
  })

  describe('Customers CRUD', () => {
    test('POST /api/customers - إنشاء عميل جديد', async () => {
      const customerData = {
        name: 'عميل تجريبي',
        phone: '01234567890',
        nationalId: '12345678901234',
        address: 'عنوان تجريبي',
        status: 'active',
        notes: 'ملاحظات تجريبية'
      }

      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(customerData)

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(response.body.data.name).toBe(customerData.name)
      expect(response.body.data.phone).toBe(customerData.phone)
      
      testCustomerId = response.body.data.id
    })

    test('GET /api/customers - عرض جميع العملاء', async () => {
      const response = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(Array.isArray(response.body.data)).toBe(true)
    })

    test('GET /api/customers/:id - عرض عميل محدد', async () => {
      const response = await request(app)
        .get(`/api/customers/${testCustomerId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(response.body.data.id).toBe(testCustomerId)
    })

    test('PUT /api/customers/:id - تحديث عميل', async () => {
      const updateData = {
        name: 'عميل محدث',
        phone: '01234567891',
        status: 'inactive'
      }

      const response = await request(app)
        .put(`/api/customers/${testCustomerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.name).toBe(updateData.name)
      expect(response.body.data.phone).toBe(updateData.phone)
    })

    test('DELETE /api/customers/:id - حذف عميل', async () => {
      const response = await request(app)
        .delete(`/api/customers/${testCustomerId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })
  })

  describe('Units CRUD', () => {
    test('POST /api/units - إنشاء وحدة جديدة', async () => {
      const unitData = {
        code: 'UNIT-001',
        name: 'وحدة تجريبية',
        unitType: 'apartment',
        area: '120',
        floor: '5',
        building: 'مبنى أ',
        totalPrice: 500000,
        status: 'available',
        notes: 'ملاحظات تجريبية'
      }

      const response = await request(app)
        .post('/api/units')
        .set('Authorization', `Bearer ${authToken}`)
        .send(unitData)

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(response.body.data.code).toBe(unitData.code)
      expect(response.body.data.name).toBe(unitData.name)
      
      testUnitId = response.body.data.id
    })

    test('GET /api/units - عرض جميع الوحدات', async () => {
      const response = await request(app)
        .get('/api/units')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(Array.isArray(response.body.data)).toBe(true)
    })

    test('GET /api/units/:id - عرض وحدة محددة', async () => {
      const response = await request(app)
        .get(`/api/units/${testUnitId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(response.body.data.id).toBe(testUnitId)
    })

    test('PUT /api/units/:id - تحديث وحدة', async () => {
      const updateData = {
        name: 'وحدة محدثة',
        totalPrice: 550000,
        status: 'sold'
      }

      const response = await request(app)
        .put(`/api/units/${testUnitId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.name).toBe(updateData.name)
      expect(response.body.data.totalPrice).toBe(updateData.totalPrice)
    })

    test('DELETE /api/units/:id - حذف وحدة', async () => {
      const response = await request(app)
        .delete(`/api/units/${testUnitId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })
  })

  describe('Contracts CRUD', () => {
    test('POST /api/contracts - إنشاء عقد جديد', async () => {
      const contractData = {
        unitId: testUnitId,
        customerId: testCustomerId,
        start: new Date().toISOString(),
        totalPrice: 500000,
        discountAmount: 0,
        brokerName: 'وسيط تجريبي',
        commissionSafeId: 'test-safe-id',
        brokerAmount: 25000
      }

      const response = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contractData)

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(response.body.data.unitId).toBe(contractData.unitId)
      expect(response.body.data.customerId).toBe(contractData.customerId)
      
      testContractId = response.body.data.id
    })

    test('GET /api/contracts - عرض جميع العقود', async () => {
      const response = await request(app)
        .get('/api/contracts')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(Array.isArray(response.body.data)).toBe(true)
    })

    test('GET /api/contracts/:id - عرض عقد محدد', async () => {
      const response = await request(app)
        .get(`/api/contracts/${testContractId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(response.body.data.id).toBe(testContractId)
    })

    test('PUT /api/contracts/:id - تحديث عقد', async () => {
      const updateData = {
        totalPrice: 550000,
        discountAmount: 5000
      }

      const response = await request(app)
        .put(`/api/contracts/${testContractId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.totalPrice).toBe(updateData.totalPrice)
      expect(response.body.data.discountAmount).toBe(updateData.discountAmount)
    })

    test('DELETE /api/contracts/:id - حذف عقد', async () => {
      const response = await request(app)
        .delete(`/api/contracts/${testContractId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })
  })

  describe('Health Check', () => {
    test('GET /api/monitoring/health - فحص صحة النظام', async () => {
      const response = await request(app)
        .get('/api/monitoring/health')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.status).toBeDefined()
      expect(response.body.checks).toBeDefined()
      expect(response.body.checks.database).toBeDefined()
      expect(response.body.checks.memory).toBeDefined()
      expect(response.body.checks.disk).toBeDefined()
    })
  })

  describe('Audit Logs', () => {
    test('GET /api/audit - عرض سجلات التدقيق', async () => {
      const response = await request(app)
        .get('/api/audit')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(response.body.pagination).toBeDefined()
    })
  })

  describe('Notifications', () => {
    test('GET /api/notifications - عرض الإشعارات', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(Array.isArray(response.body.data)).toBe(true)
    })
  })

  describe('Export', () => {
    test('GET /api/export - تصدير البيانات', async () => {
      const response = await request(app)
        .get('/api/export')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(typeof response.body.data).toBe('object')
    })
  })

  describe('Error Handling', () => {
    test('GET /api/nonexistent - مسار غير موجود', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
    })

    test('POST /api/customers - بيانات غير صحيحة', async () => {
      const invalidData = {
        name: '', // اسم فارغ
        phone: 'invalid-phone' // رقم هاتف غير صحيح
      }

      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeDefined()
    })
  })
})