import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/trash/permanent-delete - Permanently delete entity
export async function POST(request: NextRequest) {
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

    // Check if user has admin role
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'غير مخول للوصول' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { entityType, entityId } = body

    if (!entityType || !entityId) {
      return NextResponse.json(
        { success: false, error: 'نوع الكيان ومعرف الكيان مطلوبان' },
        { status: 400 }
      )
    }

    // Get the model based on entity type
    let model: any
    switch (entityType) {
      case 'customer':
        model = prisma.customer
        break
      case 'unit':
        model = prisma.unit
        break
      case 'contract':
        model = prisma.contract
        break
      case 'safe':
        model = prisma.safe
        break
      case 'partner':
        model = prisma.partner
        break
      case 'broker':
        model = prisma.broker
        break
      case 'installment':
        model = prisma.installment
        break
      case 'voucher':
        model = prisma.voucher
        break
      case 'transfer':
        model = prisma.transfer
        break
      case 'partnerDebt':
        model = prisma.partnerDebt
        break
      case 'brokerDue':
        model = prisma.brokerDue
        break
      case 'unitPartner':
        model = prisma.unitPartner
        break
      case 'partnerGroup':
        model = prisma.partnerGroup
        break
      default:
        return NextResponse.json(
          { success: false, error: 'نوع الكيان غير مدعوم' },
          { status: 400 }
        )
    }

    // Check if entity exists and is soft deleted
    const entity = await model.findUnique({
      where: { id: entityId }
    })

    if (!entity) {
      return NextResponse.json(
        { success: false, error: 'العنصر غير موجود' },
        { status: 404 }
      )
    }

    if (!entity.deletedAt) {
      return NextResponse.json(
        { success: false, error: 'العنصر غير محذوف' },
        { status: 400 }
      )
    }

    // Permanently delete entity
    await model.delete({
      where: { id: entityId }
    })

    const response: ApiResponse = {
      success: true,
      message: 'تم حذف العنصر نهائياً بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error permanently deleting entity:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}