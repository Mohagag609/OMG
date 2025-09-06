import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { ApiResponse } from '@/types/notifications'

// POST /api/notifications/[id]/acknowledge - Acknowledge notification
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مخول للوصول' },
        { status: 401 }
      )
    }

    // Check if notification exists
    const existingNotification = await prisma.notification.findUnique({
      where: { id: params.id }
    })

    if (!existingNotification) {
      return NextResponse.json(
        { success: false, error: 'الإشعار غير موجود' },
        { status: 404 }
      )
    }

    // Update notification
    const notification = await prisma.notification.update({
      where: { id: params.id },
      data: {
        acknowledged: true,
        acknowledgedAt: new Date(),
        acknowledgedBy: user.id
      }
    })

    const response: ApiResponse = {
      success: true,
      message: 'تم تأكيد الإشعار بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error acknowledging notification:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}