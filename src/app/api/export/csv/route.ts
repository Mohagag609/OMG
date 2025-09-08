import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/export/csv - Export data to CSV
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
        filename = 'customers.csv'
        break
      case 'units':
        data = await prisma.unit.findMany({
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' }
        })
        filename = 'units.csv'
        break
      case 'contracts':
        data = await prisma.contract.findMany({
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' }
        })
        filename = 'contracts.csv'
        break
      case 'vouchers':
        data = await prisma.voucher.findMany({
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' }
        })
        filename = 'vouchers.csv'
        break
      case 'safes':
        data = await prisma.safe.findMany({
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' }
        })
        filename = 'safes.csv'
        break
      case 'partners':
        data = await prisma.partner.findMany({
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' }
        })
        filename = 'partners.csv'
        break
      case 'brokers':
        data = await prisma.broker.findMany({
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' }
        })
        filename = 'brokers.csv'
        break
      default:
        return NextResponse.json(
          { success: false, error: 'نوع البيانات غير مدعوم' },
          { status: 400 }
        )
    }

    // Convert to CSV
    if (data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'لا توجد بيانات للتصدير' },
        { status: 404 }
      )
    }

    // Get headers from first object
    const headers = Object.keys(data[0])
    
    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]
          if (value === null || value === undefined) return ''
          if (typeof value === 'object') return JSON.stringify(value)
          return `"${String(value).replace(/"/g, '""')}"`
        }).join(',')
      )
    ].join('\n')

    // Return CSV file
    return new NextResponse(csvContent, {
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