import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Simple in-memory cache
const cache = new Map()
const CACHE_TTL = 2 * 60 * 1000 // 2 minutes

export async function GET() {
  try {
    const unitPartners = await prisma.unitPartner.findMany({
      where: { deletedAt: null },
      include: {
        unit: { select: { id: true, name: true, code: true } },
        partner: { select: { id: true, name: true } }
      }
    })

    return NextResponse.json({
      success: true,
      data: unitPartners
    })

  } catch (error) {
    console.error('Error fetching unit partners:', error)
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
    
    const item = await prisma.unitPartner.create({
      data: body
    })

    // Invalidate cache
    cache.delete('unit-partners-list')

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

    const item = await prisma.unitPartner.update({
      where: { id },
      data: body
    })

    // Invalidate cache
    cache.delete('unit-partners-list')

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
    await prisma.unitPartner.update({
      where: { id },
      data: { deletedAt: new Date() }
    })

    // Invalidate cache
    cache.delete('unit-partners-list')

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