import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { getMonitoringDashboard } from '@/lib/monitoring'
import { ApiResponse } from '@/types'

// GET /api/monitoring/dashboard - Get monitoring dashboard data
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مخول للوصول' },
        { status: 401 }
      )
    }

    const dashboard = await getMonitoringDashboard()

    const response: ApiResponse<typeof dashboard> = {
      success: true,
      data: dashboard
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error getting monitoring dashboard:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في جلب لوحة المراقبة' },
      { status: 500 }
    )
  }
}