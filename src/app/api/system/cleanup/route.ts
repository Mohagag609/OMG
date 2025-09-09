import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Starting system cleanup...')

    // Delete all existing users first
    await prisma.user.deleteMany({})
    console.log('✅ Deleted all existing users')

    // Create new admin user
    const bcrypt = require('bcryptjs')
    const hashedPassword = await bcrypt.hash('admin123', 12)
    
    const newAdmin = await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        email: 'admin@system.local',
        role: 'admin'
      }
    })
    console.log('✅ Created new admin user')

    // Delete any sample data if exists
    const sampleData = await prisma.customer.findMany({
      where: {
        name: {
          contains: 'عينة'
        }
      }
    })

    if (sampleData.length > 0) {
      await prisma.customer.deleteMany({
        where: {
          name: {
            contains: 'عينة'
          }
        }
      })
      console.log(`✅ Deleted ${sampleData.length} sample customers`)
    }

    // Delete any test data
    const testData = await prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: 'Test' } },
          { name: { contains: 'test' } },
          { name: { contains: 'تجربة' } }
        ]
      }
    })

    if (testData.length > 0) {
      await prisma.customer.deleteMany({
        where: {
          OR: [
            { name: { contains: 'Test' } },
            { name: { contains: 'test' } },
            { name: { contains: 'تجربة' } }
          ]
        }
      })
      console.log(`✅ Deleted ${testData.length} test customers`)
    }

    console.log('✅ System cleanup completed successfully')

    return NextResponse.json({
      success: true,
      message: 'System cleanup completed successfully. New admin user created.',
      createdAdmin: true,
      deletedCustomers: sampleData.length + testData.length
    })

  } catch (error) {
    console.error('❌ Cleanup failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to cleanup system',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}