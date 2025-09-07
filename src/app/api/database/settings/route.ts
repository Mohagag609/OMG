import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse } from '@/types'
import { loadDatabaseConfig, saveDatabaseConfig, saveDatabaseConfigAlternative, ensureDatabaseTypePersistence } from '@/lib/databaseConfig'

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

    console.log('✅ تم تحميل الإعدادات بنجاح:', settings.type)
    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ خطأ في تحميل إعدادات قاعدة البيانات:', error)
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

    // Save settings to config file with persistence
    const config = {
      type,
      connectionString,
      isConnected: false, // Will be tested separately
      lastTested: new Date().toISOString(),
      persistent: true // Ensure persistence
    }
    
    let saved = saveDatabaseConfig(config)
    
    // If main save failed, try alternative method
    if (!saved) {
      console.log('⚠️ فشل الحفظ الرئيسي، جاري المحاولة بالطريقة البديلة...')
      saved = saveDatabaseConfigAlternative(config)
    }
    
    if (!saved) {
      return NextResponse.json(
        { success: false, error: 'فشل في حفظ إعدادات قاعدة البيانات حتى بالطريقة البديلة' },
        { status: 500 }
      )
    }
    
    // Ensure database type persistence
    const persistenceEnsured = ensureDatabaseTypePersistence(type)
    if (!persistenceEnsured) {
      console.log('⚠️ تحذير: فشل في ضمان استمرارية نوع قاعدة البيانات')
    }
    
    // Update environment variable
    process.env.DATABASE_URL = connectionString
    console.log('🔧 تم تحديث متغير البيئة DATABASE_URL')
    
    const response: ApiResponse<any> = {
      success: true,
      data: config,
      message: 'تم حفظ إعدادات قاعدة البيانات بنجاح'
    }

    console.log('✅ تم حفظ الإعدادات بنجاح:', type)
    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ خطأ في حفظ إعدادات قاعدة البيانات:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}