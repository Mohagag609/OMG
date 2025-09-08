import { NextRequest, NextResponse } from 'next/server'
import { saveDatabaseConfig } from '@/lib/databaseConfig'
import { createPrismaClient, testDatabaseConnection } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface SwitchRequest {
  type: 'sqlite' | 'postgresql-local' | 'postgresql-cloud'
  connectionString: string
  adminKey: string
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'API is working',
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 بدء عملية تبديل قاعدة البيانات...')
    console.log('🔍 Request URL:', request.url)
    console.log('🔍 Request method:', request.method)
    
    // Parse request
    const body: SwitchRequest = await request.json()
    console.log('🔍 Request body:', body)
    const { type, connectionString, adminKey } = body
    
    // Simple admin key check
    if (adminKey !== 'admin-setup-key-change-me') {
      return NextResponse.json({
        success: false,
        message: 'مفتاح الأدمن غير صحيح'
      }, { status: 401 })
    }
    
    // Validate required fields
    if (!type || !connectionString) {
      return NextResponse.json({
        success: false,
        message: 'نوع قاعدة البيانات ورابط الاتصال مطلوبان'
      }, { status: 400 })
    }
    
    // Validate connection string format
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
    
    console.log(`🎯 تبديل إلى: ${type}`)
    console.log(`🔗 الرابط: ${connectionString.substring(0, 50)}...`)
    
    // Test connection
    console.log('🔍 اختبار الاتصال...')
    const connectionTest = await testDatabaseConnection(connectionString)
    
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        message: `فشل في الاتصال بقاعدة البيانات: ${connectionTest.error}`
      }, { status: 400 })
    }
    
    console.log('✅ تم التحقق من الاتصال')
    
    // Save configuration
    console.log('💾 حفظ الإعدادات...')
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
    
    // Update environment variable
    process.env.DATABASE_URL = connectionString
    process.env.DATABASE_TYPE = type
    
    console.log('✅ تم تحديث متغيرات البيئة')
    
    return NextResponse.json({
      success: true,
      message: 'تم تبديل قاعدة البيانات بنجاح',
      data: {
        type,
        connectionString: connectionString.substring(0, 50) + '...',
        connected: true
      }
    })
    
  } catch (error) {
    console.error('❌ خطأ في تبديل قاعدة البيانات:', error)
    console.error('❌ تفاصيل الخطأ:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    })
    
    return NextResponse.json({
      success: false,
      message: `خطأ في تبديل قاعدة البيانات: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`,
      error: error instanceof Error ? error.message : 'خطأ غير معروف',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}