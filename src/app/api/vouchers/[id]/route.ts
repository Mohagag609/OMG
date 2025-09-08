import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { softDeleteEntity } from '@/lib/soft-delete'
import { ApiResponse, Voucher } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/vouchers/[id] - Get voucher by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const voucher = await prisma.voucher.findUnique({
      where: { id: params.id }
    })

    if (!voucher) {
      return NextResponse.json(
        { success: false, error: 'السند غير موجود' },
        { status: 404 }
      )
    }

    const response: ApiResponse<Voucher> = {
      success: true,
      data: voucher
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error getting voucher:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}

// PUT /api/vouchers/[id] - Update voucher
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { type, date, amount, safeId, description, payer, beneficiary, linkedRef } = body

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

    // Check if voucher exists
    const existingVoucher = await prisma.voucher.findUnique({
      where: { id: params.id }
    })

    if (!existingVoucher) {
      return NextResponse.json(
        { success: false, error: 'السند غير موجود' },
        { status: 404 }
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
    if (linkedRef) {
      const unit = await prisma.unit.findUnique({
        where: { id: linkedRef }
      })

      if (!unit) {
        return NextResponse.json(
          { success: false, error: 'الوحدة المرتبطة غير موجودة' },
          { status: 400 }
        )
      }
    }

    // Update voucher
    const voucher = await prisma.voucher.update({
      where: { id: params.id },
      data: {
        type,
        date: new Date(date),
        amount,
        safeId,
        description,
        payer,
        beneficiary,
        linkedRef
      }
    })

    // Update safe balance (reverse old transaction and apply new one)
    const oldBalanceChange = existingVoucher.type === 'receipt' ? -existingVoucher.amount : existingVoucher.amount
    const newBalanceChange = type === 'receipt' ? amount : -amount
    const totalBalanceChange = oldBalanceChange + newBalanceChange

    await prisma.safe.update({
      where: { id: safeId },
      data: { balance: { increment: totalBalanceChange } }
    })

    const response: ApiResponse<Voucher> = {
      success: true,
      data: voucher,
      message: 'تم تحديث السند بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error updating voucher:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}

// DELETE /api/vouchers/[id] - Delete voucher
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get voucher to update safe balance
    const voucher = await prisma.voucher.findUnique({
      where: { id: params.id }
    })

    if (!voucher) {
      return NextResponse.json(
        { success: false, error: 'السند غير موجود' },
        { status: 404 }
      )
    }

    // Soft delete voucher
    const result = await softDeleteEntity('voucher', params.id, user.id.toString())
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      )
    }

    // Update safe balance (reverse the transaction)
    const balanceChange = voucher.type === 'receipt' ? -voucher.amount : voucher.amount
    await prisma.safe.update({
      where: { id: voucher.safeId },
      data: { balance: { increment: balanceChange } }
    })

    const response: ApiResponse = {
      success: true,
      message: 'تم حذف السند بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error deleting voucher:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}