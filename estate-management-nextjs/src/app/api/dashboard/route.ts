import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { DashboardKPIs, ApiResponse, DateFilter } from '@/types'
import { 
  calculateTotalSales, 
  calculateTotalReceipts, 
  calculateTotalExpenses, 
  calculateNetProfit,
  calculateCollectionPercentage,
  calculateTotalDebt,
  calculateUnitCounts
} from '@/utils/calculations'

// GET /api/dashboard - Get dashboard KPIs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    // Build date filter
    const dateFilter: any = {}
    if (from) dateFilter.gte = new Date(from)
    if (to) dateFilter.lte = new Date(to)

    // Get contracts with date filter
    const contracts = await prisma.contract.findMany({
      where: from || to ? {
        start: dateFilter
      } : {},
      select: {
        id: true,
        totalPrice: true,
        discountAmount: true
      }
    })

    // Get vouchers with date filter
    const vouchers = await prisma.voucher.findMany({
      where: from || to ? {
        date: dateFilter
      } : {},
      select: {
        type: true,
        amount: true
      }
    })

    // Get all units and installments for debt calculation
    const [units, installments] = await Promise.all([
      prisma.unit.findMany({
        select: {
          id: true,
          totalPrice: true
        }
      }),
      prisma.installment.findMany({
        select: {
          id: true,
          unitId: true,
          amount: true
        }
      })
    ])

    // Get partners count
    const investorCount = await prisma.partner.count()

    // Calculate KPIs
    const totalSales = calculateTotalSales(contracts)
    const totalReceipts = calculateTotalReceipts(vouchers)
    const totalExpenses = calculateTotalExpenses(vouchers)
    const netProfit = calculateNetProfit(totalReceipts, totalExpenses)
    const collectionPercentage = calculateCollectionPercentage(totalSales, totalReceipts)
    const totalDebt = calculateTotalDebt(units, installments)
    const unitCounts = calculateUnitCounts(units)

    const kpis: DashboardKPIs = {
      totalSales,
      totalReceipts,
      totalDebt,
      collectionPercentage,
      totalExpenses,
      netProfit,
      unitCounts,
      investorCount
    }

    const response: ApiResponse<DashboardKPIs> = {
      success: true,
      data: kpis
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching dashboard KPIs:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}