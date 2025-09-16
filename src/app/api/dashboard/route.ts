import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { calculateDashboardKPIs } from '@/utils/calculations'
import { ApiResponse, DashboardKPIs } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/dashboard - Get dashboard KPIs
export async function GET(request: NextRequest) {
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

    // Get all data for calculations
    const [
      contracts,
      vouchers,
      installments,
      units,
      customers
    ] = await Promise.all([
      prisma.contract.findMany({ where: { deletedAt: null } }),
      prisma.voucher.findMany({ where: { deletedAt: null } }),
      prisma.installment.findMany({ where: { deletedAt: null } }),
      prisma.unit.findMany({ where: { deletedAt: null } }),
      prisma.customer.findMany({ where: { deletedAt: null } })
    ])

    // Calculate KPIs
    const kpis = calculateDashboardKPIs(contracts, vouchers, installments, units, customers)

    const response: ApiResponse<DashboardKPIs> = {
      success: true,
      data: kpis,
      message: 'تم تحميل بيانات لوحة التحكم بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error getting dashboard data:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}