import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { validateCustomer } from '@/utils/validation'
import { ApiResponse, Customer, PaginatedResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/customers - Get customers with pagination
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    let whereClause: any = { deletedAt: null }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { nationalId: { contains: search, mode: 'insensitive' } }
      ]
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
  }
}

// POST /api/customers - Create new customer
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

    // Check if phone already exists (only if phone is provided)
    if (phone && phone.trim()) {
      const existingCustomer = await prisma.customer.findFirst({
        where: { 
          phone,
          deletedAt: null
        }
      })

      if (existingCustomer) {
        return NextResponse.json(
          { success: false, error: 'رقم الهاتف مستخدم بالفعل' },
          { status: 400 }
        )
      }
    }

    // Check if nationalId already exists (only if nationalId is provided)
    if (nationalId && nationalId.trim()) {
      const existingCustomer = await prisma.customer.findFirst({
        where: { 
          nationalId,
          deletedAt: null
        }
      })

      if (existingCustomer) {
        return NextResponse.json(
          { success: false, error: 'الرقم القومي مستخدم بالفعل' },
          { status: 400 }
        )
      }
    }

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        name,
        phone: phone || null,
        nationalId: nationalId || null,
        address: address || null,
        status: status || 'نشط',
        notes: notes || null
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
  }
}