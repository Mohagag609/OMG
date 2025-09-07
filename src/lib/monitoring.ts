import { prisma } from './db'
import { generateNotification } from './notifications'

export interface HealthCheck {
  name: string
  status: 'healthy' | 'warning' | 'critical'
  message: string
  timestamp: string
  responseTime?: number
}

export interface SystemMetrics {
  database: {
    status: 'healthy' | 'warning' | 'critical'
    responseTime: number
    connectionCount: number
  }
  storage: {
    status: 'healthy' | 'warning' | 'critical'
    usedSpace: number
    totalSpace: number
    freeSpace: number
  }
  performance: {
    status: 'healthy' | 'warning' | 'critical'
    averageResponseTime: number
    errorRate: number
    requestCount: number
  }
  memory: {
    status: 'healthy' | 'warning' | 'critical'
    used: number
    total: number
    free: number
  }
}

export interface AlertRule {
  id: string
  name: string
  metric: string
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte'
  threshold: number
  severity: 'info' | 'warning' | 'critical'
  enabled: boolean
  cooldown: number // minutes
  lastTriggered?: string
}

export const DEFAULT_ALERT_RULES: AlertRule[] = [
  {
    id: 'db_response_time',
    name: 'Database Response Time',
    metric: 'database.responseTime',
    operator: 'gt',
    threshold: 1000, // 1 second
    severity: 'warning',
    enabled: true,
    cooldown: 5
  },
  {
    id: 'db_response_time_critical',
    name: 'Database Response Time Critical',
    metric: 'database.responseTime',
    operator: 'gt',
    threshold: 5000, // 5 seconds
    severity: 'critical',
    enabled: true,
    cooldown: 2
  },
  {
    id: 'error_rate',
    name: 'Error Rate',
    metric: 'performance.errorRate',
    operator: 'gt',
    threshold: 0.05, // 5%
    severity: 'warning',
    enabled: true,
    cooldown: 10
  },
  {
    id: 'error_rate_critical',
    name: 'Error Rate Critical',
    metric: 'performance.errorRate',
    operator: 'gt',
    threshold: 0.1, // 10%
    severity: 'critical',
    enabled: true,
    cooldown: 5
  },
  {
    id: 'memory_usage',
    name: 'Memory Usage',
    metric: 'memory.used',
    operator: 'gt',
    threshold: 0.8, // 80%
    severity: 'warning',
    enabled: true,
    cooldown: 15
  },
  {
    id: 'storage_usage',
    name: 'Storage Usage',
    metric: 'storage.usedSpace',
    operator: 'gt',
    threshold: 0.9, // 90%
    severity: 'critical',
    enabled: true,
    cooldown: 30
  }
]

// Perform health checks
export async function performHealthChecks(): Promise<HealthCheck[]> {
  const checks: HealthCheck[] = []
  const timestamp = new Date().toISOString()

  // Database health check
  try {
    const startTime = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const responseTime = Date.now() - startTime

    checks.push({
      name: 'Database Connection',
      status: responseTime < 1000 ? 'healthy' : responseTime < 5000 ? 'warning' : 'critical',
      message: `Database responded in ${responseTime}ms`,
      timestamp,
      responseTime
    })
  } catch (error) {
    checks.push({
      name: 'Database Connection',
      status: 'critical',
      message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp
    })
  }

  // Storage health check
  try {
    const fs = require('fs')
    const path = require('path')
    const stats = fs.statSync(path.join(process.cwd(), 'dev.db'))
    const fileSize = stats.size
    const maxSize = 100 * 1024 * 1024 // 100MB

    checks.push({
      name: 'Database File Size',
      status: fileSize < maxSize * 0.8 ? 'healthy' : fileSize < maxSize * 0.9 ? 'warning' : 'critical',
      message: `Database file size: ${formatBytes(fileSize)}`,
      timestamp
    })
  } catch (error) {
    checks.push({
      name: 'Database File Size',
      status: 'critical',
      message: `Cannot check database file size: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp
    })
  }

  // Memory health check
  try {
    const memUsage = process.memoryUsage()
    const totalMem = memUsage.heapTotal
    const usedMem = memUsage.heapUsed
    const usagePercent = usedMem / totalMem

    checks.push({
      name: 'Memory Usage',
      status: usagePercent < 0.8 ? 'healthy' : usagePercent < 0.9 ? 'warning' : 'critical',
      message: `Memory usage: ${(usagePercent * 100).toFixed(1)}% (${formatBytes(usedMem)} / ${formatBytes(totalMem)})`,
      timestamp
    })
  } catch (error) {
    checks.push({
      name: 'Memory Usage',
      status: 'critical',
      message: `Cannot check memory usage: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp
    })
  }

  return checks
}

