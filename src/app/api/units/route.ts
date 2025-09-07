import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Unit, ApiResponse, PaginatedResponse } from '@/types'
import { validateUnitCode, getValidationError } from '@/utils/validation'
import { formatUnitCode } from '@/utils/formatting'

// GET /api/units - Get all units with pagination and search

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const unitType = searchParams.get('unitType') || ''
    const building = searchParams.get('building') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Build where clause for filters
    const where: any = {}
    
    if (search) {
      where.OR = [
        { code: { contains: search } },
        { name: { contains: search } },
        { floor: { contains: search } },
        { building: { contains: search } }
      ]
    }
    
    if (status) where.status = status
    if (unitType) where.unitType = unitType
    if (building) where.building = building

    // Get units with pagination
    const [units, total] = await Promise.all([
      prisma.unit.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          code: true,
          name: true,
          unitType: true,
          area: true,
          floor: true,
          building: true,
          totalPrice: true,
          status: true,
          notes: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.unit.count({ where })
    ])

    const response: PaginatedResponse<Unit> = {
      data: units.map(unit => ({
        id: unit.id,
        code: unit.code,
        name: unit.name || undefined,
        unitType: unit.unitType,
        area: unit.area || undefined,
        floor: unit.floor || undefined,
        building: unit.building || undefined,
        totalPrice: unit.totalPrice,
        status: unit.status,
        notes: unit.notes || undefined
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
    console.error('Error fetching units:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}

// POST /api/units - Create new unit
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, name, unitType, area, floor, building, totalPrice, status, notes } = body

    // Validation
    if (!code) {
      return NextResponse.json(
        { success: false, error: 'كود الوحدة مطلوب' },
        { status: 400 }
      )
    }

    if (!validateUnitCode(code)) {
      return NextResponse.json(
        { success: false, error: getValidationError('unitCode', 'invalid') },
        { status: 400 }
      )
    }

    if (totalPrice < 0) {
      return NextResponse.json(
        { success: false, error: 'السعر يجب أن يكون أكبر من أو يساوي صفر' },
        { status: 400 }
      )
    }

    // Check for duplicate code
    const existingUnit = await prisma.unit.findUnique({
      where: { code: formatUnitCode(code) }
    })

    if (existingUnit) {
      return NextResponse.json(
        { success: false, error: 'كود الوحدة مستخدم بالفعل' },
        { status: 400 }
      )
    }

    // Create unit
    const unit = await prisma.unit.create({
      data: {
        code: formatUnitCode(code),
        name: name?.trim() || null,
        unitType: unitType || 'سكني',
        area: area?.trim() || null,
        floor: floor?.trim() || null,
        building: building?.trim() || null,
        totalPrice: totalPrice || 0,
        status: status || 'متاحة',
        notes: notes?.trim() || null
      }
    })

    const response: ApiResponse<Unit> = {
      success: true,
      data: {
        id: unit.id,
        code: unit.code,
        name: unit.name || undefined,
        unitType: unit.unitType,
        area: unit.area || undefined,
        floor: unit.floor || undefined,
        building: unit.building || undefined,
        totalPrice: unit.totalPrice,
        status: unit.status,
        notes: unit.notes || undefined
      },
      message: 'تم إضافة الوحدة بنجاح'
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error creating unit:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}