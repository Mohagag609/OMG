'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Unit } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatting'

export default function Units() {
  const [units, setUnits] = useState<Unit[]>([])
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
    
    fetchUnits()
  }, [])

  const fetchUnits = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/units', {
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
        throw new Error('فشل في تحميل الوحدات')
      }

      const data = await response.json()
      if (data.success) {
        setUnits(data.data)
      } else {
        setError(data.error || 'خطأ في تحميل الوحدات')
      }
    } catch (err) {
      console.error('Units error:', err)
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
          <div className="logo">🏢</div>
          <h1>إدارة الوحدات</h1>
        </div>
        <div className="tools">
          <button className="btn primary">
            إضافة وحدة جديدة
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
          <button className="tab active">الوحدات</button>
          <button className="tab" onClick={() => router.push('/contracts')}>العقود</button>
          <button className="tab" onClick={() => router.push('/brokers')}>السماسرة</button>
          <button className="tab" onClick={() => router.push('/installments')}>الأقساط</button>
          <button className="tab" onClick={() => router.push('/vouchers')}>السندات</button>
          <button className="tab" onClick={() => router.push('/partners')}>الشركاء</button>
          <button className="tab" onClick={() => router.push('/treasury')}>الخزينة</button>
          <button className="tab" onClick={() => router.push('/reports')}>التقارير</button>
          <button className="tab" onClick={() => router.push('/backup')}>نسخة احتياطية</button>
        </div>

        <div className="content">
          <div className="panel">
            <h2>قائمة الوحدات</h2>
            
            {error && <div className="error-message">{error}</div>}
            
            <div style={{ marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="البحث في الوحدات..."
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
                    <th>الكود</th>
                    <th>الاسم</th>
                    <th>النوع</th>
                    <th>المساحة</th>
                    <th>الطابق</th>
                    <th>المبنى</th>
                    <th>السعر الإجمالي</th>
                    <th>الحالة</th>
                    <th>تاريخ الإضافة</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {units.filter(unit => 
                    search === '' || 
                    unit.code.toLowerCase().includes(search.toLowerCase()) ||
                    (unit.name && unit.name.toLowerCase().includes(search.toLowerCase()))
                  ).map((unit) => (
                    <tr key={unit.id}>
                      <td>{unit.code}</td>
                      <td>{unit.name || '-'}</td>
                      <td>{unit.unitType}</td>
                      <td>{unit.area || '-'}</td>
                      <td>{unit.floor || '-'}</td>
                      <td>{unit.building || '-'}</td>
                      <td>{formatCurrency(unit.totalPrice)}</td>
                      <td>{unit.status}</td>
                      <td>{unit.createdAt ? formatDate(unit.createdAt) : '-'}</td>
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