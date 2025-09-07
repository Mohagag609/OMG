'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { NotificationSystem, useNotifications } from '@/components/NotificationSystem'

interface PartnerDebt {
  id: string
  partnerId: string
  amount: number
  dueDate: string
  status: string
  notes?: string
  createdAt?: string
  updatedAt?: string
  // Relations
  partner?: {
    id: string
    name: string
    phone?: string
  }
}

interface Partner {
  id: string
  name: string
  phone?: string
  notes?: string
}

export default function PartnerDebts() {
  const [partnerDebts, setPartnerDebts] = useState<PartnerDebt[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newDebt, setNewDebt] = useState({
    partnerId: '',
    amount: '',
    dueDate: '',
    notes: ''
  })
  const router = useRouter()
  const { notifications, addNotification, removeNotification } = useNotifications()

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      router.push('/login')
      return
    }
    
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('authToken')
      
      // Fetch partner debts
      const debtsResponse = await fetch('/api/partner-debts', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const debtsData = await debtsResponse.json()
      if (debtsData.success) {
        setPartnerDebts(debtsData.data || [])
      } else {
        setError(debtsData.error || 'خطأ في تحميل ديون الشركاء')
      }

      // Fetch partners
      const partnersResponse = await fetch('/api/partners', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const partnersData = await partnersResponse.json()
      if (partnersData.success) {
        setPartners(partnersData.data || [])
      }

    } catch (err) {
      console.error('Error fetching data:', err)
      setError('خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  const handleAddDebt = async () => {
    if (!newDebt.partnerId || !newDebt.amount || !newDebt.dueDate) {
      addNotification({
        type: 'error',
        title: 'خطأ في البيانات',
        message: 'الرجاء ملء جميع الحقول المطلوبة'
      })
      return
    }

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/partner-debts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newDebt,
          amount: parseFloat(newDebt.amount)
        })
      })

      const data = await response.json()
      if (data.success) {
        setPartnerDebts([...partnerDebts, data.data])
        setNewDebt({
          partnerId: '',
          amount: '',
          dueDate: '',
          notes: ''
        })
        setShowAddForm(false)
        addNotification({
          type: 'success',
          title: 'تم الحفظ بنجاح',
          message: 'تم إضافة دين الشريك بنجاح'
        })
      } else {
        addNotification({
          type: 'error',
          title: 'خطأ في الحفظ',
          message: data.error || 'فشل في إضافة دين الشريك'
        })
      }
    } catch (err) {
      console.error('Error adding debt:', err)
      addNotification({
        type: 'error',
        title: 'خطأ في الحفظ',
        message: 'فشل في إضافة دين الشريك'
      })
    }
  }

  const handlePayDebt = async (debtId: string) => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/partner-debts/${debtId}/pay`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        fetchData() // Refresh data
        addNotification({
          type: 'success',
          title: 'تم السداد بنجاح',
          message: 'تم تسجيل سداد الدين بنجاح'
        })
      } else {
        addNotification({
          type: 'error',
          title: 'خطأ في السداد',
          message: data.error || 'فشل في تسجيل السداد'
        })
      }
    } catch (err) {
      console.error('Error paying debt:', err)
      addNotification({
        type: 'error',
        title: 'خطأ في السداد',
        message: 'فشل في تسجيل السداد'
      })
    }
  }

  const getPartnerName = (partnerId: string) => {
    const partner = partners.find(p => p.id === partnerId)
    return partner ? partner.name : 'شريك محذوف'
  }

  const filteredDebts = partnerDebts.filter(debt => {
    const matchesSearch = search === '' || 
      getPartnerName(debt.partnerId).toLowerCase().includes(search.toLowerCase()) ||
      debt.notes?.toLowerCase().includes(search.toLowerCase())
    
    const matchesStatus = statusFilter === '' || debt.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="container">
        <div className="panel loading">
          <h2>جاري التحميل...</h2>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            marginTop: '20px',
            fontSize: '24px'
          }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              border: '4px solid rgba(59, 130, 246, 0.3)',
              borderTop: '4px solid rgb(59, 130, 246)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container fade-in">
      <div className="header slide-in">
        <div className="brand">
          <div className="logo">💰</div>
          <h1>ديون الشركاء</h1>
        </div>
        <div className="tools">
          <button className="btn primary" onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? 'إخفاء النموذج' : 'إضافة دين جديد'}
          </button>
          <button className="btn secondary" onClick={() => router.push('/partners')}>
            الشركاء
          </button>
          <button className="btn secondary" onClick={() => router.push('/units')}>
            الوحدات
          </button>
          <button className="btn secondary" onClick={() => router.push('/contracts')}>
            العقود
          </button>
          <button className="btn secondary" onClick={() => router.push('/reports')}>
            التقارير
          </button>
          <button className="btn warn" onClick={() => {
            localStorage.removeItem('authToken')
            router.push('/login')
          }}>
            تسجيل الخروج
          </button>
        </div>
      </div>

      <div className="main-layout">
        <div className="sidebar slide-in">
          <button className="tab" onClick={() => router.push('/')}>لوحة التحكم</button>
          <button className="tab" onClick={() => router.push('/customers')}>العملاء</button>
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

        <div className="content slide-in">
          {/* Add Debt Form */}
          {showAddForm && (
            <div className="panel">
              <h2>إضافة دين شريك جديد</h2>
              <div className="grid-2" style={{ gap: '16px' }}>
                <div>
                  <label className="form-label">الشريك *</label>
                  <select
                    className="form-select"
                    value={newDebt.partnerId}
                    onChange={(e) => setNewDebt({...newDebt, partnerId: e.target.value})}
                  >
                    <option value="">اختر شريك...</option>
                    {partners.map(partner => (
                      <option key={partner.id} value={partner.id}>
                        {partner.name} {partner.phone && `(${partner.phone})`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">المبلغ *</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="مثال: 50000"
                    value={newDebt.amount}
                    onChange={(e) => setNewDebt({...newDebt, amount: e.target.value})}
                  />
                </div>
                <div>
                  <label className="form-label">تاريخ الاستحقاق *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newDebt.dueDate}
                    onChange={(e) => setNewDebt({...newDebt, dueDate: e.target.value})}
                  />
                </div>
                <div>
                  <label className="form-label">ملاحظات</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="ملاحظات اختيارية"
                    value={newDebt.notes}
                    onChange={(e) => setNewDebt({...newDebt, notes: e.target.value})}
                  />
                </div>
              </div>
              <div className="tools">
                <button className="btn" onClick={handleAddDebt}>
                  إضافة الدين
                </button>
                <button className="btn secondary" onClick={() => setShowAddForm(false)}>
                  إلغاء
                </button>
              </div>
            </div>
          )}

          {/* Debts List */}
          <div className="panel">
            <h2>قائمة ديون الشركاء</h2>
            
            {error && <div className="error-message">{error}</div>}
            
            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="البحث في الديون..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input"
                style={{ width: '250px' }}
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-select"
                style={{ width: '150px' }}
              >
                <option value="">جميع الحالات</option>
                <option value="غير مدفوع">غير مدفوع</option>
                <option value="مدفوع">مدفوع</option>
              </select>
              <button className="btn secondary" onClick={() => {
                setSearch('')
                setStatusFilter('')
              }}>
                مسح الفلاتر
              </button>
            </div>

            {filteredDebts.length === 0 ? (
              <p>لا توجد ديون</p>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>الشريك</th>
                      <th>المبلغ</th>
                      <th>تاريخ الاستحقاق</th>
                      <th>الحالة</th>
                      <th>ملاحظات</th>
                      <th>تاريخ الإضافة</th>
                      <th>الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDebts.map((debt) => (
                      <tr key={debt.id}>
                        <td>{getPartnerName(debt.partnerId)}</td>
                        <td>{debt.amount.toLocaleString()} ج.م</td>
                        <td>{new Date(debt.dueDate).toLocaleDateString('ar-SA')}</td>
                        <td>
                          <span style={{ 
                            padding: '4px 8px', 
                            borderRadius: '4px', 
                            fontSize: '12px',
                            backgroundColor: debt.status === 'مدفوع' ? '#dcfce7' : '#fef2f2',
                            color: debt.status === 'مدفوع' ? '#166534' : '#dc2626'
                          }}>
                            {debt.status}
                          </span>
                        </td>
                        <td>{debt.notes || '-'}</td>
                        <td>{debt.createdAt ? new Date(debt.createdAt).toLocaleDateString('ar-SA') : '-'}</td>
                        <td>
                          {debt.status !== 'مدفوع' && (
                            <button
                              className="btn ok"
                              style={{ padding: '5px 10px', fontSize: '12px' }}
                              onClick={() => handlePayDebt(debt.id)}
                            >
                              تسجيل السداد
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <NotificationSystem 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </div>
  )
}