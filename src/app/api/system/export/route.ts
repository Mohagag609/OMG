import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import * as tar from 'tar'

// Simple database config for API use
const getDatabaseConfig = () => {
  const databaseType = process.env.DATABASE_TYPE as 'postgresql-cloud' | 'postgresql-local' | 'sqlite'

  if (!databaseType) {
    throw new Error('DATABASE_TYPE environment variable is required')
  }

  let url: string
  let provider: 'postgresql' | 'sqlite'

  switch (databaseType) {
    case 'postgresql-cloud':
      url = process.env.DATABASE_URL_POSTGRES_CLOUD || process.env.DATABASE_URL || ''
      provider = 'postgresql'
      break
    case 'postgresql-local':
      url = process.env.DATABASE_URL_POSTGRES_LOCAL || process.env.DATABASE_URL || ''
      provider = 'postgresql'
      break
    case 'sqlite':
      url = process.env.DATABASE_URL_SQLITE || process.env.DATABASE_URL || ''
      provider = 'sqlite'
      break
    default:
      throw new Error(`Unsupported DATABASE_TYPE: ${databaseType}`)
  }

  if (!url) {
    throw new Error(`Database URL not found for type: ${databaseType}`)
  }

  return { type: databaseType, url, provider }
}

// Models to export
const MODELS = [
  'User', 'Customer', 'Unit', 'Contract', 'Installment', 'Voucher', 'Safe',
  'Partner', 'Broker', 'Transfer'
]

async function runExport(options: { outputDir?: string; batchSize?: number } = {}): Promise<string> {
  const { outputDir = '/tmp/backups', batchSize = 1000 } = options
  
  console.log('🚀 Starting database export...')
  
  const config = getDatabaseConfig()
  console.log(`📊 Database type: ${config.type}`)
  console.log(`🔗 Provider: ${config.provider}`)
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: config.url
      }
    }
  })

  try {
    // Create temp directory
    const tempDir = path.join(outputDir, `backup-${config.type}-${new Date().toISOString().replace(/[:.]/g, '-')}`)
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    const dataDir = path.join(tempDir, 'data')
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }

    let totalRecords = 0
    const modelStats: Record<string, number> = {}

    // Export each model
    for (const modelName of MODELS) {
      try {
        console.log(`📦 Exporting ${modelName}...`)
        
        // Get model from Prisma client
        const model = (prisma as any)[modelName.toLowerCase()]
        if (!model) {
          console.log(`⚠️  Model ${modelName} not found in Prisma client`)
          continue
        }

        // Fetch all records
        const records = await model.findMany()
        const count = records.length
        totalRecords += count
        modelStats[modelName] = count

        console.log(`✅ ${modelName}: ${count} records`)

        // Write to NDJSON file
        const filePath = path.join(dataDir, `${modelName}.ndjson`)
        const content = records.map((record: any) => JSON.stringify(record)).join('\n')
        fs.writeFileSync(filePath, content)

      } catch (error) {
        console.error(`❌ Error exporting ${modelName}:`, error)
        // Continue with other models
      }
    }

    // Create manifest
    const manifest = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      database: {
        type: config.type,
        provider: config.provider,
        url: config.url.replace(/\/\/.*@/, '//***:***@') // Hide credentials
      },
      models: modelStats,
      totalRecords,
      appVersion: process.env.APP_VERSION || '1.0.0',
      prismaMigrationId: process.env.PRISMA_MIGRATION_ID || 'unknown'
    }

    fs.writeFileSync(
      path.join(tempDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    )

    // Create tar.gz archive
    const archivePath = `${tempDir}.tar.gz`
    await tar.create(
      {
        gzip: true,
        file: archivePath,
        cwd: tempDir,
        filter: (path) => !path.includes('node_modules')
      },
      ['.']
    )

    // Clean up temp directory
    fs.rmSync(tempDir, { recursive: true, force: true })

    console.log(`✅ Export completed: ${archivePath}`)
    console.log(`📊 Archive size: ${(fs.statSync(archivePath).size / 1024 / 1024).toFixed(2)} MB`)
    console.log(`📈 Total records: ${totalRecords}`)
    console.log(`🎉 Backup created: ${path.basename(archivePath)}`)

    return archivePath

  } finally {
    await prisma.$disconnect()
  }
}

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