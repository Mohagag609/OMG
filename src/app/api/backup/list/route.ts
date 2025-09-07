import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { getBackupList } from '@/lib/backup'
import { ApiResponse, PaginatedResponse } from '@/types'

// GET /api/backup/list - Get list of backups

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مخول للوصول' },
        { status: 401 }
      )
    }

    const backups = await getBackupList()

    const response: PaginatedResponse<typeof backups[0]> = {
      data: backups,
      pagination: {
        page: 1,
        limit: backups.length,
        total: backups.length,
        totalPages: 1
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error getting backup list:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في جلب قائمة النسخ الاحتياطية' },
      { status: 500 }
    )
  }
}