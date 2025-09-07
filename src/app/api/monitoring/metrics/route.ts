import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { getSystemMetrics } from '@/lib/monitoring'
import { ApiResponse } from '@/types'

// GET /api/monitoring/metrics - Get system metrics

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

    const metrics = await getSystemMetrics()

    const response: ApiResponse<typeof metrics> = {
      success: true,
      data: metrics
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error getting system metrics:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في جلب مقاييس النظام' },
      { status: 500 }
    )
  }
}