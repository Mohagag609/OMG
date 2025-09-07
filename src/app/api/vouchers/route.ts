import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Voucher, ApiResponse, PaginatedResponse } from '@/types'
import { validateAmount, getValidationError } from '@/utils/validation'

// GET /api/vouchers - Get all vouchers with pagination and search


export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || ''
    const sortBy = searchParams.get('sortBy') || 'date'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Build where clause for filters
    const where: any = {}
    
    if (search) {
      where.OR = [
        { description: { contains: search } },
        { payer: { contains: search } },
        { beneficiary: { contains: search } }
      ]
    }
    
    if (type) where.type = type

    // Get vouchers with pagination
    const [vouchers, total] = await Promise.all([
      prisma.voucher.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          safe: {
            select: {
              id: true,
              name: true
            }
          },
          unit: {
            select: {
              id: true,
              code: true,
              name: true
            }
          }
        }
      }),
      prisma.voucher.count({ where })
    ])

    const response: PaginatedResponse<Voucher> = {
      data: vouchers.map(voucher => ({
        id: voucher.id,
        type: voucher.type as 'receipt' | 'payment',
        date: voucher.date.toISOString().split('T')[0],
        amount: voucher.amount,
        safeId: voucher.safeId,
        description: voucher.description,
        payer: voucher.payer || undefined,
        beneficiary: voucher.beneficiary || undefined,
        linked_ref: voucher.linkedRef || undefined
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
    console.error('Error fetching vouchers:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}

// POST /api/vouchers - Create new voucher
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, date, amount, safeId, description, payer, beneficiary, linked_ref } = body

    // Validation
    if (!type || !date || !amount || !safeId || !description) {
      return NextResponse.json(
        { success: false, error: 'النوع والتاريخ والمبلغ ومعرف الخزنة والوصف مطلوبة' },
        { status: 400 }
      )
    }

    if (!['receipt', 'payment'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'نوع السند يجب أن يكون receipt أو payment' },
        { status: 400 }
      )
    }

    if (!validateAmount(amount)) {
      return NextResponse.json(
        { success: false, error: getValidationError('amount', 'invalid') },
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
    if (linked_ref) {
      const unit = await prisma.unit.findUnique({
        where: { id: linked_ref }
      })

      if (!unit) {
        return NextResponse.json(
          { success: false, error: 'الوحدة المرتبطة غير موجودة' },
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
        description: description.trim(),
        payer: payer?.trim() || null,
        beneficiary: beneficiary?.trim() || null,
        linkedRef: linked_ref || null
      }
    })

    // Update safe balance
    const balanceChange = type === 'receipt' ? amount : -amount
    await prisma.safe.update({
      where: { id: safeId },
      data: {
        balance: {
          increment: balanceChange
        }
      }
    })

    const response: ApiResponse<Voucher> = {
      success: true,
      data: {
        id: voucher.id,
        type: voucher.type as 'receipt' | 'payment',
        date: voucher.date.toISOString().split('T')[0],
        amount: voucher.amount,
        safeId: voucher.safeId,
        description: voucher.description,
        payer: voucher.payer || undefined,
        beneficiary: voucher.beneficiary || undefined,
        linked_ref: voucher.linkedRef || undefined
      },
      message: 'تم إضافة السند بنجاح'
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error creating voucher:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}