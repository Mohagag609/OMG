import { prisma } from './db'
import { logAuditEntry } from './audit'

export interface SoftDeleteOptions {
  reason?: string
  deletedBy?: string
  ipAddress?: string
  userAgent?: string
}

export interface RestoreOptions {
  restoredBy?: string
  ipAddress?: string
  userAgent?: string
}

// Soft delete an entity
export async function softDeleteEntity(
  entityType: string,
  entityId: string,
  options: SoftDeleteOptions = {}
): Promise<boolean> {
  try {
    const { reason, deletedBy, ipAddress, userAgent } = options

    // Get the entity before deletion
    let entity: any = null
    let tableName = ''
    
    switch (entityType) {
      case 'customers':
        tableName = 'customer'
        entity = await prisma.customer.findUnique({ where: { id: entityId } })
        break
      case 'units':
        tableName = 'unit'
        entity = await prisma.unit.findUnique({ where: { id: entityId } })
        break
      case 'contracts':
        tableName = 'contract'
        entity = await prisma.contract.findUnique({ where: { id: entityId } })
        break
      case 'installments':
        tableName = 'installment'
        entity = await prisma.installment.findUnique({ where: { id: entityId } })
        break
      case 'vouchers':
        tableName = 'voucher'
        entity = await prisma.voucher.findUnique({ where: { id: entityId } })
        break
      case 'safes':
        tableName = 'safe'
        entity = await prisma.safe.findUnique({ where: { id: entityId } })
        break
      case 'partners':
        tableName = 'partner'
        entity = await prisma.partner.findUnique({ where: { id: entityId } })
        break
      case 'brokers':
        tableName = 'broker'
        entity = await prisma.broker.findUnique({ where: { id: entityId } })
        break
      default:
        throw new Error(`Unsupported entity type: ${entityType}`)
    }

    if (!entity) {
      throw new Error('Entity not found')
    }

    // Check if entity can be deleted
    const canDelete = await checkEntityDeletionRules(entityType, entityId)
    if (!canDelete.allowed) {
      throw new Error(canDelete.reason || 'Cannot delete entity')
    }

    // Perform soft delete
    const deletedEntity = await (prisma as any)[tableName].update({
      where: { id: entityId },
      data: { 
        deletedAt: new Date(),
        deletedBy,
        deleteReason: reason
      }
    })

    // Log the deletion
    await logAuditEntry(
      `حذف ناعم ${entityType}`,
      entityType,
      entityId,
      entity,
      { deletedAt: new Date(), deletedBy, deleteReason: reason },
      deletedBy,
      ipAddress,
      userAgent
    )

    return true
  } catch (error) {
    console.error('Error in soft delete:', error)
    throw error
  }
}

// Restore a soft-deleted entity
export async function restoreEntity(
  entityType: string,
  entityId: string,
  options: RestoreOptions = {}
): Promise<boolean> {
  try {
    const { restoredBy, ipAddress, userAgent } = options

    let tableName = ''
    
    switch (entityType) {
      case 'customers':
        tableName = 'customer'
        break
      case 'units':
        tableName = 'unit'
        break
      case 'contracts':
        tableName = 'contract'
        break
      case 'installments':
        tableName = 'installment'
        break
      case 'vouchers':
        tableName = 'voucher'
        break
      case 'safes':
        tableName = 'safe'
        break
      case 'partners':
        tableName = 'partner'
        break
      case 'brokers':
        tableName = 'broker'
        break
      default:
        throw new Error(`Unsupported entity type: ${entityType}`)
    }

    // Get the deleted entity
    const deletedEntity = await (prisma as any)[tableName].findFirst({
      where: { 
        id: entityId,
        deletedAt: { not: null }
      }
    })

    if (!deletedEntity) {
      throw new Error('Deleted entity not found')
    }

    // Check if entity can be restored
    const canRestore = await checkEntityRestoreRules(entityType, entityId)
    if (!canRestore.allowed) {
      throw new Error(canRestore.reason || 'Cannot restore entity')
    }

    // Restore the entity
    const restoredEntity = await (prisma as any)[tableName].update({
      where: { id: entityId },
      data: { 
        deletedAt: null,
        deletedBy: null,
        deleteReason: null,
        restoredAt: new Date(),
        restoredBy
      }
    })

    // Log the restoration
    await logAuditEntry(
      `استرجاع ${entityType}`,
      entityType,
      entityId,
      deletedEntity,
      { restoredAt: new Date(), restoredBy },
      restoredBy,
      ipAddress,
      userAgent
    )

    return true
  } catch (error) {
    console.error('Error in restore:', error)
    throw error
  }
}

// Check if entity can be deleted
export async function checkEntityDeletionRules(
  entityType: string,
  entityId: string
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    switch (entityType) {
      case 'customers':
        // Check if customer has contracts
        const customerContracts = await prisma.contract.count({
          where: { customerId: entityId }
        })
        if (customerContracts > 0) {
          return {
            allowed: false,
            reason: 'لا يمكن حذف هذا العميل لأنه مرتبط بعقود قائمة'
          }
        }
        break

      case 'units':
        // Check if unit has contracts
        const unitContracts = await prisma.contract.count({
          where: { unitId: entityId }
        })
        if (unitContracts > 0) {
          return {
            allowed: false,
            reason: 'لا يمكن حذف هذه الوحدة لأنها مرتبطة بعقد قائم'
          }
        }
        break

      case 'safes':
        // Check if safe has vouchers or transfers
        const safeVouchers = await prisma.voucher.count({
          where: { safeId: entityId }
        })
        const safeTransfers = await prisma.transfer.count({
          where: {
            OR: [
              { fromSafeId: entityId },
              { toSafeId: entityId }
            ]
          }
        })
        if (safeVouchers > 0 || safeTransfers > 0) {
          return {
            allowed: false,
            reason: 'لا يمكن حذف هذه الخزنة لأنها مرتبطة بمعاملات'
          }
        }
        break

      case 'contracts':
        // Check if contract has installments
        const contractInstallments = await prisma.installment.count({
          where: { unitId: entityId }
        })
        if (contractInstallments > 0) {
          return {
            allowed: false,
            reason: 'لا يمكن حذف هذا العقد لأنه مرتبط بأقساط'
          }
        }
        break

      default:
        // For other entities, allow deletion by default
        break
    }

    return { allowed: true }
  } catch (error) {
    console.error('Error checking deletion rules:', error)
    return {
      allowed: false,
      reason: 'خطأ في التحقق من قواعد الحذف'
    }
  }
}

