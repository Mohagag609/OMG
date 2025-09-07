// Jest setup file لمدير الاستثمار العقاري

import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    }
  },
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.sessionStorage = sessionStorageMock

// Mock fetch
global.fetch = jest.fn()

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock crypto
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-1234',
    getRandomValues: (arr) => arr.map(() => Math.floor(Math.random() * 256)),
  },
})

// Mock console methods for cleaner test output
const originalError = console.error
const originalWarn = console.warn

beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
  
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('componentWillReceiveProps')
    ) {
      return
    }
    originalWarn.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
  console.warn = originalWarn
})

// تنظيف بعد كل اختبار
afterEach(() => {
  jest.clearAllMocks()
  localStorageMock.clear()
  sessionStorageMock.clear()
})

// إعدادات إضافية للاختبارات
global.testUtils = {
  // دالة مساعدة لإنشاء بيانات تجريبية
  createMockUser: () => ({
    id: 'test-user-id',
    username: 'testuser',
    role: 'user',
    createdAt: new Date().toISOString(),
  }),
  
  // دالة مساعدة لإنشاء عميل تجريبي
  createMockCustomer: () => ({
    id: 'test-customer-id',
    name: 'عميل تجريبي',
    phone: '01234567890',
    nationalId: '12345678901234',
    address: 'عنوان تجريبي',
    status: 'active',
    notes: 'ملاحظات تجريبية',
    createdAt: new Date().toISOString(),
  }),
  
  // دالة مساعدة لإنشاء وحدة تجريبية
  createMockUnit: () => ({
    id: 'test-unit-id',
    code: 'UNIT-001',
    name: 'وحدة تجريبية',
    unitType: 'apartment',
    area: '120',
    floor: '5',
    building: 'مبنى أ',
    totalPrice: 500000,
    status: 'available',
    notes: 'ملاحظات تجريبية',
    createdAt: new Date().toISOString(),
  }),
  
  // دالة مساعدة لإنشاء عقد تجريبي
  createMockContract: () => ({
    id: 'test-contract-id',
    unitId: 'test-unit-id',
    customerId: 'test-customer-id',
    start: new Date().toISOString(),
    totalPrice: 500000,
    discountAmount: 0,
    brokerName: 'وسيط تجريبي',
    commissionSafeId: 'test-safe-id',
    brokerAmount: 25000,
    createdAt: new Date().toISOString(),
  }),
  
  // دالة مساعدة لإنشاء سند تجريبي
  createMockVoucher: () => ({
    id: 'test-voucher-id',
    type: 'receipt',
    date: new Date().toISOString(),
    amount: 100000,
    safeId: 'test-safe-id',
    description: 'وصف تجريبي',
    payer: 'دافع تجريبي',
    beneficiary: 'مستفيد تجريبي',
    linkedRef: 'ref-001',
    createdAt: new Date().toISOString(),
  }),
  
  // دالة مساعدة لإنشاء خزينة تجريبية
  createMockSafe: () => ({
    id: 'test-safe-id',
    name: 'خزينة تجريبية',
    balance: 1000000,
    createdAt: new Date().toISOString(),
  }),
  
  // دالة مساعدة لإنشاء وسيط تجريبي
  createMockBroker: () => ({
    id: 'test-broker-id',
    name: 'وسيط تجريبي',
    phone: '01234567890',
    notes: 'ملاحظات تجريبية',
    createdAt: new Date().toISOString(),
  }),
  
  // دالة مساعدة لإنشاء شريك تجريبي
  createMockPartner: () => ({
    id: 'test-partner-id',
    name: 'شريك تجريبي',
    phone: '01234567890',
    notes: 'ملاحظات تجريبية',
    createdAt: new Date().toISOString(),
  }),
  
  // دالة مساعدة لإنشاء قسط تجريبي
  createMockInstallment: () => ({
    id: 'test-installment-id',
    unitId: 'test-unit-id',
    amount: 50000,
    dueDate: new Date().toISOString(),
    status: 'pending',
    notes: 'ملاحظات تجريبية',
    createdAt: new Date().toISOString(),
  }),
  
  // دالة مساعدة لإنشاء إشعار تجريبي
  createMockNotification: () => ({
    id: 'test-notification-id',
    type: 'info',
    title: 'عنوان تجريبي',
    message: 'رسالة تجريبية',
    category: 'general',
    priority: 'normal',
    userId: 'test-user-id',
    read: false,
    createdAt: new Date().toISOString(),
  }),
  
  // دالة مساعدة لإنشاء سجل تدقيق تجريبي
  createMockAuditLog: () => ({
    id: 'test-audit-log-id',
    action: 'create',
    entityType: 'customer',
    entityId: 'test-customer-id',
    oldValues: null,
    newValues: { name: 'عميل تجريبي' },
    userId: 'test-user-id',
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
    createdAt: new Date().toISOString(),
  }),
  
  // دالة مساعدة لإنشاء نسخة احتياطية تجريبية
  createMockBackup: () => ({
    id: 'test-backup-id',
    name: 'backup-test.json',
    size: 1024,
    type: 'full',
    status: 'completed',
    createdAt: new Date().toISOString(),
  }),
  
  // دالة مساعدة لإنشاء تقرير صحة تجريبي
  createMockHealthCheck: () => ({
    status: 'healthy',
    checks: {
      database: { status: 'pass', responseTime: 50, error: null },
      memory: { status: 'pass', usage: 60, error: null },
      disk: { status: 'pass', usage: 40, error: null }
    },
    timestamp: new Date().toISOString(),
    uptime: 3600
  }),
  
  // دالة مساعدة لإنشاء مقاييس تجريبية
  createMockMetrics: () => ({
    totalRequests: 1000,
    averageResponseTime: 200,
    errorRate: 0.01,
    activeUsers: 50,
    databaseConnections: 10,
    memoryUsage: 512,
    diskUsage: 1024,
    lastBackupDate: new Date().toISOString()
  })
}