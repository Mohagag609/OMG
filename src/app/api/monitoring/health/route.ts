import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { performHealthChecks } from '@/lib/monitoring'
import { ApiResponse } from '@/types'

// GET /api/monitoring/health - Get health checks
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مخول للوصول' },
        { status: 401 }
      )
    }

    const healthChecks = await performHealthChecks()

    const response: ApiResponse<typeof healthChecks> = {
      success: true,
      data: healthChecks
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error performing health checks:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في فحص صحة النظام' },
      { status: 500 }
    )
  }
}