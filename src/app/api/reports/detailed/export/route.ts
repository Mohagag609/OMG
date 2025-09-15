import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import ExcelJS from 'exceljs'

const prisma = new PrismaClient()


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year') || new Date().getFullYear().toString()
    const partnerId = searchParams.get('partnerId')
    const unitId = searchParams.get('unitId')
    const status = searchParams.get('status')

    console.log('📊 تصدير التقرير المفصل إلى Excel...')

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

    // إنشاء ملف Excel
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('التقرير المفصل للأقساط')

    // إعداد الأعمدة
    worksheet.columns = [
      { header: 'اسم الوحدة - الدور - المبنى', key: 'unitFullName', width: 30 },
      { header: 'نوع الوحدة', key: 'unitType', width: 15 },
      { header: 'اسم العميل', key: 'customerName', width: 20 },
      { header: 'اسم الشريك', key: 'partnerName', width: 20 },
      { header: 'مجموعة الشركاء', key: 'partnerGroupName', width: 20 },
      { header: 'تاريخ القسط', key: 'installmentDate', width: 15 },
      { header: 'قيمة القسط', key: 'installmentAmount', width: 15 },
      { header: 'المدفوع', key: 'paidAmount', width: 15 },
      { header: 'المتبقي', key: 'remainingAmount', width: 15 },
      { header: 'الحالة', key: 'status', width: 12 },
      { header: 'ملاحظات', key: 'notes', width: 20 }
    ]

    // تنسيق الرؤوس
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    }

    // تحويل البيانات وإضافتها
    const reportData = []

    for (const installment of filteredInstallments) {
      const unit = installment.unit
      const unitPartners = unit.unitPartners
      const contract = unit.contracts[0] || {}
      // جلب بيانات العميل من customerId
      const customer = contract.customerId ? 
        await prisma.customer.findUnique({ where: { id: contract.customerId } }) : 
        null

      // دمج اسم الوحدة ورقم الدور ورقم المبنى في عمود واحد
      const unitFullName = `${unit.name || unit.code} - الدور ${unit.floor || 'غير محدد'} - المبنى ${unit.building || 'غير محدد'}`

      // حساب المبلغ المدفوع والمتبقي
      const installmentAmount = installment.amount
      const isPaid = installment.status === 'مدفوع'
      const paidAmount = isPaid ? installmentAmount : 0
      const remainingAmount = isPaid ? 0 : installmentAmount

      // إذا لم تكن هناك شركاء، أضف سطر بدون شريك
      if (unitPartners.length === 0) {
        reportData.push({
          unitFullName: unitFullName,
          unitType: unit.building || 'غير محدد',
          customerName: customer?.name || 'لا يوجد عميل',
          partnerName: 'لا يوجد شريك',
          partnerGroupName: 'لا يوجد مجموعة',
          installmentDate: installment.dueDate,
          installmentAmount: installmentAmount,
          paidAmount: paidAmount,
          remainingAmount: remainingAmount,
          status: installment.status,
          notes: installment.notes || ''
        })
      } else {
        // إضافة سطر لكل شريك
        for (const unitPartner of unitPartners) {
          // جلب مجموعة الشركاء
          const partnerGroupRelation = await prisma.partnerGroupPartner.findFirst({
            where: { partnerId: unitPartner.partner.id },
            include: { partnerGroup: true }
          })
          const partnerGroup = partnerGroupRelation?.partnerGroup || null
          
          reportData.push({
            unitFullName: unitFullName,
            unitType: unit.building || 'غير محدد',
            customerName: customer?.name || 'لا يوجد عميل',
            partnerName: unitPartner.partner.name,
            partnerGroupName: partnerGroup?.name || 'لا يوجد مجموعة',
            installmentDate: installment.dueDate,
            installmentAmount: installmentAmount,
            paidAmount: paidAmount,
            remainingAmount: remainingAmount,
            status: installment.status,
            notes: installment.notes || ''
          })
        }
      }
    }

    // إضافة البيانات
    reportData.forEach(row => {
      worksheet.addRow({
        ...row,
        installmentDate: new Date(row.installmentDate).toLocaleDateString('ar-EG'),
        installmentAmount: row.installmentAmount
      })
    })

    // تنسيق الأعمدة
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        // تلوين الصفوف المدفوعة
        if (row.getCell('isPaid').value === 'نعم') {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE8F5E8' }
          }
        }
      }
    })

    // إضافة إحصائيات في نهاية الملف
    const totalInstallments = filteredInstallments.length
    const paidInstallments = filteredInstallments.filter(i => i.status === 'مدفوع').length
    const totalAmount = filteredInstallments.reduce((sum, i) => sum + i.amount, 0)
    const paidAmount = filteredInstallments.filter(i => i.status === 'مدفوع').reduce((sum, i) => sum + i.amount, 0)

    const statsRow = reportData.length + 3
    worksheet.getCell(`A${statsRow}`).value = 'إحصائيات التقرير:'
    worksheet.getCell(`A${statsRow}`).font = { bold: true }
    
    worksheet.getCell(`A${statsRow + 1}`).value = 'إجمالي الأقساط:'
    worksheet.getCell(`B${statsRow + 1}`).value = totalInstallments
    
    worksheet.getCell(`A${statsRow + 2}`).value = 'الأقساط المدفوعة:'
    worksheet.getCell(`B${statsRow + 2}`).value = paidInstallments
    
    worksheet.getCell(`A${statsRow + 3}`).value = 'إجمالي المبلغ:'
    worksheet.getCell(`B${statsRow + 3}`).value = totalAmount
    
    worksheet.getCell(`A${statsRow + 4}`).value = 'المبلغ المدفوع:'
    worksheet.getCell(`B${statsRow + 4}`).value = paidAmount

    // إعداد الاستجابة
    const buffer = await workbook.xlsx.writeBuffer()
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="detailed-report-${new Date().toISOString().split('T')[0]}.xlsx"`
      }
    })

  } catch (error) {
    console.error('Error exporting detailed report:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'فشل في تصدير التقرير المفصل',
        details: error instanceof Error ? error.message : 'خطأ غير معروف'
      },
      { status: 500 }
    )
  }
}