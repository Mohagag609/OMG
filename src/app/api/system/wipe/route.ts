import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

// Simple database config for API use
const getDatabaseConfig = () => {
  const databaseType = (process.env.DATABASE_TYPE || 'postgresql-cloud') as 'postgresql-cloud' | 'postgresql-local' | 'sqlite'

  console.log('🔍 Database type from env:', process.env.DATABASE_TYPE)
  console.log('🔍 Using database type:', databaseType)

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

// Models to wipe (in correct order to respect foreign key constraints)
const MODELS = [
  'Transfer', 'Voucher', 'Safe', 'Installment', 'Contract', 
  'UnitPartner', 'BrokerDue', 'PartnerDebt', 'PartnerGroupPartner',
  'PartnerGroup', 'Broker', 'Partner', 'Unit', 'Customer', 'User'
]

async function runWipe(options: { mode: 'soft' | 'hard'; confirm?: boolean }): Promise<{
  success: boolean
  mode: 'soft' | 'hard'
  deletedCounts: Record<string, number>
}> {
  const { mode, confirm = false } = options
  
  if (!confirm) {
    throw new Error('Confirmation required for wipe operation')
  }

  console.log(`🚀 Starting database wipe (${mode} mode)...`)
  
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
    const deletedCounts: Record<string, number> = {}

    if (mode === 'soft') {
      // Soft delete - use deleteMany for each model
      console.log('🔄 Performing soft delete...')
      
      for (const modelName of MODELS) {
        try {
          const model = (prisma as any)[modelName.toLowerCase()]
          if (!model) {
            console.log(`⚠️  Model ${modelName} not found in Prisma client`)
            continue
          }

          const result = await model.deleteMany({})
          deletedCounts[modelName] = result.count
          console.log(`✅ ${modelName}: ${result.count} records deleted`)

        } catch (error) {
          console.error(`❌ Error deleting ${modelName}:`, error)
          deletedCounts[modelName] = 0
        }
      }

    } else {
      // Hard delete - truncate tables (PostgreSQL only)
      console.log('🔥 Performing hard delete...')
      
      if (config.provider !== 'postgresql') {
        throw new Error('Hard delete is only supported for PostgreSQL databases')
      }

      // Disable foreign key checks temporarily
      await prisma.$executeRaw`SET session_replication_role = replica;`

      for (const modelName of MODELS) {
        try {
          const tableName = modelName.toLowerCase()
          const result = await prisma.$executeRaw`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`
          deletedCounts[modelName] = result
          console.log(`✅ ${modelName}: table truncated`)

        } catch (error) {
          console.error(`❌ Error truncating ${modelName}:`, error)
          deletedCounts[modelName] = 0
        }
      }

      // Re-enable foreign key checks
      await prisma.$executeRaw`SET session_replication_role = DEFAULT;`
    }

    const totalDeleted = Object.values(deletedCounts).reduce((a, b) => a + b, 0)
    console.log(`✅ Wipe completed! Total records deleted: ${totalDeleted}`)

    return {
      success: true,
      mode,
      deletedCounts
    }

  } finally {
    await prisma.$disconnect()
  }
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Validation schema
const WipeRequestSchema = z.object({
  mode: z.enum(['soft', 'hard']).default('soft'),
  confirm: z.boolean().default(false)
})

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting database wipe via API...')
    
    const body = await request.json()
    const validatedData = WipeRequestSchema.parse(body)
    
    const { mode, confirm } = validatedData

    // Additional safety checks
    if (mode === 'hard' && process.env.ALLOW_HARD_WIPE !== 'true') {
      return NextResponse.json(
        {
          success: false,
          error: 'Hard wipe is disabled',
          details: 'Set ALLOW_HARD_WIPE=true environment variable to enable hard wipe'
        },
        { status: 403 }
      )
    }

    if (!confirm) {
      return NextResponse.json(
        {
          success: false,
          error: 'Confirmation required',
          details: 'Set confirm: true to proceed with wipe operation'
        },
        { status: 400 }
      )
    }

    // Run wipe
    const result = await runWipe({
      mode,
      confirm: true
    })

    console.log(`✅ Wipe completed successfully! Mode: ${mode}`)

    return NextResponse.json({
      success: true,
      mode: result.mode,
      deletedCounts: result.deletedCounts,
      totalDeleted: Object.values(result.deletedCounts).reduce((a, b) => a + b, 0),
      message: `Database wiped successfully using ${mode} mode`
    })

  } catch (error) {
    console.error('❌ Wipe API failed:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to wipe database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}