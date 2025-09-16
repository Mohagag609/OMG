import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// FIXED: Enhanced caching with pagination support
const cache = new Map<string, { data: any; timestamp: number; hits: number }>()
const CACHE_TTL = 2 * 60 * 1000 // 2 minutes
const MAX_CACHE_SIZE = 50

// FIXED: Cache cleanup function
const cleanupCache = () => {
  if (cache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(cache.entries())
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
    const toDelete = entries.slice(0, Math.floor(MAX_CACHE_SIZE / 2))
    toDelete.forEach(([key]) => cache.delete(key))
  }
}

export async function GET(request: Request) {
  try {
    // FIXED: Add pagination support
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const offset = (page - 1) * limit

    // FIXED: Create cache key with pagination and search
    const cacheKey = `customers-${page}-${limit}-${search}`
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      cached.hits++
      return NextResponse.json({
        success: true,
        data: cached.data.customers,
        pagination: cached.data.pagination,
        message: 'تم تحميل العملاء من الذاكرة المؤقتة',
        cached: true,
        hits: cached.hits
      })
    }

    // FIXED: Build optimized query with search and pagination
    const whereClause = {
      deletedAt: null,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { phone: { contains: search, mode: 'insensitive' as const } },
          { nationalId: { contains: search, mode: 'insensitive' as const } }
        ]
      })
    }

    const [customers, totalCount] = await Promise.all([
      prisma.customer.findMany({
        where: whereClause,
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
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.customer.count({ where: whereClause })
    ])

    const totalPages = Math.ceil(totalCount / limit)
    const pagination = {
      page,
      limit,
      total: totalCount,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }

    const result = { customers, pagination }

    // FIXED: Cache the result with cleanup
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
      hits: 0
    })
    
    cleanupCache()

    return NextResponse.json({
      success: true,
      data: customers,
      pagination,
      message: 'تم تحميل العملاء بنجاح',
      cached: false
    })

  } catch (error) {
    console.error('Error fetching customers:', error)
    
    return NextResponse.json({
      success: false,
      error: 'خطأ في قاعدة البيانات'
    }, { status: 500 })
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

    // FIXED: Invalidate all customer-related cache entries
    const keysToDelete = Array.from(cache.keys()).filter(key => key.startsWith('customers-'))
    keysToDelete.forEach(key => cache.delete(key))

    return NextResponse.json({
      success: true,
      data: customer,
      message: 'تم إضافة العميل بنجاح'
    })

  } catch (error) {
    console.error('Error creating customer:', error)
    
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

    // FIXED: Invalidate all customer-related cache entries
    const keysToDelete = Array.from(cache.keys()).filter(key => key.startsWith('customers-'))
    keysToDelete.forEach(key => cache.delete(key))

    return NextResponse.json({
      success: true,
      data: customer,
      message: 'تم تحديث العميل بنجاح'
    })

  } catch (error) {
    console.error('Error updating customer:', error)
    
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

    // FIXED: Invalidate all customer-related cache entries
    const keysToDelete = Array.from(cache.keys()).filter(key => key.startsWith('customers-'))
    keysToDelete.forEach(key => cache.delete(key))

    return NextResponse.json({
      success: true,
      message: 'تم حذف العميل بنجاح'
    })

  } catch (error) {
    console.error('Error deleting customer:', error)
    
    return NextResponse.json({
      success: false,
      error: 'خطأ في حذف العميل'
    }, { status: 500 })
  }
}