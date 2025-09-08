import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { canDeleteEntity, softDeleteEntity } from '@/lib/soft-delete'
import { ApiResponse, Safe } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/safes/[id] - Get safe by ID
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

    const safe = await prisma.safe.findUnique({
      where: { id: params.id },
      include: {
        vouchers: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' }
        },
        transfersFrom: {
          where: { deletedAt: null },
          include: {
            toSafe: true
          },
          orderBy: { createdAt: 'desc' }
        },
        transfersTo: {
          where: { deletedAt: null },
          include: {
            fromSafe: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!safe) {
      return NextResponse.json(
        { success: false, error: 'الخزنة غير موجودة' },
        { status: 404 }
      )
    }

    const response: ApiResponse<Safe> = {
      success: true,
      data: safe
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error getting safe:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}

// PUT /api/safes/[id] - Update safe
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
    const { name, balance } = body

    // Validation
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'اسم الخزنة مطلوب' },
        { status: 400 }
      )
    }

    if (balance && balance < 0) {
      return NextResponse.json(
        { success: false, error: 'الرصيد لا يمكن أن يكون سالباً' },
        { status: 400 }
      )
    }

    // Check if safe exists
    const existingSafe = await prisma.safe.findUnique({
      where: { id: params.id }
    })

    if (!existingSafe) {
      return NextResponse.json(
        { success: false, error: 'الخزنة غير موجودة' },
        { status: 404 }
      )
    }

    // Check if safe name already exists for another safe
    if (name !== existingSafe.name) {
      const nameExists = await prisma.safe.findUnique({
        where: { name }
      })

      if (nameExists) {
        return NextResponse.json(
          { success: false, error: 'اسم الخزنة مستخدم بالفعل' },
          { status: 400 }
        )
      }
    }

    // Update safe
    const safe = await prisma.safe.update({
      where: { id: params.id },
      data: {
        name,
        balance
      }
    })

    const response: ApiResponse<Safe> = {
      success: true,
      data: safe,
      message: 'تم تحديث الخزنة بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error updating safe:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}

// DELETE /api/safes/[id] - Delete safe
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

    // Check if safe can be deleted
    const canDelete = await canDeleteEntity('safe', params.id)
    if (!canDelete.canDelete) {
      return NextResponse.json(
        { success: false, error: canDelete.reason },
        { status: 400 }
      )
    }

    // Soft delete safe
    const result = await softDeleteEntity('safe', params.id, user.id.toString())
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      )
    }

    const response: ApiResponse = {
      success: true,
      message: 'تم حذف الخزنة بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error deleting safe:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}