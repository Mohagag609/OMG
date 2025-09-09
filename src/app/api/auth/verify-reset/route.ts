import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { username, adminKey } = await request.json()

    if (!username || !adminKey) {
      return NextResponse.json(
        { error: 'اسم المستخدم والمفتاح السري مطلوبان' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      )
    }

    // Check admin key
    const correctAdminKey = process.env.ADMIN_CREATION_KEY || 'admin123'
    if (adminKey !== correctAdminKey) {
      return NextResponse.json(
        { error: 'المفتاح السري غير صحيح' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'تم التحقق بنجاح',
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    })

  } catch (error) {
    console.error('Verify reset error:', error)
    return NextResponse.json(
      {
        error: 'فشل في التحقق',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}