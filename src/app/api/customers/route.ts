import { NextRequest, NextResponse } from 'next/server'
import { validateCustomer } from '@/utils/validation'
import { ApiResponse, Customer, PaginatedResponse } from '@/types'
import { ensureEnvironmentVariables } from '@/lib/env'
import { createAdvancedArabicSearch } from '@/utils/arabicSearch'
import { createPrismaClient } from '@/lib/prismaClient'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/customers - Get customers with pagination
export async function GET(request: NextRequest) {
  let prisma: any = null
  try {
    ensureEnvironmentVariables()
    console.log('📋 جاري تحميل العملاء...')

    // Create Prisma client with current database URL
    prisma = await createPrismaClient()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    const whereClause: any = { deletedAt: null }

    if (search) {
      // استخدام البحث المتقدم للعربية
      const searchConditions = createAdvancedArabicSearch(search, ['name', 'phone', 'nationalId', 'address'])
      if (searchConditions.OR) {
        whereClause.OR = searchConditions.OR
      }
    }

    const skip = (page - 1) * limit
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.customer.count({ where: whereClause })
    ])

    const totalPages = Math.ceil(total / limit)

    const response: PaginatedResponse<Customer> = {
      success: true,
      data: customers,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error getting customers:', error)
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

// POST /api/customers - Create new customer
export async function POST(request: NextRequest) {
  let prisma: any = null
  try {
    ensureEnvironmentVariables()
    console.log('➕ جاري إنشاء عميل جديد...')

    // Create Prisma client with current database URL
    prisma = await createPrismaClient()

    const body = await request.json()
    const { name, phone, nationalId, address, status, notes } = body

    // Validate customer data
    const validation = validateCustomer({ name, phone, nationalId, address, status, notes })
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.errors.join(', ') },
        { status: 400 }
      )
    }

    // Check if name already exists
    const existingCustomer = await prisma.customer.findFirst({
      where: { 
        name: name,
        deletedAt: null
      }
    })

    if (existingCustomer) {
      return NextResponse.json(
        { success: false, error: 'اسم العميل مستخدم بالفعل' },
        { status: 400 }
      )
    }

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        name,
        phone,
        nationalId,
        address,
        status: status || 'نشط',
        notes
      }
    })

    const response: ApiResponse<Customer> = {
      success: true,
      data: customer,
      message: 'تم إضافة العميل بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error creating customer:', error)
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