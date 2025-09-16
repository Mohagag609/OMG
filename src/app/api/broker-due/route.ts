import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { ApiResponse, PaginatedResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/broker-due - Get broker dues with pagination
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const brokerId = searchParams.get('brokerId') || ''

    let whereClause: any = { deletedAt: null }

    if (search) {
      whereClause.OR = [
        { broker: { name: { contains: search, mode: 'insensitive' } } },
        { notes: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (status) {
      whereClause.status = status
    }

    if (brokerId) {
      whereClause.brokerId = brokerId
    }

    const skip = (page - 1) * limit
    const [brokerDues, total] = await Promise.all([
      prisma.brokerDue.findMany({
        where: whereClause,
        include: {
          broker: true
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.brokerDue.count({ where: whereClause })
    ])

    const totalPages = Math.ceil(total / limit)

    const response: PaginatedResponse<any> = {
      success: true,
      data: brokerDues,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
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