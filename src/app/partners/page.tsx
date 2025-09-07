'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Partner } from '@/types'
import { formatDate } from '@/utils/formatting'
import { checkDuplicateName, checkDuplicatePhone } from '@/utils/duplicateCheck'

export default function Partners() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [deletingPartners, setDeletingPartners] = useState<Set<string>>(new Set())
  const [newPartner, setNewPartner] = useState({
    name: '',
    phone: '',
    notes: ''
  })
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('authToken')
    if (!token) {
      router.push('/login')
      return
    }
    
    fetchPartners()
  }, [])

  const fetchPartners = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/partners', {
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
        throw new Error('فشل في تحميل الشركاء')
      }

      const data = await response.json()
      if (data.success) {
        setPartners(data.data || [])
      } else {
        setError(data.error || 'خطأ في تحميل الشركاء')
      }
    } catch (err) {
      console.error('Partners error:', err)
      setError('خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  const handleAddPartner = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newPartner.name) {
      setError('الرجاء إدخال اسم الشريك')
      return
    }

    // فحص تكرار الاسم
    if (checkDuplicateName(newPartner.name, partners)) {
      setError('اسم الشريك موجود بالفعل')
      return
    }

    // فحص تكرار رقم الهاتف (إذا تم إدخاله)
    if (newPartner.phone && checkDuplicatePhone(newPartner.phone, partners)) {
      setError('رقم الهاتف موجود بالفعل')
      return
    }

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/partners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newPartner)
      })

      if (!response.ok) {
        throw new Error('فشل في إضافة الشريك')
      }

      const data = await response.json()
      if (data.success) {
        setShowAddForm(false)
        setSuccess('تم إضافة الشريك بنجاح!')
        setError(null)
        setNewPartner({
          name: '',
          phone: '',
          notes: ''
        })
        fetchPartners()
      } else {
        setError(data.error || 'خطأ في إضافة الشريك')
        setSuccess(null)
      }
    } catch (err) {
      console.error('Add partner error:', err)
      setError('خطأ في إضافة الشريك')
      setSuccess(null)
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
          <div className="logo">👥</div>
          <h1>إدارة الشركاء</h1>
        </div>
        <div className="tools">
          <button className="btn primary" onClick={() => setShowAddForm(true)}>
            إضافة شريك جديد
          </button>
          <button className="btn secondary" onClick={() => router.push('/partner-debts')}>
            ديون الشركاء
          </button>
          <button className="btn secondary" onClick={() => router.push('/partner-groups')}>
            مجموعات الشركاء
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
          <button className="tab active">الشركاء</button>
          <button className="tab" onClick={() => router.push('/partner-debts')}>ديون الشركاء</button>
          <button className="tab" onClick={() => router.push('/treasury')}>الخزينة</button>
          <button className="tab" onClick={() => router.push('/reports')}>التقارير</button>
          <button className="tab" onClick={() => router.push('/backup')}>نسخة احتياطية</button>
        </div>

        <div className="content">
          {showAddForm && (
            <div className="panel" style={{ marginBottom: '20px' }}>
              <h2>إضافة شريك جديد</h2>
            {success && <div className="success-message">{success}</div>}
            {error && <div className="error-message">{error}</div>}
              <form onSubmit={handleAddPartner}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group">
                    <label className="form-label">اسم الشريك</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newPartner.name}
                      onChange={(e) => setNewPartner({...newPartner, name: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">رقم الهاتف</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={newPartner.phone}
                      onChange={(e) => setNewPartner({...newPartner, phone: e.target.value})}
                    />
                  </div>
                  
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">ملاحظات</label>
                    <textarea
                      className="form-textarea"
                      value={newPartner.notes}
                      onChange={(e) => setNewPartner({...newPartner, notes: e.target.value})}
                    />
                  </div>
                </div>
                
                <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                  <button type="submit" className="btn primary">
                    إضافة الشريك
                  </button>
                  <button type="button" className="btn secondary" onClick={() => setShowAddForm(false)}>
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          )}
          
          <div className="panel">
            <h2>قائمة الشركاء</h2>
            
            {error && <div className="error-message">{error}</div>}
            
            <div style={{ marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="البحث في الشركاء..."
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
                    <th>اسم الشريك</th>
                    <th>رقم الهاتف</th>
                    <th>ملاحظات</th>
                    <th>تاريخ الإضافة</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {partners.filter(partner => 
                    search === '' || 
                    partner.name.toLowerCase().includes(search.toLowerCase()) ||
                    (partner.phone && partner.phone.toLowerCase().includes(search.toLowerCase()))
                  ).map((partner) => (
                    <tr key={partner.id}>
                      <td>{partner.name}</td>
                      <td>{partner.phone || '-'}</td>
                      <td>{partner.notes || '-'}</td>
                      <td>{partner.createdAt ? formatDate(partner.createdAt) : '-'}</td>
                      <td>
                        <button
                          className="btn"
                          style={{ padding: '5px 10px', fontSize: '12px', marginRight: '5px' }}
                          onClick={() => router.push(`/partners/${partner.id}`)}
                        >
                          تفاصيل
                        </button>
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