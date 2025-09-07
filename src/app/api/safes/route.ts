import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Safe, ApiResponse, PaginatedResponse } from '@/types'
import { validateAmount, getValidationError } from '@/utils/validation'

// GET /api/safes - Get all safes with pagination and search


export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Build where clause for search
    const where = search ? {
      name: { contains: search }
    } : {}

    // Get safes with pagination
    const [safes, total] = await Promise.all([
      prisma.safe.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          name: true,
          balance: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.safe.count({ where })
    ])

    const response: PaginatedResponse<Safe> = {
      data: safes.map(safe => ({
        id: safe.id,
        name: safe.name,
        balance: safe.balance
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching safes:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}

// POST /api/safes - Create new safe
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, balance } = body

    // Validation
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'اسم الخزنة مطلوب' },
        { status: 400 }
      )
    }

    if (balance !== undefined && !validateAmount(balance)) {
      return NextResponse.json(
        { success: false, error: getValidationError('amount', 'invalid') },
        { status: 400 }
      )
    }

    // Check for duplicate name
    const existingSafe = await prisma.safe.findUnique({
      where: { name: name.trim() }
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
        name: name.trim(),
        balance: balance || 0
      }
    })

    const response: ApiResponse<Safe> = {
      success: true,
      data: {
        id: safe.id,
        name: safe.name,
        balance: safe.balance
      },
      message: 'تم إضافة الخزنة بنجاح'
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error creating safe:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}