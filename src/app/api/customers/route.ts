import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Customer, ApiResponse, PaginatedResponse } from '@/types'
import { validatePhone, validateNationalId, getValidationError } from '@/utils/validation'
import { formatPhone, formatNationalId } from '@/utils/formatting'

// GET /api/customers - Get all customers with pagination and search


export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Build where clause for search
    const where = search ? {
      OR: [
        { name: { contains: search } },
        { phone: { contains: search } },
        { nationalId: { contains: search } },
        { address: { contains: search } }
      ]
    } : {}

    // Get customers with pagination
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          name: true,
          phone: true,
          nationalId: true,
          address: true,
          status: true,
          notes: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.customer.count({ where })
    ])

    const response: PaginatedResponse<Customer> = {
      data: customers.map(customer => ({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        nationalId: customer.nationalId || undefined,
        address: customer.address || undefined,
        status: customer.status,
        notes: customer.notes || undefined
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}

// POST /api/customers - Create new customer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, nationalId, address, status, notes } = body

    // Validation
    if (!name || !phone) {
      return NextResponse.json(
        { success: false, error: 'الاسم ورقم الهاتف مطلوبان' },
        { status: 400 }
      )
    }

    if (!validatePhone(phone)) {
      return NextResponse.json(
        { success: false, error: getValidationError('phone', 'invalid') },
        { status: 400 }
      )
    }

    if (nationalId && !validateNationalId(nationalId)) {
      return NextResponse.json(
        { success: false, error: getValidationError('nationalId', 'invalid') },
        { status: 400 }
      )
    }

    // Check for duplicate phone
    const existingCustomer = await prisma.customer.findUnique({
      where: { phone: formatPhone(phone) }
    })

    if (existingCustomer) {
      return NextResponse.json(
        { success: false, error: 'رقم الهاتف مستخدم بالفعل' },
        { status: 400 }
      )
    }

    // Check for duplicate national ID
    if (nationalId) {
      const existingNationalId = await prisma.customer.findUnique({
        where: { nationalId: formatNationalId(nationalId) }
      })

      if (existingNationalId) {
        return NextResponse.json(
          { success: false, error: 'الرقم القومي مستخدم بالفعل' },
          { status: 400 }
        )
      }
    }

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        phone: formatPhone(phone),
        nationalId: nationalId ? formatNationalId(nationalId) : null,
        address: address?.trim() || null,
        status: status || 'نشط',
        notes: notes?.trim() || null
      }
    })

    const response: ApiResponse<Customer> = {
      success: true,
      data: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        nationalId: customer.nationalId || undefined,
        address: customer.address || undefined,
        status: customer.status,
        notes: customer.notes || undefined
      },
      message: 'تم إضافة العميل بنجاح'
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}