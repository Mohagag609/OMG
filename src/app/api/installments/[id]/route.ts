import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { softDeleteEntity } from '@/lib/soft-delete'
import { ApiResponse, Installment } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/installments/[id] - Get installment by ID
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

    const installment = await prisma.installment.findUnique({
      where: { id: params.id },
      include: {
        unit: true
      }
    })

    if (!installment) {
      return NextResponse.json(
        { success: false, error: 'القسط غير موجود' },
        { status: 404 }
      )
    }

    const response: ApiResponse<Installment> = {
      success: true,
      data: installment
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error getting installment:', error)
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
    const { unitId, amount, dueDate, status, notes } = body

    // Validation
    if (!unitId || !amount || !dueDate) {
      return NextResponse.json(
        { success: false, error: 'جميع الحقول المطلوبة يجب أن تكون مملوءة' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'المبلغ يجب أن يكون أكبر من صفر' },
        { status: 400 }
      )
    }

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

    // Update installment
    const installment = await prisma.installment.update({
      where: { id: params.id },
      data: {
        unitId,
        amount,
        dueDate: new Date(dueDate),
        status,
        notes
      },
      include: {
        unit: true
      }
    })

    const response: ApiResponse<Installment> = {
      success: true,
      data: installment,
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

    // Soft delete installment
    const result = await softDeleteEntity('installment', params.id, user.id.toString())
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      )
    }

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