import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { canDeleteEntity, softDeleteEntity } from '@/lib/soft-delete'
import { ApiResponse, Broker } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/brokers/[id] - Get broker by ID
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

    const broker = await prisma.broker.findUnique({
      where: { id: params.id },
      include: {
        brokerDues: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!broker) {
      return NextResponse.json(
        { success: false, error: 'السمسار غير موجود' },
        { status: 404 }
      )
    }

    const response: ApiResponse<Broker> = {
      success: true,
      data: broker
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error getting broker:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}

// PUT /api/brokers/[id] - Update broker
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
    const { name, phone, notes } = body

    // Validation
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'اسم السمسار مطلوب' },
        { status: 400 }
      )
    }

    // Check if broker exists
    const existingBroker = await prisma.broker.findUnique({
      where: { id: params.id }
    })

    if (!existingBroker) {
      return NextResponse.json(
        { success: false, error: 'السمسار غير موجود' },
        { status: 404 }
      )
    }

    // Check if broker name already exists for another broker
    if (name !== existingBroker.name) {
      const nameExists = await prisma.broker.findUnique({
        where: { name }
      })

      if (nameExists) {
        return NextResponse.json(
          { success: false, error: 'اسم السمسار مستخدم بالفعل' },
          { status: 400 }
        )
      }
    }

    // Update broker
    const broker = await prisma.broker.update({
      where: { id: params.id },
      data: {
        name,
        phone,
        notes
      }
    })

    const response: ApiResponse<Broker> = {
      success: true,
      data: broker,
      message: 'تم تحديث السمسار بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error updating broker:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}

// DELETE /api/brokers/[id] - Delete broker
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

    // Check if broker can be deleted
    const canDelete = await canDeleteEntity('broker', params.id)
    if (!canDelete.canDelete) {
      return NextResponse.json(
        { success: false, error: canDelete.reason },
        { status: 400 }
      )
    }

    // Soft delete broker
    const result = await softDeleteEntity('broker', params.id, user.id.toString())
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      )
    }

    const response: ApiResponse = {
      success: true,
      message: 'تم حذف السمسار بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error deleting broker:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}