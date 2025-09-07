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
    const contractsData = await prisma.contract.findMany({
      where: from || to ? {
        start: dateFilter
      } : {},
      select: {
        id: true,
        unitId: true,
        customerId: true,
        start: true,
        totalPrice: true,
        discountAmount: true,
        brokerAmount: true
      }
    })

    // Convert contracts to match Contract interface
    const contracts = contractsData.map(contract => ({
      ...contract,
      start: contract.start.toISOString()
    }))

    // Get vouchers with date filter
    const vouchersData = await prisma.voucher.findMany({
      where: from || to ? {
        date: dateFilter
      } : {},
      select: {
        id: true,
        type: true,
        date: true,
        amount: true,
        safeId: true,
        description: true,
        payer: true,
        beneficiary: true
      }
    })

    // Convert vouchers to match Voucher interface
    const vouchers = vouchersData.map(voucher => ({
      ...voucher,
      date: voucher.date.toISOString(),
      type: voucher.type as 'receipt' | 'payment',
      payer: voucher.payer || undefined,
      beneficiary: voucher.beneficiary || undefined
    }))

    // Get all units and installments for debt calculation
    const [unitsData, installmentsData] = await Promise.all([
      prisma.unit.findMany({
        select: {
          id: true,
          code: true,
          name: true,
          unitType: true,
          area: true,
          floor: true,
          building: true,
          totalPrice: true,
          status: true,
          notes: true
        }
      }),
      prisma.installment.findMany({
        select: {
          id: true,
          unitId: true,
          amount: true,
          dueDate: true,
          status: true,
          notes: true
        }
      })
    ])

    // Convert units to match Unit interface
    const units = unitsData.map(unit => ({
      ...unit,
      name: unit.name || undefined,
      area: unit.area || undefined,
      floor: unit.floor || undefined,
      building: unit.building || undefined,
      notes: unit.notes || undefined
    }))

    // Convert installments to match Installment interface
    const installments = installmentsData.map(installment => ({
      ...installment,
      dueDate: installment.dueDate.toISOString(),
      notes: installment.notes || undefined
    }))

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