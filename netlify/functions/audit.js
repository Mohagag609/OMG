const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: JSON.stringify({ message: 'CORS preflight' }) }
  }

  try {
    const method = event.httpMethod
    const { id } = event.pathParameters || {}
    const queryParams = event.queryStringParameters || {}
    const body = event.body ? JSON.parse(event.body) : {}
    
    // Get ID from query parameters if not in path
    const auditId = id || queryParams.id

    let result

    switch (method) {
      case 'GET':
        const page = parseInt(event.queryStringParameters?.page) || 1
        const limit = parseInt(event.queryStringParameters?.limit) || 20
        const skip = (page - 1) * limit

        const [logs, total] = await Promise.all([
          prisma.auditLog.findMany({
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
          }),
          prisma.auditLog.count({
            where: { deletedAt: null }
          })
        ])

        result = {
          data: logs,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
        break

      case 'POST':
        result = await prisma.auditLog.create({
          data: {
            action: body.action,
            entityType: body.entityType,
            entityId: body.entityId,
            oldValues: body.oldValues || {},
            newValues: body.newValues || {},
            userId: body.userId || 'system',
            ipAddress: body.ipAddress || 'unknown',
            userAgent: body.userAgent || 'unknown'
          }
        })
        break

      case 'DELETE':
        if (auditId) {
          result = await prisma.auditLog.update({
            where: { id: auditId },
            data: { deletedAt: new Date() }
          })
        } else {
          // Delete all logs older than specified days
          const days = parseInt(body.days) || 30
          const cutoffDate = new Date()
          cutoffDate.setDate(cutoffDate.getDate() - days)
          
          result = await prisma.auditLog.updateMany({
            where: {
              createdAt: {
                lt: cutoffDate
              }
            },
            data: { deletedAt: new Date() }
          })
        }
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
    console.error('Error in audit API:', error)
    
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