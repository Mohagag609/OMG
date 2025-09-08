import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import { getBackupStatistics } from '@/lib/backup'
import { ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/backup/list - Get backup statistics
export async function GET(request: NextRequest) {
  try {
    // Check authentication - try both header and cookie
    let token = null
    let user = null
    
    // Try authorization header first
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }
    
    // Try cookie if no header
    if (!token) {
      const cookieHeader = request.headers.get('cookie')
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=')
          acc[key] = value
          return acc
        }, {} as Record<string, string>)
        token = cookies.authToken
      }
    }
    
    // If we have a token, try to get user
    if (token) {
      user = await getUserFromToken(token)
      if (!user) {
        console.log('Invalid token, proceeding without auth for backup list')
      }
    } else {
      console.log('No authentication token found, proceeding without auth for backup list')
    }

    // Check if user has admin role (only if user exists)
    if (token && user && user.role !== 'admin') {
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