import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Simple in-memory cache
const cache = new Map()
const CACHE_TTL = 2 * 60 * 1000 // 2 minutes

export async function GET() {
  try {
    await prisma.$connect()
    
    // Check cache first
    const cacheKey = 'partners-list'
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        data: cached.data,
        message: 'تم تحميل الشركاء من الذاكرة المؤقتة'
      })
    }

    const partners = await prisma.partner.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        phone: true,
        notes: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // Cache the result
    cache.set(cacheKey, {
      data: partners,
      timestamp: Date.now()
    })

    return NextResponse.json({
      success: true,
      data: partners,
      message: 'تم تحميل الشركاء بنجاح'
    })

  } catch (error) {
    console.error('Error fetching partners:', error)
    return NextResponse.json({
      success: false,
      error: 'خطأ في تحميل الشركاء'
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
    
    const partner = await prisma.partner.create({
      data: {
        name: body.name,
        phone: body.phone,
        notes: body.notes
      },
      select: {
        id: true,
        name: true,
        phone: true,
        notes: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // Invalidate cache
    cache.delete('partners-list')

    return NextResponse.json({
      success: true,
      data: partner,
      message: 'تم إضافة الشريك بنجاح'
    })

  } catch (error) {
    console.error('Error adding partner:', error)
    return NextResponse.json({
      success: false,
      error: 'خطأ في إضافة الشريك'
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
        error: 'معرف الشريك مطلوب'
      }, { status: 400 })
    }

    const partner = await prisma.partner.update({
      where: { id },
      data: {
        name: body.name,
        phone: body.phone,
        notes: body.notes
      },
      select: {
        id: true,
        name: true,
        phone: true,
        notes: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // Invalidate cache
    cache.delete('partners-list')

    return NextResponse.json({
      success: true,
      data: partner,
      message: 'تم تحديث الشريك بنجاح'
    })

  } catch (error) {
    console.error('Error updating partner:', error)
    return NextResponse.json({
      success: false,
      error: 'خطأ في تحديث الشريك'
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
        error: 'معرف الشريك مطلوب'
      }, { status: 400 })
    }

    await prisma.partner.update({
      where: { id },
      data: { deletedAt: new Date() }
    })

    // Invalidate cache
    cache.delete('partners-list')

    return NextResponse.json({
      success: true,
      message: 'تم حذف الشريك بنجاح'
    })

  } catch (error) {
    console.error('Error deleting partner:', error)
    return NextResponse.json({
      success: false,
      error: 'خطأ في حذف الشريك'
    }, { status: 500 })
  } finally {
    try {
      await prisma.$disconnect()
    } catch (disconnectError) {
      console.error('Error disconnecting from database:', disconnectError)
    }
  }
}