'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Installment } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatting'

export default function Installments() {
  const [installments, setInstallments] = useState<Installment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('authToken')
    if (!token) {
      router.push('/login')
      return
    }
    
    fetchInstallments()
  }, [])

  const fetchInstallments = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (statusFilter) params.append('status', statusFilter)

      const response = await fetch(`/api/installments?${params}`, {
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
        throw new Error('فشل في تحميل الأقساط')
      }

      const data = await response.json()
      if (data.success) {
        setInstallments(data.data)
      } else {
        setError(data.error || 'خطأ في تحميل الأقساط')
      }
    } catch (err) {
      console.error('Installments error:', err)
      setError('خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchInstallments()
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
          <div className="logo">📅</div>
          <h1>إدارة الأقساط</h1>
        </div>
        <div className="tools">
          <button className="btn primary">
            إضافة قسط جديد
          </button>
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
          <button className="tab active">الأقساط</button>
          <button className="tab" onClick={() => router.push('/vouchers')}>السندات</button>
          <button className="tab" onClick={() => router.push('/partners')}>الشركاء</button>
          <button className="tab" onClick={() => router.push('/treasury')}>الخزينة</button>
          <button className="tab" onClick={() => router.push('/reports')}>التقارير</button>
          <button className="tab" onClick={() => router.push('/backup')}>نسخة احتياطية</button>
        </div>

        <div className="content">
          <div className="panel">
            <h2>قائمة الأقساط</h2>
            
            {error && <div className="error-message">{error}</div>}
            
            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="البحث في الأقساط..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input"
                style={{ width: '300px' }}
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-select"
                style={{ width: '150px' }}
              >
                <option value="">جميع الحالات</option>
                <option value="معلق">معلق</option>
                <option value="جزئي">جزئي</option>
                <option value="مدفوع">مدفوع</option>
              </select>
              <button className="btn primary" onClick={handleSearch}>
                بحث
              </button>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>الوحدة</th>
                    <th>المبلغ</th>
                    <th>تاريخ الاستحقاق</th>
                    <th>الحالة</th>
                    <th>ملاحظات</th>
                    <th>تاريخ الإضافة</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {installments.map((installment) => (
                    <tr key={installment.id}>
                      <td>{installment.unit?.code || '-'}</td>
                      <td>{formatCurrency(installment.amount)}</td>
                      <td>{formatDate(installment.dueDate)}</td>
                      <td>
                        <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '4px', 
                          fontSize: '12px',
                          backgroundColor: 
                            installment.status === 'مدفوع' ? '#dcfce7' :
                            installment.status === 'جزئي' ? '#fef3c7' : '#fef2f2',
                          color: 
                            installment.status === 'مدفوع' ? '#166534' :
                            installment.status === 'جزئي' ? '#92400e' : '#dc2626'
                        }}>
                          {installment.status}
                        </span>
                      </td>
                      <td>{installment.notes || '-'}</td>
                      <td>{installment.createdAt ? formatDate(installment.createdAt) : '-'}</td>
                      <td>
                        <button
                          className="btn warn"
                          style={{ padding: '5px 10px', fontSize: '12px' }}
                        >
                          حذف
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}