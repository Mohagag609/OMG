import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year') || new Date().getFullYear().toString()

    console.log('📊 جلب تقرير التدفقات النقدية...')

    // جلب جميع الشركاء مع وحداتهم ونسب المشاركة
    const partners = await prisma.partner.findMany({
      where: {
        deletedAt: null
      },
      include: {
        unitPartners: {
          include: {
            unit: {
              include: {
                contracts: {
                  where: {
                    deletedAt: null
                  }
                },
                installments: {
                  where: {
                    deletedAt: null,
                    ...(month && {
                      dueDate: {
                        gte: new Date(parseInt(year), parseInt(month) - 1, 1),
                        lt: new Date(parseInt(year), parseInt(month), 1)
                      }
                    })
                  }
                }
              }
            }
          }
        }
      }
    })

    // حساب التدفقات النقدية لكل شريك
    const partnerCashflows = []

    for (const partner of partners) {
      let totalMonthlyCashflow = 0
      let totalAnnualCashflow = 0
      const unitDetails = []

      for (const unitPartner of partner.unitPartners) {
        const unit = unitPartner.unit
        const percentage = unitPartner.percentage

        // حساب الأقساط الشهرية
        let monthlyInstallment = 0
        let annualInstallment = 0

        for (const contract of unit.contracts) {
          if (contract.installmentType === 'شهري' && contract.installmentCount > 0) {
            // حساب القسط الشهري
            const remainingAmount = contract.totalPrice - contract.discountAmount - contract.downPayment
            monthlyInstallment = remainingAmount / contract.installmentCount
            
            // حساب القسط السنوي الإضافي
            if (contract.extraAnnual > 0) {
              annualInstallment = contract.annualPaymentValue || 0
            }
          }
        }

        // حساب حصة الشريك من الأقساط
        const partnerMonthlyShare = (monthlyInstallment * percentage) / 100
        const partnerAnnualShare = (annualInstallment * percentage) / 100

        totalMonthlyCashflow += partnerMonthlyShare
        totalAnnualCashflow += partnerAnnualShare

        unitDetails.push({
          unitId: unit.id,
          unitCode: unit.code,
          unitName: unit.name,
          area: unit.area,
          building: unit.building,
          floor: unit.floor,
          totalPrice: unit.totalPrice,
          percentage: percentage,
          monthlyInstallment: monthlyInstallment,
          annualInstallment: annualInstallment,
          partnerMonthlyShare: partnerMonthlyShare,
          partnerAnnualShare: partnerAnnualShare
        })
      }

      partnerCashflows.push({
        partnerId: partner.id,
        partnerName: partner.name,
        phone: partner.phone,
        notes: partner.notes,
        totalMonthlyCashflow: totalMonthlyCashflow,
        totalAnnualCashflow: totalAnnualCashflow,
        unitDetails: unitDetails
      })
    }

    // ملخص عام
    const totalMonthlyAllPartners = partnerCashflows.reduce((sum, p) => sum + p.totalMonthlyCashflow, 0)
    const totalAnnualAllPartners = partnerCashflows.reduce((sum, p) => sum + p.totalAnnualCashflow, 0)

    // إحصائيات إضافية
    const stats = {
      totalPartners: partners.length,
      totalUnits: partners.reduce((sum, p) => sum + p.unitPartners.length, 0),
      totalMonthlyCashflow: totalMonthlyAllPartners,
      totalAnnualCashflow: totalAnnualAllPartners,
      averageMonthlyPerPartner: partners.length > 0 ? totalMonthlyAllPartners / partners.length : 0
    }

    return NextResponse.json({
      success: true,
      data: {
        partners: partnerCashflows,
        stats: stats,
        filters: {
          month: month,
          year: year
        }
      }
    })

  } catch (error) {
    console.error('Error fetching cashflow report:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'فشل في جلب تقرير التدفقات النقدية',
        details: error instanceof Error ? error.message : 'خطأ غير معروف'
      },
      { status: 500 }
    )
  }
}