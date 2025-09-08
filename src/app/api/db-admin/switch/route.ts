// API route for database switching
import { NextRequest, NextResponse } from 'next/server'
import { requireAdminKey, handleInitOrSwitch, SwitchDatabaseRequest } from '@/lib/db-admin'

export async function POST(request: NextRequest) {
  try {
    // Check admin key
    requireAdminKey(request.headers)
    
    // Parse request body
    const body: SwitchDatabaseRequest = await request.json()
    
    // Validate required fields
    if (!body.type) {
      return NextResponse.json(
        { success: false, message: 'نوع قاعدة البيانات مطلوب' },
        { status: 400 }
      )
    }
    
    if (body.mode !== 'switch') {
      return NextResponse.json(
        { success: false, message: 'وضع العملية يجب أن يكون "switch"' },
        { status: 400 }
      )
    }
    
    // Validate PostgreSQL configuration if needed
    if (body.type === 'postgresql-local' && !body.postgres) {
      return NextResponse.json(
        { success: false, message: 'إعدادات PostgreSQL المحلية مطلوبة' },
        { status: 400 }
      )
    }
    
    if (body.type === 'postgresql-cloud' && !body.cloudUrl) {
      return NextResponse.json(
        { success: false, message: 'رابط قاعدة البيانات السحابية مطلوب' },
        { status: 400 }
      )
    }
    
    // Handle database switching
    const result = await handleInitOrSwitch(body)
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        redeployTriggered: result.redeployTriggered || false
      })
    } else {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('❌ خطأ في تبديل قاعدة البيانات:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'خطأ في تبديل قاعدة البيانات' 
      },
      { status: 500 }
    )
  }
}