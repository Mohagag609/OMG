import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { ApiResponse, Broker, PaginatedResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/brokers - Get brokers with pagination
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
        { phone: { contains: search, mode: 'insensitive' } }
      ]
    }

    const skip = (page - 1) * limit
    const [brokers, total] = await Promise.all([
      prisma.broker.findMany({
        where: whereClause,
        include: {
          brokerDues: {
            where: { deletedAt: null }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.broker.count({ where: whereClause })
    ])

    const totalPages = Math.ceil(total / limit)

    const response: PaginatedResponse<Broker> = {
      success: true,
      data: brokers,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error getting brokers:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}

// POST /api/brokers - Create new broker
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
    const { name, phone, notes } = body

    // Validation
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'اسم السمسار مطلوب' },
        { status: 400 }
      )
    }

    // Check if broker name already exists
    const existingBroker = await prisma.broker.findUnique({
      where: { name }
    })

    if (existingBroker) {
      return NextResponse.json(
        { success: false, error: 'اسم السمسار مستخدم بالفعل' },
        { status: 400 }
      )
    }

    // Create broker
    const broker = await prisma.broker.create({
      data: {
        name,
        phone,
        notes
      }
    })

    const response: ApiResponse<Broker> = {
      success: true,
      data: broker,
      message: 'تم إضافة السمسار بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error creating broker:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}