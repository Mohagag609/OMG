import { NextRequest, NextResponse } from 'next/server'

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
    
    // For now, just return success without actual database operations
    return NextResponse.json({
      success: true,
      message: 'تم تبديل قاعدة البيانات بنجاح (وضع الاختبار)',
      data: {
        type,
        connectionString: connectionString.substring(0, 50) + '...',
        connected: true
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