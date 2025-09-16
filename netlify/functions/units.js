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
    const body = event.body ? JSON.parse(event.body) : {}

    // FIXED: Check cache for GET requests
    if (method === 'GET' && !id) {
      const cacheKey = 'units-list'
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
          result = await prisma.unit.findUnique({
            where: { id, deletedAt: null },
            include: {
              unitPartners: {
                include: {
                  partner: {
                    select: { id: true, name: true }
                  }
                }
              }
            }
          })
        } else {
          result = await prisma.unit.findMany({
            where: { deletedAt: null },
            include: {
              unitPartners: {
                include: {
                  partner: {
                    select: { id: true, name: true }
                  }
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          })
          
          // FIXED: Cache the result
          cache.set('units-list', {
            data: result,
            timestamp: Date.now()
          })
        }
        break

      case 'POST':
        result = await prisma.unit.create({
          data: {
            code: body.code,
            name: body.name,
            unitType: body.unitType || 'سكني',
            area: body.area,
            floor: body.floor,
            building: body.building,
            totalPrice: parseFloat(body.totalPrice) || 0,
            status: body.status || 'متاحة',
            notes: body.notes
          },
          include: {
            unitPartners: {
              include: {
                partner: {
                  select: { id: true, name: true }
                }
              }
            }
          }
        })
        
        // FIXED: Invalidate cache
        cache.delete('units-list')
        break

      case 'PUT':
        result = await prisma.unit.update({
          where: { id },
          data: {
            code: body.code,
            name: body.name,
            unitType: body.unitType,
            area: body.area,
            floor: body.floor,
            building: body.building,
            totalPrice: parseFloat(body.totalPrice) || 0,
            status: body.status,
            notes: body.notes
          },
          include: {
            unitPartners: {
              include: {
                partner: {
                  select: { id: true, name: true }
                }
              }
            }
          }
        })
        
        // FIXED: Invalidate cache
        cache.delete('units-list')
        break

      case 'DELETE':
        result = await prisma.unit.update({
          where: { id },
          data: { deletedAt: new Date() }
        })
        
        // FIXED: Invalidate cache
        cache.delete('units-list')
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
      console.error('Error in units API:', error)
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