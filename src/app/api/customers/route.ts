import { NextRequest, NextResponse } from 'next/server'
import { validateCustomer } from '@/utils/validation'
import { ApiResponse, Customer, PaginatedResponse } from '@/types'
import { ensureEnvironmentVariables } from '@/lib/env'
import { createAdvancedArabicSearch } from '@/utils/arabicSearch'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/customers - Get customers with pagination
export async function GET(request: NextRequest) {
  let db: any = null
  try {
    ensureEnvironmentVariables()
    console.log('📋 جاري تحميل العملاء...')

    // Get database connection
    db = await getDb()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    const whereClause: any = { deletedAt: null }

    if (search) {
      // استخدام البحث المتقدم للعربية
      const searchConditions = createAdvancedArabicSearch(search, ['name', 'phone', 'nationalId', 'address'])
      if (searchConditions.OR) {
        whereClause.OR = searchConditions.OR
      }
    }

    const skip = (page - 1) * limit
    
    // Build SQL query based on database type
    let customersQuery = 'SELECT * FROM customers WHERE deletedAt IS NULL'
    let countQuery = 'SELECT COUNT(*) as total FROM customers WHERE deletedAt IS NULL'
    const params: any[] = []
    
    if (search) {
      const searchConditions = createAdvancedArabicSearch(search, ['name', 'phone', 'nationalId', 'address'])
      if (searchConditions.OR) {
        const searchClause = searchConditions.OR.map((condition: any) => {
          const field = Object.keys(condition)[0]
          const value = condition[field]
          params.push(`%${value}%`)
          return `${field} LIKE ?`
        }).join(' OR ')
        
        customersQuery += ` AND (${searchClause})`
        countQuery += ` AND (${searchClause})`
      }
    }
    
    customersQuery += ' ORDER BY createdAt DESC'
    customersQuery += ` LIMIT ${limit} OFFSET ${skip}`
    
    const [customers, countResult] = await Promise.all([
      db.query(customersQuery, params),
      db.query(countQuery, params)
    ])
    
    const total = countResult[0]?.total || 0

    const totalPages = Math.ceil(total / limit)

    const response: PaginatedResponse<Customer> = {
      success: true,
      data: customers,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error getting customers:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  } finally {
    if (db) {
      await db.close()
    }
  }
}

// POST /api/customers - Create new customer
export async function POST(request: NextRequest) {
  let db: any = null
  try {
    ensureEnvironmentVariables()
    console.log('➕ جاري إنشاء عميل جديد...')

    // Get database connection
    db = await getDb()

    const body = await request.json()
    const { name, phone, nationalId, address, status, notes } = body

    // Validate customer data
    const validation = validateCustomer({ name, phone, nationalId, address, status, notes })
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.errors.join(', ') },
        { status: 400 }
      )
    }

    // Check if name already exists
    const existingCustomer = await db.query(
      'SELECT id FROM customers WHERE name = ? AND deletedAt IS NULL',
      [name]
    )

    if (existingCustomer.length > 0) {
      return NextResponse.json(
        { success: false, error: 'اسم العميل مستخدم بالفعل' },
        { status: 400 }
      )
    }

    // Generate ID
    const id = `customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Create customer
    const customer = await db.query(
      `INSERT INTO customers (id, name, phone, nationalId, address, status, notes, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [id, name, phone || null, nationalId || null, address || null, status || 'نشط', notes || null]
    )

    // Get created customer
    const createdCustomer = await db.query(
      'SELECT * FROM customers WHERE id = ?',
      [id]
    )

    const response: ApiResponse<Customer> = {
      success: true,
      data: createdCustomer[0],
      message: 'تم إضافة العميل بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  } finally {
    if (db) {
      await db.close()
    }
  }
}