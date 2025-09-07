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

    const partnerDebts = await prisma.partnerDebt.findMany({
      include: {
        partner: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ success: true, data: partnerDebts })
  } catch (error) {
    console.error('Error fetching partner debts:', error)
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

    const { partnerId, amount, dueDate, notes } = await request.json()

    if (!partnerId || !amount || !dueDate) {
      return NextResponse.json({ success: false, error: 'جميع الحقول المطلوبة يجب أن تكون مملوءة' }, { status: 400 })
    }

    // Check if partner exists
    const partner = await prisma.partner.findUnique({
      where: { id: partnerId }
    })

    if (!partner) {
      return NextResponse.json({ success: false, error: 'الشريك غير موجود' }, { status: 404 })
    }

    const partnerDebt = await prisma.partnerDebt.create({
      data: {
        partnerId,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        notes: notes?.trim() || null,
        status: 'غير مدفوع'
      },
      include: {
        partner: true
      }
    })

    return NextResponse.json({ 
      success: true, 
      data: partnerDebt,
      message: 'تم إضافة دين الشريك بنجاح'
    })
  } catch (error) {
    console.error('Error creating partner debt:', error)
    return NextResponse.json({ success: false, error: 'خطأ في الخادم' }, { status: 500 })
  }
}