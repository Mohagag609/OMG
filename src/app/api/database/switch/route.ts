import { NextRequest, NextResponse } from 'next/server'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { databaseType } = await request.json()

    if (!['sqlite', 'postgresql'].includes(databaseType)) {
      return NextResponse.json({
        success: false,
        error: 'نوع قاعدة البيانات غير صحيح'
      }, { status: 400 })
    }

    // Switch database using the script
    try {
      execSync(`node scripts/switch-database.js ${databaseType}`, { 
        stdio: 'pipe',
        cwd: process.cwd()
      })
    } catch (error) {
      console.error('Error switching database:', error)
      return NextResponse.json({
        success: false,
        error: `فشل في التبديل: ${error.message}`
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `تم التبديل إلى ${databaseType} بنجاح`
    })

  } catch (error) {
    console.error('Database switch error:', error)
    return NextResponse.json({
      success: false,
      error: 'خطأ في الخادم'
    }, { status: 500 })
  }
}