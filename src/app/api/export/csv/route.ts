import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

// GET /api/export/csv - Export data as CSV

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
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

    let csvData = ''
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
        
        csvData = [
          ['الاسم', 'رقم الهاتف', 'الرقم القومي', 'العنوان', 'الحالة', 'ملاحظات'],
          ...customers.map(c => [
            c.name,
            c.phone,
            c.nationalId || '',
            c.address || '',
            c.status,
            c.notes || ''
          ])
        ].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
        
        filename = `customers-${new Date().toISOString().split('T')[0]}.csv`
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
        
        csvData = [
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
        ].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
        
        filename = `units-${new Date().toISOString().split('T')[0]}.csv`
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
        
        csvData = [
          ['كود الوحدة', 'اسم الوحدة', 'المبلغ', 'تاريخ الاستحقاق', 'الحالة', 'ملاحظات'],
          ...installments.map(i => [
            i.unit.code,
            i.unit.name || '',
            i.amount,
            i.dueDate.toISOString().split('T')[0],
            i.status,
            i.notes || ''
          ])
        ].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
        
        filename = `installments-${new Date().toISOString().split('T')[0]}.csv`
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
        
        csvData = [
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
        ].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
        
        filename = `vouchers-${new Date().toISOString().split('T')[0]}.csv`
        break

      default:
        return NextResponse.json(
          { success: false, error: 'نوع التصدير غير مدعوم' },
          { status: 400 }
        )
    }

    return new NextResponse(csvData, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('Error exporting CSV:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في تصدير البيانات' },
      { status: 500 }
    )
  }
}