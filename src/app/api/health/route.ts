import { NextResponse } from 'next/server'
import { testDatabaseConnection } from '@/lib/prisma'

export async function GET() {
  try {
    const isConnected = await testDatabaseConnection()
    
    if (isConnected) {
      return NextResponse.json({
        success: true,
        status: 'healthy',
        message: 'الاتصال بقاعدة البيانات يعمل بشكل طبيعي',
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json({
        success: false,
        status: 'unhealthy',
        message: 'فشل في الاتصال بقاعدة البيانات',
        timestamp: new Date().toISOString()
      }, { status: 503 })
    }
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json({
      success: false,
      status: 'error',
      message: 'خطأ في فحص حالة النظام',
      error: error instanceof Error ? error.message : 'خطأ غير معروف',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}