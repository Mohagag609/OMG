import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Unit, ApiResponse } from '@/types'
import { validateUnitCode, getValidationError } from '@/utils/validation'
import { formatUnitCode } from '@/utils/formatting'

// GET /api/units/[id] - Get unit by ID


export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const unit = await prisma.unit.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        code: true,
        name: true,
        unitType: true,
        area: true,
        floor: true,
        building: true,
        totalPrice: true,
        status: true,
        notes: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!unit) {
      return NextResponse.json(
        { success: false, error: 'الوحدة غير موجودة' },
        { status: 404 }
      )
    }

    const response: ApiResponse<Unit> = {
      success: true,
      data: {
        id: unit.id,
        code: unit.code,
        name: unit.name || undefined,
        unitType: unit.unitType,
        area: unit.area || undefined,
        floor: unit.floor || undefined,
        building: unit.building || undefined,
        totalPrice: unit.totalPrice,
        status: unit.status,
        notes: unit.notes || undefined
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching unit:', error)
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
    const body = await request.json()
    const { code, name, unitType, area, floor, building, totalPrice, status, notes } = body

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

    // Validation
    if (!code) {
      return NextResponse.json(
        { success: false, error: 'كود الوحدة مطلوب' },
        { status: 400 }
      )
    }

    if (!validateUnitCode(code)) {
      return NextResponse.json(
        { success: false, error: getValidationError('unitCode', 'invalid') },
        { status: 400 }
      )
    }

    if (totalPrice < 0) {
      return NextResponse.json(
        { success: false, error: 'السعر يجب أن يكون أكبر من أو يساوي صفر' },
        { status: 400 }
      )
    }

    // Check for duplicate code (excluding current unit)
    const duplicateCode = await prisma.unit.findFirst({
      where: {
        code: formatUnitCode(code),
        id: { not: params.id }
      }
    })

    if (duplicateCode) {
      return NextResponse.json(
        { success: false, error: 'كود الوحدة مستخدم بالفعل' },
        { status: 400 }
      )
    }

    // Update unit
    const unit = await prisma.unit.update({
      where: { id: params.id },
      data: {
        code: formatUnitCode(code),
        name: name?.trim() || null,
        unitType: unitType || 'سكني',
        area: area?.trim() || null,
        floor: floor?.trim() || null,
        building: building?.trim() || null,
        totalPrice: totalPrice || 0,
        status: status || 'متاحة',
        notes: notes?.trim() || null
      }
    })

    const response: ApiResponse<Unit> = {
      success: true,
      data: {
        id: unit.id,
        code: unit.code,
        name: unit.name || undefined,
        unitType: unit.unitType,
        area: unit.area || undefined,
        floor: unit.floor || undefined,
        building: unit.building || undefined,
        totalPrice: unit.totalPrice,
        status: unit.status,
        notes: unit.notes || undefined
      },
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
    // Check if unit exists
    const existingUnit = await prisma.unit.findUnique({
      where: { id: params.id },
      include: {
        contracts: true
      }
    })

    if (!existingUnit) {
      return NextResponse.json(
        { success: false, error: 'الوحدة غير موجودة' },
        { status: 404 }
      )
    }

    // Check if unit has contracts
    if (existingUnit.contracts.length > 0) {
      return NextResponse.json(
        { success: false, error: 'لا يمكن حذف هذه الوحدة لأنها مرتبطة بعقد قائم. يجب حذف العقد أولاً.' },
        { status: 400 }
      )
    }

    // Soft delete unit
    await prisma.unit.update({
      where: { id: params.id },
      data: { deletedAt: new Date() }
    })

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