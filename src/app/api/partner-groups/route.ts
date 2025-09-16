import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const partnerGroups = await prisma.partnerGroup.findMany({
      where: { deletedAt: null },
      include: {
        partners: {
          include: {
            partner: { select: { id: true, name: true } }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: partnerGroups
    })

  } catch (error) {
    console.error('Error fetching partner groups:', error)
    return NextResponse.json({
      success: false,
      error: 'خطأ في قاعدة البيانات'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}