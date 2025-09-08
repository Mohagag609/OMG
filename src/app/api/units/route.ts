import { NextRequest, NextResponse } from 'next/server'
import { validateUnit } from '@/utils/validation'
import { ApiResponse, Unit, PaginatedResponse } from '@/types'
import { ensureEnvironmentVariables } from '@/lib/env'
import { createAdvancedArabicSearch } from '@/utils/arabicSearch'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/units - Get units with pagination
export async function GET(request: NextRequest) {
  let prisma: any = null
  try {
    ensureEnvironmentVariables()
    console.log('🏠 جاري تحميل الوحدات...')

    // Create Prisma client with environment variables
    const { PrismaClient } = await import('@prisma/client')
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    })

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    const whereClause: any = { deletedAt: null }

    if (search) {
      // استخدام البحث المتقدم للعربية
      const searchConditions = createAdvancedArabicSearch(search, ['code', 'name', 'unitType', 'building', 'floor'])
      if (searchConditions.OR) {
        whereClause.OR = searchConditions.OR
      }
    }

    const skip = (page - 1) * limit
    const [units, total] = await Promise.all([
      prisma.unit.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          unitPartners: {
            where: { deletedAt: null },
            include: {
              partner: true
            }
          }
        }
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
  } finally {
    if (prisma) {
      await prisma.$disconnect()
    }
  }
}

// POST /api/units - Create new unit
export async function POST(request: NextRequest) {
  let prisma: any = null
  try {
    ensureEnvironmentVariables()
    console.log('➕ جاري إنشاء وحدة جديدة...')

    // Create Prisma client with environment variables
    const { PrismaClient } = await import('@prisma/client')
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    })

    const body = await request.json()
    const { name, unitType, area, floor, building, totalPrice, status, notes, partnerGroupId } = body

    // Validate required fields
    if (!name || !floor || !building || !totalPrice || !partnerGroupId) {
      return NextResponse.json(
        { success: false, error: 'جميع الحقول المطلوبة يجب أن تكون مملوءة' },
        { status: 400 }
      )
    }

    // Generate code from building, floor, and name
    const code = `${building.replace(/\s/g, '')}-${floor.replace(/\s/g, '')}-${name.replace(/\s/g, '')}`

    // Check if code already exists
    const existingUnit = await prisma.unit.findUnique({
      where: { code }
    })

    if (existingUnit) {
      return NextResponse.json(
        { success: false, error: 'وحدة بنفس الاسم والدور والبرج موجودة بالفعل' },
        { status: 400 }
      )
    }

    // Check if partner group exists and has 100% total
    const partnerGroup = await prisma.partnerGroup.findUnique({
      where: { id: partnerGroupId },
      include: { partners: true }
    })

    if (!partnerGroup) {
      return NextResponse.json(
        { success: false, error: 'مجموعة الشركاء غير موجودة' },
        { status: 400 }
      )
    }

    const totalPercent = partnerGroup.partners.reduce((sum: number, p: any) => sum + p.percentage, 0)
    if (totalPercent !== 100) {
      return NextResponse.json(
        { success: false, error: `مجموع نسب الشركاء في هذه المجموعة هو ${totalPercent}% ويجب أن يكون 100% بالضبط` },
        { status: 400 }
      )
    }

    // Create unit and link partners in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Create unit
      const unit = await tx.unit.create({
        data: {
          code,
          name,
          unitType: unitType || 'سكني',
          area,
          floor,
          building,
          totalPrice: parseFloat(totalPrice),
          status: status || 'متاحة',
          notes
        }
      })

      // Link partners from the group to the unit
      for (const groupPartner of partnerGroup.partners) {
        await tx.unitPartner.create({
          data: {
            unitId: unit.id,
            partnerId: groupPartner.partnerId,
            percentage: groupPartner.percentage
          }
        })
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
  } finally {
    if (prisma) {
      await prisma.$disconnect()
    }
  }
}