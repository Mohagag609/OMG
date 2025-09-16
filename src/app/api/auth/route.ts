import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function POST(request: Request) {
  try {
    await prisma.$connect()
    const { username, password } = await request.json()

    // Simple authentication - in production, use proper password hashing
    const user = await prisma.user.findFirst({
      where: {
        username,
        isActive: true
      }
    })

    if (!user || user.password !== password) {
      return NextResponse.json({
        success: false,
        error: 'اسم المستخدم أو كلمة المرور غير صحيحة'
      }, { status: 401 })
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username,
        role: user.role 
      },
      process.env.NEXTAUTH_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    )

    return NextResponse.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          role: user.role
        }
      },
      message: 'تم تسجيل الدخول بنجاح'
    })

  } catch (error) {
    console.error('Error in auth API:', error)
    return NextResponse.json({
      success: false,
      error: 'خطأ في المصادقة'
    }, { status: 500 })
  } finally {
    try {
      await prisma.$disconnect()
    } catch (disconnectError) {
      console.error('Error disconnecting from database:', disconnectError)
    }
  }
}