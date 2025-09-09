import { NextRequest, NextResponse } from 'next/server'
// Import the import function directly
async function runImport(archivePath: string, options: { dryRun?: boolean; mode?: 'replace' | 'upsert'; batchSize?: number } = {}): Promise<{
  success: boolean
  dryRun: boolean
  stats: Record<string, number>
  warnings: string[]
}> {
  // This is a simplified version for API use
  // In production, you might want to move this to a shared utility
  throw new Error('Import functionality not available in API mode. Use CLI scripts instead.')
}
import { z } from 'zod'
import * as fs from 'fs'
import * as path from 'path'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Validation schema
const ImportRequestSchema = z.object({
  base64: z.string().optional(),
  url: z.string().url().optional(),
  apply: z.boolean().default(false),
  mode: z.enum(['replace', 'upsert']).default('replace')
}).refine(
  (data) => data.base64 || data.url,
  {
    message: "Either 'base64' or 'url' must be provided"
  }
)

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting backup import via API...')
    
    const body = await request.json()
    const validatedData = ImportRequestSchema.parse(body)
    
    const { base64, url, apply, mode } = validatedData

    let archivePath: string

    if (base64) {
      // Handle base64 data
      console.log('📦 Processing base64 backup data...')
      
      const buffer = Buffer.from(base64, 'base64')
      const fileName = `backup-${Date.now()}.tar.gz`
      archivePath = path.join('/tmp', fileName)
      
      fs.writeFileSync(archivePath, buffer)
      
    } else if (url) {
      // Handle URL download
      console.log(`📥 Downloading backup from URL: ${url}`)
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to download backup: ${response.statusText}`)
      }
      
      const buffer = await response.arrayBuffer()
      const fileName = `backup-${Date.now()}.tar.gz`
      archivePath = path.join('/tmp', fileName)
      
      fs.writeFileSync(archivePath, Buffer.from(buffer))
    } else {
      throw new Error('No backup data provided')
    }

    // Verify file exists and is valid
    if (!fs.existsSync(archivePath)) {
      throw new Error('Backup file was not created')
    }

    const stats = fs.statSync(archivePath)
    console.log(`📊 Backup file size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`)

    // Run import
    const result = await runImport(archivePath, {
      dryRun: !apply,
      mode
    })

    // Clean up the temporary file
    fs.unlinkSync(archivePath)

    console.log(`✅ Import ${result.dryRun ? 'dry run' : 'completed'} successfully!`)

    return NextResponse.json({
      success: true,
      dryRun: result.dryRun,
      mode,
      stats: result.stats,
      warnings: result.warnings,
      message: result.dryRun 
        ? 'Dry run completed - no changes made'
        : 'Import completed successfully'
    })

  } catch (error) {
    console.error('❌ Import API failed:', error)
    
    // Clean up any temporary files
    try {
      const tempFiles = fs.readdirSync('/tmp').filter(f => f.startsWith('backup-'))
      tempFiles.forEach(f => fs.unlinkSync(path.join('/tmp', f)))
    } catch (cleanupError) {
      console.warn('Failed to clean up temporary files:', cleanupError)
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to import backup',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 400 }
    )
  }
}