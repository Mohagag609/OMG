import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { ApiResponse, Voucher, PaginatedResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/vouchers - Get vouchers with pagination
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
    const type = searchParams.get('type') || ''

    let whereClause: any = { deletedAt: null }

    if (search) {
      whereClause.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { payer: { contains: search, mode: 'insensitive' } },
        { beneficiary: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (type) {
      whereClause.type = type
    }

    const skip = (page - 1) * limit
    const [vouchers, total] = await Promise.all([
      prisma.voucher.findMany({
        where: whereClause,
        include: {
          safe: true,
          unit: true
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.voucher.count({ where: whereClause })
    ])

    const totalPages = Math.ceil(total / limit)

    const response: PaginatedResponse<Voucher> = {
      success: true,
      data: vouchers,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error getting vouchers:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}

// POST /api/vouchers - Create new voucher
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
    const { type, date, amount, safeId, description, payer, beneficiary, unitId, contractId } = body

    // Validation
    if (!type || !date || !amount || !safeId || !description) {
      return NextResponse.json(
        { success: false, error: 'جميع الحقول المطلوبة يجب أن تكون مملوءة' },
        { status: 400 }
      )
    }

    if (type !== 'receipt' && type !== 'payment') {
      return NextResponse.json(
        { success: false, error: 'نوع السند يجب أن يكون receipt أو payment' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'المبلغ يجب أن يكون أكبر من صفر' },
        { status: 400 }
      )
    }

    // Check if safe exists
    const safe = await prisma.safe.findUnique({
      where: { id: safeId }
    })

    if (!safe) {
      return NextResponse.json(
        { success: false, error: 'الخزنة غير موجودة' },
        { status: 400 }
      )
    }

    // Check if linked unit exists (if provided)
    if (unitId) {
      const unit = await prisma.unit.findUnique({
        where: { id: unitId }
      })

      if (!unit) {
        return NextResponse.json(
          { success: false, error: 'الوحدة المرتبطة غير موجودة' },
          { status: 400 }
        )
      }
    }

    if (contractId) {
      const contract = await prisma.contract.findUnique({
        where: { id: contractId }
      })

      if (!contract) {
        return NextResponse.json(
          { success: false, error: 'العقد المرتبط غير موجود' },
          { status: 400 }
        )
      }
    }

    // Create voucher
    const voucher = await prisma.voucher.create({
      data: {
        type,
        date: new Date(date),
        amount,
        safeId,
        description,
        payer,
        beneficiary,
        unitId,
        contractId
      },
      include: {
        safe: true,
        unit: true
      }
    })

    // Update safe balance
    const balanceChange = type === 'receipt' ? amount : -amount
    await prisma.safe.update({
      where: { id: safeId },
      data: { balance: { increment: balanceChange } }
    })

    const response: ApiResponse<Voucher> = {
      success: true,
      data: voucher,
      message: 'تم إضافة السند بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error creating voucher:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}