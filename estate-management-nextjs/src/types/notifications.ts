export interface Notification {
  id: string
  type: 'critical' | 'important' | 'info'
  title: string
  message: string
  category: string
  acknowledged: boolean
  acknowledgedAt?: string
  acknowledgedBy?: string
  createdAt: string
  expiresAt?: string
  data?: any
}

export interface NotificationPreferences {
  userId: string
  critical: boolean
  important: boolean
  info: boolean
  email: boolean
  push: boolean
  inApp: boolean
}

export interface NotificationTemplate {
  id: string
  name: string
  type: 'critical' | 'important' | 'info'
  title: string
  message: string
  category: string
  enabled: boolean
}

export interface NotificationStats {
  total: number
  unread: number
  critical: number
  important: number
  info: number
}