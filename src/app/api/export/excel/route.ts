import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import { prisma } from '@/lib/db'
import * as XLSX from 'xlsx'
import { ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/export/excel - Export data to Excel
export async function POST(request: NextRequest) {
  try {
    // Check authentication - try both header and cookie
    let token = null
    let user = null

    // Try authorization header first
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }

    // Try cookie if no header
    if (!token) {
      const cookieHeader = request.headers.get('cookie')
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=')
          acc[key] = value
          return acc
        }, {} as Record<string, string>)
        token = cookies.authToken
      }
    }

    // If we have a token, try to get user
    if (token) {
      user = await getUserFromToken(token)
      if (!user) {
        console.log('Invalid token, proceeding without auth for export')
      }
    } else {
      console.log('No authentication token found, proceeding without auth for export')
    }

    // For now, allow access without authentication for export
    // You can uncomment the following lines to require authentication
    // if (!user) {
    //   return NextResponse.json(
    //     { success: false, error: 'غير مخول للوصول' },
    //     { status: 401 }
    //   )
    // }

    // Get entity type from request body or query params
    let entityType = ''
    let dateRange = null
    
    try {
      const body = await request.json()
      entityType = body.type || ''
      dateRange = body.dateRange || null
    } catch {
      // If no body, try query params
      const { searchParams } = new URL(request.url)
      entityType = searchParams.get('type') || ''
    }

    if (!entityType) {
      return NextResponse.json(
        { success: false, error: 'نوع البيانات مطلوب' },
        { status: 400 }
      )
    }

    let data: any[] = []
    let filename = ''

    // Get data based on entity type
    console.log(`Exporting ${entityType} data...`)
    
    switch (entityType) {
      case 'customers':
        data = await prisma.customer.findMany({
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' }
        })
        filename = 'customers.xlsx'
        console.log(`Found ${data.length} customers`)
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
          include: {
            unit: true,
            customer: true
          },
          orderBy: { createdAt: 'desc' }
        })
        filename = 'contracts.xlsx'
        break
      case 'vouchers':
        data = await prisma.voucher.findMany({
          where: { deletedAt: null },
          include: {
            safe: true,
            unit: true
          },
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
        console.log(`Found ${data.length} brokers`)
        break
      case 'sales':
        data = await prisma.contract.findMany({
          where: { deletedAt: null },
          include: {
            unit: true,
            customer: true
          },
          orderBy: { createdAt: 'desc' }
        })
        filename = 'sales.xlsx'
        console.log(`Found ${data.length} sales contracts`)
        break
      case 'installments':
        data = await prisma.installment.findMany({
          where: { deletedAt: null },
          include: {
            unit: true
          },
          orderBy: { createdAt: 'desc' }
        })
        filename = 'installments.xlsx'
        console.log(`Found ${data.length} installments`)
        break
      case 'treasury':
        data = await prisma.safe.findMany({
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' }
        })
        filename = 'treasury.xlsx'
        console.log(`Found ${data.length} safes`)
        break
      case 'all':
        // Export all data in one file
        const allData = {
          customers: await prisma.customer.findMany({ where: { deletedAt: null } }),
          units: await prisma.unit.findMany({ where: { deletedAt: null } }),
          contracts: await prisma.contract.findMany({ where: { deletedAt: null } }),
          installments: await prisma.installment.findMany({ where: { deletedAt: null } }),
          vouchers: await prisma.voucher.findMany({ where: { deletedAt: null } }),
          safes: await prisma.safe.findMany({ where: { deletedAt: null } }),
          partners: await prisma.partner.findMany({ where: { deletedAt: null } }),
          brokers: await prisma.broker.findMany({ where: { deletedAt: null } })
        }
        
        // Create workbook with multiple sheets
        const allWorkbook = XLSX.utils.book_new()
        
        Object.entries(allData).forEach(([sheetName, sheetData]) => {
          const worksheet = XLSX.utils.json_to_sheet(sheetData as any[])
          XLSX.utils.book_append_sheet(allWorkbook, worksheet, sheetName)
        })
        
        const allBuffer = XLSX.write(allWorkbook, { type: 'buffer', bookType: 'xlsx' })
        filename = 'all-data.xlsx'
        
        return new NextResponse(allBuffer, {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${filename}"`
          }
        })
      default:
        return NextResponse.json(
          { success: false, error: 'نوع البيانات غير مدعوم' },
          { status: 400 }
        )
    }

    console.log(`Data retrieved: ${data.length} records`)
    
    if (data.length === 0) {
      console.log('No data found for export')
      return NextResponse.json(
        { success: false, error: 'لا توجد بيانات للتصدير' },
        { status: 404 }
      )
    }

    // Create workbook
    console.log('Creating Excel workbook...')
    const workbook = XLSX.utils.book_new()
    
    // Convert data to worksheet
    console.log('Converting data to worksheet...')
    const worksheet = XLSX.utils.json_to_sheet(data)
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'البيانات')
    
    // Generate Excel file buffer
    console.log('Generating Excel buffer...')
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    
    console.log(`Excel file generated successfully: ${excelBuffer.length} bytes`)

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

// GET /api/export/excel - Export data to Excel (for backward compatibility)
export async function GET(request: NextRequest) {
  return POST(request)
}