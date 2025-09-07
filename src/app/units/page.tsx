'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Unit, PaginatedResponse } from '@/types'

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newUnit, setNewUnit] = useState({
    code: '',
    name: '',
    unitType: 'سكني',
    area: '',
    floor: '',
    building: '',
    totalPrice: 0,
    status: 'متاحة',
    notes: ''
  })
  const router = useRouter()

  useEffect(() => {
    fetchUnits()
  }, [search, statusFilter])

  const fetchUnits = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (statusFilter) params.append('status', statusFilter)
      
      const response = await fetch(`/api/units?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('فشل في تحميل الوحدات')
      }

      const data: PaginatedResponse<Unit> = await response.json()
      setUnits(data.data)
    } catch (err) {
      setError('خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/units', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newUnit),
      })

      const data = await response.json()

      if (data.success) {
        setNewUnit({
          code: '',
          name: '',
          unitType: 'سكني',
          area: '',
          floor: '',
          building: '',
          totalPrice: 0,
          status: 'متاحة',
          notes: ''
        })
        setShowAddForm(false)
        fetchUnits()
      } else {
        setError(data.error || 'خطأ في إضافة الوحدة')
      }
    } catch (err) {
      setError('خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUnit = async (id: string, code: string) => {
    if (!confirm(`هل أنت متأكد من حذف الوحدة "${code}"؟ هذا الإجراء لا يمكن التراجع عنه.`)) {
      return
    }

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/units/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (data.success) {
        fetchUnits()
      } else {
        setError(data.error || 'خطأ في حذف الوحدة')
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

  if (loading && units.length === 0) {
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
          <h1>مدير الاستثمار العقاري — الوحدات</h1>
        </div>
        <div className="tools">
          <button className="btn" onClick={() => setShowAddForm(true)}>
            إضافة وحدة
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
            <h2>الوحدات</h2>
            
            {error && (
              <div style={{ color: 'var(--warn)', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <div className="tools">
              <input
                type="text"
                placeholder="البحث في الوحدات..."
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
                <option value="متاحة">متاحة</option>
                <option value="مباعة">مباعة</option>
                <option value="محجوزة">محجوزة</option>
              </select>
            </div>

            {showAddForm && (
              <div className="panel" style={{ marginBottom: '16px' }}>
                <h3>إضافة وحدة جديدة</h3>
                <form onSubmit={handleAddUnit}>
                  <div className="grid grid-2">
                    <div>
                      <label>كود الوحدة *</label>
                      <input
                        type="text"
                        value={newUnit.code}
                        onChange={(e) => setNewUnit({...newUnit, code: e.target.value})}
                        className="input"
                        placeholder="A-101"
                        required
                      />
                    </div>
                    <div>
                      <label>اسم الوحدة</label>
                      <input
                        type="text"
                        value={newUnit.name}
                        onChange={(e) => setNewUnit({...newUnit, name: e.target.value})}
                        className="input"
                      />
                    </div>
                    <div>
                      <label>نوع الوحدة</label>
                      <select
                        value={newUnit.unitType}
                        onChange={(e) => setNewUnit({...newUnit, unitType: e.target.value})}
                        className="select"
                      >
                        <option value="سكني">سكني</option>
                        <option value="تجاري">تجاري</option>
                        <option value="إداري">إداري</option>
                      </select>
                    </div>
                    <div>
                      <label>المساحة</label>
                      <input
                        type="text"
                        value={newUnit.area}
                        onChange={(e) => setNewUnit({...newUnit, area: e.target.value})}
                        className="input"
                        placeholder="120"
                      />
                    </div>
                    <div>
                      <label>الدور</label>
                      <input
                        type="text"
                        value={newUnit.floor}
                        onChange={(e) => setNewUnit({...newUnit, floor: e.target.value})}
                        className="input"
                        placeholder="1"
                      />
                    </div>
                    <div>
                      <label>العمارة</label>
                      <input
                        type="text"
                        value={newUnit.building}
                        onChange={(e) => setNewUnit({...newUnit, building: e.target.value})}
                        className="input"
                        placeholder="A"
                      />
                    </div>
                    <div>
                      <label>السعر الإجمالي</label>
                      <input
                        type="number"
                        value={newUnit.totalPrice}
                        onChange={(e) => setNewUnit({...newUnit, totalPrice: parseFloat(e.target.value) || 0})}
                        className="input"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label>الحالة</label>
                      <select
                        value={newUnit.status}
                        onChange={(e) => setNewUnit({...newUnit, status: e.target.value})}
                        className="select"
                      >
                        <option value="متاحة">متاحة</option>
                        <option value="مباعة">مباعة</option>
                        <option value="محجوزة">محجوزة</option>
                      </select>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label>ملاحظات</label>
                      <textarea
                        value={newUnit.notes}
                        onChange={(e) => setNewUnit({...newUnit, notes: e.target.value})}
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
                  <th>كود الوحدة</th>
                  <th>اسم الوحدة</th>
                  <th>النوع</th>
                  <th>المساحة</th>
                  <th>الدور</th>
                  <th>العمارة</th>
                  <th>السعر</th>
                  <th>الحالة</th>
                  <th>العمليات</th>
                </tr>
              </thead>
              <tbody>
                {units.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', color: 'var(--muted)' }}>
                      لا توجد وحدات
                    </td>
                  </tr>
                ) : (
                  units.map((unit) => (
                    <tr key={unit.id}>
                      <td>{unit.code}</td>
                      <td>{unit.name || '—'}</td>
                      <td>{unit.unitType}</td>
                      <td>{unit.area || '—'}</td>
                      <td>{unit.floor || '—'}</td>
                      <td>{unit.building || '—'}</td>
                      <td>{formatCurrency(unit.totalPrice)}</td>
                      <td>
                        <span className={`badge ${
                          unit.status === 'متاحة' ? 'ok' : 
                          unit.status === 'مباعة' ? 'info' : 'warn'
                        }`}>
                          {unit.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn warn"
                          onClick={() => handleDeleteUnit(unit.id, unit.code)}
                        >
                          حذف
                        </button>
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