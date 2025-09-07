'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Installment, PaginatedResponse } from '@/types'

export default function InstallmentsPage() {
  const [installments, setInstallments] = useState<Installment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [units, setUnits] = useState<any[]>([])
  const [newInstallment, setNewInstallment] = useState({
    unitId: '',
    amount: 0,
    dueDate: '',
    status: 'معلق',
    notes: ''
  })
  const router = useRouter()

  useEffect(() => {
    fetchInstallments()
    fetchUnits()
  }, [search, statusFilter])

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
        throw new Error('فشل في تحميل الأقساط')
      }

      const data: PaginatedResponse<Installment> = await response.json()
      setInstallments(data.data)
    } catch (err) {
      setError('خطأ في الاتصال')
    } finally {
      setLoading(false)
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

  const handleAddInstallment = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/installments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newInstallment),
      })

      const data = await response.json()

      if (data.success) {
        setNewInstallment({
          unitId: '',
          amount: 0,
          dueDate: '',
          status: 'معلق',
          notes: ''
        })
        setShowAddForm(false)
        fetchInstallments()
      } else {
        setError(data.error || 'خطأ في إضافة القسط')
      }
    } catch (err) {
      setError('خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteInstallment = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا القسط؟ هذا الإجراء لا يمكن التراجع عنه.')) {
      return
    }

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/installments/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (data.success) {
        fetchInstallments()
      } else {
        setError(data.error || 'خطأ في حذف القسط')
      }
    } catch (err) {
      setError('خطأ في الاتصال')
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'مدفوع':
        return 'badge ok'
      case 'جزئي':
        return 'badge warn'
      case 'معلق':
        return 'badge info'
      default:
        return 'badge'
    }
  }

  if (loading && installments.length === 0) {
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
          <h1>مدير الاستثمار العقاري — الأقساط</h1>
        </div>
        <div className="tools">
          <button className="btn" onClick={() => setShowAddForm(true)}>
            إضافة قسط
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
          <button className="tab active">الأقساط</button>
          <button className="tab" onClick={() => router.push('/vouchers')}>السندات</button>
          <button className="tab" onClick={() => router.push('/partners')}>الشركاء</button>
          <button className="tab" onClick={() => router.push('/treasury')}>الخزينة</button>
          <button className="tab" onClick={() => router.push('/reports')}>التقارير</button>
          <button className="tab" onClick={() => router.push('/backup')}>نسخة احتياطية</button>
        </div>

        <div className="content">
          <div className="panel">
            <h2>الأقساط</h2>
            
            {error && (
              <div style={{ color: 'var(--warn)', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <div className="tools">
              <input
                type="text"
                placeholder="البحث في الأقساط..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input"
                style={{ maxWidth: '300px' }}
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="select"
                style={{ maxWidth: '150px' }}
              >
                <option value="">جميع الحالات</option>
                <option value="معلق">معلق</option>
                <option value="جزئي">جزئي</option>
                <option value="مدفوع">مدفوع</option>
              </select>
            </div>

            {showAddForm && (
              <div className="panel" style={{ marginBottom: '16px' }}>
                <h3>إضافة قسط جديد</h3>
                <form onSubmit={handleAddInstallment}>
                  <div className="grid grid-2">
                    <div>
                      <label>الوحدة *</label>
                      <select
                        value={newInstallment.unitId}
                        onChange={(e) => setNewInstallment({...newInstallment, unitId: e.target.value})}
                        className="select"
                        required
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
                      <label>المبلغ *</label>
                      <input
                        type="number"
                        value={newInstallment.amount}
                        onChange={(e) => setNewInstallment({...newInstallment, amount: parseFloat(e.target.value) || 0})}
                        className="input"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div>
                      <label>تاريخ الاستحقاق *</label>
                      <input
                        type="date"
                        value={newInstallment.dueDate}
                        onChange={(e) => setNewInstallment({...newInstallment, dueDate: e.target.value})}
                        className="input"
                        required
                      />
                    </div>
                    <div>
                      <label>الحالة</label>
                      <select
                        value={newInstallment.status}
                        onChange={(e) => setNewInstallment({...newInstallment, status: e.target.value})}
                        className="select"
                      >
                        <option value="معلق">معلق</option>
                        <option value="جزئي">جزئي</option>
                        <option value="مدفوع">مدفوع</option>
                      </select>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label>ملاحظات</label>
                      <textarea
                        value={newInstallment.notes}
                        onChange={(e) => setNewInstallment({...newInstallment, notes: e.target.value})}
                        className="input"
                        rows={3}
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
                  <th>الوحدة</th>
                  <th>المبلغ</th>
                  <th>تاريخ الاستحقاق</th>
                  <th>الحالة</th>
                  <th>ملاحظات</th>
                  <th>العمليات</th>
                </tr>
              </thead>
              <tbody>
                {installments.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)' }}>
                      لا توجد أقساط
                    </td>
                  </tr>
                ) : (
                  installments.map((installment) => {
                    const unit = units.find(u => u.id === installment.unitId)
                    return (
                      <tr key={installment.id}>
                        <td>{unit ? `${unit.code} - ${unit.name || 'بدون اسم'}` : 'غير معروف'}</td>
                        <td>{formatCurrency(installment.amount)}</td>
                        <td>{formatDate(installment.dueDate)}</td>
                        <td>
                          <span className={getStatusBadge(installment.status)}>
                            {installment.status}
                          </span>
                        </td>
                        <td>{installment.notes || '—'}</td>
                        <td>
                          <button
                            className="btn warn"
                            onClick={() => handleDeleteInstallment(installment.id)}
                          >
                            حذف
                          </button>
                        </td>
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