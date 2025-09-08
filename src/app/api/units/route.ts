import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { validateUnit } from '@/utils/validation'
import { ApiResponse, Unit, PaginatedResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/units - Get units with pagination
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
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    let whereClause: any = { deletedAt: null }

    if (search) {
      whereClause.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { unitType: { contains: search, mode: 'insensitive' } }
      ]
    }

    const skip = (page - 1) * limit
    const [units, total] = await Promise.all([
      prisma.unit.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.unit.count({ where: whereClause })
    ])

    const totalPages = Math.ceil(total / limit)

    const response: PaginatedResponse<Unit> = {
      success: true,
      data: units,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error getting units:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}

// POST /api/units - Create new unit
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
    const { name, unitType, area, floor, building, totalPrice, status, notes, partnerGroupId } = body

    // Validate required fields - الاسم فقط مطلوب
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'اسم الوحدة مطلوب' },
        { status: 400 }
      )
    }

    // Generate code from building, floor, and name
    const sanitizedBuilding = (building || 'غير محدد').replace(/\s/g, '')
    const sanitizedFloor = (floor || 'غير محدد').replace(/\s/g, '')
    const sanitizedName = name.replace(/\s/g, '')
    const code = `${sanitizedBuilding}-${sanitizedFloor}-${sanitizedName}`

    // Check if code already exists
    const existingUnit = await prisma.unit.findFirst({
      where: { 
        code,
        deletedAt: null
      }
    })

    if (existingUnit) {
      return NextResponse.json(
        { success: false, error: 'وحدة بنفس الاسم والدور والبرج موجودة بالفعل' },
        { status: 400 }
      )
    }

    // Check if partner group exists and has 100% total (only if partnerGroupId is provided)
    let partnerGroup = null
    if (partnerGroupId && partnerGroupId.trim()) {
      partnerGroup = await prisma.partnerGroup.findFirst({
        where: { 
          id: partnerGroupId,
          deletedAt: null
        },
        include: { partners: true }
      })

      if (!partnerGroup) {
        return NextResponse.json(
          { success: false, error: 'مجموعة الشركاء غير موجودة' },
          { status: 400 }
        )
      }

      const totalPercent = partnerGroup.partners.reduce((sum, p) => sum + p.percentage, 0)
      if (totalPercent !== 100) {
        return NextResponse.json(
          { success: false, error: `مجموع نسب الشركاء في هذه المجموعة هو ${totalPercent}% ويجب أن يكون 100% بالضبط` },
          { status: 400 }
        )
      }
    }

    // Create unit and link partners in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create unit
      const unit = await tx.unit.create({
        data: {
          code,
          name,
          unitType: unitType || 'سكني',
          area: area || null,
          floor: floor || null,
          building: building || null,
          totalPrice: totalPrice ? parseFloat(totalPrice) : 0,
          status: status || 'متاحة',
          notes: notes || null
        }
      })

      // Link partners from the group to the unit (only if partnerGroup exists)
      if (partnerGroup) {
        for (const groupPartner of partnerGroup.partners) {
          await tx.unitPartner.create({
            data: {
              unitId: unit.id,
              partnerId: groupPartner.partnerId,
              percentage: groupPartner.percentage
            }
          })
        }
      }

      return unit
    })

    const response: ApiResponse<Unit> = {
      success: true,
      data: result,
      message: 'تم إضافة الوحدة وربط الشركاء بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error creating unit:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}