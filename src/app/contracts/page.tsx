'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Contract } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatting'

export default function Contracts() {
  const [contracts, setContracts] = useState<Contract[]>([])
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
    
    fetchContracts()
  }, [])

  const fetchContracts = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/contracts', {
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
        throw new Error('فشل في تحميل العقود')
      }

      const data = await response.json()
      if (data.success) {
        setContracts(data.data)
      } else {
        setError(data.error || 'خطأ في تحميل العقود')
      }
    } catch (err) {
      console.error('Contracts error:', err)
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
          <div className="logo">📋</div>
          <h1>إدارة العقود</h1>
        </div>
        <div className="tools">
          <button className="btn primary">
            إضافة عقد جديد
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
          <button className="tab active">العقود</button>
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
            <h2>قائمة العقود</h2>
            
            {error && <div className="error-message">{error}</div>}
            
            <div style={{ marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="البحث في العقود..."
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
                    <th>الوحدة</th>
                    <th>العميل</th>
                    <th>تاريخ البداية</th>
                    <th>السعر الإجمالي</th>
                    <th>مبلغ الخصم</th>
                    <th>اسم السمسار</th>
                    <th>مبلغ السمسار</th>
                    <th>تاريخ الإضافة</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.filter(contract => 
                    search === '' || 
                    contract.unit?.code.toLowerCase().includes(search.toLowerCase()) ||
                    contract.customer?.name.toLowerCase().includes(search.toLowerCase()) ||
                    (contract.brokerName && contract.brokerName.toLowerCase().includes(search.toLowerCase()))
                  ).map((contract) => (
                    <tr key={contract.id}>
                      <td>{contract.unit?.code || '-'}</td>
                      <td>{contract.customer?.name || '-'}</td>
                      <td>{formatDate(contract.start)}</td>
                      <td>{formatCurrency(contract.totalPrice)}</td>
                      <td>{formatCurrency(contract.discountAmount)}</td>
                      <td>{contract.brokerName || '-'}</td>
                      <td>{formatCurrency(contract.brokerAmount)}</td>
                      <td>{contract.createdAt ? formatDate(contract.createdAt) : '-'}</td>
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