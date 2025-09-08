import { NextRequest, NextResponse } from 'next/server'
import { ensureEnvironmentVariables } from '@/lib/env'
import { calculateDashboardKPIs } from '@/utils/calculations'
import { ApiResponse, DashboardKPIs } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/dashboard - Get dashboard KPIs
export async function GET(request: NextRequest) {
  let prisma: any = null
  
  try {
    ensureEnvironmentVariables()
    console.log('📊 جاري تحميل بيانات لوحة التحكم...')

    // Create Prisma client with environment variables
    const { PrismaClient } = await import('@prisma/client')
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    })

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

    console.log('✅ تم تحميل بيانات لوحة التحكم بنجاح')
    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ خطأ في تحميل بيانات لوحة التحكم:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  } finally {
    if (prisma) {
      await prisma.$disconnect()
    }
  }
}