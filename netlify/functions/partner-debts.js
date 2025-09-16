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
        result = await prisma.partnerDebt.findMany({
          where: { deletedAt: null },
          include: {
            partner: {
              select: { id: true, name: true, phone: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        })
        break

      case 'POST':
        result = await prisma.partnerDebt.create({
          data: {
            partnerId: body.partnerId,
            amount: body.amount,
            description: body.description || '',
            dueDate: body.dueDate ? new Date(body.dueDate) : null,
            status: body.status || 'غير مدفوع',
            notes: body.notes || ''
          },
          include: {
            partner: {
              select: { id: true, name: true, phone: true }
            }
          }
        })
        break

      case 'PUT':
        result = await prisma.partnerDebt.update({
          where: { id },
          data: {
            amount: body.amount,
            description: body.description,
            dueDate: body.dueDate ? new Date(body.dueDate) : null,
            status: body.status,
            notes: body.notes
          },
          include: {
            partner: {
              select: { id: true, name: true, phone: true }
            }
          }
        })
        break

      case 'DELETE':
        result = await prisma.partnerDebt.update({
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
    console.error('Error in partner-debts API:', error)
    
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