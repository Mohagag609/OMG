import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    if (!decoded.userId) {
      return NextResponse.json({ success: false, error: 'رمز غير صالح' }, { status: 401 })
    }

    const partnerGroups = await prisma.partnerGroup.findMany({
      include: {
        partners: {
          include: {
            partner: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Transform the data to match the expected format
    const transformedGroups = partnerGroups.map(group => ({
      id: group.id,
      name: group.name,
      notes: group.notes,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
      partners: group.partners.map(p => ({
        partnerId: p.partnerId,
        percent: p.percentage
      }))
    }))

    return NextResponse.json({ success: true, data: transformedGroups })
  } catch (error) {
    console.error('Error fetching partner groups:', error)
    return NextResponse.json({ success: false, error: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    if (!decoded.userId) {
      return NextResponse.json({ success: false, error: 'رمز غير صالح' }, { status: 401 })
    }

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
  }
}