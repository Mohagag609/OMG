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
      cloudUrl: cloudUrl ? `موجود (${cloudUrl.substring(0, 30)}...)` : 'غير موجود'
    })
    
    // Validate required fields
    if (!type) {
      return NextResponse.json(
        { ok: false, message: 'نوع قاعدة البيانات مطلوب' },
        { status: 400 }
      )
    }
    
    // Validate type
    const validTypes = ['sqlite', 'postgresql-local', 'postgresql-cloud']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { ok: false, message: 'نوع قاعدة البيانات غير صحيح' },
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
      if (!cloudUrl || cloudUrl.trim() === '') {
        return NextResponse.json(
          { ok: false, message: 'رابط قاعدة البيانات السحابية مطلوب - يرجى إدخال رابط PostgreSQL الصحيح' },
          { status: 400 }
        )
      }
      
      if (!cloudUrl.startsWith('postgresql://')) {
        return NextResponse.json(
          { ok: false, message: 'رابط قاعدة البيانات يجب أن يبدأ بـ postgresql://' },
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
    return NextResponse.json(
      { 
        ok: false, 
        message: error instanceof Error ? error.message : 'خطأ غير معروف' 
      },
      { status: 500 }
    )
  }
}