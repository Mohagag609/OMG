'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Voucher } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatting'

export default function Vouchers() {
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('authToken')
    if (!token) {
      router.push('/login')
      return
    }
    
    fetchVouchers()
  }, [])

  const fetchVouchers = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (typeFilter) params.append('type', typeFilter)

      const response = await fetch(`/api/vouchers?${params}`, {
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
        throw new Error('فشل في تحميل السندات')
      }

      const data = await response.json()
      if (data.success) {
        setVouchers(data.data)
      } else {
        setError(data.error || 'خطأ في تحميل السندات')
      }
    } catch (err) {
      console.error('Vouchers error:', err)
      setError('خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchVouchers()
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
          <div className="logo">🧾</div>
          <h1>إدارة السندات</h1>
        </div>
        <div className="tools">
          <button className="btn primary">
            إضافة سند جديد
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
          <button className="tab" onClick={() => router.push('/installments')}>الأقساط</button>
          <button className="tab active">السندات</button>
          <button className="tab" onClick={() => router.push('/partners')}>الشركاء</button>
          <button className="tab" onClick={() => router.push('/treasury')}>الخزينة</button>
          <button className="tab" onClick={() => router.push('/reports')}>التقارير</button>
          <button className="tab" onClick={() => router.push('/backup')}>نسخة احتياطية</button>
        </div>

        <div className="content">
          <div className="panel">
            <h2>قائمة السندات</h2>
            
            {error && <div className="error-message">{error}</div>}
            
            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="البحث في السندات..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input"
                style={{ width: '300px' }}
              />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="form-select"
                style={{ width: '150px' }}
              >
                <option value="">جميع الأنواع</option>
                <option value="receipt">قبض</option>
                <option value="payment">صرف</option>
              </select>
              <button className="btn primary" onClick={handleSearch}>
                بحث
              </button>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>النوع</th>
                    <th>التاريخ</th>
                    <th>المبلغ</th>
                    <th>الخزنة</th>
                    <th>الوصف</th>
                    <th>المدفوع</th>
                    <th>المستفيد</th>
                    <th>الوحدة المرتبطة</th>
                    <th>تاريخ الإضافة</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {vouchers.map((voucher) => (
                    <tr key={voucher.id}>
                      <td>
                        <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '4px', 
                          fontSize: '12px',
                          backgroundColor: voucher.type === 'receipt' ? '#dcfce7' : '#fef2f2',
                          color: voucher.type === 'receipt' ? '#166534' : '#dc2626'
                        }}>
                          {voucher.type === 'receipt' ? 'قبض' : 'صرف'}
                        </span>
                      </td>
                      <td>{formatDate(voucher.date)}</td>
                      <td>{formatCurrency(voucher.amount)}</td>
                      <td>{voucher.safe?.name || '-'}</td>
                      <td>{voucher.description}</td>
                      <td>{voucher.payer || '-'}</td>
                      <td>{voucher.beneficiary || '-'}</td>
                      <td>{voucher.unit?.code || '-'}</td>
                      <td>{voucher.createdAt ? formatDate(voucher.createdAt) : '-'}</td>
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