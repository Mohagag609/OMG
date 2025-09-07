import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { Notification } from '@/types/notifications'
import { ApiResponse, PaginatedResponse } from '@/types'
import { sortNotifications, groupNotifications } from '@/lib/notifications'

// GET /api/notifications - Get user notifications
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مخول للوصول' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type') || ''
    const category = searchParams.get('category') || ''
    const acknowledged = searchParams.get('acknowledged')
    const group = searchParams.get('group') === 'true'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (type) where.type = type
    if (category) where.category = category
    if (acknowledged !== null) {
      where.acknowledged = acknowledged === 'true'
    }

    // Get notifications
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          category: true,
          acknowledged: true,
          acknowledgedAt: true,
          acknowledgedBy: true,
          createdAt: true,
          expiresAt: true,
          data: true
        }
      }),
      prisma.notification.count({ where })
    ])

    let processedNotifications = notifications.map(notification => ({
      id: notification.id,
      type: notification.type as 'critical' | 'important' | 'info',
      title: notification.title,
      message: notification.message,
      category: notification.category,
      acknowledged: notification.acknowledged,
      acknowledgedAt: notification.acknowledgedAt?.toISOString(),
      acknowledgedBy: notification.acknowledgedBy,
      createdAt: notification.createdAt.toISOString(),
      expiresAt: notification.expiresAt?.toISOString(),
      data: notification.data
    }))

    // Group similar notifications if requested
    if (group) {
      processedNotifications = groupNotifications(processedNotifications)
    }

    // Sort by priority
    processedNotifications = sortNotifications(processedNotifications)

    const response: PaginatedResponse<Notification> = {
      data: processedNotifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}

// POST /api/notifications - Create notification
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
    const { type, title, message, category, data, expiresAt } = body

    // Validation
    if (!type || !title || !message || !category) {
      return NextResponse.json(
        { success: false, error: 'النوع والعنوان والرسالة والفئة مطلوبة' },
        { status: 400 }
      )
    }

    if (!['critical', 'important', 'info'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'نوع الإشعار غير صحيح' },
        { status: 400 }
      )
    }

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        type,
        title: title.trim(),
        message: message.trim(),
        category: category.trim(),
        data: data || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      }
    })

    const response: ApiResponse<Notification> = {
      success: true,
      data: {
        id: notification.id,
        type: notification.type as 'critical' | 'important' | 'info',
        title: notification.title,
        message: notification.message,
        category: notification.category,
        acknowledged: notification.acknowledged,
        acknowledgedAt: notification.acknowledgedAt?.toISOString(),
        acknowledgedBy: notification.acknowledgedBy,
        createdAt: notification.createdAt.toISOString(),
        expiresAt: notification.expiresAt?.toISOString(),
        data: notification.data
      },
      message: 'تم إنشاء الإشعار بنجاح'
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}