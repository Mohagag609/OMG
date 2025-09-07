import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import { ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/database/reset - Reset database
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'غير مخول للوصول' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const user = await getUserFromToken(token)
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مخول للوصول' },
        { status: 401 }
      )
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'هذا الإجراء مخصص للمديرين فقط' },
        { status: 403 }
      )
    }

    // Reset database
    const resetResult = await resetDatabase()

    if (resetResult.success) {
      const response: ApiResponse<any> = {
        success: true,
        data: {
          resetAt: new Date().toISOString(),
          message: 'تم إعادة تهيئة قاعدة البيانات بنجاح'
        },
        message: 'تم إعادة تهيئة قاعدة البيانات وإضافة البيانات التجريبية بنجاح'
      }
      return NextResponse.json(response)
    } else {
      return NextResponse.json(
        { success: false, error: resetResult.error || 'فشل في إعادة تهيئة قاعدة البيانات' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error resetting database:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في إعادة تهيئة قاعدة البيانات' },
      { status: 500 }
    )
  }
}

// Function to reset database
async function resetDatabase(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🔄 بدء إعادة تهيئة قاعدة البيانات...')

    // Import Prisma client
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    // Disconnect current connection
    await prisma.$disconnect()

    // Reset database using Prisma
    const { execSync } = await import('child_process')
    
    // Set environment variable for user consent
    const userConsent = "تطوير عادي مش هاممني البيانات"
    
    // Reset database
    execSync(`PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="${userConsent}" npx prisma db push --force-reset`, {
      stdio: 'pipe',
      cwd: process.cwd()
    })

    console.log('✅ تم إعادة تهيئة قاعدة البيانات')

    // Reconnect and seed database
    const newPrisma = new PrismaClient()
    
    // Create default users
    const bcrypt = await import('bcryptjs')
    
    // Create admin user
    await newPrisma.user.upsert({
      where: { username: 'admin' },
      update: { password: await bcrypt.hash('admin123', 12) },
      create: {
        username: 'admin',
        password: await bcrypt.hash('admin123', 12),
        email: 'admin@example.com',
        fullName: 'مدير النظام',
        role: 'admin'
      }
    })
    
    // Create regular user
    await newPrisma.user.upsert({
      where: { username: 'user' },
      update: { password: await bcrypt.hash('user123', 12) },
      create: {
        username: 'user',
        password: await bcrypt.hash('user123', 12),
        email: 'user@example.com',
        fullName: 'مستخدم عادي',
        role: 'user'
      }
    })

    // Create default safe
    await newPrisma.safe.upsert({
      where: { name: 'الخزنة الرئيسية' },
      update: {},
      create: {
        name: 'الخزنة الرئيسية',
        balance: 0
      }
    })

    // Create sample customer
    await newPrisma.customer.upsert({
      where: { nationalId: '12345678901234' },
      update: {},
      create: {
        name: 'أحمد محمد علي',
        phone: '01012345678',
        nationalId: '12345678901234',
        address: 'القاهرة، مصر',
        status: 'نشط',
        notes: 'عميل تجريبي'
      }
    })

    // Create sample unit
    await newPrisma.unit.upsert({
      where: { code: 'A-101' },
      update: {},
      create: {
        code: 'A-101',
        name: 'شقة 101',
        unitType: 'سكني',
        area: '120 متر مربع',
        floor: 'الطابق الأول',
        building: 'المبنى أ',
        totalPrice: 500000,
        status: 'متاحة',
        notes: 'وحدة تجريبية'
      }
    })

    // Create sample partner
    await newPrisma.partner.upsert({
      where: { name: 'محمد أحمد' },
      update: {},
      create: {
        name: 'محمد أحمد',
        phone: '01087654321',
        notes: 'شريك تجريبي'
      }
    })

    // Create sample broker
    await newPrisma.broker.upsert({
      where: { name: 'علي حسن' },
      update: {},
      create: {
        name: 'علي حسن',
        phone: '01011111111',
        notes: 'وسيط تجريبي'
      }
    })

    await newPrisma.$disconnect()

    console.log('✅ تم إضافة البيانات التجريبية بنجاح')
    
    return { success: true }
  } catch (error: any) {
    console.error('❌ خطأ في إعادة تهيئة قاعدة البيانات:', error)
    return { 
      success: false, 
      error: error.message || 'فشل في إعادة تهيئة قاعدة البيانات' 
    }
  }
}