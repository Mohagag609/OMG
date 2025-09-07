import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { AppState, ApiResponse } from '@/types'

// GET /api/export - Export all data as JSON


export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export async function GET(request: NextRequest) {
  try {
    // Get all data from database
    const [
      customers,
      units,
      partners,
      unitPartners,
      contracts,
      installments,
      safes,
      transfers,
      auditLog,
      vouchers,
      brokerDues,
      brokers,
      partnerGroups,
      settings
    ] = await Promise.all([
      prisma.customer.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
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
          id: true,
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
      prisma.partner.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          phone: true,
          notes: true
        }
      }),
      prisma.unitPartner.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          unitId: true,
          partnerId: true,
          percentage: true
        }
      }),
      prisma.contract.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          unitId: true,
          customerId: true,
          start: true,
          totalPrice: true,
          discountAmount: true,
          brokerName: true,
          commissionSafeId: true,
          brokerAmount: true
        }
      }),
      prisma.installment.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          unitId: true,
          amount: true,
          dueDate: true,
          status: true,
          notes: true
        }
      }),
      prisma.safe.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          balance: true
        }
      }),
      prisma.transfer.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          fromSafeId: true,
          toSafeId: true,
          amount: true,
          description: true
        }
      }),
      prisma.auditLog.findMany({
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          oldValues: true,
          newValues: true,
          userId: true,
          ipAddress: true,
          userAgent: true,
          createdAt: true
        }
      }),
      prisma.voucher.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          type: true,
          date: true,
          amount: true,
          safeId: true,
          description: true,
          payer: true,
          beneficiary: true,
          linkedRef: true
        }
      }),
      prisma.brokerDue.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          brokerId: true,
          amount: true,
          dueDate: true,
          status: true,
          notes: true
        }
      }),
      prisma.broker.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          phone: true,
          notes: true
        }
      }),
      prisma.partnerGroup.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          notes: true
        }
      }),
      prisma.settings.findMany({
        select: {
          key: true,
          value: true
        }
      })
    ])

    // Transform data to match original JSON structure
    const appState: AppState = {
      customers: customers.map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        nationalId: c.nationalId || undefined,
        address: c.address || undefined,
        status: c.status,
        notes: c.notes || undefined
      })),
      units: units.map(u => ({
        id: u.id,
        code: u.code,
        name: u.name || undefined,
        unitType: u.unitType,
        area: u.area || undefined,
        floor: u.floor || undefined,
        building: u.building || undefined,
        totalPrice: u.totalPrice,
        status: u.status,
        notes: u.notes || undefined
      })),
      partners: partners.map(p => ({
        id: p.id,
        name: p.name,
        phone: p.phone || undefined,
        notes: p.notes || undefined
      })),
      unitPartners: unitPartners.map(up => ({
        id: up.id,
        unitId: up.unitId,
        partnerId: up.partnerId,
        percentage: up.percentage
      })),
      contracts: contracts.map(c => ({
        id: c.id,
        unitId: c.unitId,
        customerId: c.customerId,
        start: c.start.toISOString().split('T')[0],
        totalPrice: c.totalPrice,
        discountAmount: c.discountAmount,
        brokerName: c.brokerName || undefined,
        commissionSafeId: c.commissionSafeId || undefined,
        brokerAmount: c.brokerAmount
      })),
      installments: installments.map(i => ({
        id: i.id,
        unitId: i.unitId,
        amount: i.amount,
        dueDate: i.dueDate.toISOString().split('T')[0],
        status: i.status,
        notes: i.notes || undefined
      })),
      safes: safes.map(s => ({
        id: s.id,
        name: s.name,
        balance: s.balance
      })),
      transfers: transfers.map(t => ({
        id: t.id,
        fromSafeId: t.fromSafeId,
        toSafeId: t.toSafeId,
        amount: t.amount,
        description: t.description || undefined
      })),
      auditLog: auditLog.map(a => ({
        id: a.id,
        action: a.action,
        entityType: a.entityType,
        entityId: a.entityId,
        oldValues: a.oldValues || undefined,
        newValues: a.newValues || undefined,
        userId: a.userId || undefined,
        ipAddress: a.ipAddress || undefined,
        userAgent: a.userAgent || undefined,
        timestamp: a.createdAt.toISOString()
      })),
      vouchers: vouchers.map(v => ({
        id: v.id,
        type: v.type as 'receipt' | 'payment',
        date: v.date.toISOString().split('T')[0],
        amount: v.amount,
        safeId: v.safeId,
        description: v.description,
        payer: v.payer || undefined,
        beneficiary: v.beneficiary || undefined,
        linked_ref: v.linkedRef || undefined
      })),
      brokerDues: brokerDues.map(bd => ({
        id: bd.id,
        brokerId: bd.brokerId,
        amount: bd.amount,
        dueDate: bd.dueDate.toISOString().split('T')[0],
        status: bd.status,
        notes: bd.notes || undefined
      })),
      brokers: brokers.map(b => ({
        id: b.id,
        name: b.name,
        phone: b.phone || undefined,
        notes: b.notes || undefined
      })),
      partnerGroups: partnerGroups.map(pg => ({
        id: pg.id,
        name: pg.name,
        notes: pg.notes || undefined
      })),
      settings: {
        theme: 'dark',
        font: 16,
        pass: undefined
      },
      locked: false
    }

    // Convert settings array to object
    settings.forEach(setting => {
      if (setting.key === 'theme') appState.settings.theme = setting.value
      if (setting.key === 'font') appState.settings.font = parseInt(setting.value)
      if (setting.key === 'pass') appState.settings.pass = setting.value || undefined
    })

    const response: ApiResponse<AppState> = {
      success: true,
      data: appState
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error exporting data:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في تصدير البيانات' },
      { status: 500 }
    )
  }
}