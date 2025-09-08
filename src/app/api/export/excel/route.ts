import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import { prisma } from '@/lib/db'
import * as XLSX from 'xlsx'
import { ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/export/excel - Export data to Excel
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'غير مخول للوصول' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const user = await getUserFromToken(token)
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مخول للوصول' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('type') || ''

    if (!entityType) {
      return NextResponse.json(
        { success: false, error: 'نوع البيانات مطلوب' },
        { status: 400 }
      )
    }

    let data: any[] = []
    let filename = ''

    // Get data based on entity type
    switch (entityType) {
      case 'customers':
        data = await prisma.customer.findMany({
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' }
        })
        filename = 'customers.xlsx'
        break
      case 'units':
        data = await prisma.unit.findMany({
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' }
        })
        filename = 'units.xlsx'
        break
      case 'contracts':
        data = await prisma.contract.findMany({
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' }
        })
        filename = 'contracts.xlsx'
        break
      case 'vouchers':
        data = await prisma.voucher.findMany({
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' }
        })
        filename = 'vouchers.xlsx'
        break
      case 'safes':
        data = await prisma.safe.findMany({
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' }
        })
        filename = 'safes.xlsx'
        break
      case 'partners':
        data = await prisma.partner.findMany({
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' }
        })
        filename = 'partners.xlsx'
        break
      case 'brokers':
        data = await prisma.broker.findMany({
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' }
        })
        filename = 'brokers.xlsx'
        break
      default:
        return NextResponse.json(
          { success: false, error: 'نوع البيانات غير مدعوم' },
          { status: 400 }
        )
    }

    if (data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'لا توجد بيانات للتصدير' },
        { status: 404 }
      )
    }

    // Create workbook
    const workbook = XLSX.utils.book_new()
    
    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(data)
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'البيانات')
    
    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Return Excel file
    return new NextResponse(excelBuffer, {
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