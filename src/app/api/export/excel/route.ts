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

    // Helper function to create customers sheet
    const createCustomersSheet = (customers: any[]) => {
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
      return XLSX.utils.aoa_to_sheet(customersData)
    }

    // Helper function to create units sheet
    const createUnitsSheet = (units: any[]) => {
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
      return XLSX.utils.aoa_to_sheet(unitsData)
    }

    // Helper function to create installments sheet
    const createInstallmentsSheet = (installments: any[]) => {
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
      return XLSX.utils.aoa_to_sheet(installmentsData)
    }

    // Helper function to create vouchers sheet
    const createVouchersSheet = (vouchers: any[]) => {
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
      return XLSX.utils.aoa_to_sheet(vouchersData)
    }

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
        
        const customersSheet = createCustomersSheet(customers)
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
        
        const unitsSheet = createUnitsSheet(units)
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
        
        const installmentsSheet = createInstallmentsSheet(installments)
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
        
        const vouchersSheet = createVouchersSheet(vouchers)
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

        // Create all sheets
        const allCustomersSheet = createCustomersSheet(allCustomers)
        const allUnitsSheet = createUnitsSheet(allUnits)
        const allInstallmentsSheet = createInstallmentsSheet(allInstallments)
        const allVouchersSheet = createVouchersSheet(allVouchers)

        // Append all sheets
        XLSX.utils.book_append_sheet(workbook, allCustomersSheet, 'العملاء')
        XLSX.utils.book_append_sheet(workbook, allUnitsSheet, 'الوحدات')
        XLSX.utils.book_append_sheet(workbook, allInstallmentsSheet, 'الأقساط')
        XLSX.utils.book_append_sheet(workbook, allVouchersSheet, 'السندات')

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