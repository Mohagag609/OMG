// API route for database wipe
import { NextRequest, NextResponse } from 'next/server'
import { requireAdminKey, handleWipe, WipeDatabaseRequest } from '@/lib/db-admin'

export async function POST(request: NextRequest) {
  try {
    // Check admin key
    requireAdminKey(request.headers)
    
    // Parse request body
    const body: WipeDatabaseRequest = await request.json()
    
    // Validate confirmation
    if (!body.confirm) {
      return NextResponse.json(
        { success: false, message: 'تأكيد العملية مطلوب' },
        { status: 400 }
      )
    }
    
    // Handle database wipe
    const result = await handleWipe(body)
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message
      })
    } else {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('❌ خطأ في مسح قاعدة البيانات:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'خطأ في مسح قاعدة البيانات' 
      },
      { status: 500 }
    )
  }
}