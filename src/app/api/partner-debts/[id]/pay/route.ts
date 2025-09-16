import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/partner-debts/[id]/pay - Mark debt as paid
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

    const debtId = params.id

    // Check if debt exists
    const existingDebt = await prisma.partnerDebt.findUnique({
      where: { id: debtId }
    })

    if (!existingDebt) {
      return NextResponse.json(
        { success: false, error: 'دين الشريك غير موجود' },
        { status: 404 }
      )
    }

    if (existingDebt.status === 'مدفوع') {
      return NextResponse.json(
        { success: false, error: 'هذا الدين مدفوع بالفعل' },
        { status: 400 }
      )
    }

    // Update debt status to paid
    await prisma.partnerDebt.update({
      where: { id: debtId },
      data: { 
        status: 'مدفوع',
        updatedAt: new Date()
      }
    })

    const response: ApiResponse = {
      success: true,
      message: 'تم تسجيل سداد الدين بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error paying debt:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}