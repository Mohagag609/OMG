import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const contracts = await prisma.contract.findMany({
      where: { deletedAt: null },
      include: {
        unit: { select: { id: true, name: true, code: true } },
        customer: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: contracts
    })

  } catch (error) {
    console.error('Error fetching contracts:', error)
    return NextResponse.json({
      success: false,
      error: 'خطأ في قاعدة البيانات'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}