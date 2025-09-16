import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Simple in-memory cache
const cache = new Map()
const CACHE_TTL = 2 * 60 * 1000 // 2 minutes

export async function GET() {
  try {
    await prisma.$connect()
    
    // Check cache first
    const cacheKey = 'unit-partners-list'
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        data: cached.data,
        message: 'تم تحميل شركاء الوحدات من الذاكرة المؤقتة'
      })
    }

    const unitPartners = await prisma.unitPartner.findMany({
      where: { deletedAt: null },
      include: {
        unit: { select: { id: true, name: true, code: true } },
        partner: { select: { id: true, name: true, phone: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Cache the result
    cache.set(cacheKey, {
      data: unitPartners,
      timestamp: Date.now()
    })

    return NextResponse.json({
      success: true,
      data: unitPartners,
      message: 'تم تحميل شركاء الوحدات بنجاح'
    })

  } catch (error) {
    console.error('Error fetching unit partners:', error)
    return NextResponse.json({
      success: false,
      error: 'خطأ في تحميل شركاء الوحدات'
    }, { status: 500 })
  } finally {
    try {
      await prisma.$disconnect()
    } catch (disconnectError) {
      console.error('Error disconnecting from database:', disconnectError)
    }
  }
}

export async function POST(request: Request) {
  try {
    await prisma.$connect()
    const body = await request.json()
    
    const unitPartner = await prisma.unitPartner.create({
      data: {
        unitId: body.unitId,
        partnerId: body.partnerId,
        percentage: body.percentage || 0
      },
      include: {
        unit: { select: { id: true, name: true, code: true } },
        partner: { select: { id: true, name: true, phone: true } }
      }
    })

    // Invalidate cache
    cache.delete('unit-partners-list')

    return NextResponse.json({
      success: true,
      data: unitPartner,
      message: 'تم إضافة شريك الوحدة بنجاح'
    })

  } catch (error) {
    console.error('Error adding unit partner:', error)
    return NextResponse.json({
      success: false,
      error: 'خطأ في إضافة شريك الوحدة'
    }, { status: 500 })
  } finally {
    try {
      await prisma.$disconnect()
    } catch (disconnectError) {
      console.error('Error disconnecting from database:', disconnectError)
    }
  }
}

export async function PUT(request: Request) {
  try {
    await prisma.$connect()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const body = await request.json()
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'معرف شريك الوحدة مطلوب'
      }, { status: 400 })
    }

    const unitPartner = await prisma.unitPartner.update({
      where: { id },
      data: {
        unitId: body.unitId,
        partnerId: body.partnerId,
        percentage: body.percentage
      },
      include: {
        unit: { select: { id: true, name: true, code: true } },
        partner: { select: { id: true, name: true, phone: true } }
      }
    })

    // Invalidate cache
    cache.delete('unit-partners-list')

    return NextResponse.json({
      success: true,
      data: unitPartner,
      message: 'تم تحديث شريك الوحدة بنجاح'
    })

  } catch (error) {
    console.error('Error updating unit partner:', error)
    return NextResponse.json({
      success: false,
      error: 'خطأ في تحديث شريك الوحدة'
    }, { status: 500 })
  } finally {
    try {
      await prisma.$disconnect()
    } catch (disconnectError) {
      console.error('Error disconnecting from database:', disconnectError)
    }
  }
}

export async function DELETE(request: Request) {
  try {
    await prisma.$connect()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'معرف شريك الوحدة مطلوب'
      }, { status: 400 })
    }

    await prisma.unitPartner.update({
      where: { id },
      data: { deletedAt: new Date() }
    })

    // Invalidate cache
    cache.delete('unit-partners-list')

    return NextResponse.json({
      success: true,
      message: 'تم حذف شريك الوحدة بنجاح'
    })

  } catch (error) {
    console.error('Error deleting unit partner:', error)
    return NextResponse.json({
      success: false,
      error: 'خطأ في حذف شريك الوحدة'
    }, { status: 500 })
  } finally {
    try {
      await prisma.$disconnect()
    } catch (disconnectError) {
      console.error('Error disconnecting from database:', disconnectError)
    }
  }
}