import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Customer, ApiResponse } from '@/types'
import { validatePhone, validateNationalId, getValidationError } from '@/utils/validation'
import { formatPhone, formatNationalId } from '@/utils/formatting'

// GET /api/customers/[id] - Get customer by ID


export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        phone: true,
        nationalId: true,
        address: true,
        status: true,
        notes: true,
        createdAt: true,
        updatedAt: true
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
      data: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        nationalId: customer.nationalId || undefined,
        address: customer.address || undefined,
        status: customer.status,
        notes: customer.notes || undefined
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching customer:', error)
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
    const body = await request.json()
    const { name, phone, nationalId, address, status, notes } = body

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

    // Validation
    if (!name || !phone) {
      return NextResponse.json(
        { success: false, error: 'الاسم ورقم الهاتف مطلوبان' },
        { status: 400 }
      )
    }

    if (!validatePhone(phone)) {
      return NextResponse.json(
        { success: false, error: getValidationError('phone', 'invalid') },
        { status: 400 }
      )
    }

    if (nationalId && !validateNationalId(nationalId)) {
      return NextResponse.json(
        { success: false, error: getValidationError('nationalId', 'invalid') },
        { status: 400 }
      )
    }

    // Check for duplicate phone (excluding current customer)
    const duplicatePhone = await prisma.customer.findFirst({
      where: {
        phone: formatPhone(phone),
        id: { not: params.id }
      }
    })

    if (duplicatePhone) {
      return NextResponse.json(
        { success: false, error: 'رقم الهاتف مستخدم بالفعل' },
        { status: 400 }
      )
    }

    // Check for duplicate national ID (excluding current customer)
    if (nationalId) {
      const duplicateNationalId = await prisma.customer.findFirst({
        where: {
          nationalId: formatNationalId(nationalId),
          id: { not: params.id }
        }
      })

      if (duplicateNationalId) {
        return NextResponse.json(
          { success: false, error: 'الرقم القومي مستخدم بالفعل' },
          { status: 400 }
        )
      }
    }

    // Update customer
    const customer = await prisma.customer.update({
      where: { id: params.id },
      data: {
        name: name.trim(),
        phone: formatPhone(phone),
        nationalId: nationalId ? formatNationalId(nationalId) : null,
        address: address?.trim() || null,
        status: status || 'نشط',
        notes: notes?.trim() || null
      }
    })

    const response: ApiResponse<Customer> = {
      success: true,
      data: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        nationalId: customer.nationalId || undefined,
        address: customer.address || undefined,
        status: customer.status,
        notes: customer.notes || undefined
      },
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
    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        contracts: true
      }
    })

    if (!existingCustomer) {
      return NextResponse.json(
        { success: false, error: 'العميل غير موجود' },
        { status: 404 }
      )
    }

    // Check if customer has contracts
    if (existingCustomer.contracts.length > 0) {
      return NextResponse.json(
        { success: false, error: 'لا يمكن حذف هذا العميل لأنه مرتبط بعقود قائمة' },
        { status: 400 }
      )
    }

    // Soft delete customer
    await prisma.customer.update({
      where: { id: params.id },
      data: { deletedAt: new Date() }
    })

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