import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import { getBackupStatistics } from '@/lib/backup'
import { ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/backup/list - Get backup statistics
export async function GET(request: NextRequest) {
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

    // Check if user has admin role
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'غير مخول للوصول' },
        { status: 403 }
      )
    }

    // Get backup statistics
    const statistics = await getBackupStatistics()

    const response: ApiResponse = {
      success: true,
      data: statistics,
      message: 'تم تحميل إحصائيات النسخ الاحتياطية بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error getting backup statistics:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في تحميل إحصائيات النسخ الاحتياطية' },
      { status: 500 }
    )
  }
}