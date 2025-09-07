import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { getAuditLogs, getAuditStats, AuditLogFilter } from '@/lib/audit'
import { ApiResponse, PaginatedResponse } from '@/types'


export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/audit - Get audit logs
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
    const action = searchParams.get('action')
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('entityId')
    const userId = searchParams.get('userId')
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const stats = searchParams.get('stats') === 'true'

    if (stats) {
      // Return audit statistics
      const auditStats = await getAuditStats()
      const response: ApiResponse<typeof auditStats> = {
        success: true,
        data: auditStats
      }
      return NextResponse.json(response)
    }

    // Return audit logs
    const filter: AuditLogFilter = {
      action: action || undefined,
      entityType: entityType || undefined,
      entityId: entityId || undefined,
      userId: userId || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      page,
      limit
    }

    const result = await getAuditLogs(filter)
    
    const response: PaginatedResponse<any> = {
      data: result.logs,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}