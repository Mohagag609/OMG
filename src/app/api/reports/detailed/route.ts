import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year') || new Date().getFullYear().toString()
    const partnerId = searchParams.get('partnerId')
    const unitId = searchParams.get('unitId')
    const status = searchParams.get('status') // مدفوع، غير مدفوع، معلق

    console.log('📊 جلب التقرير المفصل للأقساط...')

    // بناء فلتر البحث
    const whereClause: any = {
      deletedAt: null
    }

    if (month) {
      whereClause.dueDate = {
        gte: new Date(parseInt(year), parseInt(month) - 1, 1),
        lt: new Date(parseInt(year), parseInt(month), 1)
      }
    }

    if (status) {
      whereClause.status = status
    }

    // جلب جميع الأقساط مع تفاصيل الوحدة والشريك
    const installments = await prisma.installment.findMany({
      where: whereClause,
      include: {
        unit: {
          include: {
            unitPartners: {
              include: {
                partner: true
              }
            },
            contracts: {
              where: {
                deletedAt: null
              }
            }
          }
        }
      },
      orderBy: [
        { unit: { code: 'asc' } },
        { dueDate: 'asc' }
      ]
    })

    // فلترة إضافية حسب الشريك أو الوحدة
    let filteredInstallments = installments

    if (partnerId) {
      filteredInstallments = installments.filter(installment =>
        installment.unit.unitPartners.some(up => up.partnerId === partnerId)
      )
    }

    if (unitId) {
      filteredInstallments = filteredInstallments.filter(installment =>
        installment.unitId === unitId
      )
    }

    // تحويل البيانات إلى التنسيق المطلوب
    const reportData = []

    for (const installment of filteredInstallments) {
      const unit = installment.unit
      const unitPartners = unit.unitPartners
      const contract = unit.contracts[0] || {}

      // إذا لم تكن هناك شركاء، أضف سطر بدون شريك
      if (unitPartners.length === 0) {
        reportData.push({
          unitName: unit.name || unit.code,
          partnerName: 'لا يوجد شريك',
          percentage: 0,
          unitType: unit.building || 'غير محدد',
          paymentType: contract.installmentType || 'غير محدد',
          installmentDate: installment.dueDate,
          installmentAmount: installment.amount,
          isPaid: installment.status === 'مدفوع',
          dueDate: installment.dueDate,
          totalInstallments: contract.installmentCount || 0,
          status: installment.status,
          notes: installment.notes
        })
      } else {
        // إضافة سطر لكل شريك
        for (const unitPartner of unitPartners) {
          reportData.push({
            unitName: unit.name || unit.code,
            partnerName: unitPartner.partner.name,
            percentage: unitPartner.percentage,
            unitType: unit.building || 'غير محدد',
            paymentType: contract.installmentType || 'غير محدد',
            installmentDate: installment.dueDate,
            installmentAmount: installment.amount,
            isPaid: installment.status === 'مدفوع',
            dueDate: installment.dueDate,
            totalInstallments: contract.installmentCount || 0,
            status: installment.status,
            notes: installment.notes
          })
        }
      }
    }

    // إحصائيات
    const totalInstallments = filteredInstallments.length
    const paidInstallments = filteredInstallments.filter(i => i.status === 'مدفوع').length
    const unpaidInstallments = totalInstallments - paidInstallments
    const totalAmount = filteredInstallments.reduce((sum, i) => sum + i.amount, 0)
    const paidAmount = filteredInstallments.filter(i => i.status === 'مدفوع').reduce((sum, i) => sum + i.amount, 0)

    // تجميع حسب الشريك
    const partnerStats = {}
    reportData.forEach(row => {
      if (row.partnerName !== 'لا يوجد شريك') {
        if (!partnerStats[row.partnerName]) {
          partnerStats[row.partnerName] = {
            totalAmount: 0,
            paidAmount: 0,
            installments: 0
          }
        }
        partnerStats[row.partnerName].totalAmount += row.installmentAmount
        if (row.isPaid) {
          partnerStats[row.partnerName].paidAmount += row.installmentAmount
        }
        partnerStats[row.partnerName].installments += 1
      }
    })

    const stats = {
      totalInstallments,
      paidInstallments,
      unpaidInstallments,
      totalAmount,
      paidAmount,
      remainingAmount: totalAmount - paidAmount,
      partnerStats
    }

    return NextResponse.json({
      success: true,
      data: {
        report: reportData,
        stats: stats,
        filters: {
          month,
          year,
          partnerId,
          unitId,
          status
        }
      }
    })

  } catch (error) {
    console.error('Error fetching detailed report:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'فشل في جلب التقرير المفصل',
        details: error instanceof Error ? error.message : 'خطأ غير معروف'
      },
      { status: 500 }
    )
  }
}