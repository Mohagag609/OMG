// Soft delete utilities

import { prisma } from './db'

// Check if entity can be deleted (has no related records)
export async function canDeleteEntity(entityType: string, entityId: string): Promise<{
  canDelete: boolean
  reason?: string
}> {
  try {
    switch (entityType) {
      case 'customer':
        // Check if customer has contracts
        const customerContracts = await prisma.contract.count({
          where: { customerId: entityId, deletedAt: null }
        })
        if (customerContracts > 0) {
          return {
            canDelete: false,
            reason: 'لا يمكن حذف هذا العميل لأنه مرتبط بعقود قائمة'
          }
        }
        break
        
      case 'unit':
        // Check if unit has contracts
        const unitContracts = await prisma.contract.count({
          where: { unitId: entityId, deletedAt: null }
        })
        if (unitContracts > 0) {
          return {
            canDelete: false,
            reason: 'لا يمكن حذف هذه الوحدة لأنها مرتبطة بعقد قائم. يجب حذف العقد أولاً.'
          }
        }
        break
        
      case 'contract':
        // Check if contract has paid installments
        const paidInstallments = await prisma.installment.count({
          where: { 
            unitId: entityId, 
            status: 'مدفوع',
            deletedAt: null 
          }
        })
        if (paidInstallments > 0) {
          return {
            canDelete: false,
            reason: 'لا يمكن حذف عقد له أقساط مدفوعة'
          }
        }
        break
        
      case 'safe':
        // Check if safe has balance or transactions
        const safe = await prisma.safe.findUnique({
          where: { id: entityId }
        })
        
        if (!safe) {
          return { canDelete: false, reason: 'الخزنة غير موجودة' }
        }
        
        if (safe.balance > 0) {
          return {
            canDelete: false,
            reason: 'لا يمكن حذف خزنة لها رصيد'
          }
        }
        
        if (safe.balance > 0) {
          return {
            canDelete: false,
            reason: 'لا يمكن حذف خزنة لها رصيد'
          }
        }
        break
        
      case 'partner':
        // Check if partner has unit partnerships or debts
        const unitPartners = await prisma.unitPartner.count({
          where: { partnerId: entityId, deletedAt: null }
        })
        const partnerDebts = await prisma.partnerDebt.count({
          where: { partnerId: entityId, deletedAt: null }
        })
        
        if (unitPartners > 0 || partnerDebts > 0) {
          return {
            canDelete: false,
            reason: 'لا يمكن حذف شريك له شراكات أو ديون'
          }
        }
        break
        
      case 'broker':
        // Check if broker has dues
        const brokerDues = await prisma.brokerDue.count({
          where: { brokerId: entityId, deletedAt: null }
        })
        
        if (brokerDues > 0) {
          return {
            canDelete: false,
            reason: 'لا يمكن حذف سمسار له مستحقات'
          }
        }
        break
        
      default:
        return { canDelete: true }
    }
    
    return { canDelete: true }
  } catch (error) {
    console.error('Error checking if entity can be deleted:', error)
    return {
      canDelete: false,
      reason: 'خطأ في التحقق من إمكانية الحذف'
    }
  }
}

// Soft delete entity
export async function softDeleteEntity(
  entityType: string, 
  entityId: string, 
  userId?: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Check if entity can be deleted
    const canDelete = await canDeleteEntity(entityType, entityId)
    if (!canDelete.canDelete) {
      return {
        success: false,
        message: canDelete.reason || 'لا يمكن حذف هذا العنصر'
      }
    }
    
    // Get the model based on entity type
    let model: any
    switch (entityType) {
      case 'customer':
        model = prisma.customer
        break
      case 'unit':
        model = prisma.unit
        break
      case 'contract':
        model = prisma.contract
        break
      case 'safe':
        model = prisma.safe
        break
      case 'partner':
        model = prisma.partner
        break
      case 'broker':
        model = prisma.broker
        break
      case 'installment':
        model = prisma.installment
        break
      case 'voucher':
        model = prisma.voucher
        break
      case 'transfer':
        model = prisma.transfer
        break
      case 'partnerDebt':
        model = prisma.partnerDebt
        break
      case 'brokerDue':
        model = prisma.brokerDue
        break
      case 'unitPartner':
        model = prisma.unitPartner
        break
      case 'partnerGroup':
        model = prisma.partnerGroup
        break
      default:
        return {
          success: false,
          message: 'نوع الكيان غير مدعوم'
        }
    }
    
    // Perform soft delete
    await model.update({
      where: { id: entityId },
      data: { deletedAt: new Date() }
    })
    
    return {
      success: true,
      message: 'تم حذف العنصر بنجاح'
    }
  } catch (error) {
    console.error('Error soft deleting entity:', error)
    return {
      success: false,
      message: 'خطأ في حذف العنصر'
    }
  }
}

