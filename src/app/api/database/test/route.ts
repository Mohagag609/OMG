import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { ApiResponse } from '@/types'
import { updateConnectionStatus } from '@/lib/databaseConfig'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/database/test - Test database connection and create tables
export async function POST(request: NextRequest) {
  let prisma: any = null
  
  try {
    console.log('🔍 بدء اختبار اتصال قاعدة البيانات...')

    const body = await request.json()
    const { connectionString, type } = body

    if (!connectionString) {
      return NextResponse.json(
        { success: false, error: 'رابط الاتصال مطلوب' },
        { status: 400 }
      )
    }

    // Set environment variable
    process.env.DATABASE_URL = connectionString
    console.log('🔧 تم تعيين متغير البيئة DATABASE_URL')

    // Create Prisma client with explicit URL
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: connectionString
        }
      }
    })

    // Test connection
    console.log('🔌 اختبار الاتصال...')
    await prisma.$connect()
    console.log('✅ تم الاتصال بنجاح')

    // Create tables using raw SQL
    console.log('📋 إنشاء الجداول...')
    await createTablesIfNeeded(prisma, type)
    console.log('✅ تم إنشاء الجداول بنجاح')

    // Test basic operations
    console.log('🧪 اختبار العمليات الأساسية...')
    await testBasicOperations(prisma)
    console.log('✅ تم اختبار العمليات بنجاح')

    // Update connection status
    updateConnectionStatus(true, {
      type: type || 'postgresql',
      connectionString: connectionString,
      message: 'تم اختبار الاتصال وإنشاء الجداول بنجاح',
      tablesCreated: true,
      lastTested: new Date().toISOString()
    })

    const response: ApiResponse<any> = {
      success: true,
      message: 'تم اختبار الاتصال وإنشاء الجداول بنجاح',
      data: {
        type: type || 'postgresql',
        connectionString: connectionString,
        isConnected: true,
        tablesCreated: true,
        lastTested: new Date().toISOString()
      }
    }

    console.log('🎉 تم اختبار قاعدة البيانات بنجاح!')
    return NextResponse.json(response)

  } catch (error: any) {
    console.error('❌ خطأ في اختبار قاعدة البيانات:', error)
    
    // Update connection status as failed
    updateConnectionStatus(false, {
      error: error.message,
      lastTested: new Date().toISOString()
    })

    return NextResponse.json(
      { 
        success: false, 
        error: `خطأ في قاعدة البيانات: ${error.message}`,
        details: error.message
      },
      { status: 500 }
    )
  } finally {
    if (prisma) {
      await prisma.$disconnect()
      console.log('🔌 تم قطع الاتصال')
    }
  }
}

