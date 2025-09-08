import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST() {
  try {
    const cwd = process.cwd()
    const testFile = path.join(cwd, 'test-save.json')
    
    const testData = {
      message: 'Test save',
      timestamp: new Date().toISOString(),
      cwd
    }
    
    // Try to save file
    fs.writeFileSync(testFile, JSON.stringify(testData, null, 2), 'utf8')
    
    // Check if file exists
    const exists = fs.existsSync(testFile)
    const content = exists ? fs.readFileSync(testFile, 'utf8') : null
    
    // Clean up
    if (exists) {
      fs.unlinkSync(testFile)
    }
    
    return NextResponse.json({
      success: true,
      message: 'File save test completed',
      results: {
        cwd,
        testFile,
        saved: exists,
        content: content ? JSON.parse(content) : null,
        cleaned: true
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        name: error instanceof Error ? error.name : 'Unknown',
        code: (error as any)?.code,
        errno: (error as any)?.errno
      }
    }, { status: 500 })
  }
}