import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json(
        {
          success: false,
          error: 'كلمة المرور مطلوبة'
        },
        { status: 400 }
      )
    }

    // Get admin password from environment
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
    
    // Check password
    const isValid = await bcrypt.compare(password, await bcrypt.hash(adminPassword, 12)) || password === adminPassword

    if (isValid) {
      return NextResponse.json({
        success: true,
        message: 'تم التحقق بنجاح'
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'كلمة المرور غير صحيحة'
        },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Admin auth error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'خطأ في التحقق'
      },
      { status: 500 }
    )
  }
}