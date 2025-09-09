import { NextRequest, NextResponse } from 'next/server'
// Import the wipe function directly
async function runWipe(options: { mode: 'soft' | 'hard'; confirm?: boolean }): Promise<{
  success: boolean
  mode: 'soft' | 'hard'
  deletedCounts: Record<string, number>
}> {
  // This is a simplified version for API use
  // In production, you might want to move this to a shared utility
  throw new Error('Wipe functionality not available in API mode. Use CLI scripts instead.')
}
import { z } from 'zod'

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