import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Simple in-memory cache
const cache = new Map()
const CACHE_TTL = 2 * 60 * 1000 // 2 minutes

export async function GET() {
  try {
    await prisma.$connect()
    
    // Check cache first
    const cacheKey = 'partner-groups-list'
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        data: cached.data,
        message: 'تم تحميل مجموعات الشركاء من الذاكرة المؤقتة'
      })
    }

    const partnerGroups = await prisma.partnerGroup.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        notes: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // Cache the result
    cache.set(cacheKey, {
      data: partnerGroups,
      timestamp: Date.now()
    })

    return NextResponse.json({
      success: true,
      data: partnerGroups,
      message: 'تم تحميل مجموعات الشركاء بنجاح'
    })

  } catch (error) {
    console.error('Error fetching partner groups:', error)
    return NextResponse.json({
      success: false,
      error: 'خطأ في تحميل مجموعات الشركاء'
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
    
    const partnerGroup = await prisma.partnerGroup.create({
      data: {
        name: body.name,
        notes: body.notes
      },
      select: {
        id: true,
        name: true,
        notes: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // Invalidate cache
    cache.delete('partner-groups-list')

    return NextResponse.json({
      success: true,
      data: partnerGroup,
      message: 'تم إضافة مجموعة الشركاء بنجاح'
    })

  } catch (error) {
    console.error('Error adding partner group:', error)
    return NextResponse.json({
      success: false,
      error: 'خطأ في إضافة مجموعة الشركاء'
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
        error: 'معرف مجموعة الشركاء مطلوب'
      }, { status: 400 })
    }

    const partnerGroup = await prisma.partnerGroup.update({
      where: { id },
      data: {
        name: body.name,
        notes: body.notes
      },
      select: {
        id: true,
        name: true,
        notes: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // Invalidate cache
    cache.delete('partner-groups-list')

    return NextResponse.json({
      success: true,
      data: partnerGroup,
      message: 'تم تحديث مجموعة الشركاء بنجاح'
    })

  } catch (error) {
    console.error('Error updating partner group:', error)
    return NextResponse.json({
      success: false,
      error: 'خطأ في تحديث مجموعة الشركاء'
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
        error: 'معرف مجموعة الشركاء مطلوب'
      }, { status: 400 })
    }

    await prisma.partnerGroup.update({
      where: { id },
      data: { deletedAt: new Date() }
    })

    // Invalidate cache
    cache.delete('partner-groups-list')

    return NextResponse.json({
      success: true,
      message: 'تم حذف مجموعة الشركاء بنجاح'
    })

  } catch (error) {
    console.error('Error deleting partner group:', error)
    return NextResponse.json({
      success: false,
      error: 'خطأ في حذف مجموعة الشركاء'
    }, { status: 500 })
  } finally {
    try {
      await prisma.$disconnect()
    } catch (disconnectError) {
      console.error('Error disconnecting from database:', disconnectError)
    }
  }
}