// Check if entity can be restored
export async function checkEntityRestoreRules(
  entityType: string,
  entityId: string
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    // Check if entity is within restore window (30 days)
    const entity = await (prisma as any)[entityType].findFirst({
      where: { 
        id: entityId,
        deletedAt: { not: null }
      }
    })

    if (!entity) {
      return {
        allowed: false,
        reason: 'الكيان المحذوف غير موجود'
      }
    }

    const daysSinceDeletion = Math.floor(
      (Date.now() - new Date(entity.deletedAt).getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysSinceDeletion > 30) {
      return {
        allowed: false,
        reason: 'انتهت فترة الاسترجاع (30 يوم)'
      }
    }

    // Check for conflicts (e.g., if a new entity with same unique field was created)
    switch (entityType) {
      case 'customers':
        if (entity.phone) {
          const existingCustomer = await prisma.customer.findFirst({
            where: {
              phone: entity.phone,
              id: { not: entityId },
              deletedAt: null
            }
          })
          if (existingCustomer) {
            return {
              allowed: false,
              reason: 'يوجد عميل آخر بنفس رقم الهاتف'
            }
          }
        }
        break

      case 'units':
        if (entity.code) {
          const existingUnit = await prisma.unit.findFirst({
            where: {
              code: entity.code,
              id: { not: entityId },
              deletedAt: null
            }
          })
          if (existingUnit) {
            return {
              allowed: false,
              reason: 'يوجد وحدة أخرى بنفس الكود'
            }
          }
        }
        break

      case 'safes':
        if (entity.name) {
          const existingSafe = await prisma.safe.findFirst({
            where: {
              name: entity.name,
              id: { not: entityId },
              deletedAt: null
            }
          })
          if (existingSafe) {
            return {
              allowed: false,
              reason: 'يوجد خزنة أخرى بنفس الاسم'
            }
          }
        }
        break

      default:
        // For other entities, allow restoration by default
        break
    }

    return { allowed: true }
  } catch (error) {
    console.error('Error checking restore rules:', error)
    return {
      allowed: false,
      reason: 'خطأ في التحقق من قواعد الاسترجاع'
    }
  }
}

// Get soft-deleted entities
export async function getSoftDeletedEntities(
  entityType: string,
  limit: number = 50
): Promise<any[]> {
  try {
    let tableName = ''
    
    switch (entityType) {
      case 'customers':
        tableName = 'customer'
        break
      case 'units':
        tableName = 'unit'
        break
      case 'contracts':
        tableName = 'contract'
        break
      case 'installments':
        tableName = 'installment'
        break
      case 'vouchers':
        tableName = 'voucher'
        break
      case 'safes':
        tableName = 'safe'
        break
      case 'partners':
        tableName = 'partner'
        break
      case 'brokers':
        tableName = 'broker'
        break
      default:
        throw new Error(`Unsupported entity type: ${entityType}`)
    }

    const entities = await (prisma as any)[tableName].findMany({
      where: {
        deletedAt: { not: null }
      },
      orderBy: { deletedAt: 'desc' },
      take: limit
    })

    return entities
  } catch (error) {
    console.error('Error getting soft-deleted entities:', error)
    throw error
  }
}

// Permanently delete an entity (after grace period)
export async function permanentDeleteEntity(
  entityType: string,
  entityId: string,
  deletedBy?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<boolean> {
  try {
    let tableName = ''
    
    switch (entityType) {
      case 'customers':
        tableName = 'customer'
        break
      case 'units':
        tableName = 'unit'
        break
      case 'contracts':
        tableName = 'contract'
        break
      case 'installments':
        tableName = 'installment'
        break
      case 'vouchers':
        tableName = 'voucher'
        break
      case 'safes':
        tableName = 'safe'
        break
      case 'partners':
        tableName = 'partner'
        break
      case 'brokers':
        tableName = 'broker'
        break
      default:
        throw new Error(`Unsupported entity type: ${entityType}`)
    }

    // Get the entity before permanent deletion
    const entity = await (prisma as any)[tableName].findFirst({
      where: { 
        id: entityId,
        deletedAt: { not: null }
      }
    })

    if (!entity) {
      throw new Error('Soft-deleted entity not found')
    }

    // Permanently delete
    await (prisma as any)[tableName].delete({
      where: { id: entityId }
    })

    // Log the permanent deletion
    await logAuditEntry(
      `حذف نهائي ${entityType}`,
      entityType,
      entityId,
      entity,
      null,
      deletedBy,
      ipAddress,
      userAgent
    )

    return true
  } catch (error) {
    console.error('Error in permanent delete:', error)
    throw error
  }
}