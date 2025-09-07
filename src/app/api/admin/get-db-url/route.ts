// API Route لقراءة URL قاعدة البيانات الحالي
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentDbUrl, getCurrentDbType } from '@/lib/config'
import { testConnection } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/admin/get-db-url - قراءة URL قاعدة البيانات الحالي
export async function GET(request: NextRequest) {
  try {
    console.log('📋 جاري قراءة URL قاعدة البيانات الحالي...')

    // التحقق من وجود CONTROL_DB_URL
    if (!process.env.CONTROL_DB_URL) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'CONTROL_DB_URL غير محدد في متغيرات البيئة' 
        },
        { status: 500 }
      )
    }

    // قراءة URL ونوع قاعدة البيانات
    const [url, dbType] = await Promise.all([
      getCurrentDbUrl(),
      getCurrentDbType()
    ])

    console.log('📋 URL الحالي:', url.substring(0, 50) + '...')
    console.log('📋 نوع قاعدة البيانات:', dbType)

    // اختبار الاتصال
    const testResult = await testConnection()

    return NextResponse.json({
      success: true,
      data: {
        url,
        dbType,
        isConnected: testResult.success,
        connectionMessage: testResult.message
      }
    })

  } catch (error: any) {
    console.error('❌ خطأ في قراءة URL قاعدة البيانات:', error?.message || error)
    return NextResponse.json(
      { 
        success: false, 
        error: `خطأ في قراءة URL قاعدة البيانات: ${error?.message || error}` 
      },
      { status: 500 }
    )
  }
}