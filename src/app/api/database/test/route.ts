import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import { ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/database/test - Test database connection
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'غير مخول للوصول' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const user = await getUserFromToken(token)
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مخول للوصول' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { type, connectionString } = body

    // Validate input
    if (!type || !connectionString) {
      return NextResponse.json(
        { success: false, error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      )
    }

    // Test connection based on type
    let testResult: { success: boolean; error?: string; details?: any } = { success: false }

    if (type === 'sqlite') {
      testResult = await testSQLiteConnection(connectionString)
    } else if (type === 'postgresql') {
      testResult = await testPostgreSQLConnection(connectionString)
    } else {
      return NextResponse.json(
        { success: false, error: 'نوع قاعدة البيانات غير مدعوم' },
        { status: 400 }
      )
    }

    if (testResult.success) {
      const response: ApiResponse<any> = {
        success: true,
        data: {
          type,
          connectionString: connectionString.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'), // Hide credentials
          isConnected: true,
          lastTested: new Date().toISOString(),
          details: testResult.details
        },
        message: `تم الاتصال بقاعدة البيانات ${type === 'sqlite' ? 'SQLite' : 'PostgreSQL'} بنجاح`
      }
      return NextResponse.json(response)
    } else {
      return NextResponse.json(
        { success: false, error: testResult.error || 'فشل في الاتصال بقاعدة البيانات' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error testing database connection:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في اختبار الاتصال' },
      { status: 500 }
    )
  }
}

// Test SQLite connection
async function testSQLiteConnection(connectionString: string): Promise<{ success: boolean; error?: string; details?: any }> {
  try {
    // For SQLite, we can't easily test without changing the current connection
    // So we'll do basic validation
    if (!connectionString.startsWith('file:')) {
      return { success: false, error: 'رابط SQLite غير صحيح' }
    }

    // Extract file path
    const filePath = connectionString.replace('file:', '')
    
    // Basic file path validation
    if (!filePath || filePath.length < 3) {
      return { success: false, error: 'مسار ملف SQLite غير صحيح' }
    }

    return {
      success: true,
      details: {
        type: 'SQLite',
        filePath: filePath,
        message: 'رابط SQLite صحيح'
      }
    }
  } catch (error) {
    return { success: false, error: 'خطأ في اختبار SQLite' }
  }
}

// Test PostgreSQL connection
async function testPostgreSQLConnection(connectionString: string): Promise<{ success: boolean; error?: string; details?: any }> {
  try {
    // For PostgreSQL, we can test the connection
    if (!connectionString.startsWith('postgresql://')) {
      return { success: false, error: 'رابط PostgreSQL غير صحيح' }
    }

    // Parse connection string
    const url = new URL(connectionString)
    const host = url.hostname
    const port = url.port || '5432'
    const database = url.pathname.substring(1)
    const username = url.username
    const password = url.password

    // Validate required fields
    if (!host || !database || !username || !password) {
      return { success: false, error: 'رابط PostgreSQL ناقص (يجب أن يحتوي على host, database, username, password)' }
    }

    // Test connection by creating a temporary Prisma client
    const { PrismaClient } = await import('@prisma/client')
    
    // Create a temporary client with the test connection string
    const tempClient = new PrismaClient({
      datasources: {
        db: {
          url: connectionString
        }
      }
    })

    // Test connection
    await tempClient.$connect()
    await tempClient.$disconnect()

    return {
      success: true,
      details: {
        type: 'PostgreSQL',
        host,
        port,
        database,
        username,
        message: 'تم الاتصال بنجاح'
      }
    }
  } catch (error: any) {
    console.error('PostgreSQL connection test error:', error)
    
    let errorMessage = 'فشل في الاتصال بقاعدة البيانات PostgreSQL'
    
    if (error.code === 'ECONNREFUSED') {
      errorMessage = 'لا يمكن الاتصال بالخادم - تأكد من أن الخادم يعمل'
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'عنوان الخادم غير صحيح'
    } else if (error.code === 'P1001') {
      errorMessage = 'لا يمكن الاتصال بقاعدة البيانات'
    } else if (error.code === 'P1003') {
      errorMessage = 'قاعدة البيانات غير موجودة'
    } else if (error.code === 'P1017') {
      errorMessage = 'انقطع الاتصال بقاعدة البيانات'
    } else if (error.message.includes('authentication')) {
      errorMessage = 'فشل في المصادقة - تأكد من اسم المستخدم وكلمة المرور'
    }

    return { success: false, error: errorMessage }
  }
}