import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import ExcelJS from 'exceljs'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year') || new Date().getFullYear().toString()

    console.log('📊 تصدير تقرير التدفقات النقدية إلى Excel...')

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

    // تحويل إلى buffer
    const buffer = await workbook.xlsx.writeBuffer()

    // إرجاع الملف
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="partner-cashflow-${year}-${month?.toString().padStart(2, '0') || 'all'}.xlsx"`
      }
    })

  } catch (error) {
    console.error('Error exporting cashflow report:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'فشل في تصدير التقرير',
        details: error instanceof Error ? error.message : 'خطأ غير معروف'
      },
      { status: 500 }
    )
  }
}