import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { permanentDeleteEntity } from '@/lib/soft-delete'
import { ApiResponse } from '@/types'

// POST /api/trash/permanent-delete - Permanently delete entity

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مخول للوصول' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { entityType, entityId } = body

    if (!entityType || !entityId) {
      return NextResponse.json(
        { success: false, error: 'نوع الكيان ومعرف الكيان مطلوبان' },
        { status: 400 }
      )
    }

    // Get client IP and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Permanently delete the entity
    await permanentDeleteEntity(entityType, entityId, user.id, ipAddress, userAgent)

    const response: ApiResponse = {
      success: true,
      message: 'تم حذف الكيان نهائياً'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error permanently deleting entity:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في الحذف النهائي' },
      { status: 500 }
    )
  }
}