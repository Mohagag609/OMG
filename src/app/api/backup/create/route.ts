import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { createBackup } from '@/lib/backup'
import { ApiResponse } from '@/types'

// POST /api/backup/create - Create a new backup

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
    const { type = 'local' } = body

    if (!['local', 'remote'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'نوع النسخة الاحتياطية غير صحيح' },
        { status: 400 }
      )
    }

    // Get client IP and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Create backup
    const backupInfo = await createBackup(type, user.id)

    const response: ApiResponse<typeof backupInfo> = {
      success: true,
      data: backupInfo,
      message: 'تم إنشاء النسخة الاحتياطية بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error creating backup:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في إنشاء النسخة الاحتياطية' },
      { status: 500 }
    )
  }
}