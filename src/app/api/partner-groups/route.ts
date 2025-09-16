import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Simple in-memory cache
const cache = new Map()


export async function GET() {
  try {
    const partnerGroups = await prisma.partnerGroup.findMany({
      where: { deletedAt: null },
      include: {
        partners: {
          include: {
            partner: { select: { id: true, name: true } }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: partnerGroups
    })

  } catch (error) {
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
    
    const item = await prisma.partnerGroup.create({
      data: body
    })

    // Invalidate cache
    cache.delete('partner-groups-list')

    return NextResponse.json({
      success: true,
      data: item,
      message: 'تم الإضافة بنجاح'
    })

  } catch (error) {
    
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

    const item = await prisma.partnerGroup.update({
      where: { id },
      data: body
    })

    // Invalidate cache
    cache.delete('partner-groups-list')

    return NextResponse.json({
      success: true,
      data: item,
      message: 'تم التحديث بنجاح'
    })

  } catch (error) {
    
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
    await prisma.partnerGroup.update({
      where: { id },
      data: { deletedAt: new Date() }
    })

    // Invalidate cache
    cache.delete('partner-groups-list')

    return NextResponse.json({
      success: true,
      message: 'تم الحذف بنجاح'
    })

  } catch (error) {
    
    return NextResponse.json({
      success: false,
      error: 'خطأ في الحذف'
    }, { status: 500 })
  }
}