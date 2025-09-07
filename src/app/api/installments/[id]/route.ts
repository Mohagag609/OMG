import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Installment, Voucher, ApiResponse } from '@/types'
import { validateAmount, getValidationError } from '@/utils/validation'
import { calculateInstallmentStatus } from '@/utils/calculations'

// GET /api/installments/[id] - Get installment by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const installment = await prisma.installment.findUnique({
      where: { id: params.id },
      include: {
        unit: {
          select: {
            id: true,
            code: true,
            name: true
          }
        }
      }
    })

    if (!installment) {
      return NextResponse.json(
        { success: false, error: 'القسط غير موجود' },
        { status: 404 }
      )
    }

    // Get vouchers for status calculation
    const vouchers = await prisma.voucher.findMany({
      where: {
        type: 'receipt',
        linkedRef: installment.unitId
      }
    })

    // Convert installment to match Installment interface
    const installmentData: Installment = {
      id: installment.id,
      unitId: installment.unitId,
      amount: installment.amount,
      dueDate: installment.dueDate.toISOString().split('T')[0],
      status: installment.status,
      notes: installment.notes || undefined
    }

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

    const response: ApiResponse<Installment> = {
      success: true,
      data: {
        ...installmentData,
        status: calculateInstallmentStatus(installmentData, vouchersData)
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching installment:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}

// PUT /api/installments/[id] - Update installment
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { amount, dueDate, status, notes } = body

    // Check if installment exists
    const existingInstallment = await prisma.installment.findUnique({
      where: { id: params.id }
    })

    if (!existingInstallment) {
      return NextResponse.json(
        { success: false, error: 'القسط غير موجود' },
        { status: 404 }
      )
    }

    // Validation
    if (amount !== undefined && !validateAmount(amount)) {
      return NextResponse.json(
        { success: false, error: getValidationError('amount', 'invalid') },
        { status: 400 }
      )
    }

    // Check if due date is in the future (if provided)
    if (dueDate) {
      const dueDateObj = new Date(dueDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (dueDateObj < today) {
        return NextResponse.json(
          { success: false, error: 'تاريخ الاستحقاق يجب أن يكون في المستقبل' },
          { status: 400 }
        )
      }
    }

    // Update installment
    const installment = await prisma.installment.update({
      where: { id: params.id },
      data: {
        amount: amount !== undefined ? amount : existingInstallment.amount,
        dueDate: dueDate ? new Date(dueDate) : existingInstallment.dueDate,
        status: status || existingInstallment.status,
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
      message: 'تم تحديث القسط بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error updating installment:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}

// DELETE /api/installments/[id] - Delete installment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if installment exists
    const existingInstallment = await prisma.installment.findUnique({
      where: { id: params.id }
    })

    if (!existingInstallment) {
      return NextResponse.json(
        { success: false, error: 'القسط غير موجود' },
        { status: 404 }
      )
    }

    // Soft delete installment
    await prisma.installment.update({
      where: { id: params.id },
      data: { deletedAt: new Date() }
    })

    const response: ApiResponse = {
      success: true,
      message: 'تم حذف القسط بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error deleting installment:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}