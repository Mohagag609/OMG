import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// FIXED: Enhanced caching with better memory management
const cache = new Map<string, { data: any; timestamp: number; hits: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const MAX_CACHE_SIZE = 100 // Prevent memory leaks

// FIXED: Cache cleanup function
const cleanupCache = () => {
  if (cache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(cache.entries())
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
    const toDelete = entries.slice(0, Math.floor(MAX_CACHE_SIZE / 2))
    toDelete.forEach(([key]) => cache.delete(key))
  }
}

export async function GET() {
  try {
    // FIXED: Check cache first with hit tracking
    const cacheKey = 'dashboard-kpis'
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      cached.hits++
      return NextResponse.json({
        success: true,
        data: cached.data,
        message: 'تم تحميل بيانات لوحة التحكم من الذاكرة المؤقتة',
        cached: true,
        hits: cached.hits
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
      totalDebt: totalSales - totalReceipts
    }

    // Cache the result
    cache.set(cacheKey, {
      data: kpis,
      timestamp: Date.now(),
      hits: 0
    })

    return NextResponse.json({
      success: true,
      data: kpis,
      message: 'تم تحميل بيانات لوحة التحكم بنجاح'
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'خطأ في قاعدة البيانات'
    }, { status: 500 })
  }
}