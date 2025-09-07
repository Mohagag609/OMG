'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Unit } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatting'
import { NotificationSystem, useNotifications } from '@/components/NotificationSystem'

interface PartnerGroup {
  id: string
  name: string
  partners: Array<{
    partnerId: string
    percent: number
  }>
}

interface UnitPartner {
  id: string
  unitId: string
  partnerId: string
  percentage: number
  partner?: {
    id: string
    name: string
    phone?: string
  }
}

export default function Units() {
  const [units, setUnits] = useState<Unit[]>([])
  const [partnerGroups, setPartnerGroups] = useState<PartnerGroup[]>([])
  const [unitPartners, setUnitPartners] = useState<UnitPartner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newUnit, setNewUnit] = useState({
    name: '',
    floor: '',
    building: '',
    unitType: 'سكني',
    area: '',
    totalPrice: '',
    partnerGroupId: '',
    notes: ''
  })
  const router = useRouter()
  const { notifications, addNotification, removeNotification } = useNotifications()

  useEffect(() => {
    // Check if user is logged in
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
      
      // Fetch units
      const unitsResponse = await fetch('/api/units', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const unitsData = await unitsResponse.json()
      if (unitsData.success) {
        setUnits(unitsData.data)
      } else {
        setError(unitsData.error || 'خطأ في تحميل الوحدات')
      }

      // Fetch partner groups
      const groupsResponse = await fetch('/api/partner-groups', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const groupsData = await groupsResponse.json()
      if (groupsData.success) {
        setPartnerGroups(groupsData.data)
      }

      // Fetch unit partners
      const unitPartnersResponse = await fetch('/api/unit-partners', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const unitPartnersData = await unitPartnersResponse.json()
      if (unitPartnersData.success) {
        setUnitPartners(unitPartnersData.data)
      }

    } catch (err) {
      console.error('Error fetching data:', err)
      setError('خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  const handleAddUnit = async () => {
    if (!newUnit.name || !newUnit.floor || !newUnit.building || !newUnit.totalPrice || !newUnit.partnerGroupId) {
      addNotification({
        type: 'error',
        title: 'خطأ في البيانات',
        message: 'الرجاء ملء جميع الحقول المطلوبة'
      })
      return
    }

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/units', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newUnit,
          totalPrice: parseFloat(newUnit.totalPrice)
        })
      })

      const data = await response.json()
      if (data.success) {
        setUnits([...units, data.data])
        setNewUnit({
          name: '',
          floor: '',
          building: '',
          unitType: 'سكني',
          area: '',
          totalPrice: '',
          partnerGroupId: '',
          notes: ''
        })
        setShowAddForm(false)
        addNotification({
          type: 'success',
          title: 'تم الحفظ بنجاح',
          message: 'تم إضافة الوحدة بنجاح'
        })
      } else {
        addNotification({
          type: 'error',
          title: 'خطأ في الحفظ',
          message: data.error || 'فشل في إضافة الوحدة'
        })
      }
    } catch (err) {
      console.error('Error adding unit:', err)
      addNotification({
        type: 'error',
        title: 'خطأ في الحفظ',
        message: 'فشل في إضافة الوحدة'
      })
    }
  }

  const getUnitPartners = (unitId: string) => {
    return unitPartners.filter(up => up.unitId === unitId)
  }

  const getPartnerName = (partnerId: string) => {
    const unitPartner = unitPartners.find(up => up.partnerId === partnerId)
    return unitPartner?.partner?.name || 'شريك محذوف'
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
          <button className="btn primary" onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? 'إخفاء النموذج' : 'إضافة وحدة جديدة'}
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
          <button className="tab active">الوحدات</button>
          <button className="tab" onClick={() => router.push('/contracts')}>العقود</button>
          <button className="tab" onClick={() => router.push('/brokers')}>السماسرة</button>
          <button className="tab" onClick={() => router.push('/installments')}>الأقساط</button>
          <button className="tab" onClick={() => router.push('/vouchers')}>السندات</button>
          <button className="tab" onClick={() => router.push('/partners')}>الشركاء</button>
          <button className="tab" onClick={() => router.push('/partner-debts')}>ديون الشركاء</button>
          <button className="tab" onClick={() => router.push('/treasury')}>الخزينة</button>
          <button className="tab" onClick={() => router.push('/reports')}>التقارير</button>
          <button className="tab" onClick={() => router.push('/backup')}>نسخة احتياطية</button>
        </div>

        <div className="content">
          {/* Add Unit Form */}
          {showAddForm && (
            <div className="panel">
              <h2>إضافة وحدة جديدة</h2>
              <div className="grid-2" style={{ gap: '16px' }}>
                <div>
                  <label className="form-label">اسم الوحدة *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="مثال: شقة 101"
                    value={newUnit.name}
                    onChange={(e) => setNewUnit({...newUnit, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="form-label">رقم الطابق *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="مثال: الأول"
                    value={newUnit.floor}
                    onChange={(e) => setNewUnit({...newUnit, floor: e.target.value})}
                  />
                </div>
                <div>
                  <label className="form-label">المبنى/البرج *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="مثال: برج أ"
                    value={newUnit.building}
                    onChange={(e) => setNewUnit({...newUnit, building: e.target.value})}
                  />
                </div>
                <div>
                  <label className="form-label">نوع الوحدة</label>
                  <select
                    className="form-select"
                    value={newUnit.unitType}
                    onChange={(e) => setNewUnit({...newUnit, unitType: e.target.value})}
                  >
                    <option value="سكني">سكني</option>
                    <option value="تجاري">تجاري</option>
                    <option value="إداري">إداري</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">المساحة (م²)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="مثال: 120"
                    value={newUnit.area}
                    onChange={(e) => setNewUnit({...newUnit, area: e.target.value})}
                  />
                </div>
                <div>
                  <label className="form-label">السعر الإجمالي *</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="مثال: 500000"
                    value={newUnit.totalPrice}
                    onChange={(e) => setNewUnit({...newUnit, totalPrice: e.target.value})}
                  />
                </div>
                <div>
                  <label className="form-label">مجموعة الشركاء *</label>
                  <select
                    className="form-select"
                    value={newUnit.partnerGroupId}
                    onChange={(e) => setNewUnit({...newUnit, partnerGroupId: e.target.value})}
                  >
                    <option value="">اختر مجموعة شركاء...</option>
                    {partnerGroups.map(group => (
                      <option key={group.id} value={group.id}>
                        {group.name} ({group.partners.reduce((sum, p) => sum + p.percent, 0)}%)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">ملاحظات</label>
                  <textarea
                    className="form-textarea"
                    placeholder="ملاحظات اختيارية"
                    value={newUnit.notes}
                    onChange={(e) => setNewUnit({...newUnit, notes: e.target.value})}
                    rows={3}
                  />
                </div>
              </div>
              <div className="tools">
                <button className="btn" onClick={handleAddUnit}>
                  إضافة الوحدة
                </button>
                <button className="btn secondary" onClick={() => setShowAddForm(false)}>
                  إلغاء
                </button>
              </div>
            </div>
          )}

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
                    <th>الشركاء</th>
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
                  ).map((unit) => {
                    const partners = getUnitPartners(unit.id)
                    const partnersText = partners.length > 0 
                      ? partners.map(p => `${getPartnerName(p.partnerId)} (${p.percentage}%)`).join(', ')
                      : 'لا يوجد شركاء'
                    
                    return (
                      <tr key={unit.id}>
                        <td>{unit.code}</td>
                        <td>{unit.name || '-'}</td>
                        <td>{unit.unitType}</td>
                        <td>{unit.area || '-'}</td>
                        <td>{unit.floor || '-'}</td>
                        <td>{unit.building || '-'}</td>
                        <td style={{ fontSize: '12px', maxWidth: '200px' }}>
                          {partnersText}
                        </td>
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
                    )
                  })}
                </tbody>
              </table>
            </div>
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