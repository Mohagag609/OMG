import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { getAuditLogById } from '@/lib/audit'
import { ApiResponse } from '@/types'

// GET /api/audit/[id] - Get audit log by ID


export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export async function GET(
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

    const auditLog = await getAuditLogById(params.id)

    if (!auditLog) {
      return NextResponse.json(
        { success: false, error: 'سجل التدقيق غير موجود' },
        { status: 404 }
      )
    }

    const response: ApiResponse<typeof auditLog> = {
      success: true,
      data: auditLog
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching audit log:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}