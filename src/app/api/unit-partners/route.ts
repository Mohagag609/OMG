import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { ApiResponse, UnitPartner, PaginatedResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/unit-partners - Get unit partners with pagination
export async function GET(request: NextRequest) {
  try {
    // Check authentication
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
    const limit = parseInt(searchParams.get('limit') || '100')
    const unitId = searchParams.get('unitId')

    let whereClause: any = { deletedAt: null }

    if (unitId) {
      whereClause.unitId = unitId
    }

    const skip = (page - 1) * limit
    const [unitPartners, total] = await Promise.all([
      prisma.unitPartner.findMany({
        where: whereClause,
        include: {
          unit: true,
          partner: true
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.unitPartner.count({ where: whereClause })
    ])

    const totalPages = Math.ceil(total / limit)

    const response: PaginatedResponse<UnitPartner> = {
      success: true,
      data: unitPartners,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error getting unit partners:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}

// POST /api/unit-partners - Create new unit partner
export async function POST(request: NextRequest) {
  try {
    // Check authentication
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

    const body = await request.json()
    const { unitId, partnerId, percentage } = body

    // Validation
    if (!unitId || !partnerId || !percentage) {
      return NextResponse.json(
        { success: false, error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      )
    }

    if (percentage <= 0 || percentage > 100) {
      return NextResponse.json(
        { success: false, error: 'النسبة يجب أن تكون بين 0 و 100' },
        { status: 400 }
      )
    }

    // Check if unit exists
    const unit = await prisma.unit.findUnique({
      where: { id: unitId }
    })

    if (!unit) {
      return NextResponse.json(
        { success: false, error: 'الوحدة غير موجودة' },
        { status: 400 }
      )
    }

    // Check if partner exists
    const partner = await prisma.partner.findUnique({
      where: { id: partnerId }
    })

    if (!partner) {
      return NextResponse.json(
        { success: false, error: 'الشريك غير موجود' },
        { status: 400 }
      )
    }

    // Check if partner is already linked to this unit
    const existingLink = await prisma.unitPartner.findFirst({
      where: { unitId, partnerId, deletedAt: null }
    })

    if (existingLink) {
      return NextResponse.json(
        { success: false, error: 'هذا الشريك مرتبط بالفعل بهذه الوحدة' },
        { status: 400 }
      )
    }

    // Check total percentage
    const currentTotal = await prisma.unitPartner.aggregate({
      where: { unitId, deletedAt: null },
      _sum: { percentage: true }
    })

    const currentTotalPercent = currentTotal._sum.percentage || 0
    if (currentTotalPercent + percentage > 100) {
      return NextResponse.json(
        { success: false, error: `لا يمكن إضافة هذه النسبة. الإجمالي الحالي هو ${currentTotalPercent}%. إضافة ${percentage}% سيجعل المجموع يتجاوز 100%.` },
        { status: 400 }
      )
    }

    // Create unit partner
    const unitPartner = await prisma.unitPartner.create({
      data: {
        unitId,
        partnerId,
        percentage
      },
      include: {
        unit: true,
        partner: true
      }
    })

    const response: ApiResponse<UnitPartner> = {
      success: true,
      data: unitPartner,
      message: 'تم ربط الشريك بالوحدة بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error creating unit partner:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}