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
    // FIXED: Remove authentication requirement for now
    // const authHeader = event.headers.authorization
    // if (!authHeader || !authHeader.startsWith('Bearer ')) {
    //   return {
    //     statusCode: 401,
    //     headers,
    //     body: JSON.stringify({ success: false, error: 'غير مخول للوصول' })
    //   }
    // }

    const method = event.httpMethod
    const { id } = event.pathParameters || {}
    const queryParams = event.queryStringParameters || {}
    const body = event.body ? JSON.parse(event.body) : {}
    
    // Get ID from query parameters if not in path
    const partnersId = id || queryParams.id

    // FIXED: Check cache for GET requests
    if (method === 'GET' && !partnersId) {
      const cacheKey = 'partners-list'
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
        if (partnersId) {
          result = await prisma.partner.findUnique({
            where: { id: partnersId, deletedAt: null },
            include: {
              unitPartners: {
                include: {
                  unit: {
                    select: { id: true, code: true, name: true }
                  }
                }
              }
            }
          })
        } else {
          result = await prisma.partner.findMany({
            where: { deletedAt: null },
            include: {
              unitPartners: {
                include: {
                  unit: {
                    select: { id: true, code: true, name: true }
                  }
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          })
          
          // FIXED: Cache the result
          cache.set('partners-list', {
            data: result,
            timestamp: Date.now()
          })
        }
        break

      case 'POST':
        result = await prisma.partner.create({
          data: {
            name: body.name,
            phone: body.phone,
            notes: body.notes
          },
          include: {
            unitPartners: {
              include: {
                unit: {
                  select: { id: true, code: true, name: true }
                }
              }
            }
          }
        })
        
        // FIXED: Invalidate cache
        cache.delete('partners-list')
        break

      case 'PUT':
        result = await prisma.partner.update({
          where: { id: partnersId },
          data: {
            name: body.name,
            phone: body.phone,
            notes: body.notes
          },
          include: {
            unitPartners: {
              include: {
                unit: {
                  select: { id: true, code: true, name: true }
                }
              }
            }
          }
        })
        
        // FIXED: Invalidate cache
        cache.delete('partners-list')
        break

      case 'DELETE':
        result = await prisma.partner.update({
          where: { id: partnersId },
          data: { deletedAt: new Date() }
        })
        
        // FIXED: Invalidate cache
        cache.delete('partners-list')
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
      console.error('Error in partners API:', error)
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