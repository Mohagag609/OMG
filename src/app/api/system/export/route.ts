import { NextRequest, NextResponse } from 'next/server'
// Import the export function directly
async function runExport(options: { outputDir?: string; batchSize?: number } = {}): Promise<string> {
  // This is a simplified version for API use
  // In production, you might want to move this to a shared utility
  throw new Error('Export functionality not available in API mode. Use CLI scripts instead.')
}
import * as fs from 'fs'
import * as path from 'path'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting backup export via API...')
    
    // Parse request body for options
    const body = await request.json().catch(() => ({}))
    const { outputDir = '/tmp/backups' } = body

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // Run export
    const archivePath = await runExport({ outputDir })
    
    // Check if file exists
    if (!fs.existsSync(archivePath)) {
      throw new Error('Backup file was not created')
    }

    const stats = fs.statSync(archivePath)
    const fileName = path.basename(archivePath)

    console.log(`✅ Backup created: ${fileName} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`)

    // For large files, consider returning a download URL instead
    // For now, we'll return the file directly
    const fileBuffer = fs.readFileSync(archivePath)
    
    // Clean up the file after reading
    fs.unlinkSync(archivePath)

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/gzip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': stats.size.toString()
      }
    })

  } catch (error) {
    console.error('❌ Export API failed:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create backup',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Also support GET for simple exports
export async function GET(request: NextRequest) {
  return POST(request)
}