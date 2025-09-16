import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const unitPartners = await prisma.unitPartner.findMany({
      where: { deletedAt: null },
      include: {
        unit: { select: { id: true, name: true, code: true } },
        partner: { select: { id: true, name: true } }
      }
    })

    return NextResponse.json({
      success: true,
      data: unitPartners
    })

  } catch (error) {
    console.error('Error fetching unit partners:', error)
    return NextResponse.json({
      success: false,
      error: 'خطأ في قاعدة البيانات'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}