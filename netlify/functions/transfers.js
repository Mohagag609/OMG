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
        result = await prisma.transfer.findMany({
          where: { deletedAt: null },
          include: {
            fromSafe: {
              select: { id: true, name: true }
            },
            toSafe: {
              select: { id: true, name: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        })
        break

      case 'POST':
        // Start transaction for transfer
        result = await prisma.$transaction(async (tx) => {
          // Create transfer record
          const transfer = await tx.transfer.create({
            data: {
              fromSafeId: body.fromSafeId,
              toSafeId: body.toSafeId,
              amount: body.amount,
              description: body.description || '',
              notes: body.notes || ''
            },
            include: {
              fromSafe: {
                select: { id: true, name: true }
              },
              toSafe: {
                select: { id: true, name: true }
              }
            }
          })

          // Update from safe balance
          await tx.safe.update({
            where: { id: body.fromSafeId },
            data: {
              balance: {
                decrement: body.amount
              }
            }
          })

          // Update to safe balance
          await tx.safe.update({
            where: { id: body.toSafeId },
            data: {
              balance: {
                increment: body.amount
              }
            }
          })

          return transfer
        })
        break

      case 'PUT':
        result = await prisma.transfer.update({
          where: { id },
          data: {
            description: body.description,
            notes: body.notes
          },
          include: {
            fromSafe: {
              select: { id: true, name: true }
            },
            toSafe: {
              select: { id: true, name: true }
            }
          }
        })
        break

      case 'DELETE':
        result = await prisma.transfer.update({
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
    console.error('Error in transfers API:', error)
    
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