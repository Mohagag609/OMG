import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import { getSystemMetrics } from '@/lib/monitoring'
import { ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/monitoring/metrics - Get system metrics
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

    // Get system metrics
    const metrics = await getSystemMetrics()

    const response: ApiResponse = {
      success: true,
      data: metrics,
      message: 'تم تحميل مقاييس النظام بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error getting system metrics:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في تحميل مقاييس النظام' },
      { status: 500 }
    )
  }
}