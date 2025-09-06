import { Notification, NotificationPreferences, NotificationTemplate } from '@/types/notifications'

// Notification templates
export const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'installment_overdue',
    name: 'قسط متأخر',
    type: 'critical',
    title: 'قسط متأخر',
    message: 'القسط {amount} للوحدة {unitCode} متأخر منذ {days} يوم',
    category: 'installments',
    enabled: true
  },
  {
    id: 'installment_due_soon',
    name: 'قسط قريب الاستحقاق',
    type: 'important',
    title: 'قسط قريب الاستحقاق',
    message: 'القسط {amount} للوحدة {unitCode} مستحق خلال {days} يوم',
    category: 'installments',
    enabled: true
  },
  {
    id: 'low_balance',
    name: 'رصيد منخفض',
    type: 'important',
    title: 'رصيد منخفض',
    message: 'رصيد الخزنة {safeName} منخفض: {balance}',
    category: 'treasury',
    enabled: true
  },
  {
    id: 'contract_expiring',
    name: 'عقد قريب الانتهاء',
    type: 'info',
    title: 'عقد قريب الانتهاء',
    message: 'عقد الوحدة {unitCode} ينتهي خلال {days} يوم',
    category: 'contracts',
    enabled: true
  },
  {
    id: 'backup_completed',
    name: 'نسخة احتياطية مكتملة',
    type: 'info',
    title: 'نسخة احتياطية مكتملة',
    message: 'تم إنشاء النسخة الاحتياطية بنجاح',
    category: 'system',
    enabled: true
  },
  {
    id: 'backup_failed',
    name: 'فشل النسخة الاحتياطية',
    type: 'critical',
    title: 'فشل النسخة الاحتياطية',
    message: 'فشل في إنشاء النسخة الاحتياطية: {error}',
    category: 'system',
    enabled: true
  }
]

// Generate notification from template
export function generateNotification(
  templateId: string,
  data: Record<string, any>,
  userId?: string
): Notification | null {
  const template = NOTIFICATION_TEMPLATES.find(t => t.id === templateId)
  if (!template || !template.enabled) return null

  // Replace placeholders in message
  let message = template.message
  Object.keys(data).forEach(key => {
    message = message.replace(`{${key}}`, data[key])
  })

  return {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type: template.type,
    title: template.title,
    message,
    category: template.category,
    acknowledged: false,
    createdAt: new Date().toISOString(),
    data
  }
}

// Notification categories
export const NOTIFICATION_CATEGORIES = {
  installments: 'الأقساط',
  treasury: 'الخزينة',
  contracts: 'العقود',
  system: 'النظام',
  customers: 'العملاء',
  units: 'الوحدات'
}

// Default notification preferences
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  userId: '',
  critical: true,
  important: true,
  info: true,
  email: false,
  push: false,
  inApp: true
}

// Check if notification should be sent based on preferences
export function shouldSendNotification(
  notification: Notification,
  preferences: NotificationPreferences
): boolean {
  if (!preferences.inApp) return false
  
  switch (notification.type) {
    case 'critical':
      return preferences.critical
    case 'important':
      return preferences.important
    case 'info':
      return preferences.info
    default:
      return false
  }
}

// Group similar notifications
export function groupNotifications(notifications: Notification[]): Notification[] {
  const grouped = new Map<string, Notification>()
  
  notifications.forEach(notification => {
    const key = `${notification.type}-${notification.category}-${notification.title}`
    
    if (grouped.has(key)) {
      const existing = grouped.get(key)!
      existing.message += `\n• ${notification.message}`
      existing.data = {
        ...existing.data,
        count: (existing.data?.count || 1) + 1
      }
    } else {
      grouped.set(key, { ...notification })
    }
  })
  
  return Array.from(grouped.values())
}

// Check if notification is expired
export function isNotificationExpired(notification: Notification): boolean {
  if (!notification.expiresAt) return false
  return new Date(notification.expiresAt) < new Date()
}

// Get notification priority for sorting
export function getNotificationPriority(notification: Notification): number {
  switch (notification.type) {
    case 'critical': return 3
    case 'important': return 2
    case 'info': return 1
    default: return 0
  }
}

// Sort notifications by priority and date
export function sortNotifications(notifications: Notification[]): Notification[] {
  return notifications.sort((a, b) => {
    const priorityA = getNotificationPriority(a)
    const priorityB = getNotificationPriority(b)
    
    if (priorityA !== priorityB) {
      return priorityB - priorityA
    }
    
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}