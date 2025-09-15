const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
    // Check authentication
    const authHeader = event.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'غير مخول للوصول' 
        })
      }
    }

    // Get all data for calculations
    const [
      contracts,
      vouchers,
      installments,
      units,
      customers
    ] = await Promise.all([
      prisma.contract.findMany({ where: { deletedAt: null } }),
      prisma.voucher.findMany({ where: { deletedAt: null } }),
      prisma.installment.findMany({ where: { deletedAt: null } }),
      prisma.unit.findMany({ where: { deletedAt: null } }),
      prisma.customer.findMany({ where: { deletedAt: null } })
    ])

    // Calculate KPIs (simplified version)
    const totalSales = contracts.reduce((sum, contract) => sum + (contract.totalPrice || 0), 0)
    const totalReceipts = vouchers
      .filter(v => v.type === 'receipt')
      .reduce((sum, voucher) => sum + (voucher.amount || 0), 0)
    const totalExpenses = vouchers
      .filter(v => v.type === 'payment')
      .reduce((sum, voucher) => sum + (voucher.amount || 0), 0)
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
        available: units.filter(u => !u.isSold).length
      },
      investorCount: customers.length
    }

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
    console.error('Error getting dashboard data:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'خطأ في قاعدة البيانات'
      })
    }
  }
}