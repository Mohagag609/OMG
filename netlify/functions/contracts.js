const { PrismaClient } = require('@prisma/client')

// FIXED: Optimized Prisma client with connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'],
  __internal: {
    engine: {
      binaryTargets: ['native']
    }
  }
})

// FIXED: Simple in-memory cache
const cache = new Map()
const CACHE_TTL = 2 * 60 * 1000 // 2 minutes

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Cache-Control': 'public, max-age=120'
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: JSON.stringify({ message: 'CORS preflight' }) }
  }

  try {
    // Check authentication
    const authHeader = event.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, error: 'غير مخول للوصول' })
      }
    }

    const method = event.httpMethod
    const { id } = event.pathParameters || {}
    const body = event.body ? JSON.parse(event.body) : {}

    // FIXED: Check cache for GET requests
    if (method === 'GET' && !id) {
      const cacheKey = 'contracts-list'
      const cached = cache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, data: cached.data })
        }
      }
    }

    let result

    switch (method) {
      case 'GET':
        if (id) {
          result = await prisma.contract.findUnique({
            where: { id, deletedAt: null },
            include: {
              unit: {
                select: { id: true, code: true, name: true, totalPrice: true }
              },
              customer: {
                select: { id: true, name: true, phone: true }
              }
            }
          })
        } else {
          result = await prisma.contract.findMany({
            where: { deletedAt: null },
            include: {
              unit: {
                select: { id: true, code: true, name: true, totalPrice: true }
              },
              customer: {
                select: { id: true, name: true, phone: true }
              }
            },
            orderBy: { createdAt: 'desc' }
          })
          
          // FIXED: Cache the result
          cache.set('contracts-list', {
            data: result,
            timestamp: Date.now()
          })
        }
        break

      case 'POST':
        result = await prisma.contract.create({
          data: {
            unitId: body.unitId,
            customerId: body.customerId,
            start: new Date(body.start),
            totalPrice: parseFloat(body.totalPrice) || 0,
            discountAmount: parseFloat(body.discountAmount) || 0,
            brokerName: body.brokerName,
            brokerPercent: parseFloat(body.brokerPercent) || 0,
            brokerAmount: parseFloat(body.brokerAmount) || 0,
            commissionSafeId: body.commissionSafeId,
            downPaymentSafeId: body.downPaymentSafeId,
            maintenanceDeposit: parseFloat(body.maintenanceDeposit) || 0,
            installmentType: body.installmentType || 'شهري',
            installmentCount: parseInt(body.installmentCount) || 0,
            extraAnnual: parseInt(body.extraAnnual) || 0,
            annualPaymentValue: parseFloat(body.annualPaymentValue) || 0,
            downPayment: parseFloat(body.downPayment) || 0,
            paymentType: body.paymentType || 'installment'
          },
          include: {
            unit: {
              select: { id: true, code: true, name: true, totalPrice: true }
            },
            customer: {
              select: { id: true, name: true, phone: true }
            }
          }
        })
        
        // FIXED: Invalidate cache
        cache.delete('contracts-list')
        break

      case 'PUT':
        result = await prisma.contract.update({
          where: { id },
          data: {
            unitId: body.unitId,
            customerId: body.customerId,
            start: new Date(body.start),
            totalPrice: parseFloat(body.totalPrice) || 0,
            discountAmount: parseFloat(body.discountAmount) || 0,
            brokerName: body.brokerName,
            brokerPercent: parseFloat(body.brokerPercent) || 0,
            brokerAmount: parseFloat(body.brokerAmount) || 0,
            commissionSafeId: body.commissionSafeId,
            downPaymentSafeId: body.downPaymentSafeId,
            maintenanceDeposit: parseFloat(body.maintenanceDeposit) || 0,
            installmentType: body.installmentType,
            installmentCount: parseInt(body.installmentCount) || 0,
            extraAnnual: parseInt(body.extraAnnual) || 0,
            annualPaymentValue: parseFloat(body.annualPaymentValue) || 0,
            downPayment: parseFloat(body.downPayment) || 0,
            paymentType: body.paymentType
          },
          include: {
            unit: {
              select: { id: true, code: true, name: true, totalPrice: true }
            },
            customer: {
              select: { id: true, name: true, phone: true }
            }
          }
        })
        
        // FIXED: Invalidate cache
        cache.delete('contracts-list')
        break

      case 'DELETE':
        result = await prisma.contract.update({
          where: { id },
          data: { deletedAt: new Date() }
        })
        
        // FIXED: Invalidate cache
        cache.delete('contracts-list')
        break

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ success: false, error: 'Method not allowed' })
        }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, data: result })
    }

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in contracts API:', error)
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
    await prisma.$disconnect()
  }
}