// Create tables if they don't exist
async function createTablesIfNeeded(prisma: PrismaClient, type: string) {
  try {
    console.log('📋 بدء إنشاء جميع الجداول...')
    
    // Create all tables manually to ensure they exist
    if (type === 'sqlite') {
      console.log('🔧 إنشاء جداول SQLite...')
      
      // Users table
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "users" (
          "id" TEXT PRIMARY KEY,
          "username" TEXT NOT NULL UNIQUE,
          "password" TEXT NOT NULL,
          "role" TEXT NOT NULL DEFAULT 'user',
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `
      
      // Customers table
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "customers" (
          "id" TEXT PRIMARY KEY,
          "name" TEXT NOT NULL,
          "phone" TEXT,
          "nationalId" TEXT,
          "address" TEXT,
          "status" TEXT DEFAULT 'نشط',
          "notes" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "deletedAt" DATETIME
        )
      `
      
      // Units table
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "units" (
          "id" TEXT PRIMARY KEY,
          "code" TEXT UNIQUE,
          "name" TEXT,
          "unitType" TEXT DEFAULT 'سكني',
          "area" TEXT,
          "floor" TEXT,
          "building" TEXT,
          "totalPrice" REAL DEFAULT 0,
          "status" TEXT DEFAULT 'متاحة',
          "notes" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "deletedAt" DATETIME
        )
      `
      
      // Partners table
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "partners" (
          "id" TEXT PRIMARY KEY,
          "name" TEXT UNIQUE,
          "phone" TEXT,
          "notes" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "deletedAt" DATETIME
        )
      `
      
      // Brokers table
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "brokers" (
          "id" TEXT PRIMARY KEY,
          "name" TEXT UNIQUE,
          "phone" TEXT,
          "notes" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "deletedAt" DATETIME
        )
      `
      
      // Safes table
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "safes" (
          "id" TEXT PRIMARY KEY,
          "name" TEXT NOT NULL,
          "balance" REAL DEFAULT 0,
          "notes" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "deletedAt" DATETIME
        )
      `
      
      // Contracts table
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "contracts" (
          "id" TEXT PRIMARY KEY,
          "contractNumber" TEXT UNIQUE,
          "customerId" TEXT,
          "unitId" TEXT,
          "brokerId" TEXT,
          "contractDate" DATETIME,
          "totalAmount" REAL DEFAULT 0,
          "downPayment" REAL DEFAULT 0,
          "installmentAmount" REAL DEFAULT 0,
          "installmentCount" INTEGER DEFAULT 0,
          "status" TEXT DEFAULT 'نشط',
          "notes" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "deletedAt" DATETIME
        )
      `
      
      // Vouchers table
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "vouchers" (
          "id" TEXT PRIMARY KEY,
          "voucherNumber" TEXT UNIQUE,
          "voucherType" TEXT DEFAULT 'قبض',
          "amount" REAL DEFAULT 0,
          "description" TEXT,
          "voucherDate" DATETIME,
          "safeId" TEXT,
          "contractId" TEXT,
          "status" TEXT DEFAULT 'نشط',
          "notes" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "deletedAt" DATETIME
        )
      `
      
      // Installments table
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "installments" (
          "id" TEXT PRIMARY KEY,
          "contractId" TEXT,
          "installmentNumber" INTEGER,
          "amount" REAL DEFAULT 0,
          "dueDate" DATETIME,
          "paidAmount" REAL DEFAULT 0,
          "paidDate" DATETIME,
          "status" TEXT DEFAULT 'معلق',
          "notes" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "deletedAt" DATETIME
        )
      `
      
      // UnitPartners table
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "unit_partners" (
          "id" TEXT PRIMARY KEY,
          "unitId" TEXT,
          "partnerId" TEXT,
          "percentage" REAL DEFAULT 0,
          "notes" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "deletedAt" DATETIME
        )
      `
      
      // PartnerDebts table
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "partner_debts" (
          "id" TEXT PRIMARY KEY,
          "partnerId" TEXT,
          "amount" REAL DEFAULT 0,
          "dueDate" DATETIME,
          "paidAmount" REAL DEFAULT 0,
          "paidDate" DATETIME,
          "status" TEXT DEFAULT 'معلق',
          "notes" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "deletedAt" DATETIME
        )
      `
      
      // PartnerGroups table
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "partner_groups" (
          "id" TEXT PRIMARY KEY,
          "name" TEXT NOT NULL,
          "description" TEXT,
          "notes" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "deletedAt" DATETIME
        )
      `
      
      // BrokerDues table
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "broker_dues" (
          "id" TEXT PRIMARY KEY,
          "brokerId" TEXT,
          "amount" REAL DEFAULT 0,
          "dueDate" DATETIME,
          "status" TEXT DEFAULT 'معلق',
          "notes" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "deletedAt" DATETIME
        )
      `
      
    } else {
      console.log('🔧 إنشاء جداول PostgreSQL...')
      
      // Users table
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "users" (
          "id" TEXT PRIMARY KEY,
          "username" TEXT NOT NULL UNIQUE,
          "password" TEXT NOT NULL,
          "role" TEXT NOT NULL DEFAULT 'user',
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `
      
      // Customers table
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "customers" (
          "id" TEXT PRIMARY KEY,
          "name" TEXT NOT NULL,
          "phone" TEXT,
          "nationalId" TEXT,
          "address" TEXT,
          "status" TEXT DEFAULT 'نشط',
          "notes" TEXT,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "deletedAt" TIMESTAMP
        )
      `
      
      // Units table
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "units" (
          "id" TEXT PRIMARY KEY,
          "code" TEXT UNIQUE,
          "name" TEXT,
          "unitType" TEXT DEFAULT 'سكني',
          "area" TEXT,
          "floor" TEXT,
          "building" TEXT,
          "totalPrice" DOUBLE PRECISION DEFAULT 0,
          "status" TEXT DEFAULT 'متاحة',
          "notes" TEXT,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "deletedAt" TIMESTAMP
        )
      `
      
      // Partners table
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "partners" (
          "id" TEXT PRIMARY KEY,
          "name" TEXT UNIQUE,
          "phone" TEXT,
          "notes" TEXT,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "deletedAt" TIMESTAMP
        )
      `
      
      // Brokers table
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "brokers" (
          "id" TEXT PRIMARY KEY,
          "name" TEXT UNIQUE,
          "phone" TEXT,
          "notes" TEXT,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "deletedAt" TIMESTAMP
        )
      `
      
      // Safes table
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "safes" (
          "id" TEXT PRIMARY KEY,
          "name" TEXT NOT NULL,
          "balance" DOUBLE PRECISION DEFAULT 0,
          "notes" TEXT,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "deletedAt" TIMESTAMP
        )
      `
      
      // Contracts table
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "contracts" (
          "id" TEXT PRIMARY KEY,
          "contractNumber" TEXT UNIQUE,
          "customerId" TEXT,
          "unitId" TEXT,
          "brokerId" TEXT,
          "contractDate" TIMESTAMP,
          "totalAmount" DOUBLE PRECISION DEFAULT 0,
          "downPayment" DOUBLE PRECISION DEFAULT 0,
          "installmentAmount" DOUBLE PRECISION DEFAULT 0,
          "installmentCount" INTEGER DEFAULT 0,
          "status" TEXT DEFAULT 'نشط',
          "notes" TEXT,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "deletedAt" TIMESTAMP
        )
      `
      
      // Vouchers table
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "vouchers" (
          "id" TEXT PRIMARY KEY,
          "voucherNumber" TEXT UNIQUE,
          "voucherType" TEXT DEFAULT 'قبض',
          "amount" DOUBLE PRECISION DEFAULT 0,
          "description" TEXT,
          "voucherDate" TIMESTAMP,
          "safeId" TEXT,
          "contractId" TEXT,
          "status" TEXT DEFAULT 'نشط',
          "notes" TEXT,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "deletedAt" TIMESTAMP
        )
      `
      
      // Installments table
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "installments" (
          "id" TEXT PRIMARY KEY,
          "contractId" TEXT,
          "installmentNumber" INTEGER,
          "amount" DOUBLE PRECISION DEFAULT 0,
          "dueDate" TIMESTAMP,
          "paidAmount" DOUBLE PRECISION DEFAULT 0,
          "paidDate" TIMESTAMP,
          "status" TEXT DEFAULT 'معلق',
          "notes" TEXT,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "deletedAt" TIMESTAMP
        )
      `
      
      // UnitPartners table
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "unit_partners" (
          "id" TEXT PRIMARY KEY,
          "unitId" TEXT,
          "partnerId" TEXT,
          "percentage" DOUBLE PRECISION DEFAULT 0,
          "notes" TEXT,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "deletedAt" TIMESTAMP
        )
      `
      
      // PartnerDebts table
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "partner_debts" (
          "id" TEXT PRIMARY KEY,
          "partnerId" TEXT,
          "amount" DOUBLE PRECISION DEFAULT 0,
          "dueDate" TIMESTAMP,
          "paidAmount" DOUBLE PRECISION DEFAULT 0,
          "paidDate" TIMESTAMP,
          "status" TEXT DEFAULT 'معلق',
          "notes" TEXT,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "deletedAt" TIMESTAMP
        )
      `
      
      // PartnerGroups table
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "partner_groups" (
          "id" TEXT PRIMARY KEY,
          "name" TEXT NOT NULL,
          "description" TEXT,
          "notes" TEXT,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "deletedAt" TIMESTAMP
        )
      `
      
      // BrokerDues table
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "broker_dues" (
          "id" TEXT PRIMARY KEY,
          "brokerId" TEXT,
          "amount" DOUBLE PRECISION DEFAULT 0,
          "dueDate" TIMESTAMP,
          "status" TEXT DEFAULT 'معلق',
          "notes" TEXT,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "deletedAt" TIMESTAMP
        )
      `
    }
    
    console.log('✅ تم إنشاء جميع الجداول الأساسية بنجاح')
  } catch (error) {
    console.error('❌ خطأ في إنشاء الجداول:', error)
    throw error
  }
}

// Test basic operations
async function testBasicOperations(prisma: PrismaClient) {
  try {
    // Test User table
    const userCount = await prisma.user.count()
    console.log(`👥 عدد المستخدمين: ${userCount}`)

    // Test Customer table
    const customerCount = await prisma.customer.count()
    console.log(`👤 عدد العملاء: ${customerCount}`)

    console.log('✅ تم اختبار العمليات الأساسية بنجاح')
  } catch (error) {
    console.error('❌ خطأ في اختبار العمليات الأساسية:', error)
    throw error
  }
}