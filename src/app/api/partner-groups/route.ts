import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const partnerGroups = await prisma.partnerGroup.findMany({
      include: {
        partners: {
          include: {
            partner: true
          }
        }
      },
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ success: true, data: partnerGroups })
  } catch (error) {
    console.error('Error fetching partner groups:', error)
    return NextResponse.json({ success: false, error: 'خطأ في الخادم' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(request: NextRequest) {
  try {

    const { name, notes } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'اسم المجموعة مطلوب' }, { status: 400 })
    }

    const partnerGroup = await prisma.partnerGroup.create({
      data: {
        name: name.trim(),
        notes: notes?.trim() || null
      }
    })

    return NextResponse.json({ 
      success: true, 
      data: {
        id: partnerGroup.id,
        name: partnerGroup.name,
        notes: partnerGroup.notes,
        createdAt: partnerGroup.createdAt,
        updatedAt: partnerGroup.updatedAt,
        partners: []
      }
    })
  } catch (error) {
    console.error('Error creating partner group:', error)
    return NextResponse.json({ success: false, error: 'خطأ في الخادم' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}