import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const safes = await prisma.safe.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        balance: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: safes
    })

  } catch (error) {
    console.error('Error fetching safes:', error)
    return NextResponse.json({
      success: false,
      error: 'خطأ في قاعدة البيانات'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}