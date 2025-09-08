import { NextResponse } from 'next/server'
import { loadDatabaseConfig } from '@/lib/databaseConfig'
import { testDatabaseConnection } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    // Load current configuration
    const config = loadDatabaseConfig()
    
    // Test current connection
    const connectionTest = await testDatabaseConnection(config.connectionString)
    
    return NextResponse.json({
      success: true,
      data: {
        type: config.type,
        connectionString: config.connectionString.substring(0, 50) + '...',
        isConnected: connectionTest.success,
        lastTested: config.lastTested,
        environment: {
          DATABASE_URL: process.env.DATABASE_URL ? 'موجود' : 'غير موجود',
          DATABASE_TYPE: process.env.DATABASE_TYPE || 'غير محدد'
        }
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: `خطأ في تحميل حالة قاعدة البيانات: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`
    }, { status: 500 })
  }
}