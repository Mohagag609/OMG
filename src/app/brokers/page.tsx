'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Broker } from '@/types'
import { formatDate } from '@/utils/formatting'

export default function Brokers() {
  const [brokers, setBrokers] = useState<Broker[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('authToken')
    if (!token) {
      router.push('/login')
      return
    }
    
    fetchBrokers()
  }, [])

  const fetchBrokers = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/brokers', {
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
        throw new Error('فشل في تحميل السماسرة')
      }

      const data = await response.json()
      if (data.success) {
        setBrokers(data.data)
      } else {
        setError(data.error || 'خطأ في تحميل السماسرة')
      }
    } catch (err) {
      console.error('Brokers error:', err)
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
          <div className="logo">🤝</div>
          <h1>إدارة السماسرة</h1>
        </div>
        <div className="tools">
          <button className="btn primary">
            إضافة سمسار جديد
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
          <button className="tab active">السماسرة</button>
          <button className="tab" onClick={() => router.push('/installments')}>الأقساط</button>
          <button className="tab" onClick={() => router.push('/vouchers')}>السندات</button>
          <button className="tab" onClick={() => router.push('/partners')}>الشركاء</button>
          <button className="tab" onClick={() => router.push('/treasury')}>الخزينة</button>
          <button className="tab" onClick={() => router.push('/reports')}>التقارير</button>
          <button className="tab" onClick={() => router.push('/backup')}>نسخة احتياطية</button>
        </div>

        <div className="content">
          <div className="panel">
            <h2>قائمة السماسرة</h2>
            
            {error && <div className="error-message">{error}</div>}
            
            <div style={{ marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="البحث في السماسرة..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input"
                style={{ width: '300px' }}
              />
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>اسم السمسار</th>
                    <th>رقم الهاتف</th>
                    <th>ملاحظات</th>
                    <th>تاريخ الإضافة</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {brokers.filter(broker => 
                    search === '' || 
                    broker.name.toLowerCase().includes(search.toLowerCase()) ||
                    (broker.phone && broker.phone.toLowerCase().includes(search.toLowerCase()))
                  ).map((broker) => (
                    <tr key={broker.id}>
                      <td>{broker.name}</td>
                      <td>{broker.phone || '-'}</td>
                      <td>{broker.notes || '-'}</td>
                      <td>{broker.createdAt ? formatDate(broker.createdAt) : '-'}</td>
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