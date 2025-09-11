const { PrismaClient } = require('@prisma/client')
const ExcelJS = require('exceljs')

async function generateCashflowExcel() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://neondb_owner:npg_x5qvmpzF3hjX@ep-dawn-cell-adylfb98-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
      }
    }
  })

  try {
    console.log('📊 إنشاء تقرير Excel للتدفقات النقدية...')

    // جلب البيانات
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
                }
              }
            }
          }
        }
      }
    })

    // إنشاء ملف Excel
    const workbook = new ExcelJS.Workbook()
    
    // ورقة العمل الرئيسية
    const worksheet = workbook.addWorksheet('تدفقات الشركاء النقدية')
    
    // تنسيق الأعمدة
    worksheet.columns = [
      { header: 'اسم الشريك', key: 'partnerName', width: 20 },
      { header: 'الهاتف', key: 'phone', width: 15 },
      { header: 'كود الوحدة', key: 'unitCode', width: 15 },
      { header: 'اسم الوحدة', key: 'unitName', width: 25 },
      { header: 'المبنى', key: 'building', width: 15 },
      { header: 'الطابق', key: 'floor', width: 15 },
      { header: 'المساحة', key: 'area', width: 15 },
      { header: 'السعر الإجمالي', key: 'totalPrice', width: 15 },
      { header: 'نسبة المشاركة %', key: 'percentage', width: 15 },
      { header: 'القسط الشهري', key: 'monthlyInstallment', width: 15 },
      { header: 'حصة الشريك الشهرية', key: 'partnerShare', width: 20 },
      { header: 'الحصة السنوية', key: 'annualShare', width: 15 }
    ]

    // تنسيق الرؤوس
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '366092' }
    }
    worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' }

    let rowNumber = 2
    let totalMonthlyCashflow = 0

    // ملء البيانات
    for (const partner of partners) {
      for (const unitPartner of partner.unitPartners) {
        const unit = unitPartner.unit
        const percentage = unitPartner.percentage

        // حساب القسط الشهري
        let monthlyInstallment = 0
        for (const contract of unit.contracts) {
          if (contract.installmentType === 'شهري' && contract.installmentCount > 0) {
            const remainingAmount = contract.totalPrice - contract.discountAmount - contract.downPayment
            monthlyInstallment = remainingAmount / contract.installmentCount
            break
          }
        }

        const partnerShare = (monthlyInstallment * percentage) / 100
        const annualShare = partnerShare * 12
        totalMonthlyCashflow += partnerShare

        worksheet.addRow({
          partnerName: partner.name,
          phone: partner.phone || '',
          unitCode: unit.code,
          unitName: unit.name || '',
          building: unit.building || '',
          floor: unit.floor || '',
          area: unit.area || '',
          totalPrice: unit.totalPrice,
          percentage: percentage,
          monthlyInstallment: monthlyInstallment,
          partnerShare: partnerShare,
          annualShare: annualShare
        })

        // تنسيق الصف
        const row = worksheet.getRow(rowNumber)
        row.alignment = { horizontal: 'center', vertical: 'middle' }
        
        // تلوين الصفوف المتناوبة
        if (rowNumber % 2 === 0) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'F2F2F2' }
          }
        }

        rowNumber++
      }
    }

    // إضافة صف الإجمالي
    const totalRow = worksheet.addRow({
      partnerName: 'الإجمالي',
      phone: '',
      unitCode: '',
      unitName: '',
      building: '',
      floor: '',
      area: '',
      totalPrice: '',
      percentage: '',
      monthlyInstallment: '',
      partnerShare: totalMonthlyCashflow,
      annualShare: totalMonthlyCashflow * 12
    })

    // تنسيق صف الإجمالي
    totalRow.font = { bold: true, color: { argb: 'FFFFFF' } }
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'D32F2F' }
    }
    totalRow.alignment = { horizontal: 'center', vertical: 'middle' }

    // تنسيق الأرقام
    worksheet.getColumn('totalPrice').numFmt = '#,##0'
    worksheet.getColumn('monthlyInstallment').numFmt = '#,##0.00'
    worksheet.getColumn('partnerShare').numFmt = '#,##0.00'
    worksheet.getColumn('annualShare').numFmt = '#,##0.00'

    // إضافة حدود للجدول
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      })
    })

    // ورقة العمل الثانية - ملخص شهري
    const summarySheet = workbook.addWorksheet('ملخص شهري')
    
    summarySheet.columns = [
      { header: 'الشهر', key: 'month', width: 15 },
      { header: 'إجمالي التدفق الشهري', key: 'monthlyTotal', width: 20 },
      { header: 'إجمالي التدفق السنوي', key: 'annualTotal', width: 20 }
    ]

    // تنسيق رؤوس الملخص
    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } }
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '366092' }
    }
    summarySheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' }

    const months = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ]

    months.forEach((month, index) => {
      summarySheet.addRow({
        month: month,
        monthlyTotal: totalMonthlyCashflow,
        annualTotal: totalMonthlyCashflow * 12
      })
    })

    // تنسيق أرقام الملخص
    summarySheet.getColumn('monthlyTotal').numFmt = '#,##0.00'
    summarySheet.getColumn('annualTotal').numFmt = '#,##0.00'

    // إضافة حدود لملخص
    summarySheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      })
    })

    // حفظ الملف
    const fileName = `partner-cashflow-${new Date().toISOString().split('T')[0]}.xlsx`
    await workbook.xlsx.writeFile(fileName)

    console.log('✅ تم إنشاء ملف Excel بنجاح!')
    console.log(`📁 اسم الملف: ${fileName}`)
    console.log('')
    console.log('📊 ملخص التقرير:')
    console.log(`💰 إجمالي التدفق الشهري: ${totalMonthlyCashflow.toLocaleString()} جنيه`)
    console.log(`💰 إجمالي التدفق السنوي: ${(totalMonthlyCashflow * 12).toLocaleString()} جنيه`)
    console.log(`👥 عدد الشركاء: ${partners.length}`)
    console.log('')
    console.log('🎯 تدفقات شهر نوفمبر:')
    console.log(`💰 إجمالي التدفق: ${totalMonthlyCashflow.toLocaleString()} جنيه`)

    return {
      fileName,
      totalMonthly: totalMonthlyCashflow,
      totalAnnual: totalMonthlyCashflow * 12,
      partnersCount: partners.length
    }

  } catch (error) {
    console.error('❌ خطأ في إنشاء ملف Excel:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// تشغيل السكريبت
generateCashflowExcel()
  .then((result) => {
    console.log('🎉 تم إنجاز المهمة بنجاح!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 فشل في إنجاز المهمة:', error)
    process.exit(1)
  })