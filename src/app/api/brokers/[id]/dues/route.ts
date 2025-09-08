import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/brokers/[id]/dues - Get broker dues for specific broker
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'غير مخول للوصول' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const user = await getUserFromToken(token)

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مخول للوصول' },
        { status: 401 }
      )
    }

    const brokerDues = await prisma.brokerDue.findMany({
      where: {
        brokerId: params.id,
        deletedAt: null
      },
      include: {
        broker: true
      },
      orderBy: { createdAt: 'desc' }
    })

    const response: ApiResponse<any> = {
      success: true,
      data: brokerDues
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error getting broker dues:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}