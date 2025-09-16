import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import { performHealthCheck } from '@/lib/monitoring'
import { ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/monitoring/health - Get system health status
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

    // Perform health check
    const healthCheck = await performHealthCheck()

    const response: ApiResponse = {
      success: true,
      data: healthCheck,
      message: 'تم تحميل حالة النظام بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error getting system health:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في تحميل حالة النظام' },
      { status: 500 }
    )
  }
}