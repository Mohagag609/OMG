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
      const cacheKey = 'customers-list'
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
          result = await prisma.customer.findUnique({
            where: { id, deletedAt: null },
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
        } else {
          result = await prisma.customer.findMany({
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
          
          // FIXED: Cache the result
          cache.set('customers-list', {
            data: result,
            timestamp: Date.now()
          })
        }
        break

      case 'POST':
        result = await prisma.customer.create({
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
        
        // FIXED: Invalidate cache
        cache.delete('customers-list')
        break

      case 'PUT':
        result = await prisma.customer.update({
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
        
        // FIXED: Invalidate cache
        cache.delete('customers-list')
        break

      case 'DELETE':
        result = await prisma.customer.update({
          where: { id },
          data: { deletedAt: new Date() }
        })
        
        // FIXED: Invalidate cache
        cache.delete('customers-list')
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
      console.error('Error in customers API:', error)
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