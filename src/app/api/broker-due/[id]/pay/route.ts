import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/broker-due/[id]/pay - Pay broker due
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    const body = await request.json()
    const { safeId, paymentDate, notes } = body

    if (!safeId) {
      return NextResponse.json(
        { success: false, error: 'يجب تحديد الخزنة' },
        { status: 400 }
      )
    }

    // Get broker due
    const brokerDue = await prisma.brokerDue.findUnique({
      where: { id: params.id },
      include: {
        broker: true
      }
    })

    if (!brokerDue) {
      return NextResponse.json(
        { success: false, error: 'العمولة المستحقة غير موجودة' },
        { status: 404 }
      )
    }

    if (brokerDue.status === 'مدفوع') {
      return NextResponse.json(
        { success: false, error: 'تم دفع هذه العمولة مسبقاً' },
        { status: 400 }
      )
    }

    // Check if safe exists and has enough balance
    const safe = await prisma.safe.findUnique({
      where: { id: safeId }
    })

    if (!safe) {
      return NextResponse.json(
        { success: false, error: 'الخزنة غير موجودة' },
        { status: 400 }
      )
    }

    if (safe.balance < brokerDue.amount) {
      return NextResponse.json(
        { success: false, error: 'الرصيد في الخزنة غير كافٍ' },
        { status: 400 }
      )
    }

    // Process payment in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update broker due status
      const updatedBrokerDue = await tx.brokerDue.update({
        where: { id: params.id },
        data: {
          status: 'مدفوع',
          notes: notes ? `${brokerDue.notes || ''}\n${notes}` : brokerDue.notes
        },
        include: {
          broker: true
        }
      })

      // Create payment voucher
      await tx.voucher.create({
        data: {
          type: 'payment',
          date: new Date(paymentDate || new Date()),
          amount: brokerDue.amount,
          safeId: safeId,
          description: `دفع عمولة سمسار ${brokerDue.broker.name}`,
          beneficiary: brokerDue.broker.name,
          unitId: null,
          contractId: null
        }
      })

      // Update safe balance
      await tx.safe.update({
        where: { id: safeId },
        data: { balance: { decrement: brokerDue.amount } }
      })

      return updatedBrokerDue
    })

    const response: ApiResponse<any> = {
      success: true,
      data: result,
      message: 'تم دفع العمولة بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error paying broker due:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { success: false, error: `خطأ في قاعدة البيانات: ${errorMessage}` },
      { status: 500 }
    )
  }
}