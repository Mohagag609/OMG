import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { ApiResponse, PartnerDebt, PaginatedResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/partner-debts - Get partner debts with pagination
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
    const partnerId = searchParams.get('partnerId')

    const whereClause: any = { deletedAt: null }

    if (partnerId) {
      whereClause.partnerId = partnerId
    }

    if (search) {
      whereClause.OR = [
        { partner: { name: { contains: search, mode: 'insensitive' } } },
        { status: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } }
      ]
    }

    const skip = (page - 1) * limit
    const [partnerDebts, total] = await Promise.all([
      prisma.partnerDebt.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.partnerDebt.count({ where: whereClause })
    ])

    const totalPages = Math.ceil(total / limit)

    const response: PaginatedResponse<PartnerDebt> = {
      success: true,
      data: partnerDebts,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error getting partner debts:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}

// POST /api/partner-debts - Create new partner debt
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
    const { partnerId, amount, dueDate, notes } = body

    // Validation
    if (!partnerId || !amount || !dueDate) {
      return NextResponse.json(
        { success: false, error: 'الشريك والمبلغ وتاريخ الاستحقاق مطلوبة' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'المبلغ يجب أن يكون أكبر من صفر' },
        { status: 400 }
      )
    }

    // Check if partner exists
    const partner = await prisma.partner.findUnique({
      where: { id: partnerId }
    })

    if (!partner) {
      return NextResponse.json(
        { success: false, error: 'الشريك غير موجود' },
        { status: 400 }
      )
    }

    // Create partner debt
    const partnerDebt = await prisma.partnerDebt.create({
      data: {
        partnerId,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        notes: notes || null,
        status: 'غير مدفوع'
      }
    })

    const response: ApiResponse<PartnerDebt> = {
      success: true,
      data: partnerDebt,
      message: 'تم إضافة دين الشريك بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error creating partner debt:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}