import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse } from '@/types'
import { loadDatabaseConfig, saveDatabaseConfig, saveDatabaseConfigAlternative, saveDatabaseConfigUltraSimple, ensureDatabaseTypePersistence } from '@/lib/databaseConfig'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/database/settings - Get database settings
export async function GET(request: NextRequest) {
  try {
    console.log('📋 جاري تحميل إعدادات قاعدة البيانات...')

    // Get database settings from config file
    const settings = await loadDatabaseConfig()

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

    console.log('📋 البيانات المستلمة:', { type, connectionString: connectionString?.substring(0, 50) + '...' })

    // Validate settings
    if (!type || !connectionString) {
      console.log('❌ بيانات ناقصة:', { type: !!type, connectionString: !!connectionString })
      return NextResponse.json(
        { success: false, error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      )
    }

    if (type !== 'sqlite' && type !== 'postgresql') {
      console.log('❌ نوع قاعدة بيانات غير صحيح:', type)
      return NextResponse.json(
        { success: false, error: 'نوع قاعدة البيانات غير صحيح' },
        { status: 400 }
      )
    }

    // Validate connection string format
    if (type === 'sqlite' && !connectionString.startsWith('file:')) {
      console.log('❌ رابط SQLite غير صحيح:', connectionString.substring(0, 20))
      return NextResponse.json(
        { success: false, error: 'رابط SQLite يجب أن يبدأ بـ file:' },
        { status: 400 }
      )
    }

    if (type === 'postgresql' && !connectionString.startsWith('postgresql://')) {
      console.log('❌ رابط PostgreSQL غير صحيح:', connectionString.substring(0, 20))
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
    
    console.log('💾 محاولة الحفظ الرئيسي...')
    let saved = saveDatabaseConfig(config)
    
    // If main save failed, try alternative method
    if (!saved) {
      console.log('⚠️ فشل الحفظ الرئيسي، جاري المحاولة بالطريقة البديلة...')
      saved = saveDatabaseConfigAlternative(config)
    }
    
    // If alternative method failed, try ultra simple method
    if (!saved) {
      console.log('⚠️ فشل الطريقة البديلة، جاري المحاولة بالطريقة البسيطة جداً...')
      saved = saveDatabaseConfigUltraSimple(type, connectionString)
    }
    
    // Last resort: direct file write in API route
    if (!saved) {
      console.log('⚠️ فشل الطريقة البسيطة، جاري المحاولة بالكتابة المباشرة...')
      try {
        const CONFIG_FILE = path.join(process.cwd(), 'database-config.json')
        const directConfig = {
          type,
          connectionString,
          isConnected: false,
          savedAt: new Date().toISOString(),
          version: '2.0',
          persistent: true
        }
        
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(directConfig, null, 2), 'utf8')
        process.env.DATABASE_URL = connectionString
        saved = true
        console.log('✅ تم الحفظ بالكتابة المباشرة')
      } catch (directError) {
        console.error('❌ فشل حتى الكتابة المباشرة:', directError)
        saved = false
      }
    }
    
    if (!saved) {
      console.log('❌ فشل في الحفظ بجميع الطرق')
      return NextResponse.json(
        { success: false, error: 'فشل في حفظ إعدادات قاعدة البيانات بجميع الطرق المتاحة' },
        { status: 500 }
      )
    }
    
    console.log('✅ تم الحفظ بنجاح، جاري ضمان الاستمرارية...')
    
    // Ensure database type persistence
    const persistenceEnsured = await ensureDatabaseTypePersistence(type)
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
    console.error('📄 تفاصيل الخطأ:', error)
    return NextResponse.json(
      { success: false, error: `خطأ في قاعدة البيانات: ${error}` },
      { status: 500 }
    )
  }
}