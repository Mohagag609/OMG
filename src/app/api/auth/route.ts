import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

export async function POST(request: Request) {
  try {
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
    console.error('Error in auth:', error)
    return NextResponse.json({
      success: false,
      error: 'خطأ في المصادقة'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}