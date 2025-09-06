'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Customer, PaginatedResponse } from '@/types'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    nationalId: '',
    address: '',
    status: 'نشط',
    notes: ''
  })
  const router = useRouter()

  useEffect(() => {
    fetchCustomers()
  }, [search])

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      
      const response = await fetch(`/api/customers?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('فشل في تحميل العملاء')
      }

      const data: PaginatedResponse<Customer> = await response.json()
      setCustomers(data.data)
    } catch (err) {
      setError('خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newCustomer),
      })

      const data = await response.json()

      if (data.success) {
        setNewCustomer({
          name: '',
          phone: '',
          nationalId: '',
          address: '',
          status: 'نشط',
          notes: ''
        })
        setShowAddForm(false)
        fetchCustomers()
      } else {
        setError(data.error || 'خطأ في إضافة العميل')
      }
    } catch (err) {
      setError('خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCustomer = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف العميل "${name}"؟ هذا الإجراء لا يمكن التراجع عنه.`)) {
      return
    }

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (data.success) {
        fetchCustomers()
      } else {
        setError(data.error || 'خطأ في حذف العميل')
      }
    } catch (err) {
      setError('خطأ في الاتصال')
    }
  }

  if (loading && customers.length === 0) {
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
          <h1>مدير الاستثمار العقاري — العملاء</h1>
        </div>
        <div className="tools">
          <button className="btn" onClick={() => setShowAddForm(true)}>
            إضافة عميل
          </button>
          <button className="btn secondary" onClick={() => router.push('/')}>
            العودة للوحة التحكم
          </button>
        </div>
      </div>

      <div className="main-layout">
        <div className="sidebar">
          <button className="tab" onClick={() => router.push('/')}>لوحة التحكم</button>
          <button className="tab active">العملاء</button>
          <button className="tab" onClick={() => router.push('/units')}>الوحدات</button>
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
            <h2>العملاء</h2>
            
            {error && (
              <div style={{ color: 'var(--warn)', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <div className="tools">
              <input
                type="text"
                placeholder="البحث في العملاء..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input"
                style={{ maxWidth: '300px' }}
              />
            </div>

            {showAddForm && (
              <div className="panel" style={{ marginBottom: '16px' }}>
                <h3>إضافة عميل جديد</h3>
                <form onSubmit={handleAddCustomer}>
                  <div className="grid grid-2">
                    <div>
                      <label>الاسم *</label>
                      <input
                        type="text"
                        value={newCustomer.name}
                        onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                        className="input"
                        required
                      />
                    </div>
                    <div>
                      <label>رقم الهاتف *</label>
                      <input
                        type="text"
                        value={newCustomer.phone}
                        onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                        className="input"
                        required
                      />
                    </div>
                    <div>
                      <label>الرقم القومي</label>
                      <input
                        type="text"
                        value={newCustomer.nationalId}
                        onChange={(e) => setNewCustomer({...newCustomer, nationalId: e.target.value})}
                        className="input"
                      />
                    </div>
                    <div>
                      <label>العنوان</label>
                      <input
                        type="text"
                        value={newCustomer.address}
                        onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                        className="input"
                      />
                    </div>
                    <div>
                      <label>الحالة</label>
                      <select
                        value={newCustomer.status}
                        onChange={(e) => setNewCustomer({...newCustomer, status: e.target.value})}
                        className="select"
                      >
                        <option value="نشط">نشط</option>
                        <option value="غير نشط">غير نشط</option>
                      </select>
                    </div>
                    <div>
                      <label>ملاحظات</label>
                      <textarea
                        value={newCustomer.notes}
                        onChange={(e) => setNewCustomer({...newCustomer, notes: e.target.value})}
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
                  <th>الاسم</th>
                  <th>رقم الهاتف</th>
                  <th>الرقم القومي</th>
                  <th>العنوان</th>
                  <th>الحالة</th>
                  <th>العمليات</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)' }}>
                      لا توجد عملاء
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr key={customer.id}>
                      <td>{customer.name}</td>
                      <td>{customer.phone}</td>
                      <td>{customer.nationalId || '—'}</td>
                      <td>{customer.address || '—'}</td>
                      <td>
                        <span className={`badge ${customer.status === 'نشط' ? 'ok' : 'warn'}`}>
                          {customer.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn warn"
                          onClick={() => handleDeleteCustomer(customer.id, customer.name)}
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