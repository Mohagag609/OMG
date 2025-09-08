import { NextRequest, NextResponse } from 'next/server'
import { saveDatabaseConfig } from '@/lib/databaseConfig'
import { testDatabaseConnection } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Database Switch API is working!',
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Database Switch API called')
    
    const body = await request.json()
    console.log('📦 Request body:', body)
    
    const { type, connectionString, adminKey } = body
    
    // Simple validation
    if (!type || !connectionString || !adminKey) {
      return NextResponse.json({
        success: false,
        message: 'جميع الحقول مطلوبة'
      }, { status: 400 })
    }
    
    // Simple admin key check
    if (adminKey !== 'admin-setup-key-change-me') {
      return NextResponse.json({
        success: false,
        message: 'مفتاح الأدمن غير صحيح'
      }, { status: 401 })
    }
    
    // Simple validation
    if (type === 'sqlite' && !connectionString.startsWith('file:')) {
      return NextResponse.json({
        success: false,
        message: 'رابط SQLite يجب أن يبدأ بـ file:'
      }, { status: 400 })
    }
    
    if (type.startsWith('postgresql') && !connectionString.startsWith('postgresql://')) {
      return NextResponse.json({
        success: false,
        message: 'رابط PostgreSQL يجب أن يبدأ بـ postgresql://'
      }, { status: 400 })
    }
    
    // Test actual database connection
    console.log('🔍 اختبار الاتصال بقاعدة البيانات...')
    const connectionTest = await testDatabaseConnection(connectionString)
    
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        message: `فشل في الاتصال بقاعدة البيانات: ${connectionTest.error}`
      }, { status: 400 })
    }
    
    console.log('✅ تم التحقق من الاتصال')
    
    // Save configuration to database-config.json
    console.log('💾 حفظ إعدادات قاعدة البيانات...')
    const configSaved = saveDatabaseConfig({
      type: type as any,
      connectionString,
      isConnected: true,
      lastTested: new Date().toISOString()
    })
    
    if (!configSaved) {
      return NextResponse.json({
        success: false,
        message: 'فشل في حفظ إعدادات قاعدة البيانات'
      }, { status: 500 })
    }
    
    // Update environment variables
    process.env.DATABASE_URL = connectionString
    process.env.DATABASE_TYPE = type
    
    console.log('✅ تم تحديث متغيرات البيئة')
    
    return NextResponse.json({
      success: true,
      message: 'تم تبديل قاعدة البيانات بنجاح',
      data: {
        type,
        connectionString: connectionString.substring(0, 50) + '...',
        connected: true,
        configUpdated: true,
        environmentUpdated: true
      }
    })
    
  } catch (error) {
    console.error('❌ Error in database switch:', error)
    return NextResponse.json({
      success: false,
      message: `خطأ: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`
    }, { status: 500 })
  }
}