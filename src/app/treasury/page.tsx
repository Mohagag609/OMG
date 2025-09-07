'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Safe } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatting'

export default function Treasury() {
  const [safes, setSafes] = useState<Safe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newSafe, setNewSafe] = useState({
    name: '',
    balance: 0
  })
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('authToken')
    if (!token) {
      router.push('/login')
      return
    }
    
    fetchSafes()
  }, [])

  const fetchSafes = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/safes', {
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
        throw new Error('فشل في تحميل الخزائن')
      }

      const data = await response.json()
      if (data.success) {
        setSafes(data.data)
      } else {
        setError(data.error || 'خطأ في تحميل الخزائن')
      }
    } catch (err) {
      console.error('Safes error:', err)
      setError('خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  const handleAddSafe = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/safes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newSafe)
      })

      const data = await response.json()
      if (data.success) {
        setShowAddForm(false)
        setNewSafe({ name: '', balance: 0 })
        fetchSafes()
      } else {
        setError(data.error || 'خطأ في إضافة الخزنة')
      }
    } catch (err) {
      setError('خطأ في الاتصال')
    }
  }

  const handleDeleteSafe = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الخزنة؟')) {
      return
    }

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/safes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        fetchSafes()
      } else {
        setError(data.error || 'خطأ في حذف الخزنة')
      }
    } catch (err) {
      setError('خطأ في الاتصال')
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
          <div className="logo">🏦</div>
          <h1>إدارة الخزينة</h1>
        </div>
        <div className="tools">
          <button className="btn primary" onClick={() => setShowAddForm(true)}>
            إضافة خزنة جديدة
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
          <button className="tab" onClick={() => router.push('/vouchers')}>السندات</button>
          <button className="tab" onClick={() => router.push('/partners')}>الشركاء</button>
          <button className="tab active">الخزينة</button>
          <button className="tab" onClick={() => router.push('/reports')}>التقارير</button>
          <button className="tab" onClick={() => router.push('/backup')}>نسخة احتياطية</button>
        </div>

        <div className="content">
          <div className="panel">
            <h2>قائمة الخزائن</h2>
            
            {error && <div className="error-message">{error}</div>}
            
            <div style={{ marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="البحث في الخزائن..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input"
                style={{ width: '300px' }}
              />
            </div>

            {showAddForm && (
              <div className="panel" style={{ marginBottom: '20px' }}>
                <h3>إضافة خزنة جديدة</h3>
                <form onSubmit={handleAddSafe}>
                  <div className="form-group">
                    <label className="form-label">اسم الخزنة *</label>
                    <input
                      type="text"
                      value={newSafe.name}
                      onChange={(e) => setNewSafe({ ...newSafe, name: e.target.value })}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">الرصيد الابتدائي</label>
                    <input
                      type="number"
                      value={newSafe.balance}
                      onChange={(e) => setNewSafe({ ...newSafe, balance: parseFloat(e.target.value) || 0 })}
                      className="form-input"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" className="btn primary">إضافة</button>
                    <button type="button" className="btn secondary" onClick={() => setShowAddForm(false)}>
                      إلغاء
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>اسم الخزنة</th>
                    <th>الرصيد الحالي</th>
                    <th>تاريخ الإضافة</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {safes.filter(safe => 
                    search === '' || 
                    safe.name.toLowerCase().includes(search.toLowerCase())
                  ).map((safe) => (
                    <tr key={safe.id}>
                      <td>{safe.name}</td>
                      <td>
                        <span style={{ 
                          fontWeight: 'bold',
                          color: safe.balance >= 0 ? '#059669' : '#dc2626'
                        }}>
                          {formatCurrency(safe.balance)}
                        </span>
                      </td>
                      <td>{safe.createdAt ? formatDate(safe.createdAt) : '-'}</td>
                      <td>
                        <button
                          className="btn warn"
                          onClick={() => handleDeleteSafe(safe.id)}
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