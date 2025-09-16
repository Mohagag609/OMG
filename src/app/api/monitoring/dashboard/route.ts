import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import { getSystemMetrics, performHealthCheck } from '@/lib/monitoring'
import { ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/monitoring/dashboard - Get monitoring dashboard data
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

    // Get monitoring data
    const [healthCheck, metrics] = await Promise.all([
      performHealthCheck(),
      getSystemMetrics()
    ])

    const dashboardData = {
      health: healthCheck,
      metrics,
      timestamp: new Date().toISOString()
    }

    const response: ApiResponse = {
      success: true,
      data: dashboardData,
      message: 'تم تحميل لوحة المراقبة بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error getting monitoring dashboard:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في تحميل لوحة المراقبة' },
      { status: 500 }
    )
  }
}