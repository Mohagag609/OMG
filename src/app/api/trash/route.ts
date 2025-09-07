import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { getSoftDeletedEntities } from '@/lib/soft-delete'
import { ApiResponse, PaginatedResponse } from '@/types'

// GET /api/trash - Get soft-deleted entities


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
    const entityType = searchParams.get('type') || 'all'
    const limit = parseInt(searchParams.get('limit') || '50')

    let entities: any[] = []

    if (entityType === 'all') {
      // Get all types of soft-deleted entities
      const [
        customers,
        units,
        contracts,
        installments,
        vouchers,
        safes,
        partners,
        brokers
      ] = await Promise.all([
        getSoftDeletedEntities('customers', limit),
        getSoftDeletedEntities('units', limit),
        getSoftDeletedEntities('contracts', limit),
        getSoftDeletedEntities('installments', limit),
        getSoftDeletedEntities('vouchers', limit),
        getSoftDeletedEntities('safes', limit),
        getSoftDeletedEntities('partners', limit),
        getSoftDeletedEntities('brokers', limit)
      ])

      entities = [
        ...customers.map(e => ({ ...e, entityType: 'customers' })),
        ...units.map(e => ({ ...e, entityType: 'units' })),
        ...contracts.map(e => ({ ...e, entityType: 'contracts' })),
        ...installments.map(e => ({ ...e, entityType: 'installments' })),
        ...vouchers.map(e => ({ ...e, entityType: 'vouchers' })),
        ...safes.map(e => ({ ...e, entityType: 'safes' })),
        ...partners.map(e => ({ ...e, entityType: 'partners' })),
        ...brokers.map(e => ({ ...e, entityType: 'brokers' }))
      ]

      // Sort by deletion date
      entities.sort((a, b) => 
        new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()
      )
    } else {
      entities = await getSoftDeletedEntities(entityType, limit)
    }

    const response: PaginatedResponse<any> = {
      data: entities,
      pagination: {
        page: 1,
        limit,
        total: entities.length,
        totalPages: 1
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching trash:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}