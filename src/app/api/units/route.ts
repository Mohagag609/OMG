import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Simple in-memory cache
const cache = new Map()
const CACHE_TTL = 2 * 60 * 1000 // 2 minutes

export async function GET() {
  try {
    // Check cache first
    const cacheKey = 'units-list'
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        data: cached.data,
        message: 'تم تحميل الوحدات من الذاكرة المؤقتة'
      })
    }

    const units = await prisma.unit.findMany({
      where: { deletedAt: null },
      include: {
        unitPartners: {
          include: {
            partner: {
              select: { id: true, name: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Cache the result
    cache.set(cacheKey, {
      data: units,
      timestamp: Date.now()
    })

    return NextResponse.json({
      success: true,
      data: units,
      message: 'تم تحميل الوحدات بنجاح'
    })

  } catch (error) {
    console.error('Error fetching units:', error)
    
    return NextResponse.json({
      success: false,
      error: 'خطأ في قاعدة البيانات'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const unit = await prisma.unit.create({
      data: {
        code: body.code,
        name: body.name,
        unitType: body.unitType || 'سكني',
        area: body.area,
        floor: body.floor,
        building: body.building,
        totalPrice: parseFloat(body.totalPrice) || 0,
        status: body.status || 'متاحة',
        notes: body.notes
      },
      include: {
        unitPartners: {
          include: {
            partner: {
              select: { id: true, name: true }
            }
          }
        }
      }
    })

    // Invalidate cache
    cache.delete('units-list')

    return NextResponse.json({
      success: true,
      data: unit,
      message: 'تم إضافة الوحدة بنجاح'
    })

  } catch (error) {
    console.error('Error creating unit:', error)
    
    return NextResponse.json({
      success: false,
      error: 'خطأ في إضافة الوحدة'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}