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
    const { type, mode = 'new', seed = false, pg, cloudUrl } = body
    
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
    if (type === 'postgresql-local' && mode === 'new') {
      if (!pg || !pg.host || !pg.port || !pg.user || !pg.password || !pg.database) {
        return NextResponse.json(
          { ok: false, message: 'إعدادات PostgreSQL المحلي مطلوبة' },
          { status: 400 }
        )
      }
    }
    
    // Validate PostgreSQL cloud configuration
    if (type === 'postgresql-cloud' && mode === 'new') {
      if (!cloudUrl) {
        return NextResponse.json(
          { ok: false, message: 'رابط قاعدة البيانات السحابية مطلوب' },
          { status: 400 }
        )
      }
    }
    
    // Prepare payload
    const payload: InitOrSwitchPayload = {
      type,
      mode: 'new',
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
    console.error('❌ خطأ في API init:', error)
    return NextResponse.json(
      { 
        ok: false, 
        message: error instanceof Error ? error.message : 'خطأ غير معروف' 
      },
      { status: 500 }
    )
  }
}