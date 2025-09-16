import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const brokers = await prisma.broker.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        phone: true,
        notes: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: brokers
    })

  } catch (error) {
    console.error('Error fetching brokers:', error)
    return NextResponse.json({
      success: false,
      error: 'خطأ في قاعدة البيانات'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}