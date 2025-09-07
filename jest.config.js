// Jest configuration لمدير الاستثمار العقاري

const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // مسار Next.js app
  dir: './',
})

// إعدادات Jest المخصصة
const customJestConfig = {
  // بيئة الاختبار
  testEnvironment: 'jest-environment-jsdom',
  
  // مسارات الاختبارات
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/tests/**/*.{test,spec}.{js,jsx,ts,tsx}'
  ],
  
  // مجلدات الاختبار
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/build/',
    '<rootDir>/dist/'
  ],
  
  // إعدادات التغطية
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/node_modules/**'
  ],
  
  // مجلدات التغطية
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  
  // عتبات التغطية
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // إعدادات الوحدة
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/constants/(.*)$': '<rootDir>/src/constants/$1'
  },
  
  // إعدادات التحويل
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }]
  },
  
  // إعدادات الملفات
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // إعدادات الاختبار
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // إعدادات Mock
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // إعدادات الوقت
  testTimeout: 10000,
  
  // إعدادات المتغيرات البيئية
  setupFiles: ['<rootDir>/jest.env.js'],
  
  // إعدادات التقارير
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'reports',
      outputName: 'junit.xml'
    }]
  ],
  
  // إعدادات الأداء
  maxWorkers: '50%',
  
  // إعدادات الذاكرة
  workerIdleMemoryLimit: '512MB',
  
  // إعدادات التخزين المؤقت
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // إعدادات الاختبارات المتوازية
  maxConcurrency: 5,
  
  // إعدادات إضافية
  verbose: true,
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true
}

// إنشاء إعداد Jest النهائي
module.exports = createJestConfig(customJestConfig)