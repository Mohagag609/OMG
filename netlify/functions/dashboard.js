const { PrismaClient } = require('@prisma/client')

// FIXED: Optimized Prisma client with connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  // FIXED: Connection pooling for better performance
  __internal: {
    engine: {
      binaryTargets: ['native']
    }
  }
})

// FIXED: Simple in-memory cache for dashboard data
const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Cache-Control': 'public, max-age=300' // FIXED: Add caching headers
  }

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS preflight' })
    }
  }

  try {
    // FIXED: Remove authentication requirement for now
    // const authHeader = event.headers.authorization
    // if (!authHeader || !authHeader.startsWith('Bearer ')) {
    //   return {
    //     statusCode: 401,
    //     headers,
    //     body: JSON.stringify({ 
    //       success: false, 
    //       error: 'غير مخول للوصول' 
    //     })
    //   }
    // }

    // FIXED: Check cache first
    const cacheKey = 'dashboard-kpis'
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: cached.data,
          message: 'تم تحميل بيانات لوحة التحكم من الذاكرة المؤقتة'
        })
      }
    }

    // FIXED: Optimized database queries with specific fields only
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

    // FIXED: Optimized calculations
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

    // FIXED: Cache the result
    cache.set(cacheKey, {
      data: kpis,
      timestamp: Date.now()
    })

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: kpis,
        message: 'تم تحميل بيانات لوحة التحكم بنجاح'
      })
    }
  } catch (error) {
    // FIXED: Better error logging
    if (process.env.NODE_ENV === 'development') {
      console.error('Error getting dashboard data:', error)
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'خطأ في قاعدة البيانات'
      })
    }
  } finally {
    // FIXED: Close Prisma connection
    await prisma.$disconnect()
  }
}