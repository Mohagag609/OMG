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
    const body = event.body ? JSON.parse(event.body) : {}

    let result

    switch (method) {
      case 'GET':
        result = await prisma.unitPartner.findMany({
          where: { deletedAt: null },
          include: {
            unit: {
              select: { id: true, name: true, building: true, floor: true, number: true }
            },
            partner: {
              select: { id: true, name: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        })
        break

      case 'POST':
        result = await prisma.unitPartner.create({
          data: {
            unitId: body.unitId,
            partnerId: body.partnerId,
            percent: body.percent || 0,
            notes: body.notes || ''
          },
          include: {
            unit: {
              select: { id: true, name: true, building: true, floor: true, number: true }
            },
            partner: {
              select: { id: true, name: true }
            }
          }
        })
        break

      case 'PUT':
        result = await prisma.unitPartner.update({
          where: { id },
          data: {
            percent: body.percent,
            notes: body.notes
          },
          include: {
            unit: {
              select: { id: true, name: true, building: true, floor: true, number: true }
            },
            partner: {
              select: { id: true, name: true }
            }
          }
        })
        break

      case 'DELETE':
        result = await prisma.unitPartner.update({
          where: { id },
          data: { deletedAt: new Date() }
        })
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
    console.error('Error in unit-partners API:', error)
    
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