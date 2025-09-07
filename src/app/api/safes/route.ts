import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ApiResponse, Safe, PaginatedResponse } from '@/types'
import { ensureEnvironmentVariables } from '@/lib/env'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/safes - Get safes with pagination
export async function GET(request: NextRequest) {
  try {
    ensureEnvironmentVariables()
    console.log('💰 جاري تحميل الخزن...')

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    let whereClause: any = { deletedAt: null }

    if (search) {
      whereClause.name = { contains: search, mode: 'insensitive' }
    }

    const skip = (page - 1) * limit
    const [safes, total] = await Promise.all([
      prisma.safe.findMany({
        where: whereClause,
        include: {
          vouchers: {
            where: { deletedAt: null },
            take: 5,
            orderBy: { createdAt: 'desc' }
          },
          transfersFrom: {
            where: { deletedAt: null },
            take: 5,
            orderBy: { createdAt: 'desc' }
          },
          transfersTo: {
            where: { deletedAt: null },
            take: 5,
            orderBy: { createdAt: 'desc' }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.safe.count({ where: whereClause })
    ])

    const totalPages = Math.ceil(total / limit)

    const response: PaginatedResponse<Safe> = {
      success: true,
      data: safes,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error getting safes:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}

// POST /api/safes - Create new safe
export async function POST(request: NextRequest) {
  try {
    ensureEnvironmentVariables()
    console.log('➕ جاري إنشاء خزنة جديدة...')

    const body = await request.json()
    const { name, balance } = body

    // Validation
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'اسم الخزنة مطلوب' },
        { status: 400 }
      )
    }

    if (balance && balance < 0) {
      return NextResponse.json(
        { success: false, error: 'الرصيد لا يمكن أن يكون سالباً' },
        { status: 400 }
      )
    }

    // Check if safe name already exists
    const existingSafe = await prisma.safe.findUnique({
      where: { name }
    })

    if (existingSafe) {
      return NextResponse.json(
        { success: false, error: 'اسم الخزنة مستخدم بالفعل' },
        { status: 400 }
      )
    }

    // Create safe
    const safe = await prisma.safe.create({
      data: {
        name,
        balance: balance || 0
      }
    })

    const response: ApiResponse<Safe> = {
      success: true,
      data: safe,
      message: 'تم إضافة الخزنة بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error creating safe:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}