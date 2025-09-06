'use client'

import { useState, useEffect } from 'react'
import { Notification, NotificationStats } from '@/types/notifications'

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    critical: 0,
    important: 0,
    info: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/notifications?limit=50', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('فشل في تحميل الإشعارات')
      }

      const data = await response.json()
      setNotifications(data.data)
      
      // Calculate stats
      const total = data.data.length
      const unread = data.data.filter((n: Notification) => !n.acknowledged).length
      const critical = data.data.filter((n: Notification) => n.type === 'critical').length
      const important = data.data.filter((n: Notification) => n.type === 'important').length
      const info = data.data.filter((n: Notification) => n.type === 'info').length
      
      setStats({ total, unread, critical, important, info })
    } catch (err) {
      setError('خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  const acknowledgeNotification = async (id: string) => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/notifications/${id}/acknowledge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === id 
              ? { ...n, acknowledged: true, acknowledgedAt: new Date().toISOString() }
              : n
          )
        )
        setStats(prev => ({ ...prev, unread: prev.unread - 1 }))
      }
    } catch (err) {
      console.error('Error acknowledging notification:', err)
    }
  }

  const acknowledgeAll = async () => {
    const unreadNotifications = notifications.filter(n => !n.acknowledged)
    
    for (const notification of unreadNotifications) {
      await acknowledgeNotification(notification.id)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'critical': return '🚨'
      case 'important': return '⚠️'
      case 'info': return 'ℹ️'
      default: return '📢'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'critical': return 'var(--warn)'
      case 'important': return 'var(--gold)'
      case 'info': return 'var(--brand)'
      default: return 'var(--muted)'
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: 'var(--panel)',
        border: '1px solid var(--line)',
        borderRadius: '14px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '80vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          padding: '20px',
          borderBottom: '1px solid var(--line)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0 }}>مركز الإشعارات</h2>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {stats.unread > 0 && (
              <button
                className="btn secondary"
                onClick={acknowledgeAll}
                style={{ fontSize: '12px' }}
              >
                تأكيد الكل
              </button>
            )}
            <button
              className="btn secondary"
              onClick={onClose}
            >
              ✕
            </button>
          </div>
        </div>

        <div style={{
          padding: '20px',
          borderBottom: '1px solid var(--line)',
          display: 'flex',
          gap: '20px',
          justifyContent: 'center'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--warn)' }}>
              {stats.critical}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>حرجة</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--gold)' }}>
              {stats.important}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>هامة</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--brand)' }}>
              {stats.info}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>معلوماتية</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--ink)' }}>
              {stats.unread}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>غير مقروءة</div>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '0' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              جاري التحميل...
            </div>
          ) : error ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--warn)' }}>
              {error}
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
              لا توجد إشعارات
            </div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--line)',
                    background: notification.acknowledged ? 'transparent' : 'rgba(37, 99, 235, 0.1)',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onClick={() => !notification.acknowledged && acknowledgeNotification(notification.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ fontSize: '20px' }}>
                      {getTypeIcon(notification.type)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '4px'
                      }}>
                        <h4 style={{
                          margin: 0,
                          fontSize: '14px',
                          color: getTypeColor(notification.type)
                        }}>
                          {notification.title}
                        </h4>
                        <div style={{
                          fontSize: '11px',
                          color: 'var(--muted)',
                          whiteSpace: 'nowrap',
                          marginLeft: '10px'
                        }}>
                          {formatDate(notification.createdAt)}
                        </div>
                      </div>
                      <p style={{
                        margin: 0,
                        fontSize: '13px',
                        color: 'var(--ink)',
                        lineHeight: '1.4'
                      }}>
                        {notification.message}
                      </p>
                      {notification.acknowledged && (
                        <div style={{
                          fontSize: '11px',
                          color: 'var(--ok)',
                          marginTop: '4px'
                        }}>
                          ✓ تم التأكيد
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}