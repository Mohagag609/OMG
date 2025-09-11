import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { ApiResponse, Transfer, PaginatedResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/transfers - Get transfers with pagination
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
        { fromSafe: { name: { contains: search, mode: 'insensitive' } } },
        { toSafe: { name: { contains: search, mode: 'insensitive' } } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    const skip = (page - 1) * limit
    const [transfers, total] = await Promise.all([
      prisma.transfer.findMany({
        where: whereClause,
        include: {
          fromSafe: true,
          toSafe: true
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.transfer.count({ where: whereClause })
    ])

    const totalPages = Math.ceil(total / limit)

    const response: PaginatedResponse<Transfer> = {
      success: true,
      data: transfers,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error getting transfers:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}

// POST /api/transfers - Create new transfer
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
    const { fromSafeId, toSafeId, amount, description } = body

    // Validate required fields
    if (!fromSafeId || !toSafeId || !amount) {
      return NextResponse.json(
        { success: false, error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      )
    }

    if (fromSafeId === toSafeId) {
      return NextResponse.json(
        { success: false, error: 'لا يمكن التحويل من نفس الخزنة إلى نفسها' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'المبلغ يجب أن يكون أكبر من صفر' },
        { status: 400 }
      )
    }

    // Check if safes exist
    const [fromSafe, toSafe] = await Promise.all([
      prisma.safe.findUnique({ where: { id: fromSafeId } }),
      prisma.safe.findUnique({ where: { id: toSafeId } })
    ])

    if (!fromSafe || !toSafe) {
      return NextResponse.json(
        { success: false, error: 'إحدى الخزائن غير موجودة' },
        { status: 400 }
      )
    }

    if (fromSafe.balance < amount) {
      return NextResponse.json(
        { success: false, error: 'الرصيد غير كافي في الخزنة المصدر' },
        { status: 400 }
      )
    }

    // Create transfer and update balances in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create transfer
      const transfer = await tx.transfer.create({
        data: {
          fromSafeId,
          toSafeId,
          amount,
          description: description || `تحويل من ${fromSafe.name} إلى ${toSafe.name}`
        },
        include: {
          fromSafe: true,
          toSafe: true
        }
      })

      // Update balances
      await tx.safe.update({
        where: { id: fromSafeId },
        data: { balance: { decrement: amount } }
      })

      await tx.safe.update({
        where: { id: toSafeId },
        data: { balance: { increment: amount } }
      })

      return transfer
    })

    const response: ApiResponse<Transfer> = {
      success: true,
      data: result,
      message: 'تم إجراء التحويل بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error creating transfer:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}