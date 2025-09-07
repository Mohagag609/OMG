import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    if (!decoded.userId) {
      return NextResponse.json({ success: false, error: 'رمز غير صالح' }, { status: 401 })
    }

    const debtId = params.id

    // Check if debt exists
    const debt = await prisma.partnerDebt.findUnique({
      where: { id: debtId },
      include: { partner: true }
    })

    if (!debt) {
      return NextResponse.json({ success: false, error: 'الدين غير موجود' }, { status: 404 })
    }

    if (debt.status === 'مدفوع') {
      return NextResponse.json({ success: false, error: 'هذا الدين مدفوع بالفعل' }, { status: 400 })
    }

    // Update debt status to paid
    const updatedDebt = await prisma.partnerDebt.update({
      where: { id: debtId },
      data: {
        status: 'مدفوع',
        updatedAt: new Date()
      },
      include: {
        partner: true
      }
    })

    return NextResponse.json({ 
      success: true, 
      data: updatedDebt,
      message: 'تم تسجيل سداد الدين بنجاح'
    })
  } catch (error) {
    console.error('Error paying partner debt:', error)
    return NextResponse.json({ success: false, error: 'خطأ في الخادم' }, { status: 500 })
  }
}