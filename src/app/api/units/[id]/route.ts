import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { validateUnit } from '@/utils/validation'
import { canDeleteEntity, softDeleteEntity } from '@/lib/soft-delete'
import { ApiResponse, Unit } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/units/[id] - Get unit by ID
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

    const unit = await prisma.unit.findUnique({
      where: { id: params.id }
    })

    if (!unit) {
      return NextResponse.json(
        { success: false, error: 'الوحدة غير موجودة' },
        { status: 404 }
      )
    }

    const response: ApiResponse<Unit> = {
      success: true,
      data: unit
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error getting unit:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}

// PUT /api/units/[id] - Update unit
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
    const { code, name, unitType, area, floor, building, totalPrice, status, notes } = body

    // Validate unit data
    const validation = validateUnit({ code, name, unitType, area, floor, building, totalPrice, status, notes })
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.errors.join(', ') },
        { status: 400 }
      )
    }

    // Check if unit exists
    const existingUnit = await prisma.unit.findUnique({
      where: { id: params.id }
    })

    if (!existingUnit) {
      return NextResponse.json(
        { success: false, error: 'الوحدة غير موجودة' },
        { status: 404 }
      )
    }

    // Check if code already exists for another unit
    if (code !== existingUnit.code) {
      const codeExists = await prisma.unit.findUnique({
        where: { code }
      })

      if (codeExists) {
        return NextResponse.json(
          { success: false, error: 'كود الوحدة مستخدم بالفعل' },
          { status: 400 }
        )
      }
    }

    // Update unit
    const unit = await prisma.unit.update({
      where: { id: params.id },
      data: {
        code,
        name,
        unitType,
        area,
        floor,
        building,
        totalPrice,
        status,
        notes
      }
    })

    const response: ApiResponse<Unit> = {
      success: true,
      data: unit,
      message: 'تم تحديث الوحدة بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error updating unit:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}

// DELETE /api/units/[id] - Delete unit
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

    // Check if unit can be deleted
    const canDelete = await canDeleteEntity('unit', params.id)
    if (!canDelete.canDelete) {
      return NextResponse.json(
        { success: false, error: canDelete.reason },
        { status: 400 }
      )
    }

    // Soft delete unit
    const result = await softDeleteEntity('unit', params.id, user.id.toString())
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      )
    }

    const response: ApiResponse = {
      success: true,
      message: 'تم حذف الوحدة بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error deleting unit:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}