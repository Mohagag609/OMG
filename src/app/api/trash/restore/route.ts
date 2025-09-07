import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { restoreEntity, checkEntityRestoreRules } from '@/lib/soft-delete'
import { ApiResponse } from '@/types'

// POST /api/trash/restore - Restore soft-deleted entity
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

    // Check if entity can be restored
    const canRestore = await checkEntityRestoreRules(entityType, entityId)
    if (!canRestore.allowed) {
      return NextResponse.json(
        { success: false, error: canRestore.reason || 'لا يمكن استرجاع هذا الكيان' },
        { status: 400 }
      )
    }

    // Get client IP and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Restore the entity
    await restoreEntity(entityType, entityId, {
      restoredBy: user.id,
      ipAddress,
      userAgent
    })

    const response: ApiResponse = {
      success: true,
      message: 'تم استرجاع الكيان بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error restoring entity:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في استرجاع الكيان' },
      { status: 500 }
    )
  }
}