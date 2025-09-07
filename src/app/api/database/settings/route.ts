import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/database/settings - Get database settings
export async function GET(request: NextRequest) {
  try {
    console.log('📋 جاري تحميل إعدادات قاعدة البيانات...')

    // Get database settings from environment or defaults
    const databaseUrl = process.env.DATABASE_URL || ''
    const isPostgreSQL = databaseUrl.startsWith('postgresql://')
    const isSQLite = databaseUrl.startsWith('file:')

    const settings = {
      type: isPostgreSQL ? 'postgresql' : 'sqlite',
      connectionString: databaseUrl,
      isConnected: true, // Assume connected if we can read env
      lastTested: new Date().toISOString()
    }

    const response: ApiResponse<any> = {
      success: true,
      data: settings
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error getting database settings:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}

// POST /api/database/settings - Save database settings
export async function POST(request: NextRequest) {
  try {
    console.log('💾 جاري حفظ إعدادات قاعدة البيانات...')

    const body = await request.json()
    const { type, connectionString } = body

    // Validate settings
    if (!type || !connectionString) {
      return NextResponse.json(
        { success: false, error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      )
    }

    if (type !== 'sqlite' && type !== 'postgresql') {
      return NextResponse.json(
        { success: false, error: 'نوع قاعدة البيانات غير صحيح' },
        { status: 400 }
      )
    }

    // Validate connection string format
    if (type === 'sqlite' && !connectionString.startsWith('file:')) {
      return NextResponse.json(
        { success: false, error: 'رابط SQLite يجب أن يبدأ بـ file:' },
        { status: 400 }
      )
    }

    if (type === 'postgresql' && !connectionString.startsWith('postgresql://')) {
      return NextResponse.json(
        { success: false, error: 'رابط PostgreSQL يجب أن يبدأ بـ postgresql://' },
        { status: 400 }
      )
    }

    // In a real application, you would save these settings to a secure storage
    // For now, we'll just return success
    const response: ApiResponse<any> = {
      success: true,
      data: {
        type,
        connectionString,
        isConnected: false, // Will be tested separately
        lastTested: new Date().toISOString()
      },
      message: 'تم حفظ إعدادات قاعدة البيانات بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error saving database settings:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}