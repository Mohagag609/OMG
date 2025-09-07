// اختبارات الوظائف المساعدة لمدير الاستثمار العقاري

const {
  calculateNetAmount,
  calculateCommission,
  calculateDiscount,
  formatCurrency,
  formatDate,
  validatePhone,
  validateNationalId,
  validateEmail,
  generateCode,
  sanitizeInput,
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  createAuditLog,
  sendNotification,
  createBackup,
  restoreBackup,
  performHealthCheck,
  getMetrics
} = require('../src/utils')

describe('Utility Functions Tests', () => {
  describe('Calculation Functions', () => {
    test('calculateNetAmount - حساب المبلغ الصافي', () => {
      expect(calculateNetAmount(1000, 100)).toBe(900)
      expect(calculateNetAmount(5000, 500)).toBe(4500)
      expect(calculateNetAmount(0, 0)).toBe(0)
      expect(calculateNetAmount(1000, 0)).toBe(1000)
    })

    test('calculateCommission - حساب العمولة', () => {
      expect(calculateCommission(100000, 0.05)).toBe(5000)
      expect(calculateCommission(500000, 0.03)).toBe(15000)
      expect(calculateCommission(0, 0.05)).toBe(0)
    })

    test('calculateDiscount - حساب الخصم', () => {
      expect(calculateDiscount(1000, 0.1)).toBe(100)
      expect(calculateDiscount(5000, 0.2)).toBe(1000)
      expect(calculateDiscount(0, 0.1)).toBe(0)
    })
  })

  describe('Formatting Functions', () => {
    test('formatCurrency - تنسيق العملة', () => {
      expect(formatCurrency(1000)).toBe('1,000 جنيه')
      expect(formatCurrency(1000000)).toBe('1,000,000 جنيه')
      expect(formatCurrency(0)).toBe('0 جنيه')
      expect(formatCurrency(1234.56)).toBe('1,235 جنيه')
    })

    test('formatDate - تنسيق التاريخ', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      expect(formatDate(date)).toBe('15/01/2024')
      expect(formatDate(date, 'YYYY-MM-DD')).toBe('2024-01-15')
      expect(formatDate(date, 'DD/MM/YYYY HH:mm')).toBe('15/01/2024 10:30')
    })
  })

  describe('Validation Functions', () => {
    test('validatePhone - التحقق من رقم الهاتف', () => {
      expect(validatePhone('01234567890')).toBe(true)
      expect(validatePhone('+201234567890')).toBe(true)
      expect(validatePhone('1234567890')).toBe(false)
      expect(validatePhone('0123456789')).toBe(false)
      expect(validatePhone('invalid')).toBe(false)
    })

    test('validateNationalId - التحقق من الرقم القومي', () => {
      expect(validateNationalId('12345678901234')).toBe(true)
      expect(validateNationalId('1234567890123')).toBe(false)
      expect(validateNationalId('123456789012345')).toBe(false)
      expect(validateNationalId('invalid')).toBe(false)
    })

    test('validateEmail - التحقق من البريد الإلكتروني', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name@domain.co.uk')).toBe(true)
      expect(validateEmail('invalid-email')).toBe(false)
      expect(validateEmail('@example.com')).toBe(false)
      expect(validateEmail('test@')).toBe(false)
    })
  })

  describe('Code Generation', () => {
    test('generateCode - إنشاء كود', () => {
      const code1 = generateCode('CUST')
      const code2 = generateCode('UNIT')
      
      expect(code1).toMatch(/^CUST-\d{6}$/)
      expect(code2).toMatch(/^UNIT-\d{6}$/)
      expect(code1).not.toBe(code2)
    })
  })

  describe('Input Sanitization', () => {
    test('sanitizeInput - تنظيف المدخلات', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('alert("xss")')
      expect(sanitizeInput('  hello world  ')).toBe('hello world')
      expect(sanitizeInput('test@example.com')).toBe('test@example.com')
      expect(sanitizeInput('')).toBe('')
    })
  })

  describe('Password Functions', () => {
    test('hashPassword - تشفير كلمة المرور', async () => {
      const password = 'testpassword'
      const hash = await hashPassword(password)
      
      expect(hash).toBeDefined()
      expect(hash).not.toBe(password)
      expect(hash.length).toBeGreaterThan(20)
    })

    test('comparePassword - مقارنة كلمة المرور', async () => {
      const password = 'testpassword'
      const hash = await hashPassword(password)
      
      expect(await comparePassword(password, hash)).toBe(true)
      expect(await comparePassword('wrongpassword', hash)).toBe(false)
    })
  })

  describe('Token Functions', () => {
    test('generateToken - إنشاء توكن', () => {
      const payload = { userId: '123', role: 'admin' }
      const token = generateToken(payload)
      
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3)
    })

    test('verifyToken - التحقق من التوكن', () => {
      const payload = { userId: '123', role: 'admin' }
      const token = generateToken(payload)
      const decoded = verifyToken(token)
      
      expect(decoded).toBeDefined()
      expect(decoded.userId).toBe(payload.userId)
      expect(decoded.role).toBe(payload.role)
    })

    test('verifyToken - توكن غير صحيح', () => {
      const invalidToken = 'invalid.token.here'
      const decoded = verifyToken(invalidToken)
      
      expect(decoded).toBeNull()
    })
  })

  describe('Audit Functions', () => {
    test('createAuditLog - إنشاء سجل تدقيق', async () => {
      const auditData = {
        action: 'create',
        entityType: 'customer',
        entityId: '123',
        newValues: { name: 'Test Customer' },
        userId: 'user123'
      }
      
      const result = await createAuditLog(auditData)
      expect(result).toBeDefined()
    })
  })

  describe('Notification Functions', () => {
    test('sendNotification - إرسال إشعار', async () => {
      const notificationData = {
        type: 'info',
        title: 'Test Notification',
        message: 'This is a test notification',
        userId: 'user123'
      }
      
      const result = await sendNotification(notificationData)
      expect(result).toBeDefined()
    })
  })

  describe('Backup Functions', () => {
    test('createBackup - إنشاء نسخة احتياطية', async () => {
      const result = await createBackup('test-backup')
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })

    test('restoreBackup - استرجاع نسخة احتياطية', async () => {
      const result = await restoreBackup('test-backup.json')
      expect(result).toBeDefined()
    })
  })

  describe('Health Check Functions', () => {
    test('performHealthCheck - فحص صحة النظام', async () => {
      const result = await performHealthCheck()
      expect(result).toBeDefined()
      expect(result.status).toBeDefined()
      expect(result.checks).toBeDefined()
      expect(result.checks.database).toBeDefined()
      expect(result.checks.memory).toBeDefined()
      expect(result.checks.disk).toBeDefined()
    })
  })

  describe('Metrics Functions', () => {
    test('getMetrics - الحصول على المقاييس', async () => {
      const result = await getMetrics()
      expect(result).toBeDefined()
      expect(result.totalRequests).toBeDefined()
      expect(result.averageResponseTime).toBeDefined()
      expect(result.errorRate).toBeDefined()
      expect(result.activeUsers).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    test('handle null and undefined values', () => {
      expect(formatCurrency(null)).toBe('0 جنيه')
      expect(formatCurrency(undefined)).toBe('0 جنيه')
      expect(formatDate(null)).toBe('')
      expect(formatDate(undefined)).toBe('')
      expect(sanitizeInput(null)).toBe('')
      expect(sanitizeInput(undefined)).toBe('')
    })

    test('handle empty strings', () => {
      expect(formatCurrency('')).toBe('0 جنيه')
      expect(formatDate('')).toBe('')
      expect(sanitizeInput('')).toBe('')
      expect(validatePhone('')).toBe(false)
      expect(validateNationalId('')).toBe(false)
      expect(validateEmail('')).toBe(false)
    })

    test('handle very large numbers', () => {
      expect(formatCurrency(999999999999)).toBe('999,999,999,999 جنيه')
      expect(calculateNetAmount(999999999999, 99999999999)).toBe(900000000000)
    })

    test('handle negative numbers', () => {
      expect(formatCurrency(-1000)).toBe('-1,000 جنيه')
      expect(calculateNetAmount(-1000, 100)).toBe(-1100)
    })
  })
})