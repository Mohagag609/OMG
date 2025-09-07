import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { validateCustomer } from '@/utils/validation'
import { canDeleteEntity, softDeleteEntity } from '@/lib/soft-delete'
import { ApiResponse, Customer } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/customers/[id] - Get customer by ID
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

    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        contracts: {
          where: { deletedAt: null },
          include: {
            unit: true
          }
        }
      }
    })

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'العميل غير موجود' },
        { status: 404 }
      )
    }

    const response: ApiResponse<Customer> = {
      success: true,
      data: customer
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error getting customer:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}

// PUT /api/customers/[id] - Update customer
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
    const { name, phone, nationalId, address, status, notes } = body

    // Validate customer data
    const validation = validateCustomer({ name, phone, nationalId, address, status, notes })
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.errors.join(', ') },
        { status: 400 }
      )
    }

    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: params.id }
    })

    if (!existingCustomer) {
      return NextResponse.json(
        { success: false, error: 'العميل غير موجود' },
        { status: 404 }
      )
    }

    // Check if name already exists for another customer
    if (name !== existingCustomer.name) {
      const nameExists = await prisma.customer.findFirst({
        where: { 
          name: name,
          deletedAt: null,
          id: { not: params.id }
        }
      })

      if (nameExists) {
        return NextResponse.json(
          { success: false, error: 'اسم العميل مستخدم بالفعل' },
          { status: 400 }
        )
      }
    }

    // Update customer
    const customer = await prisma.customer.update({
      where: { id: params.id },
      data: {
        name,
        phone,
        nationalId,
        address,
        status,
        notes
      }
    })

    const response: ApiResponse<Customer> = {
      success: true,
      data: customer,
      message: 'تم تحديث العميل بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}

// DELETE /api/customers/[id] - Delete customer
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

    // Check if customer can be deleted
    const canDelete = await canDeleteEntity('customer', params.id)
    if (!canDelete.canDelete) {
      return NextResponse.json(
        { success: false, error: canDelete.reason },
        { status: 400 }
      )
    }

    // Soft delete customer
    const result = await softDeleteEntity('customer', params.id, user.id.toString())
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      )
    }

    const response: ApiResponse = {
      success: true,
      message: 'تم حذف العميل بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}