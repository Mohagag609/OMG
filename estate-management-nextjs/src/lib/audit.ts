import { prisma } from './db'
import { getUserFromRequest } from './auth'

export interface AuditLogEntry {
  id: string
  action: string
  entityType: string
  entityId: string
  oldValues?: any
  newValues?: any
  userId?: string
  ipAddress?: string
  userAgent?: string
  timestamp: string
}

export interface AuditLogFilter {
  action?: string
  entityType?: string
  entityId?: string
  userId?: string
  fromDate?: string
  toDate?: string
  page?: number
  limit?: number
}

// Log an audit entry
export async function logAuditEntry(
  action: string,
  entityType: string,
  entityId: string,
  oldValues?: any,
  newValues?: any,
  userId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        oldValues: oldValues ? JSON.stringify(oldValues) : null,
        newValues: newValues ? JSON.stringify(newValues) : null,
        userId,
        ipAddress,
        userAgent
      }
    })
  } catch (error) {
    console.error('Error logging audit entry:', error)
    // Don't throw error to avoid breaking the main operation
  }
}

// Get audit logs with filtering
export async function getAuditLogs(filter: AuditLogFilter = {}): Promise<{
  logs: AuditLogEntry[]
  total: number
  page: number
  limit: number
  totalPages: number
}> {
  const {
    action,
    entityType,
    entityId,
    userId,
    fromDate,
    toDate,
    page = 1,
    limit = 50
  } = filter

  const skip = (page - 1) * limit

  // Build where clause
  const where: any = {}
  if (action) where.action = { contains: action }
  if (entityType) where.entityType = entityType
  if (entityId) where.entityId = entityId
  if (userId) where.userId = userId
  
  if (fromDate || toDate) {
    where.createdAt = {}
    if (fromDate) where.createdAt.gte = new Date(fromDate)
    if (toDate) where.createdAt.lte = new Date(toDate)
  }

  // Get logs and total count
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
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
    prisma.auditLog.count({ where })
  ])

  return {
    logs: logs.map(log => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      oldValues: log.oldValues ? JSON.parse(log.oldValues) : undefined,
      newValues: log.newValues ? JSON.parse(log.newValues) : undefined,
      userId: log.userId,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      timestamp: log.createdAt.toISOString()
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }
}

// Get audit log by ID
export async function getAuditLogById(id: string): Promise<AuditLogEntry | null> {
  const log = await prisma.auditLog.findUnique({
    where: { id },
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
  })

  if (!log) return null

  return {
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    oldValues: log.oldValues ? JSON.parse(log.oldValues) : undefined,
    newValues: log.newValues ? JSON.parse(log.newValues) : undefined,
    userId: log.userId,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    timestamp: log.createdAt.toISOString()
  }
}

// Get audit logs for a specific entity
export async function getEntityAuditLogs(
  entityType: string,
  entityId: string,
  limit: number = 20
): Promise<AuditLogEntry[]> {
  const logs = await prisma.auditLog.findMany({
    where: {
      entityType,
      entityId
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
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
  })

  return logs.map(log => ({
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    oldValues: log.oldValues ? JSON.parse(log.oldValues) : undefined,
    newValues: log.newValues ? JSON.parse(log.newValues) : undefined,
    userId: log.userId,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    timestamp: log.createdAt.toISOString()
  }))
}

// Get audit statistics
export async function getAuditStats(): Promise<{
  totalLogs: number
  logsToday: number
  logsThisWeek: number
  logsThisMonth: number
  topActions: Array<{ action: string; count: number }>
  topEntities: Array<{ entityType: string; count: number }>
}> {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [
    totalLogs,
    logsToday,
    logsThisWeek,
    logsThisMonth,
    topActions,
    topEntities
  ] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.count({
      where: { createdAt: { gte: today } }
    }),
    prisma.auditLog.count({
      where: { createdAt: { gte: weekAgo } }
    }),
    prisma.auditLog.count({
      where: { createdAt: { gte: monthAgo } }
    }),
    prisma.auditLog.groupBy({
      by: ['action'],
      _count: { action: true },
      orderBy: { _count: { action: 'desc' } },
      take: 10
    }),
    prisma.auditLog.groupBy({
      by: ['entityType'],
      _count: { entityType: true },
      orderBy: { _count: { entityType: 'desc' } },
      take: 10
    })
  ])

  return {
    totalLogs,
    logsToday,
    logsThisWeek,
    logsThisMonth,
    topActions: topActions.map(item => ({
      action: item.action,
      count: item._count.action
    })),
    topEntities: topEntities.map(item => ({
      entityType: item.entityType,
      count: item._count.entityType
    }))
  }
}

// Clean up old audit logs (older than specified days)
export async function cleanupAuditLogs(olderThanDays: number = 365): Promise<number> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

  const result = await prisma.auditLog.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate
      }
    }
  })

  return result.count
}