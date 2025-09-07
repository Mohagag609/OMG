import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Installment, Voucher, ApiResponse, PaginatedResponse } from '@/types'
import { validateAmount, getValidationError } from '@/utils/validation'
import { calculateInstallmentStatus } from '@/utils/calculations'

// GET /api/installments - Get all installments with pagination and search

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const sortBy = searchParams.get('sortBy') || 'dueDate'
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    const skip = (page - 1) * limit

    // Build where clause for filters
    const where: any = {}
    
    if (search) {
      where.OR = [
        { notes: { contains: search } },
        { unit: { code: { contains: search } } },
        { unit: { name: { contains: search } } }
      ]
    }
    
    if (status) where.status = status

    // Get installments with pagination
    const [installments, total] = await Promise.all([
      prisma.installment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          unit: {
            select: {
              id: true,
              code: true,
              name: true
            }
          }
        }
      }),
      prisma.installment.count({ where })
    ])

    // Get vouchers for status calculation
    const vouchers = await prisma.voucher.findMany({
      where: {
        type: 'receipt',
        linkedRef: { in: installments.map(i => i.unitId) }
      }
    })

    // Convert vouchers to match Voucher interface
    const vouchersData: Voucher[] = vouchers.map(voucher => ({
      id: voucher.id,
      type: voucher.type as 'receipt' | 'payment',
      date: voucher.date.toISOString(),
      amount: voucher.amount,
      safeId: voucher.safeId,
      description: voucher.description,
      payer: voucher.payer || undefined,
      beneficiary: voucher.beneficiary || undefined,
      linked_ref: voucher.linkedRef || undefined
    }))

    const response: PaginatedResponse<Installment> = {
      data: installments.map(installment => {
        const installmentData: Installment = {
          id: installment.id,
          unitId: installment.unitId,
          amount: installment.amount,
          dueDate: installment.dueDate.toISOString().split('T')[0],
          status: installment.status,
          notes: installment.notes || undefined
        }
        return {
          ...installmentData,
          status: calculateInstallmentStatus(installmentData, vouchersData)
        }
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching installments:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}

// POST /api/installments - Create new installment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { unitId, amount, dueDate, status, notes } = body

    // Validation
    if (!unitId || !amount || !dueDate) {
      return NextResponse.json(
        { success: false, error: 'معرف الوحدة والمبلغ وتاريخ الاستحقاق مطلوبة' },
        { status: 400 }
      )
    }

    if (!validateAmount(amount)) {
      return NextResponse.json(
        { success: false, error: getValidationError('amount', 'invalid') },
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

    // Check if due date is in the future
    const dueDateObj = new Date(dueDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (dueDateObj < today) {
      return NextResponse.json(
        { success: false, error: 'تاريخ الاستحقاق يجب أن يكون في المستقبل' },
        { status: 400 }
      )
    }

    // Create installment
    const installment = await prisma.installment.create({
      data: {
        unitId,
        amount,
        dueDate: dueDateObj,
        status: status || 'معلق',
        notes: notes?.trim() || null
      }
    })

    const response: ApiResponse<Installment> = {
      success: true,
      data: {
        id: installment.id,
        unitId: installment.unitId,
        amount: installment.amount,
        dueDate: installment.dueDate.toISOString().split('T')[0],
        status: installment.status,
        notes: installment.notes || undefined
      },
      message: 'تم إضافة القسط بنجاح'
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error creating installment:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}