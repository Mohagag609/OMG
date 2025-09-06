'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Voucher, PaginatedResponse } from '@/types'

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [safes, setSafes] = useState<any[]>([])
  const [units, setUnits] = useState<any[]>([])
  const [newVoucher, setNewVoucher] = useState({
    type: 'receipt' as 'receipt' | 'payment',
    date: '',
    amount: 0,
    safeId: '',
    description: '',
    payer: '',
    beneficiary: '',
    linked_ref: ''
  })
  const router = useRouter()

  useEffect(() => {
    fetchVouchers()
    fetchSafes()
    fetchUnits()
  }, [search, typeFilter])

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
        throw new Error('فشل في تحميل السندات')
      }

      const data: PaginatedResponse<Voucher> = await response.json()
      setVouchers(data.data)
    } catch (err) {
      setError('خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  const fetchSafes = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/safes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSafes(data.data)
      }
    } catch (err) {
      console.error('Error fetching safes:', err)
    }
  }

  const fetchUnits = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/units', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUnits(data.data)
      }
    } catch (err) {
      console.error('Error fetching units:', err)
    }
  }

  const handleAddVoucher = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/vouchers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newVoucher),
      })

      const data = await response.json()

      if (data.success) {
        setNewVoucher({
          type: 'receipt',
          date: '',
          amount: 0,
          safeId: '',
          description: '',
          payer: '',
          beneficiary: '',
          linked_ref: ''
        })
        setShowAddForm(false)
        fetchVouchers()
        fetchSafes() // Refresh safes to update balances
      } else {
        setError(data.error || 'خطأ في إضافة السند')
      }
    } catch (err) {
      setError('خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount) + ' ج.م'
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar-EG')
  }

  const getTypeLabel = (type: string) => {
    return type === 'receipt' ? 'سند قبض' : 'سند دفع'
  }

  const getTypeBadge = (type: string) => {
    return type === 'receipt' ? 'badge ok' : 'badge warn'
  }

  if (loading && vouchers.length === 0) {
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
          <h1>مدير الاستثمار العقاري — السندات</h1>
        </div>
        <div className="tools">
          <button className="btn" onClick={() => setShowAddForm(true)}>
            إضافة سند
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
          <button className="tab active">السندات</button>
          <button className="tab" onClick={() => router.push('/partners')}>الشركاء</button>
          <button className="tab" onClick={() => router.push('/treasury')}>الخزينة</button>
          <button className="tab" onClick={() => router.push('/reports')}>التقارير</button>
          <button className="tab" onClick={() => router.push('/backup')}>نسخة احتياطية</button>
        </div>

        <div className="content">
          <div className="panel">
            <h2>السندات</h2>
            
            {error && (
              <div style={{ color: 'var(--warn)', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <div className="tools">
              <input
                type="text"
                placeholder="البحث في السندات..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input"
                style={{ maxWidth: '300px' }}
              />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="select"
                style={{ maxWidth: '150px' }}
              >
                <option value="">جميع الأنواع</option>
                <option value="receipt">سند قبض</option>
                <option value="payment">سند دفع</option>
              </select>
            </div>

            {showAddForm && (
              <div className="panel" style={{ marginBottom: '16px' }}>
                <h3>إضافة سند جديد</h3>
                <form onSubmit={handleAddVoucher}>
                  <div className="grid grid-2">
                    <div>
                      <label>نوع السند *</label>
                      <select
                        value={newVoucher.type}
                        onChange={(e) => setNewVoucher({...newVoucher, type: e.target.value as 'receipt' | 'payment'})}
                        className="select"
                        required
                      >
                        <option value="receipt">سند قبض</option>
                        <option value="payment">سند دفع</option>
                      </select>
                    </div>
                    <div>
                      <label>التاريخ *</label>
                      <input
                        type="date"
                        value={newVoucher.date}
                        onChange={(e) => setNewVoucher({...newVoucher, date: e.target.value})}
                        className="input"
                        required
                      />
                    </div>
                    <div>
                      <label>المبلغ *</label>
                      <input
                        type="number"
                        value={newVoucher.amount}
                        onChange={(e) => setNewVoucher({...newVoucher, amount: parseFloat(e.target.value) || 0})}
                        className="input"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div>
                      <label>الخزنة *</label>
                      <select
                        value={newVoucher.safeId}
                        onChange={(e) => setNewVoucher({...newVoucher, safeId: e.target.value})}
                        className="select"
                        required
                      >
                        <option value="">اختر الخزنة</option>
                        {safes.map(safe => (
                          <option key={safe.id} value={safe.id}>
                            {safe.name} - {formatCurrency(safe.balance)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label>الوصف *</label>
                      <input
                        type="text"
                        value={newVoucher.description}
                        onChange={(e) => setNewVoucher({...newVoucher, description: e.target.value})}
                        className="input"
                        required
                      />
                    </div>
                    <div>
                      <label>الوحدة المرتبطة</label>
                      <select
                        value={newVoucher.linked_ref}
                        onChange={(e) => setNewVoucher({...newVoucher, linked_ref: e.target.value})}
                        className="select"
                      >
                        <option value="">اختر الوحدة</option>
                        {units.map(unit => (
                          <option key={unit.id} value={unit.id}>
                            {unit.code} - {unit.name || 'بدون اسم'}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label>{newVoucher.type === 'receipt' ? 'المدفوع له' : 'المستفيد'}</label>
                      <input
                        type="text"
                        value={newVoucher.type === 'receipt' ? newVoucher.payer : newVoucher.beneficiary}
                        onChange={(e) => {
                          if (newVoucher.type === 'receipt') {
                            setNewVoucher({...newVoucher, payer: e.target.value})
                          } else {
                            setNewVoucher({...newVoucher, beneficiary: e.target.value})
                          }
                        }}
                        className="input"
                      />
                    </div>
                  </div>
                  <div className="tools">
                    <button type="submit" className="btn" disabled={loading}>
                      {loading ? 'جاري الحفظ...' : 'حفظ'}
                    </button>
                    <button type="button" className="btn secondary" onClick={() => setShowAddForm(false)}>
                      إلغاء
                    </button>
                  </div>
                </form>
              </div>
            )}

            <table className="table">
              <thead>
                <tr>
                  <th>النوع</th>
                  <th>التاريخ</th>
                  <th>المبلغ</th>
                  <th>الخزنة</th>
                  <th>الوصف</th>
                  <th>المدفوع له/المستفيد</th>
                  <th>الوحدة</th>
                </tr>
              </thead>
              <tbody>
                {vouchers.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)' }}>
                      لا توجد سندات
                    </td>
                  </tr>
                ) : (
                  vouchers.map((voucher) => {
                    const safe = safes.find(s => s.id === voucher.safeId)
                    const unit = units.find(u => u.id === voucher.linked_ref)
                    return (
                      <tr key={voucher.id}>
                        <td>
                          <span className={getTypeBadge(voucher.type)}>
                            {getTypeLabel(voucher.type)}
                          </span>
                        </td>
                        <td>{formatDate(voucher.date)}</td>
                        <td>{formatCurrency(voucher.amount)}</td>
                        <td>{safe ? safe.name : 'غير معروف'}</td>
                        <td>{voucher.description}</td>
                        <td>{voucher.payer || voucher.beneficiary || '—'}</td>
                        <td>{unit ? `${unit.code} - ${unit.name || 'بدون اسم'}` : '—'}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}