'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuditLogEntry } from '@/lib/audit'

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
    entityId: '',
    fromDate: '',
    toDate: ''
  })
  const [stats, setStats] = useState<any>(null)
  const [showStats, setShowStats] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchLogs()
    fetchStats()
  }, [filters])

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const params = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })
      
      const response = await fetch(`/api/audit?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('فشل في تحميل سجل التدقيق')
      }

      const data = await response.json()
      setLogs(data.data)
    } catch (err) {
      setError('خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/audit?stats=true', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.data)
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getActionColor = (action: string) => {
    if (action.includes('حذف')) return 'var(--warn)'
    if (action.includes('تعديل')) return 'var(--gold)'
    if (action.includes('إضافة')) return 'var(--ok)'
    return 'var(--brand)'
  }

  const getEntityTypeLabel = (entityType: string) => {
    const labels: Record<string, string> = {
      'customers': 'العملاء',
      'units': 'الوحدات',
      'contracts': 'العقود',
      'installments': 'الأقساط',
      'vouchers': 'السندات',
      'safes': 'الخزائن',
      'partners': 'الشركاء',
      'brokers': 'السماسرة'
    }
    return labels[entityType] || entityType
  }

  if (loading && logs.length === 0) {
    return (
      <div className="container">
        <div className="panel">
          <h2>جاري التحميل...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="header">
        <div className="brand">
          <div className="logo">🏛️</div>
          <h1>مدير الاستثمار العقاري — سجل التدقيق</h1>
        </div>
        <div className="tools">
          <button 
            className="btn secondary" 
            onClick={() => setShowStats(!showStats)}
          >
            {showStats ? 'إخفاء الإحصائيات' : 'عرض الإحصائيات'}
          </button>
          <button className="btn secondary" onClick={() => router.push('/')}>
            العودة للوحة التحكم
          </button>
        </div>
      </div>

      <div className="main-layout">
        <div className="sidebar">
          <button className="tab" onClick={() => router.push('/')}>لوحة التحكم</button>
          <button className="tab" onClick={() => router.push('/customers')}>العملاء</button>
          <button className="tab" onClick={() => router.push('/units')}>الوحدات</button>
          <button className="tab" onClick={() => router.push('/contracts')}>العقود</button>
          <button className="tab" onClick={() => router.push('/brokers')}>السماسرة</button>
          <button className="tab" onClick={() => router.push('/installments')}>الأقساط</button>
          <button className="tab" onClick={() => router.push('/vouchers')}>السندات</button>
          <button className="tab" onClick={() => router.push('/partners')}>الشركاء</button>
          <button className="tab" onClick={() => router.push('/treasury')}>الخزينة</button>
          <button className="tab" onClick={() => router.push('/reports')}>التقارير</button>
          <button className="tab" onClick={() => router.push('/backup')}>نسخة احتياطية</button>
          <button className="tab active">سجل التدقيق</button>
        </div>

        <div className="content">
          <div className="panel">
            <h2>سجل التدقيق</h2>
            
            {error && (
              <div style={{ color: 'var(--warn)', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            {showStats && stats && (
              <div className="panel" style={{ marginBottom: '16px' }}>
                <h3>إحصائيات سجل التدقيق</h3>
                <div className="grid grid-4">
                  <div className="card">
                    <h3>إجمالي السجلات</h3>
                    <div className="big">{stats.totalLogs.toLocaleString()}</div>
                  </div>
                  <div className="card">
                    <h3>اليوم</h3>
                    <div className="big">{stats.logsToday.toLocaleString()}</div>
                  </div>
                  <div className="card">
                    <h3>هذا الأسبوع</h3>
                    <div className="big">{stats.logsThisWeek.toLocaleString()}</div>
                  </div>
                  <div className="card">
                    <h3>هذا الشهر</h3>
                    <div className="big">{stats.logsThisMonth.toLocaleString()}</div>
                  </div>
                </div>
                
                <div className="grid grid-2" style={{ marginTop: '16px' }}>
                  <div>
                    <h4>أكثر العمليات</h4>
                    <div style={{ fontSize: '14px' }}>
                      {stats.topActions.slice(0, 5).map((item: any, index: number) => (
                        <div key={index} style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          marginBottom: '4px' 
                        }}>
                          <span>{item.action}</span>
                          <span style={{ color: 'var(--muted)' }}>{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4>أكثر الكيانات</h4>
                    <div style={{ fontSize: '14px' }}>
                      {stats.topEntities.slice(0, 5).map((item: any, index: number) => (
                        <div key={index} style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          marginBottom: '4px' 
                        }}>
                          <span>{getEntityTypeLabel(item.entityType)}</span>
                          <span style={{ color: 'var(--muted)' }}>{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="tools">
              <input
                type="text"
                placeholder="البحث في العملية..."
                value={filters.action}
                onChange={(e) => setFilters({...filters, action: e.target.value})}
                className="input"
                style={{ maxWidth: '200px' }}
              />
              <select
                value={filters.entityType}
                onChange={(e) => setFilters({...filters, entityType: e.target.value})}
                className="select"
                style={{ maxWidth: '150px' }}
              >
                <option value="">جميع الكيانات</option>
                <option value="customers">العملاء</option>
                <option value="units">الوحدات</option>
                <option value="contracts">العقود</option>
                <option value="installments">الأقساط</option>
                <option value="vouchers">السندات</option>
                <option value="safes">الخزائن</option>
                <option value="partners">الشركاء</option>
                <option value="brokers">السماسرة</option>
              </select>
              <input
                type="date"
                placeholder="من تاريخ"
                value={filters.fromDate}
                onChange={(e) => setFilters({...filters, fromDate: e.target.value})}
                className="input"
                style={{ maxWidth: '150px' }}
              />
              <input
                type="date"
                placeholder="إلى تاريخ"
                value={filters.toDate}
                onChange={(e) => setFilters({...filters, toDate: e.target.value})}
                className="input"
                style={{ maxWidth: '150px' }}
              />
            </div>

            <table className="table">
              <thead>
                <tr>
                  <th>التاريخ والوقت</th>
                  <th>العملية</th>
                  <th>نوع الكيان</th>
                  <th>معرف الكيان</th>
                  <th>المستخدم</th>
                  <th>عنوان IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)' }}>
                      لا توجد سجلات تدقيق
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td>{formatDate(log.timestamp)}</td>
                      <td>
                        <span style={{ color: getActionColor(log.action) }}>
                          {log.action}
                        </span>
                      </td>
                      <td>{getEntityTypeLabel(log.entityType)}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                        {log.entityId}
                      </td>
                      <td>{log.userId || '—'}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                        {log.ipAddress || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}