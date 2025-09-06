import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { ApiResponse } from '@/types'

// GET /api/auth/verify - Verify token and get user info
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'انتهت صلاحية الجلسة' },
        { status: 401 }
      )
    }

    const response: ApiResponse<{ user: { id: string; username: string; role: string } }> = {
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error verifying token:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في التحقق من الجلسة' },
      { status: 500 }
    )
  }
}