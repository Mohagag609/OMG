'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/utils/formatting'

export default function Audit() {
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  })
  // const [deletingLogs, setDeletingLogs] = useState<Set<string>>(new Set())
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('authToken')
    if (!token) {
      router.push('/login')
      return
    }
    
    fetchAuditLogs()
  }, [pagination.page])

  const fetchAuditLogs = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      })

      const response = await fetch(`/api/audit?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('authToken')
          router.push('/login')
          return
        }
        throw new Error('فشل في تحميل سجل التدقيق')
      }

      const data = await response.json()
      if (data.success) {
        setAuditLogs(data.data)
        setPagination(data.pagination)
      } else {
        setError(data.error || 'خطأ في تحميل سجل التدقيق')
      }
    } catch (err) {
      setError('خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
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
          <div className="logo">🔍</div>
          <h1>سجل التدقيق</h1>
        </div>
        <div className="tools">
          <button className="btn secondary" onClick={() => router.push('/')}>
            العودة للرئيسية
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
            
            {error && <div className="error-message">{error}</div>}
            
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>الإجراء</th>
                    <th>نوع الكيان</th>
                    <th>معرف الكيان</th>
                    <th>المستخدم</th>
                    <th>العنوان</th>
                    <th>المتصفح</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td>{formatDate(log.createdAt)}</td>
                      <td>{log.action}</td>
                      <td>{log.entityType}</td>
                      <td>{log.entityId}</td>
                      <td>{log.userId || '-'}</td>
                      <td>{log.ipAddress || '-'}</td>
                      <td>{log.userAgent || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.totalPages > 1 && (
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <button
                  className="btn secondary"
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                >
                  السابق
                </button>
                <span style={{ margin: '0 20px' }}>
                  صفحة {pagination.page} من {pagination.totalPages}
                </span>
                <button
                  className="btn secondary"
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.totalPages}
                >
                  التالي
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}