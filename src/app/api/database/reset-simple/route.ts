import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { ApiResponse } from '@/types'
import { getCurrentDatabaseUrl, updateConnectionStatus } from '@/lib/databaseConfig'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/database/reset-simple - Reset database completely
export async function POST(request: NextRequest) {
  let prisma: any = null
  
  try {
    console.log('🔄 بدء إعادة تهيئة قاعدة البيانات...')

    // Get current database URL
    const databaseUrl = getCurrentDatabaseUrl()
    if (!databaseUrl) {
      return NextResponse.json(
        { success: false, error: 'رابط قاعدة البيانات غير محدد' },
        { status: 400 }
      )
    }

    // Set environment variables
    process.env.DATABASE_URL = databaseUrl
    process.env.JWT_SECRET = 'your-super-secret-jwt-key-2024'
    console.log('🔧 تم تعيين متغيرات البيئة')

    // Create Prisma client
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl
        }
      }
    })

    // Connect to database
    await prisma.$connect()
    console.log('🔌 تم الاتصال بقاعدة البيانات')

    // Reset database directly
    await resetDatabaseDirectly(prisma)
    console.log('✅ تم إعادة تهيئة قاعدة البيانات')

    // Update connection status
    updateConnectionStatus(true, {
      message: 'تم إعادة تهيئة قاعدة البيانات بنجاح',
      lastReset: new Date().toISOString()
    })

    const response: ApiResponse<any> = {
      success: true,
      message: 'تم إعادة تهيئة قاعدة البيانات بنجاح',
      data: {
        resetAt: new Date().toISOString(),
        databaseUrl: databaseUrl
      }
    }

    console.log('🎉 تم إعادة تهيئة قاعدة البيانات بنجاح!')
    return NextResponse.json(response)

  } catch (error: any) {
    console.error('❌ خطأ في إعادة تهيئة قاعدة البيانات:', error)
    
    // Update connection status as failed
    updateConnectionStatus(false, {
      error: error.message,
      lastReset: new Date().toISOString()
    })

    return NextResponse.json(
      { 
        success: false, 
        error: `خطأ في إعادة تهيئة قاعدة البيانات: ${error.message}`,
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

// Reset database directly using Prisma
async function resetDatabaseDirectly(prisma: PrismaClient) {
  try {
    console.log('🗑️ بدء حذف البيانات...')

    // Delete all data in correct order (respecting foreign keys)
    await prisma.$transaction(async (tx: any) => {
      // Delete dependent tables first
      await tx.installment.deleteMany()
      await tx.voucher.deleteMany()
      await tx.contract.deleteMany()
      await tx.unitPartner.deleteMany()
      await tx.partnerDebt.deleteMany()
      await tx.safe.deleteMany()
      
      // Delete main tables
      await tx.unit.deleteMany()
      await tx.partner.deleteMany()
      await tx.broker.deleteMany()
      await tx.customer.deleteMany()
      
      // Keep users for login
      console.log('👥 الاحتفاظ بالمستخدمين للدخول')
    })

    console.log('✅ تم حذف البيانات بنجاح')

    // Create default users
    await createDefaultUsers(prisma)
    console.log('✅ تم إنشاء المستخدمين الافتراضيين')

    // Create sample data
    await createSampleData(prisma)
    console.log('✅ تم إنشاء البيانات التجريبية')

  } catch (error) {
    console.error('❌ خطأ في إعادة تهيئة قاعدة البيانات:', error)
    throw error
  }
}

// Create default users
async function createDefaultUsers(prisma: PrismaClient) {
  try {
    const bcrypt = require('bcryptjs')
    
    // Check if admin exists
    const existingAdmin = await prisma.user.findFirst({
      where: { username: 'admin' }
    })
    
    if (!existingAdmin) {
      await prisma.user.create({
        data: {
          username: 'admin',
          password: await bcrypt.hash('admin123', 10),
          role: 'admin'
        }
      })
      console.log('✅ تم إنشاء مستخدم admin')
    }

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: { username: 'user' }
    })
    
    if (!existingUser) {
      await prisma.user.create({
        data: {
          username: 'user',
          password: await bcrypt.hash('user123', 10),
          role: 'user'
        }
      })
      console.log('✅ تم إنشاء مستخدم user')
    }

  } catch (error) {
    console.error('❌ خطأ في إنشاء المستخدمين الافتراضيين:', error)
    throw error
  }
}

// Create sample data
async function createSampleData(prisma: PrismaClient) {
  try {
    // Create sample customer
    const existingCustomer = await prisma.customer.findFirst({
      where: { name: 'عميل تجريبي' }
    })
    
    if (!existingCustomer) {
      await prisma.customer.create({
        data: {
          name: 'عميل تجريبي',
          phone: '01234567890',
          address: 'عنوان تجريبي'
        }
      })
      console.log('✅ تم إنشاء عميل تجريبي')
    }

    // Create sample broker
    const existingBroker = await prisma.broker.findFirst({
      where: { name: 'وسيط تجريبي' }
    })
    
    if (!existingBroker) {
      await prisma.broker.create({
        data: {
          name: 'وسيط تجريبي',
          phone: '01234567891',
          notes: 'وسيط تجريبي للاختبار'
        }
      })
      console.log('✅ تم إنشاء وسيط تجريبي')
    }

  } catch (error) {
    console.error('❌ خطأ في إنشاء البيانات التجريبية:', error)
    throw error
  }
}