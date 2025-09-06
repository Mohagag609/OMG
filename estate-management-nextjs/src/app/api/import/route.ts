import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { AppState, ApiResponse } from '@/types'
import { validatePhone, validateNationalId, validateUnitCode } from '@/utils/validation'
import { formatPhone, formatNationalId, formatUnitCode } from '@/utils/formatting'

// POST /api/import - Import data from JSON
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const appState: AppState = body

    // Validate required fields
    if (!appState.customers || !appState.units || !appState.safes) {
      return NextResponse.json(
        { success: false, error: 'البيانات غير مكتملة' },
        { status: 400 }
      )
    }

    // Start transaction
    await prisma.$transaction(async (tx) => {
      // Clear existing data (soft delete)
      const now = new Date()
      await Promise.all([
        tx.customer.updateMany({ data: { deletedAt: now } }),
        tx.unit.updateMany({ data: { deletedAt: now } }),
        tx.partner.updateMany({ data: { deletedAt: now } }),
        tx.unitPartner.updateMany({ data: { deletedAt: now } }),
        tx.contract.updateMany({ data: { deletedAt: now } }),
        tx.installment.updateMany({ data: { deletedAt: now } }),
        tx.safe.updateMany({ data: { deletedAt: now } }),
        tx.transfer.updateMany({ data: { deletedAt: now } }),
        tx.voucher.updateMany({ data: { deletedAt: now } }),
        tx.brokerDue.updateMany({ data: { deletedAt: now } }),
        tx.broker.updateMany({ data: { deletedAt: now } }),
        tx.partnerGroup.updateMany({ data: { deletedAt: now } })
      ])

      // Import customers
      if (appState.customers.length > 0) {
        const customersData = appState.customers.map(customer => ({
          id: customer.id,
          name: customer.name,
          phone: formatPhone(customer.phone),
          nationalId: customer.nationalId ? formatNationalId(customer.nationalId) : null,
          address: customer.address || null,
          status: customer.status || 'نشط',
          notes: customer.notes || null
        }))
        await tx.customer.createMany({ data: customersData })
      }

      // Import units
      if (appState.units.length > 0) {
        const unitsData = appState.units.map(unit => ({
          id: unit.id,
          code: formatUnitCode(unit.code),
          name: unit.name || null,
          unitType: unit.unitType || 'سكني',
          area: unit.area || null,
          floor: unit.floor || null,
          building: unit.building || null,
          totalPrice: unit.totalPrice || 0,
          status: unit.status || 'متاحة',
          notes: unit.notes || null
        }))
        await tx.unit.createMany({ data: unitsData })
      }

      // Import partners
      if (appState.partners.length > 0) {
        const partnersData = appState.partners.map(partner => ({
          id: partner.id,
          name: partner.name,
          phone: partner.phone || null,
          notes: partner.notes || null
        }))
        await tx.partner.createMany({ data: partnersData })
      }

      // Import unit partners
      if (appState.unitPartners.length > 0) {
        const unitPartnersData = appState.unitPartners.map(up => ({
          id: up.id,
          unitId: up.unitId,
          partnerId: up.partnerId,
          percentage: up.percentage
        }))
        await tx.unitPartner.createMany({ data: unitPartnersData })
      }

      // Import contracts
      if (appState.contracts.length > 0) {
        const contractsData = appState.contracts.map(contract => ({
          id: contract.id,
          unitId: contract.unitId,
          customerId: contract.customerId,
          start: new Date(contract.start),
          totalPrice: contract.totalPrice,
          discountAmount: contract.discountAmount || 0,
          brokerName: contract.brokerName || null,
          commissionSafeId: contract.commissionSafeId || null,
          brokerAmount: contract.brokerAmount || 0
        }))
        await tx.contract.createMany({ data: contractsData })
      }

      // Import installments
      if (appState.installments.length > 0) {
        const installmentsData = appState.installments.map(installment => ({
          id: installment.id,
          unitId: installment.unitId,
          amount: installment.amount,
          dueDate: new Date(installment.dueDate),
          status: installment.status || 'معلق',
          notes: installment.notes || null
        }))
        await tx.installment.createMany({ data: installmentsData })
      }

      // Import safes
      if (appState.safes.length > 0) {
        const safesData = appState.safes.map(safe => ({
          id: safe.id,
          name: safe.name,
          balance: safe.balance || 0
        }))
        await tx.safe.createMany({ data: safesData })
      }

      // Import transfers
      if (appState.transfers.length > 0) {
        const transfersData = appState.transfers.map(transfer => ({
          id: transfer.id,
          fromSafeId: transfer.fromSafeId,
          toSafeId: transfer.toSafeId,
          amount: transfer.amount,
          description: transfer.description || null
        }))
        await tx.transfer.createMany({ data: transfersData })
      }

      // Import vouchers
      if (appState.vouchers.length > 0) {
        const vouchersData = appState.vouchers.map(voucher => ({
          id: voucher.id,
          type: voucher.type,
          date: new Date(voucher.date),
          amount: voucher.amount,
          safeId: voucher.safeId,
          description: voucher.description,
          payer: voucher.payer || null,
          beneficiary: voucher.beneficiary || null,
          linkedRef: voucher.linked_ref || null
        }))
        await tx.voucher.createMany({ data: vouchersData })
      }

      // Import broker dues
      if (appState.brokerDues.length > 0) {
        const brokerDuesData = appState.brokerDues.map(bd => ({
          id: bd.id,
          brokerId: bd.brokerId,
          amount: bd.amount,
          dueDate: new Date(bd.dueDate),
          status: bd.status || 'معلق',
          notes: bd.notes || null
        }))
        await tx.brokerDue.createMany({ data: brokerDuesData })
      }

      // Import brokers
      if (appState.brokers.length > 0) {
        const brokersData = appState.brokers.map(broker => ({
          id: broker.id,
          name: broker.name,
          phone: broker.phone || null,
          notes: broker.notes || null
        }))
        await tx.broker.createMany({ data: brokersData })
      }

      // Import partner groups
      if (appState.partnerGroups.length > 0) {
        const partnerGroupsData = appState.partnerGroups.map(pg => ({
          id: pg.id,
          name: pg.name,
          notes: pg.notes || null
        }))
        await tx.partnerGroup.createMany({ data: partnerGroupsData })
      }

      // Import settings
      if (appState.settings) {
        await tx.settings.upsert({
          where: { key: 'theme' },
          update: { value: appState.settings.theme || 'dark' },
          create: { key: 'theme', value: appState.settings.theme || 'dark' }
        })
        await tx.settings.upsert({
          where: { key: 'font' },
          update: { value: String(appState.settings.font || 16) },
          create: { key: 'font', value: String(appState.settings.font || 16) }
        })
        if (appState.settings.pass) {
          await tx.settings.upsert({
            where: { key: 'pass' },
            update: { value: appState.settings.pass },
            create: { key: 'pass', value: appState.settings.pass }
          })
        }
      }
    })

    const response: ApiResponse = {
      success: true,
      message: 'تم استيراد البيانات بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error importing data:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في استيراد البيانات' },
      { status: 500 }
    )
  }
}