// Restore soft deleted entity
export async function restoreEntity(
  entityType: string, 
  entityId: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Get the model based on entity type
    let model: any
    switch (entityType) {
      case 'customer':
        model = prisma.customer
        break
      case 'unit':
        model = prisma.unit
        break
      case 'contract':
        model = prisma.contract
        break
      case 'safe':
        model = prisma.safe
        break
      case 'partner':
        model = prisma.partner
        break
      case 'broker':
        model = prisma.broker
        break
      case 'installment':
        model = prisma.installment
        break
      case 'voucher':
        model = prisma.voucher
        break
      case 'transfer':
        model = prisma.transfer
        break
      case 'partnerDebt':
        model = prisma.partnerDebt
        break
      case 'brokerDue':
        model = prisma.brokerDue
        break
      case 'unitPartner':
        model = prisma.unitPartner
        break
      case 'partnerGroup':
        model = prisma.partnerGroup
        break
      default:
        return {
          success: false,
          message: 'نوع الكيان غير مدعوم'
        }
    }
    
    // Check if entity exists and is soft deleted
    const entity = await model.findUnique({
      where: { id: entityId }
    })
    
    if (!entity) {
      return {
        success: false,
        message: 'العنصر غير موجود'
      }
    }
    
    if (!entity.deletedAt) {
      return {
        success: false,
        message: 'العنصر غير محذوف'
      }
    }
    
    // Restore entity
    await model.update({
      where: { id: entityId },
      data: { deletedAt: null }
    })
    
    return {
      success: true,
      message: 'تم استرجاع العنصر بنجاح'
    }
  } catch (error) {
    console.error('Error restoring entity:', error)
    return {
      success: false,
      message: 'خطأ في استرجاع العنصر'
    }
  }
}

// Get soft deleted entities
export async function getSoftDeletedEntities(
  entityType: string,
  page: number = 1,
  limit: number = 50
): Promise<{ data: any[]; total: number; totalPages: number }> {
  try {
    const skip = (page - 1) * limit
    
    // Get the model based on entity type
    let model: any
    switch (entityType) {
      case 'customer':
        model = prisma.customer
        break
      case 'unit':
        model = prisma.unit
        break
      case 'contract':
        model = prisma.contract
        break
      case 'safe':
        model = prisma.safe
        break
      case 'partner':
        model = prisma.partner
        break
      case 'broker':
        model = prisma.broker
        break
      case 'installment':
        model = prisma.installment
        break
      case 'voucher':
        model = prisma.voucher
        break
      case 'transfer':
        model = prisma.transfer
        break
      case 'partnerDebt':
        model = prisma.partnerDebt
        break
      case 'brokerDue':
        model = prisma.brokerDue
        break
      case 'unitPartner':
        model = prisma.unitPartner
        break
      case 'partnerGroup':
        model = prisma.partnerGroup
        break
      default:
        return { data: [], total: 0, totalPages: 0 }
    }
    
    const [data, total] = await Promise.all([
      model.findMany({
        where: { deletedAt: { not: null } },
        skip,
        take: limit,
        orderBy: { deletedAt: 'desc' }
      }),
      model.count({ where: { deletedAt: { not: null } } })
    ])
    
    const totalPages = Math.ceil(total / limit)
    
    return { data, total, totalPages }
  } catch (error) {
    console.error('Error getting soft deleted entities:', error)
    throw error
  }
}