import { NextRequest, NextResponse } from 'next/server'
import { requireAdminKey, handleWipe, WipePayload } from '@/lib/db-admin'

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
    const { confirm } = body
    
    // Validate confirmation
    if (!confirm) {
      return NextResponse.json(
        { ok: false, message: 'يجب تأكيد عملية المسح' },
        { status: 400 }
      )
    }
    
    // Prepare payload
    const payload: WipePayload = {
      confirm: true
    }
    
    // Handle the operation
    const result = await handleWipe(payload)
    
    return NextResponse.json(result, { 
      status: result.ok ? 200 : 400 
    })
    
  } catch (error) {
    console.error('❌ خطأ في API wipe:', error)
    return NextResponse.json(
      { 
        ok: false, 
        message: error instanceof Error ? error.message : 'خطأ غير معروف' 
      },
      { status: 500 }
    )
  }
}