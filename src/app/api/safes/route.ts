import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Simple in-memory cache
const cache = new Map()
const CACHE_TTL = 2 * 60 * 1000 // 2 minutes

export async function GET() {
  try {
    await prisma.$connect()
    
    // Check cache first
    const cacheKey = 'safes-list'
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        data: cached.data,
        message: 'تم تحميل الخزائن من الذاكرة المؤقتة'
      })
    }

    const safes = await prisma.safe.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        balance: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // Cache the result
    cache.set(cacheKey, {
      data: safes,
      timestamp: Date.now()
    })

    return NextResponse.json({
      success: true,
      data: safes,
      message: 'تم تحميل الخزائن بنجاح'
    })

  } catch (error) {
    console.error('Error fetching safes:', error)
    return NextResponse.json({
      success: false,
      error: 'خطأ في تحميل الخزائن'
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
    
    const safe = await prisma.safe.create({
      data: {
        name: body.name,
        balance: body.balance || 0
      },
      select: {
        id: true,
        name: true,
        balance: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // Invalidate cache
    cache.delete('safes-list')

    return NextResponse.json({
      success: true,
      data: safe,
      message: 'تم إضافة الخزينة بنجاح'
    })

  } catch (error) {
    console.error('Error adding safe:', error)
    return NextResponse.json({
      success: false,
      error: 'خطأ في إضافة الخزينة'
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
        error: 'معرف الخزينة مطلوب'
      }, { status: 400 })
    }

    const safe = await prisma.safe.update({
      where: { id },
      data: {
        name: body.name,
        balance: body.balance
      },
      select: {
        id: true,
        name: true,
        balance: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // Invalidate cache
    cache.delete('safes-list')

    return NextResponse.json({
      success: true,
      data: safe,
      message: 'تم تحديث الخزينة بنجاح'
    })

  } catch (error) {
    console.error('Error updating safe:', error)
    return NextResponse.json({
      success: false,
      error: 'خطأ في تحديث الخزينة'
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
        error: 'معرف الخزينة مطلوب'
      }, { status: 400 })
    }

    await prisma.safe.update({
      where: { id },
      data: { deletedAt: new Date() }
    })

    // Invalidate cache
    cache.delete('safes-list')

    return NextResponse.json({
      success: true,
      message: 'تم حذف الخزينة بنجاح'
    })

  } catch (error) {
    console.error('Error deleting safe:', error)
    return NextResponse.json({
      success: false,
      error: 'خطأ في حذف الخزينة'
    }, { status: 500 })
  } finally {
    try {
      await prisma.$disconnect()
    } catch (disconnectError) {
      console.error('Error disconnecting from database:', disconnectError)
    }
  }
}