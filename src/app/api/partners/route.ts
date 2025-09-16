import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Simple in-memory cache
const cache = new Map()
const CACHE_TTL = 2 * 60 * 1000 // 2 minutes

export async function GET() {
  try {
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
      error: 'خطأ في قاعدة البيانات'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(request: Request) {
  try {
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
    console.error('Error creating partner:', error)
    
    return NextResponse.json({
      success: false,
      error: 'خطأ في إضافة الشريك'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}