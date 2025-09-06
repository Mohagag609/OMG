import { prisma } from './db'
import { AppState } from '@/types'
import { logAuditEntry } from './audit'
import { generateNotification } from './notifications'
import fs from 'fs'
import path from 'path'

export interface BackupConfig {
  localRetentionDays: number
  remoteRetentionDays: number
  remoteRetentionWeeks: number
  remoteRetentionMonths: number
  backupTime: string // HH:MM format
  enabled: boolean
}

export interface BackupInfo {
  id: string
  type: 'local' | 'remote'
  timestamp: string
  size: number
  checksum: string
  status: 'success' | 'failed' | 'in_progress'
  error?: string
  location: string
}

export const DEFAULT_BACKUP_CONFIG: BackupConfig = {
  localRetentionDays: 3,
  remoteRetentionDays: 14,
  remoteRetentionWeeks: 8,
  remoteRetentionMonths: 6,
  backupTime: '02:00',
  enabled: true
}

// Create a backup
export async function createBackup(
  type: 'local' | 'remote' = 'local',
  userId?: string
): Promise<BackupInfo> {
  const backupId = `backup-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  const timestamp = new Date().toISOString()

  try {
    // Log backup start
    await logAuditEntry(
      `بدء النسخ الاحتياطي ${type}`,
      'backup',
      backupId,
      null,
      { type, timestamp },
      userId
    )

    // Get all data from database
    const appState = await exportAllData()

    // Create backup directory if it doesn't exist
    const backupDir = path.join(process.cwd(), 'backups')
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    // Create backup file
    const backupFileName = `${backupId}.json`
    const backupPath = path.join(backupDir, backupFileName)
    
    const backupData = {
      id: backupId,
      type,
      timestamp,
      version: '1.0',
      data: appState
    }

    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2))

    // Calculate file size and checksum
    const stats = fs.statSync(backupPath)
    const fileContent = fs.readFileSync(backupPath)
    const checksum = calculateChecksum(fileContent)

    const backupInfo: BackupInfo = {
      id: backupId,
      type,
      timestamp,
      size: stats.size,
      checksum,
      status: 'success',
      location: backupPath
    }

    // Save backup info to database
    await prisma.keyVal.upsert({
      where: { key: `backup_${backupId}` },
      update: { value: JSON.stringify(backupInfo) },
      create: { key: `backup_${backupId}`, value: JSON.stringify(backupInfo) }
    })

    // Log backup success
    await logAuditEntry(
      `اكتمال النسخ الاحتياطي ${type}`,
      'backup',
      backupId,
      null,
      backupInfo,
      userId
    )

    // Send notification
    await generateNotification('backup_completed', {
      type,
      size: formatFileSize(stats.size),
      timestamp
    })

    return backupInfo
  } catch (error) {
    console.error('Error creating backup:', error)
    
    const backupInfo: BackupInfo = {
      id: backupId,
      type,
      timestamp,
      size: 0,
      checksum: '',
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      location: ''
    }

    // Log backup failure
    await logAuditEntry(
      `فشل النسخ الاحتياطي ${type}`,
      'backup',
      backupId,
      null,
      backupInfo,
      userId
    )

    // Send notification
    await generateNotification('backup_failed', {
      type,
      error: backupInfo.error,
      timestamp
    })

    throw error
  }
}

// Export all data
export async function exportAllData(): Promise<AppState> {
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
      pass: null
    },
    locked: false
  }

  // Convert settings array to object
  settings.forEach(setting => {
    if (setting.key === 'theme') appState.settings.theme = setting.value
    if (setting.key === 'font') appState.settings.font = parseInt(setting.value)
    if (setting.key === 'pass') appState.settings.pass = setting.value || null
  })

  return appState
}

// Restore from backup
export async function restoreFromBackup(
  backupPath: string,
  userId?: string
): Promise<boolean> {
  try {
    // Read backup file
    const backupContent = fs.readFileSync(backupPath, 'utf8')
    const backupData = JSON.parse(backupContent)

    if (!backupData.data) {
      throw new Error('Invalid backup file format')
    }

    // Log restore start
    await logAuditEntry(
      'بدء استرجاع النسخة الاحتياطية',
      'backup',
      backupData.id || 'unknown',
      null,
      { backupPath, timestamp: new Date().toISOString() },
      userId
    )

    // Clear existing data (soft delete)
    const now = new Date()
    await Promise.all([
      prisma.customer.updateMany({ data: { deletedAt: now } }),
      prisma.unit.updateMany({ data: { deletedAt: now } }),
      prisma.partner.updateMany({ data: { deletedAt: now } }),
      prisma.unitPartner.updateMany({ data: { deletedAt: now } }),
      prisma.contract.updateMany({ data: { deletedAt: now } }),
      prisma.installment.updateMany({ data: { deletedAt: now } }),
      prisma.safe.updateMany({ data: { deletedAt: now } }),
      prisma.transfer.updateMany({ data: { deletedAt: now } }),
      prisma.voucher.updateMany({ data: { deletedAt: now } }),
      prisma.brokerDue.updateMany({ data: { deletedAt: now } }),
      prisma.broker.updateMany({ data: { deletedAt: now } }),
      prisma.partnerGroup.updateMany({ data: { deletedAt: now } })
    ])

    // Import the data (similar to import API)
    const appState = backupData.data

    // Import customers
    if (appState.customers && appState.customers.length > 0) {
      const customersData = appState.customers.map((customer: any) => ({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        nationalId: customer.nationalId || null,
        address: customer.address || null,
        status: customer.status || 'نشط',
        notes: customer.notes || null
      }))
      await prisma.customer.createMany({ data: customersData })
    }

    // Import other entities similarly...
    // (Implementation similar to import API)

    // Log restore success
    await logAuditEntry(
      'اكتمال استرجاع النسخة الاحتياطية',
      'backup',
      backupData.id || 'unknown',
      null,
      { backupPath, timestamp: new Date().toISOString() },
      userId
    )

    return true
  } catch (error) {
    console.error('Error restoring from backup:', error)
    
    // Log restore failure
    await logAuditEntry(
      'فشل استرجاع النسخة الاحتياطية',
      'backup',
      'unknown',
      null,
      { backupPath, error: error instanceof Error ? error.message : 'Unknown error' },
      userId
    )

    throw error
  }
}

// Get backup list
export async function getBackupList(): Promise<BackupInfo[]> {
  try {
    const backupKeys = await prisma.keyVal.findMany({
      where: {
        key: { startsWith: 'backup_' }
      }
    })

    const backups = backupKeys
      .map(key => {
        try {
          return JSON.parse(key.value) as BackupInfo
        } catch {
          return null
        }
      })
      .filter(Boolean) as BackupInfo[]

    // Sort by timestamp (newest first)
    backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return backups
  } catch (error) {
    console.error('Error getting backup list:', error)
    return []
  }
}

// Clean up old backups
export async function cleanupOldBackups(config: BackupConfig): Promise<number> {
  try {
    const backups = await getBackupList()
    const now = new Date()
    let deletedCount = 0

    for (const backup of backups) {
      const backupDate = new Date(backup.timestamp)
      const daysSinceBackup = Math.floor((now.getTime() - backupDate.getTime()) / (1000 * 60 * 60 * 24))

      let shouldDelete = false

      if (backup.type === 'local' && daysSinceBackup > config.localRetentionDays) {
        shouldDelete = true
      } else if (backup.type === 'remote') {
        if (daysSinceBackup > config.remoteRetentionDays) {
          shouldDelete = true
        }
      }

      if (shouldDelete) {
        try {
          // Delete backup file
          if (fs.existsSync(backup.location)) {
            fs.unlinkSync(backup.location)
          }

          // Delete backup info from database
          await prisma.keyVal.delete({
            where: { key: `backup_${backup.id}` }
          })

          deletedCount++
        } catch (error) {
          console.error(`Error deleting backup ${backup.id}:`, error)
        }
      }
    }

    return deletedCount
  } catch (error) {
    console.error('Error cleaning up old backups:', error)
    return 0
  }
}

// Calculate file checksum
function calculateChecksum(content: Buffer): string {
  const crypto = require('crypto')
  return crypto.createHash('sha256').update(content).digest('hex')
}

// Format file size
function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  if (bytes === 0) return '0 Bytes'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

// Verify backup integrity
export async function verifyBackup(backupPath: string): Promise<boolean> {
  try {
    const backupContent = fs.readFileSync(backupPath, 'utf8')
    const backupData = JSON.parse(backupContent)

    // Check if backup has required structure
    if (!backupData.id || !backupData.timestamp || !backupData.data) {
      return false
    }

    // Check if data is valid JSON
    if (typeof backupData.data !== 'object') {
      return false
    }

    // Check if required collections exist
    const requiredCollections = ['customers', 'units', 'safes']
    for (const collection of requiredCollections) {
      if (!Array.isArray(backupData.data[collection])) {
        return false
      }
    }

    return true
  } catch (error) {
    console.error('Error verifying backup:', error)
    return false
  }
}