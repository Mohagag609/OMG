import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Simple in-memory cache
const cache = new Map()
const CACHE_TTL = 2 * 60 * 1000 // 2 minutes

export async function GET() {
  try {
    // Test database connection first
    await prisma.$connect()
    
    // Check cache first
    const cacheKey = 'customers-list'
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        data: cached.data,
        message: 'تم تحميل العملاء من الذاكرة المؤقتة'
      })
    }

    let customers = []
    try {
      customers = await prisma.customer.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          phone: true,
          nationalId: true,
          address: true,
          status: true,
          notes: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: 'desc' }
      })
    } catch (dbError) {
      console.error('Database query error:', dbError)
      // Return fallback data if database is not available
      return NextResponse.json({
        success: true,
        data: [],
        message: 'تم تحميل البيانات الافتراضية - قاعدة البيانات غير متاحة',
        fallback: true
      })
    }

    // Cache the result
    cache.set(cacheKey, {
      data: customers,
      timestamp: Date.now()
    })

    return NextResponse.json({
      success: true,
      data: customers,
      message: 'تم تحميل العملاء بنجاح'
    })

  } catch (error) {
    console.error('Customers API error:', error)
    
    // Return fallback data on error
    return NextResponse.json({
      success: true,
      data: [],
      message: 'تم تحميل البيانات الافتراضية - خطأ في الاتصال',
      fallback: true,
      error: error instanceof Error ? error.message : 'خطأ غير معروف'
    })
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
    const body = await request.json()
    
    const customer = await prisma.customer.create({
      data: {
        name: body.name,
        phone: body.phone,
        nationalId: body.nationalId,
        address: body.address,
        status: body.status || 'نشط',
        notes: body.notes
      },
      select: {
        id: true,
        name: true,
        phone: true,
        nationalId: true,
        address: true,
        status: true,
        notes: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // Invalidate cache
    cache.delete('customers-list')

    return NextResponse.json({
      success: true,
      data: customer,
      message: 'تم إضافة العميل بنجاح'
    })

  } catch (error) {
    
    return NextResponse.json({
      success: false,
      error: 'خطأ في إضافة العميل'
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
        error: 'معرف العميل مطلوب'
      }, { status: 400 })
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: body.name,
        phone: body.phone,
        nationalId: body.nationalId,
        address: body.address,
        status: body.status,
        notes: body.notes
      },
      select: {
        id: true,
        name: true,
        phone: true,
        nationalId: true,
        address: true,
        status: true,
        notes: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // Invalidate cache
    cache.delete('customers-list')

    return NextResponse.json({
      success: true,
      data: customer,
      message: 'تم تحديث العميل بنجاح'
    })

  } catch (error) {
    
    return NextResponse.json({
      success: false,
      error: 'خطأ في تحديث العميل'
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
        error: 'معرف العميل مطلوب'
      }, { status: 400 })
    }

    // Soft delete
    await prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() }
    })

    // Invalidate cache
    cache.delete('customers-list')

    return NextResponse.json({
      success: true,
      message: 'تم حذف العميل بنجاح'
    })

  } catch (error) {
    
    return NextResponse.json({
      success: false,
      error: 'خطأ في حذف العميل'
    }, { status: 500 })
  }
}