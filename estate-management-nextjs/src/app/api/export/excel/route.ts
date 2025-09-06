import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import * as XLSX from 'xlsx'

// GET /api/export/excel - Export data as Excel
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مخول للوصول' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all'

    let workbook = XLSX.utils.book_new()
    let filename = ''

    switch (type) {
      case 'customers':
        const customers = await prisma.customer.findMany({
          where: { deletedAt: null },
          select: {
            name: true,
            phone: true,
            nationalId: true,
            address: true,
            status: true,
            notes: true
          }
        })
        
        const customersData = [
          ['الاسم', 'رقم الهاتف', 'الرقم القومي', 'العنوان', 'الحالة', 'ملاحظات'],
          ...customers.map(c => [
            c.name,
            c.phone,
            c.nationalId || '',
            c.address || '',
            c.status,
            c.notes || ''
          ])
        ]
        
        const customersSheet = XLSX.utils.aoa_to_sheet(customersData)
        XLSX.utils.book_append_sheet(workbook, customersSheet, 'العملاء')
        filename = `customers-${new Date().toISOString().split('T')[0]}.xlsx`
        break

      case 'units':
        const units = await prisma.unit.findMany({
          where: { deletedAt: null },
          select: {
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
        })
        
        const unitsData = [
          ['كود الوحدة', 'اسم الوحدة', 'النوع', 'المساحة', 'الدور', 'العمارة', 'السعر', 'الحالة', 'ملاحظات'],
          ...units.map(u => [
            u.code,
            u.name || '',
            u.unitType,
            u.area || '',
            u.floor || '',
            u.building || '',
            u.totalPrice,
            u.status,
            u.notes || ''
          ])
        ]
        
        const unitsSheet = XLSX.utils.aoa_to_sheet(unitsData)
        XLSX.utils.book_append_sheet(workbook, unitsSheet, 'الوحدات')
        filename = `units-${new Date().toISOString().split('T')[0]}.xlsx`
        break

      case 'installments':
        const installments = await prisma.installment.findMany({
          where: { deletedAt: null },
          include: {
            unit: {
              select: {
                code: true,
                name: true
              }
            }
          }
        })
        
        const installmentsData = [
          ['كود الوحدة', 'اسم الوحدة', 'المبلغ', 'تاريخ الاستحقاق', 'الحالة', 'ملاحظات'],
          ...installments.map(i => [
            i.unit.code,
            i.unit.name || '',
            i.amount,
            i.dueDate.toISOString().split('T')[0],
            i.status,
            i.notes || ''
          ])
        ]
        
        const installmentsSheet = XLSX.utils.aoa_to_sheet(installmentsData)
        XLSX.utils.book_append_sheet(workbook, installmentsSheet, 'الأقساط')
        filename = `installments-${new Date().toISOString().split('T')[0]}.xlsx`
        break

      case 'vouchers':
        const vouchers = await prisma.voucher.findMany({
          where: { deletedAt: null },
          include: {
            safe: {
              select: {
                name: true
              }
            }
          }
        })
        
        const vouchersData = [
          ['النوع', 'التاريخ', 'المبلغ', 'الخزنة', 'الوصف', 'المدفوع له', 'المستفيد'],
          ...vouchers.map(v => [
            v.type === 'receipt' ? 'سند قبض' : 'سند دفع',
            v.date.toISOString().split('T')[0],
            v.amount,
            v.safe.name,
            v.description,
            v.payer || '',
            v.beneficiary || ''
          ])
        ]
        
        const vouchersSheet = XLSX.utils.aoa_to_sheet(vouchersData)
        XLSX.utils.book_append_sheet(workbook, vouchersSheet, 'السندات')
        filename = `vouchers-${new Date().toISOString().split('T')[0]}.xlsx`
        break

      case 'all':
        // Export all data in separate sheets
        const [allCustomers, allUnits, allInstallments, allVouchers] = await Promise.all([
          prisma.customer.findMany({
            where: { deletedAt: null },
            select: {
              name: true,
              phone: true,
              nationalId: true,
              address: true,
              status: true,
              notes: true
            }
          }),
          prisma.unit.findMany({
            where: { deletedAt: null },
            select: {
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
            where: { deletedAt: null },
            include: {
              unit: {
                select: {
                  code: true,
                  name: true
                }
              }
            }
          }),
          prisma.voucher.findMany({
            where: { deletedAt: null },
            include: {
              safe: {
                select: {
                  name: true
                }
              }
            }
          })
        ])

        // Customers sheet
        const customersSheetData = [
          ['الاسم', 'رقم الهاتف', 'الرقم القومي', 'العنوان', 'الحالة', 'ملاحظات'],
          ...allCustomers.map(c => [
            c.name,
            c.phone,
            c.nationalId || '',
            c.address || '',
            c.status,
            c.notes || ''
          ])
        ]
        const customersSheet = XLSX.utils.aoa_to_sheet(customersSheetData)
        XLSX.utils.book_append_sheet(workbook, customersSheet, 'العملاء')

        // Units sheet
        const unitsSheetData = [
          ['كود الوحدة', 'اسم الوحدة', 'النوع', 'المساحة', 'الدور', 'العمارة', 'السعر', 'الحالة', 'ملاحظات'],
          ...allUnits.map(u => [
            u.code,
            u.name || '',
            u.unitType,
            u.area || '',
            u.floor || '',
            u.building || '',
            u.totalPrice,
            u.status,
            u.notes || ''
          ])
        ]
        const unitsSheet = XLSX.utils.aoa_to_sheet(unitsSheetData)
        XLSX.utils.book_append_sheet(workbook, unitsSheet, 'الوحدات')

        // Installments sheet
        const installmentsSheetData = [
          ['كود الوحدة', 'اسم الوحدة', 'المبلغ', 'تاريخ الاستحقاق', 'الحالة', 'ملاحظات'],
          ...allInstallments.map(i => [
            i.unit.code,
            i.unit.name || '',
            i.amount,
            i.dueDate.toISOString().split('T')[0],
            i.status,
            i.notes || ''
          ])
        ]
        const installmentsSheet = XLSX.utils.aoa_to_sheet(installmentsSheetData)
        XLSX.utils.book_append_sheet(workbook, installmentsSheet, 'الأقساط')

        // Vouchers sheet
        const vouchersSheetData = [
          ['النوع', 'التاريخ', 'المبلغ', 'الخزنة', 'الوصف', 'المدفوع له', 'المستفيد'],
          ...allVouchers.map(v => [
            v.type === 'receipt' ? 'سند قبض' : 'سند دفع',
            v.date.toISOString().split('T')[0],
            v.amount,
            v.safe.name,
            v.description,
            v.payer || '',
            v.beneficiary || ''
          ])
        ]
        const vouchersSheet = XLSX.utils.aoa_to_sheet(vouchersSheetData)
        XLSX.utils.book_append_sheet(workbook, vouchersSheet, 'السندات')

        filename = `estate-data-${new Date().toISOString().split('T')[0]}.xlsx`
        break

      default:
        return NextResponse.json(
          { success: false, error: 'نوع التصدير غير مدعوم' },
          { status: 400 }
        )
    }

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('Error exporting Excel:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في تصدير البيانات' },
      { status: 500 }
    )
  }
}