// Get system metrics
export async function getSystemMetrics(): Promise<SystemMetrics> {
  const timestamp = new Date().toISOString()

  // Database metrics
  let dbStatus: 'healthy' | 'warning' | 'critical' = 'healthy'
  let dbResponseTime = 0
  let connectionCount = 0

  try {
    const startTime = Date.now()
    await prisma.$queryRaw`SELECT 1`
    dbResponseTime = Date.now() - startTime
    
    if (dbResponseTime > 5000) {
      dbStatus = 'critical'
    } else if (dbResponseTime > 1000) {
      dbStatus = 'warning'
    }
  } catch (error) {
    dbStatus = 'critical'
  }

  // Storage metrics
  let storageStatus: 'healthy' | 'warning' | 'critical' = 'healthy'
  let usedSpace = 0
  let totalSpace = 0
  let freeSpace = 0

  try {
    const fs = require('fs')
    const path = require('path')
    const stats = fs.statSync(path.join(process.cwd(), 'dev.db'))
    usedSpace = stats.size
    totalSpace = 100 * 1024 * 1024 // 100MB limit
    freeSpace = totalSpace - usedSpace

    const usagePercent = usedSpace / totalSpace
    if (usagePercent > 0.9) {
      storageStatus = 'critical'
    } else if (usagePercent > 0.8) {
      storageStatus = 'warning'
    }
  } catch (error) {
    storageStatus = 'critical'
  }

  // Performance metrics
  let performanceStatus: 'healthy' | 'warning' | 'critical' = 'healthy'
  let averageResponseTime = 0
  let errorRate = 0
  let requestCount = 0

  try {
    // Get recent audit logs to calculate performance metrics
    const recentLogs = await prisma.auditLog.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      select: {
        action: true,
        createdAt: true
      }
    })

    requestCount = recentLogs.length
    const errorLogs = recentLogs.filter(log => log.action.includes('خطأ') || log.action.includes('فشل'))
    errorRate = requestCount > 0 ? errorLogs.length / requestCount : 0

    if (errorRate > 0.1) {
      performanceStatus = 'critical'
    } else if (errorRate > 0.05) {
      performanceStatus = 'warning'
    }
  } catch (error) {
    performanceStatus = 'critical'
  }

  // Memory metrics
  let memoryStatus: 'healthy' | 'warning' | 'critical' = 'healthy'
  let used = 0
  let total = 0
  let free = 0

  try {
    const memUsage = process.memoryUsage()
    total = memUsage.heapTotal
    used = memUsage.heapUsed
    free = total - used

    const usagePercent = used / total
    if (usagePercent > 0.9) {
      memoryStatus = 'critical'
    } else if (usagePercent > 0.8) {
      memoryStatus = 'warning'
    }
  } catch (error) {
    memoryStatus = 'critical'
  }

  return {
    database: {
      status: dbStatus,
      responseTime: dbResponseTime,
      connectionCount
    },
    storage: {
      status: storageStatus,
      usedSpace,
      totalSpace,
      freeSpace
    },
    performance: {
      status: performanceStatus,
      averageResponseTime,
      errorRate,
      requestCount
    },
    memory: {
      status: memoryStatus,
      used,
      total,
      free
    }
  }
}

// Check alert rules
export async function checkAlertRules(metrics: SystemMetrics): Promise<void> {
  for (const rule of DEFAULT_ALERT_RULES) {
    if (!rule.enabled) continue

    // Check cooldown
    if (rule.lastTriggered) {
      const lastTriggered = new Date(rule.lastTriggered)
      const cooldownMs = rule.cooldown * 60 * 1000
      if (Date.now() - lastTriggered.getTime() < cooldownMs) {
        continue
      }
    }

    let value: number | undefined
    let shouldAlert = false

    // Get metric value
    switch (rule.metric) {
      case 'database.responseTime':
        value = metrics.database.responseTime
        break
      case 'performance.errorRate':
        value = metrics.performance.errorRate
        break
      case 'memory.used':
        value = metrics.memory.used / metrics.memory.total
        break
      case 'storage.usedSpace':
        value = metrics.storage.usedSpace / metrics.storage.totalSpace
        break
      default:
        continue
    }

    if (value === undefined) continue

    // Check rule condition
    switch (rule.operator) {
      case 'gt':
        shouldAlert = value > rule.threshold
        break
      case 'lt':
        shouldAlert = value < rule.threshold
        break
      case 'eq':
        shouldAlert = value === rule.threshold
        break
      case 'gte':
        shouldAlert = value >= rule.threshold
        break
      case 'lte':
        shouldAlert = value <= rule.threshold
        break
    }

    if (shouldAlert) {
      // Update last triggered time
      rule.lastTriggered = new Date().toISOString()

      // Send notification
      await generateNotification('system_alert', {
        ruleName: rule.name,
        metric: rule.metric,
        value: value.toFixed(2),
        threshold: rule.threshold,
        severity: rule.severity,
        timestamp: new Date().toISOString()
      })
    }
  }
}

// Format bytes
function formatBytes(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  if (bytes === 0) return '0 Bytes'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

// Get monitoring dashboard data
export async function getMonitoringDashboard() {
  const [healthChecks, metrics] = await Promise.all([
    performHealthChecks(),
    getSystemMetrics()
  ])

  // Check alert rules
  await checkAlertRules(metrics)

  return {
    healthChecks,
    metrics,
    timestamp: new Date().toISOString()
  }
}