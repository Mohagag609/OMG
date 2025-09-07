import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/database/reset-simple - Simple database reset without auth
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 بدء إعادة تهيئة قاعدة البيانات البسيطة...')

    // Set environment variables
    process.env.DATABASE_URL = "postgresql://neondb_owner:npg_ZBrYxkMEL91f@ep-mute-violet-ad0dmo9y-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    process.env.JWT_SECRET = "estate-management-development-secret-key"

    // Import and create Prisma client
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    try {
      // Delete all data from all tables
      await prisma.$transaction([
        prisma.contract.deleteMany(),
        prisma.customer.deleteMany(),
        prisma.unit.deleteMany(),
        prisma.partner.deleteMany(),
        prisma.broker.deleteMany(),
        prisma.safe.deleteMany(),
        prisma.user.deleteMany(),
      ])
      
      console.log('✅ تم حذف جميع البيانات بنجاح')

      // Create default users
      const bcrypt = await import('bcryptjs')
      
      // Create admin user
      await prisma.user.create({
        data: {
          username: 'admin',
          password: await bcrypt.hash('admin123', 12),
          email: 'admin@example.com',
          fullName: 'مدير النظام',
          role: 'admin',
          isActive: true
        }
      })
      
      // Create regular user
      await prisma.user.create({
        data: {
          username: 'user',
          password: await bcrypt.hash('user123', 12),
          email: 'user@example.com',
          fullName: 'مستخدم عادي',
          role: 'user',
          isActive: true
        }
      })

      // Create default safe
      await prisma.safe.create({
        data: {
          name: 'الخزنة الرئيسية',
          balance: 0
        }
      })

      // Create sample customer
      await prisma.customer.create({
        data: {
          name: 'أحمد محمد علي',
          phone: '01012345678',
          nationalId: '12345678901234',
          address: 'القاهرة، مصر',
          status: 'نشط',
          notes: 'عميل تجريبي'
        }
      })

      // Create sample unit
      await prisma.unit.create({
        data: {
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
      await prisma.partner.create({
        data: {
          name: 'محمد أحمد',
          phone: '01087654321',
          notes: 'شريك تجريبي'
        }
      })

      // Create sample broker
      await prisma.broker.create({
        data: {
          name: 'علي حسن',
          phone: '01011111111',
          notes: 'وسيط تجريبي'
        }
      })

      console.log('✅ تم إضافة البيانات التجريبية بنجاح')

      const response: ApiResponse<any> = {
        success: true,
        data: {
          resetAt: new Date().toISOString(),
          message: 'تم إعادة تهيئة قاعدة البيانات بنجاح'
        },
        message: 'تم إعادة تهيئة قاعدة البيانات وإضافة البيانات التجريبية بنجاح'
      }
      return NextResponse.json(response)

    } catch (error: any) {
      console.error('❌ خطأ في إعادة تهيئة قاعدة البيانات:', error)
      return NextResponse.json(
        { success: false, error: error.message || 'فشل في إعادة تهيئة قاعدة البيانات' },
        { status: 500 }
      )
    } finally {
      await prisma.$disconnect()
    }

  } catch (error) {
    console.error('Error resetting database:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في إعادة تهيئة قاعدة البيانات' },
      { status: 500 }
    )
  }
}