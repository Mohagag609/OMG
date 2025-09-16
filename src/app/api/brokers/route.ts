import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Simple in-memory cache
const cache = new Map()
const CACHE_TTL = 2 * 60 * 1000 // 2 minutes

export async function GET() {
  try {
    await prisma.$connect()
    
    // Check cache first
    const cacheKey = 'brokers-list'
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        data: cached.data,
        message: 'تم تحميل الوسطاء من الذاكرة المؤقتة'
      })
    }

    const brokers = await prisma.broker.findMany({
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
      data: brokers,
      timestamp: Date.now()
    })

    return NextResponse.json({
      success: true,
      data: brokers,
      message: 'تم تحميل الوسطاء بنجاح'
    })

  } catch (error) {
    console.error('Error fetching brokers:', error)
    return NextResponse.json({
      success: false,
      error: 'خطأ في تحميل الوسطاء'
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
    
    const broker = await prisma.broker.create({
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
    cache.delete('brokers-list')

    return NextResponse.json({
      success: true,
      data: broker,
      message: 'تم إضافة الوكيل بنجاح'
    })

  } catch (error) {
    console.error('Error adding broker:', error)
    return NextResponse.json({
      success: false,
      error: 'خطأ في إضافة الوكيل'
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
        error: 'معرف الوكيل مطلوب'
      }, { status: 400 })
    }

    const broker = await prisma.broker.update({
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
    cache.delete('brokers-list')

    return NextResponse.json({
      success: true,
      data: broker,
      message: 'تم تحديث الوكيل بنجاح'
    })

  } catch (error) {
    console.error('Error updating broker:', error)
    return NextResponse.json({
      success: false,
      error: 'خطأ في تحديث الوكيل'
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
        error: 'معرف الوكيل مطلوب'
      }, { status: 400 })
    }

    await prisma.broker.update({
      where: { id },
      data: { deletedAt: new Date() }
    })

    // Invalidate cache
    cache.delete('brokers-list')

    return NextResponse.json({
      success: true,
      message: 'تم حذف الوكيل بنجاح'
    })

  } catch (error) {
    console.error('Error deleting broker:', error)
    return NextResponse.json({
      success: false,
      error: 'خطأ في حذف الوكيل'
    }, { status: 500 })
  } finally {
    try {
      await prisma.$disconnect()
    } catch (disconnectError) {
      console.error('Error disconnecting from database:', disconnectError)
    }
  }
}