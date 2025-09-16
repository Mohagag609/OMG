import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { validateContract } from '@/utils/validation'
import { canDeleteEntity, softDeleteEntity } from '@/lib/soft-delete'
import { ApiResponse, Contract } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/contracts/[id] - Get contract by ID
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

    const contract = await prisma.contract.findUnique({
      where: { id: params.id },
      include: {
        unit: true,
        customer: true
      }
    })

    if (!contract) {
      return NextResponse.json(
        { success: false, error: 'العقد غير موجود' },
        { status: 404 }
      )
    }

    const response: ApiResponse<Contract> = {
      success: true,
      data: contract
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error getting contract:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}

// PUT /api/contracts/[id] - Update contract
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
    const { unitId, customerId, start, totalPrice, discountAmount, brokerName, commissionSafeId, brokerAmount } = body

    // Validate contract data
    const validation = validateContract({ unitId, customerId, start, totalPrice, discountAmount, brokerName, commissionSafeId, brokerAmount })
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.errors.join(', ') },
        { status: 400 }
      )
    }

    // Check if contract exists
    const existingContract = await prisma.contract.findUnique({
      where: { id: params.id }
    })

    if (!existingContract) {
      return NextResponse.json(
        { success: false, error: 'العقد غير موجود' },
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

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    })

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'العميل غير موجود' },
        { status: 400 }
      )
    }

    // Update contract
    const contract = await prisma.contract.update({
      where: { id: params.id },
      data: {
        unitId,
        customerId,
        start: new Date(start),
        totalPrice,
        discountAmount,
        brokerName,
        commissionSafeId,
        brokerAmount
      },
      include: {
        unit: true,
        customer: true
      }
    })

    const response: ApiResponse<Contract> = {
      success: true,
      data: contract,
      message: 'تم تحديث العقد بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error updating contract:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}

// DELETE /api/contracts/[id] - Delete contract
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

    // Check if contract can be deleted
    const canDelete = await canDeleteEntity('contract', params.id)
    if (!canDelete.canDelete) {
      return NextResponse.json(
        { success: false, error: canDelete.reason },
        { status: 400 }
      )
    }

    // Get contract to update unit status
    const contract = await prisma.contract.findUnique({
      where: { id: params.id }
    })

    if (!contract) {
      return NextResponse.json(
        { success: false, error: 'العقد غير موجود' },
        { status: 404 }
      )
    }

    // Soft delete contract
    const result = await softDeleteEntity('contract', params.id, user.id.toString())
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      )
    }

    // Update unit status back to available
    await prisma.unit.update({
      where: { id: contract.unitId },
      data: { status: 'متاحة' }
    })

    const response: ApiResponse = {
      success: true,
      message: 'تم حذف العقد بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error deleting contract:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}