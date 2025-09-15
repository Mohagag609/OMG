const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
  log: process.env.NODE_ENV === 'development' ? ['error'] : ['error']
})

const cache = new Map()
const CACHE_TTL = 2 * 60 * 1000

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
    const authHeader = event.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { statusCode: 401, headers, body: JSON.stringify({ success: false, error: 'غير مخول للوصول' }) }
    }

    const method = event.httpMethod
    const { id } = event.pathParameters || {}
    const body = event.body ? JSON.parse(event.body) : {}

    if (method === 'GET' && !id) {
      const cacheKey = 'safes-list'
      const cached = cache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, data: cached.data }) }
      }
    }

    let result

    switch (method) {
      case 'GET':
        if (id) {
          result = await prisma.safe.findUnique({
            where: { id, deletedAt: null }
          })
        } else {
          result = await prisma.safe.findMany({
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' }
          })
          cache.set('safes-list', { data: result, timestamp: Date.now() })
        }
        break

      case 'POST':
        result = await prisma.safe.create({
          data: {
            name: body.name,
            balance: parseFloat(body.balance) || 0
          }
        })
        cache.delete('safes-list')
        break

      case 'PUT':
        result = await prisma.safe.update({
          where: { id },
          data: {
            name: body.name,
            balance: parseFloat(body.balance) || 0
          }
        })
        cache.delete('safes-list')
        break

      case 'DELETE':
        result = await prisma.safe.update({
          where: { id },
          data: { deletedAt: new Date() }
        })
        cache.delete('safes-list')
        break

      default:
        return { statusCode: 405, headers, body: JSON.stringify({ success: false, error: 'Method not allowed' }) }
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, data: result }) }

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in safes API:', error)
    }
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: 'خطأ في قاعدة البيانات' }) }
  } finally {
    await prisma.$disconnect()
  }
}