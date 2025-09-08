import { NextRequest, NextResponse } from 'next/server'
import { requireAdminKey, handleInitOrSwitch, InitOrSwitchPayload } from '@/lib/db-admin'

export async function POST(request: NextRequest) {
  try {
    // Check admin key
    if (!requireAdminKey(request.headers)) {
      return NextResponse.json(
        { ok: false, message: 'مفتاح الأدمن غير صحيح أو مفقود' },
        { status: 401 }
      )
    }
    
    // Parse request body
    const body = await request.json()
    const { type, seed = false, pg, cloudUrl } = body
    
    console.log('🔍 API Switch - البيانات المستلمة:', {
      type,
      seed,
      pg: pg ? 'موجود' : 'غير موجود',
      cloudUrl: cloudUrl ? `موجود (${cloudUrl.substring(0, 30)}...)` : 'غير موجود',
      bodyKeys: Object.keys(body),
      fullBody: JSON.stringify(body, null, 2)
    })
    
    // Validate required fields
    if (!type) {
      console.log('❌ خطأ: نوع قاعدة البيانات مفقود')
      return NextResponse.json(
        { 
          ok: false, 
          message: 'نوع قاعدة البيانات مطلوب',
          details: {
            receivedType: type,
            receivedData: body
          }
        },
        { status: 400 }
      )
    }
    
    // Validate type
    const validTypes = ['sqlite', 'postgresql-local', 'postgresql-cloud']
    if (!validTypes.includes(type)) {
      console.log('❌ خطأ: نوع قاعدة البيانات غير صحيح:', type)
      return NextResponse.json(
        { 
          ok: false, 
          message: 'نوع قاعدة البيانات غير صحيح',
          details: {
            receivedType: type,
            validTypes: validTypes,
            receivedData: body
          }
        },
        { status: 400 }
      )
    }
    
    // Validate PostgreSQL local configuration
    if (type === 'postgresql-local') {
      if (!pg || !pg.host || !pg.port || !pg.user || !pg.password || !pg.database) {
        return NextResponse.json(
          { ok: false, message: 'إعدادات PostgreSQL المحلي مطلوبة' },
          { status: 400 }
        )
      }
    }
    
    // Validate PostgreSQL cloud configuration
    if (type === 'postgresql-cloud') {
      console.log('🔍 التحقق من إعدادات PostgreSQL السحابي:', {
        cloudUrl: cloudUrl ? `موجود (${cloudUrl.length} حرف)` : 'غير موجود',
        cloudUrlEmpty: cloudUrl ? cloudUrl.trim() === '' : true,
        cloudUrlStartsWithPostgresql: cloudUrl ? cloudUrl.startsWith('postgresql://') : false
      })
      
      if (!cloudUrl || cloudUrl.trim() === '') {
        console.log('❌ خطأ: رابط قاعدة البيانات السحابية مفقود أو فارغ')
        return NextResponse.json(
          { 
            ok: false, 
            message: 'رابط قاعدة البيانات السحابية مطلوب - يرجى إدخال رابط PostgreSQL الصحيح',
            details: {
              receivedCloudUrl: cloudUrl,
              cloudUrlEmpty: cloudUrl ? cloudUrl.trim() === '' : true,
              receivedData: body
            }
          },
          { status: 400 }
        )
      }
      
      if (!cloudUrl.startsWith('postgresql://')) {
        console.log('❌ خطأ: رابط قاعدة البيانات لا يبدأ بـ postgresql://')
        return NextResponse.json(
          { 
            ok: false, 
            message: 'رابط قاعدة البيانات يجب أن يبدأ بـ postgresql://',
            details: {
              receivedCloudUrl: cloudUrl,
              expectedFormat: 'postgresql://username:password@host:port/database',
              receivedData: body
            }
          },
          { status: 400 }
        )
      }
    }
    
    // Prepare payload
    const payload: InitOrSwitchPayload = {
      type,
      mode: 'switch',
      seed,
      pg,
      cloudUrl
    }
    
    // Handle the operation
    const result = await handleInitOrSwitch(payload)
    
    return NextResponse.json(result, { 
      status: result.ok ? 200 : 400 
    })
    
  } catch (error) {
    console.error('❌ خطأ في API switch:', error)
    console.error('❌ تفاصيل الخطأ:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      errorType: typeof error,
      errorString: String(error)
    })
    
    return NextResponse.json(
      { 
        ok: false, 
        message: error instanceof Error ? error.message : 'خطأ غير معروف',
        details: {
          errorName: error instanceof Error ? error.name : 'Unknown',
          errorType: typeof error,
          errorString: String(error),
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    )
  }
}