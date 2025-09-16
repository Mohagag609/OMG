import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Simple in-memory cache
const cache = new Map()
const CACHE_TTL = 2 * 60 * 1000 // 2 minutes

export async function GET() {
  try {
    const brokers = await prisma.broker.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        phone: true,
        notes: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: brokers
    })

  } catch (error) {
    console.error('Error fetching brokers:', error)
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
    
    const item = await prisma.broker.create({
      data: body
    })

    // Invalidate cache
    cache.delete('brokers-list')

    return NextResponse.json({
      success: true,
      data: item,
      message: 'تم الإضافة بنجاح'
    })

  } catch (error) {
    console.error('Error creating item:', error)
    
    return NextResponse.json({
      success: false,
      error: 'خطأ في الإضافة'
    }, { status: 500 })
  }
}
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const body = await request.json()
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'معرف العنصر مطلوب'
      }, { status: 400 })
    }

    const item = await prisma.broker.update({
      where: { id },
      data: body
    })

    // Invalidate cache
    cache.delete('brokers-list')

    return NextResponse.json({
      success: true,
      data: item,
      message: 'تم التحديث بنجاح'
    })

  } catch (error) {
    console.error('Error updating item:', error)
    
    return NextResponse.json({
      success: false,
      error: 'خطأ في التحديث'
    }, { status: 500 })
  }
}
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'معرف العنصر مطلوب'
      }, { status: 400 })
    }

    // Soft delete
    await prisma.broker.update({
      where: { id },
      data: { deletedAt: new Date() }
    })

    // Invalidate cache
    cache.delete('brokers-list')

    return NextResponse.json({
      success: true,
      message: 'تم الحذف بنجاح'
    })

  } catch (error) {
    console.error('Error deleting item:', error)
    
    return NextResponse.json({
      success: false,
      error: 'خطأ في الحذف'
    }, { status: 500 })
  }
}