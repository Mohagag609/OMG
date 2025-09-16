import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Simple in-memory cache
const cache = new Map()
const CACHE_TTL = 2 * 60 * 1000 // 2 minutes

export async function GET() {
  try {
    await prisma.$connect()
    
    // Check cache first
    const cacheKey = 'contracts-list'
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        data: cached.data,
        message: 'تم تحميل العقود من الذاكرة المؤقتة'
      })
    }

    const contracts = await prisma.contract.findMany({
      where: { deletedAt: null },
      include: {
        unit: { select: { id: true, name: true, code: true } },
        customer: { select: { id: true, name: true, phone: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Cache the result
    cache.set(cacheKey, {
      data: contracts,
      timestamp: Date.now()
    })

    return NextResponse.json({
      success: true,
      data: contracts,
      message: 'تم تحميل العقود بنجاح'
    })

  } catch (error) {
    console.error('Error fetching contracts:', error)
    return NextResponse.json({
      success: false,
      error: 'خطأ في تحميل العقود'
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
    
    const contract = await prisma.contract.create({
      data: {
        unitId: body.unitId,
        customerId: body.customerId,
        start: new Date(body.startDate),
        totalPrice: body.totalPrice,
        downPayment: body.downPayment || 0,
        discountAmount: body.discountAmount || 0,
        brokerName: body.brokerName,
        brokerPercent: body.brokerPercent || 0,
        brokerAmount: body.brokerAmount || 0,
        commissionSafeId: body.commissionSafeId,
        downPaymentSafeId: body.downPaymentSafeId,
        maintenanceDeposit: body.maintenanceDeposit || 0,
        installmentType: body.installmentType || 'شهري',
        installmentCount: body.installmentCount || 0,
        extraAnnual: body.extraAnnual || 0,
        annualPaymentValue: body.annualPaymentValue || 0,
        paymentType: body.paymentType || 'installment'
      },
      include: {
        unit: { select: { id: true, name: true, code: true } },
        customer: { select: { id: true, name: true, phone: true } }
      }
    })

    // Invalidate cache
    cache.delete('contracts-list')

    return NextResponse.json({
      success: true,
      data: contract,
      message: 'تم إضافة العقد بنجاح'
    })

  } catch (error) {
    console.error('Error adding contract:', error)
    return NextResponse.json({
      success: false,
      error: 'خطأ في إضافة العقد'
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
        error: 'معرف العقد مطلوب'
      }, { status: 400 })
    }

    const contract = await prisma.contract.update({
      where: { id },
      data: {
        unitId: body.unitId,
        customerId: body.customerId,
        start: body.startDate ? new Date(body.startDate) : undefined,
        totalPrice: body.totalPrice,
        downPayment: body.downPayment,
        discountAmount: body.discountAmount,
        brokerName: body.brokerName,
        brokerPercent: body.brokerPercent,
        brokerAmount: body.brokerAmount,
        commissionSafeId: body.commissionSafeId,
        downPaymentSafeId: body.downPaymentSafeId,
        maintenanceDeposit: body.maintenanceDeposit,
        installmentType: body.installmentType,
        installmentCount: body.installmentCount,
        extraAnnual: body.extraAnnual,
        annualPaymentValue: body.annualPaymentValue,
        paymentType: body.paymentType
      },
      include: {
        unit: { select: { id: true, name: true, code: true } },
        customer: { select: { id: true, name: true, phone: true } }
      }
    })

    // Invalidate cache
    cache.delete('contracts-list')

    return NextResponse.json({
      success: true,
      data: contract,
      message: 'تم تحديث العقد بنجاح'
    })

  } catch (error) {
    console.error('Error updating contract:', error)
    return NextResponse.json({
      success: false,
      error: 'خطأ في تحديث العقد'
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
        error: 'معرف العقد مطلوب'
      }, { status: 400 })
    }

    await prisma.contract.update({
      where: { id },
      data: { deletedAt: new Date() }
    })

    // Invalidate cache
    cache.delete('contracts-list')

    return NextResponse.json({
      success: true,
      message: 'تم حذف العقد بنجاح'
    })

  } catch (error) {
    console.error('Error deleting contract:', error)
    return NextResponse.json({
      success: false,
      error: 'خطأ في حذف العقد'
    }, { status: 500 })
  } finally {
    try {
      await prisma.$disconnect()
    } catch (disconnectError) {
      console.error('Error disconnecting from database:', disconnectError)
    }
  }
}