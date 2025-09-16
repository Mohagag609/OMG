import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Simple in-memory cache
const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function GET() {
  try {
    // Check cache first
    const cacheKey = 'dashboard-kpis'
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        data: cached.data,
        message: 'تم تحميل بيانات لوحة التحكم من الذاكرة المؤقتة'
      })
    }

    // Optimized database queries
    const [
      contracts,
      vouchers,
      units,
      customers
    ] = await Promise.all([
      prisma.contract.findMany({ 
        where: { deletedAt: null },
        select: { totalPrice: true, createdAt: true }
      }),
      prisma.voucher.findMany({ 
        where: { deletedAt: null },
        select: { type: true, amount: true, createdAt: true }
      }),
      prisma.unit.findMany({ 
        where: { deletedAt: null },
        select: { status: true, createdAt: true }
      }),
      prisma.customer.findMany({ 
        where: { deletedAt: null },
        select: { id: true, createdAt: true }
      })
    ])

    // Calculate KPIs
    const totalSales = contracts.reduce((sum, contract) => sum + (contract.totalPrice || 0), 0)
    
    const receiptVouchers = vouchers.filter(v => v.type === 'receipt')
    const paymentVouchers = vouchers.filter(v => v.type === 'payment')
    
    const totalReceipts = receiptVouchers.reduce((sum, voucher) => sum + (voucher.amount || 0), 0)
    const totalExpenses = paymentVouchers.reduce((sum, voucher) => sum + (voucher.amount || 0), 0)
    const netProfit = totalReceipts - totalExpenses

    const kpis = {
      totalSales,
      totalReceipts,
      totalExpenses,
      netProfit,
      collectionPercentage: totalSales > 0 ? Math.round((totalReceipts / totalSales) * 100) : 0,
      totalDebt: totalSales - totalReceipts,
      unitCounts: {
        total: units.length,
        available: units.filter(u => u.status === 'متاحة').length
      },
      investorCount: customers.length
    }

    // Cache the result
    cache.set(cacheKey, {
      data: kpis,
      timestamp: Date.now()
    })

    return NextResponse.json({
      success: true,
      data: kpis,
      message: 'تم تحميل بيانات لوحة التحكم بنجاح'
    })

  } catch (error) {
    console.error('Error getting dashboard data:', error)
    
    return NextResponse.json({
      success: false,
      error: 'خطأ في قاعدة البيانات'
    }, { status: 500 })
  }
}