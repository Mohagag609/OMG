import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { canDeleteEntity, softDeleteEntity } from '@/lib/soft-delete'
import { ApiResponse, Partner } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/partners/[id] - Get partner by ID
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

    const partner = await prisma.partner.findUnique({
      where: { id: params.id },
      include: {
        unitPartners: {
          where: { deletedAt: null },
          include: {
            unit: true
          }
        },
        partnerDebts: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!partner) {
      return NextResponse.json(
        { success: false, error: 'الشريك غير موجود' },
        { status: 404 }
      )
    }

    const response: ApiResponse<Partner> = {
      success: true,
      data: partner
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error getting partner:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}

// PUT /api/partners/[id] - Update partner
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
        { success: false, error: 'اسم الشريك مطلوب' },
        { status: 400 }
      )
    }

    // Check if partner exists
    const existingPartner = await prisma.partner.findUnique({
      where: { id: params.id }
    })

    if (!existingPartner) {
      return NextResponse.json(
        { success: false, error: 'الشريك غير موجود' },
        { status: 404 }
      )
    }

    // Update partner
    const partner = await prisma.partner.update({
      where: { id: params.id },
      data: {
        name,
        phone,
        notes
      }
    })

    const response: ApiResponse<Partner> = {
      success: true,
      data: partner,
      message: 'تم تحديث الشريك بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error updating partner:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}

// DELETE /api/partners/[id] - Delete partner
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

    // Check if partner can be deleted
    const canDelete = await canDeleteEntity('partner', params.id)
    if (!canDelete.canDelete) {
      return NextResponse.json(
        { success: false, error: canDelete.reason },
        { status: 400 }
      )
    }

    // Soft delete partner
    const result = await softDeleteEntity('partner', params.id, user.id.toString())
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      )
    }

    const response: ApiResponse = {
      success: true,
      message: 'تم حذف الشريك بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error deleting partner:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}