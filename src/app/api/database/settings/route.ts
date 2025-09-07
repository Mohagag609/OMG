import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse } from '@/types'
import { loadDatabaseConfig, saveDatabaseConfig, updateConnectionStatus } from '@/lib/databaseConfig'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/database/settings - Get database settings
export async function GET(request: NextRequest) {
  try {
    console.log('📋 جاري تحميل إعدادات قاعدة البيانات...')

    // Get database settings from config file
    const settings = loadDatabaseConfig()

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

    // Save settings to config file
    const config = {
      type,
      connectionString,
      isConnected: false, // Will be tested separately
      lastTested: new Date().toISOString()
    }
    
    const saved = saveDatabaseConfig(config)
    
    if (!saved) {
      return NextResponse.json(
        { success: false, error: 'فشل في حفظ إعدادات قاعدة البيانات' },
        { status: 500 }
      )
    }
    
    const response: ApiResponse<any> = {
      success: true,
      data: config,
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