import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateToken, verifyPassword } from '@/lib/auth'
import { ApiResponse } from '@/types'


export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/auth/login - Login user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    // Validation
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'اسم المستخدم وكلمة المرور مطلوبان' },
        { status: 400 }
      )
    }

    // For now, we'll use a simple hardcoded admin user
    // In production, this should be stored in the database
    const adminUser = {
      id: 'admin-1',
      username: 'admin',
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/9yQK.2O', // 'admin123'
      role: 'admin' as const
    }

    // Check if user exists
    if (username !== adminUser.username) {
      return NextResponse.json(
        { success: false, error: 'بيانات الدخول غير صحيحة' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, adminUser.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'بيانات الدخول غير صحيحة' },
        { status: 401 }
      )
    }

    // Generate token
    const token = generateToken({
      id: adminUser.id,
      username: adminUser.username,
      role: adminUser.role
    })

    const response: ApiResponse<{ token: string; user: { id: string; username: string; role: string } }> = {
      success: true,
      data: {
        token,
        user: {
          id: adminUser.id,
          username: adminUser.username,
          role: adminUser.role
        }
      },
      message: 'تم تسجيل الدخول بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error during login:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}