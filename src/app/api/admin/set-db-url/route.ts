// API Route لتعيين URL قاعدة البيانات الجديد
import { NextRequest, NextResponse } from 'next/server'
import { setCurrentDbUrl } from '@/lib/config'
import { testConnection } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/admin/set-db-url - تعيين URL قاعدة البيانات الجديد
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 جاري تعيين URL قاعدة البيانات الجديد...')

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

    const body = await request.json()
    const { url } = body

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'URL قاعدة البيانات مطلوب' 
        },
        { status: 400 }
      )
    }

    // التحقق من صحة URL
    if (!isValidDbUrl(url)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'URL قاعدة البيانات غير صحيح. يجب أن يبدأ بـ postgres:// أو postgresql:// أو sqlite://' 
        },
        { status: 400 }
      )
    }

    console.log('🔗 URL الجديد:', url.substring(0, 50) + '...')

    // حفظ URL الجديد
    const saved = await setCurrentDbUrl(url)
    
    if (!saved) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'فشل في حفظ URL قاعدة البيانات' 
        },
        { status: 500 }
      )
    }

    // اختبار الاتصال الجديد
    console.log('🧪 اختبار الاتصال الجديد...')
    const testResult = await testConnection()
    
    if (!testResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: `تم حفظ URL لكن فشل في الاتصال: ${testResult.message}`,
          warning: 'تم حفظ URL لكن الاتصال فشل'
        },
        { status: 200 }
      )
    }

    console.log('✅ تم تعيين URL قاعدة البيانات بنجاح')

    return NextResponse.json({
      success: true,
      message: 'تم تعيين URL قاعدة البيانات بنجاح',
      dbType: testResult.dbType,
      url: url.substring(0, 50) + '...'
    })

  } catch (error: any) {
    console.error('❌ خطأ في تعيين URL قاعدة البيانات:', error?.message || error)
    return NextResponse.json(
      { 
        success: false, 
        error: `خطأ في تعيين URL قاعدة البيانات: ${error?.message || error}` 
      },
      { status: 500 }
    )
  }
}

// التحقق من صحة URL قاعدة البيانات
function isValidDbUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    
    // التحقق من البروتوكولات المدعومة
    const supportedProtocols = ['postgres:', 'postgresql:', 'sqlite:']
    if (!supportedProtocols.includes(urlObj.protocol)) {
      return false
    }

    // التحقق من SQLite
    if (urlObj.protocol === 'sqlite:') {
      return urlObj.pathname.length > 0
    }

    // التحقق من PostgreSQL
    if (urlObj.protocol === 'postgres:' || urlObj.protocol === 'postgresql:') {
      return urlObj.hostname.length > 0
    }

    return true
  } catch (error) {
    return false
  }
}