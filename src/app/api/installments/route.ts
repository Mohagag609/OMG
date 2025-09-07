import { NextRequest, NextResponse } from 'next/server'
import { ensureEnvironmentVariables } from '@/lib/env'
import { ApiResponse, Installment, PaginatedResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/installments - Get installments with pagination
export async function GET(request: NextRequest) {
  let prisma: any = null
  
  try {
    ensureEnvironmentVariables()
    console.log('📋 جاري تحميل الأقساط...')

    // Create Prisma client with environment variables
    const { PrismaClient } = await import('@prisma/client')
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    })

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''

    const whereClause: any = { deletedAt: null }

    if (search) {
      whereClause.OR = [
        { unit: { code: { contains: search, mode: 'insensitive' } } },
        { notes: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (status) {
      whereClause.status = status
    }

    const skip = (page - 1) * limit
    const [installments, total] = await Promise.all([
      prisma.installment.findMany({
        where: whereClause,
        include: {
          unit: true
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.installment.count({ where: whereClause })
    ])

    const totalPages = Math.ceil(total / limit)

    const response: PaginatedResponse<Installment> = {
      success: true,
      data: installments,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    }

    console.log('✅ تم تحميل الأقساط بنجاح:', installments.length)
    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ خطأ في تحميل الأقساط:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  } finally {
    if (prisma) {
      await prisma.$disconnect()
    }
  }
}

// POST /api/installments - Create new installment
export async function POST(request: NextRequest) {
  let prisma: any = null
  
  try {
    ensureEnvironmentVariables()
    console.log('📝 جاري إنشاء قسط جديد...')

    // Create Prisma client with environment variables
    const { PrismaClient } = await import('@prisma/client')
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    })

    const body = await request.json()
    const { unitId, amount, dueDate, status, notes } = body

    // Validation
    if (!unitId || !amount || !dueDate) {
      return NextResponse.json(
        { success: false, error: 'جميع الحقول المطلوبة يجب أن تكون مملوءة' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'المبلغ يجب أن يكون أكبر من صفر' },
        { status: 400 }
      )
    }

    // Check if unit exists
    const unit = await prisma.unit.findUnique({
      where: { id: unitId }
    })

    if (!unit) {
      return NextResponse.json(
        { success: false, error: 'الوحدة غير موجودة' },
        { status: 400 }
      )
    }

    // Create installment
    const installment = await prisma.installment.create({
      data: {
        unitId,
        amount,
        dueDate: new Date(dueDate),
        status: status || 'معلق',
        notes
      },
      include: {
        unit: true
      }
    })

    const response: ApiResponse<Installment> = {
      success: true,
      data: installment,
      message: 'تم إضافة القسط بنجاح'
    }

    console.log('✅ تم إنشاء القسط بنجاح:', installment.id)
    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ خطأ في إنشاء القسط:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  } finally {
    if (prisma) {
      await prisma.$disconnect()
    }
  }
}