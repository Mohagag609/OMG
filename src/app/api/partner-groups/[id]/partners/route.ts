import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'غير مخول للوصول' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const user = await getUserFromToken(token)
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مخول للوصول' },
        { status: 401 }
      )
    }

    const { partnerId, percent } = await request.json()
    const groupId = params.id

    if (!partnerId || !percent || percent <= 0) {
      return NextResponse.json({ success: false, error: 'بيانات غير صحيحة' }, { status: 400 })
    }

    // Check if partner exists
    const partner = await prisma.partner.findUnique({
      where: { id: partnerId }
    })

    if (!partner) {
      return NextResponse.json({ success: false, error: 'الشريك غير موجود' }, { status: 404 })
    }

    // Check if group exists
    const group = await prisma.partnerGroup.findUnique({
      where: { id: groupId }
    })

    if (!group) {
      return NextResponse.json({ success: false, error: 'المجموعة غير موجودة' }, { status: 404 })
    }

    // Check if partner is already in the group
    const existingPartner = await prisma.partnerGroupPartner.findFirst({
      where: {
        partnerGroupId: groupId,
        partnerId: partnerId
      }
    })

    if (existingPartner) {
      return NextResponse.json({ success: false, error: 'الشريك موجود بالفعل في هذه المجموعة' }, { status: 400 })
    }

    // Check total percentage
    const currentTotal = await prisma.partnerGroupPartner.aggregate({
      where: { partnerGroupId: groupId },
      _sum: { percentage: true }
    })

    const currentTotalPercent = currentTotal._sum.percentage || 0
    if (currentTotalPercent + percent > 100) {
      return NextResponse.json({ 
        success: false, 
        error: `لا يمكن إضافة هذه النسبة. الإجمالي الحالي هو ${currentTotalPercent}%. إضافة ${percent}% سيجعل المجموع يتجاوز 100%.` 
      }, { status: 400 })
    }

    // Add partner to group
    await prisma.partnerGroupPartner.create({
      data: {
        partnerGroupId: groupId,
        partnerId: partnerId,
        percentage: percent
      }
    })

    return NextResponse.json({ success: true, message: 'تم إضافة الشريك للمجموعة بنجاح' })
  } catch (error) {
    console.error('Error adding partner to group:', error)
    return NextResponse.json({ success: false, error: 'خطأ في الخادم' }, { status: 500 })
  }
}