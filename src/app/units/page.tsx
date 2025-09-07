'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Unit, UnitPartner } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatting'
import { NotificationSystem, useNotifications } from '@/components/NotificationSystem'
import { checkDuplicateCode } from '@/utils/duplicateCheck'

// Modern UI Components
const ModernCard = ({ children, className = '', ...props }: any) => (
  <div className={`bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-xl shadow-gray-900/5 p-6 ${className}`} {...props}>
    {children}
  </div>
)

const ModernButton = ({ children, variant = 'primary', size = 'md', className = '', ...props }: any) => {
  const variants: { [key: string]: string } = {
    primary: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/25',
    secondary: 'bg-white/80 hover:bg-white border border-gray-200 text-gray-700 shadow-lg shadow-gray-900/5',
    success: 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg shadow-green-500/25',
    danger: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-500/25',
    warning: 'bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white shadow-lg shadow-yellow-500/25',
    info: 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg shadow-purple-500/25'
  }
  
  const sizes: { [key: string]: string } = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm font-medium',
    lg: 'px-6 py-3 text-base font-medium'
  }
  
  return (
    <button 
      className={`${variants[variant]} ${sizes[size]} rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

const ModernInput = ({ label, className = '', ...props }: any) => (
  <div className="space-y-2">
    {label && <label className="text-sm font-bold text-gray-900">{label}</label>}
    <input 
      className={`w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 font-bold placeholder:text-gray-500 placeholder:font-normal ${className}`}
      {...props}
    />
  </div>
)

const ModernSelect = ({ label, children, className = '', ...props }: any) => (
  <div className="space-y-2">
    {label && <label className="text-sm font-bold text-gray-900">{label}</label>}
    <select 
      className={`w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 font-bold ${className}`}
      {...props}
    >
      {children}
    </select>
  </div>
)

export default function Units() {
  const [units, setUnits] = useState<Unit[]>([])
  const [unitPartners, setUnitPartners] = useState<UnitPartner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  const [deletingUnits, setDeletingUnits] = useState<Set<string>>(new Set())
  const [newUnit, setNewUnit] = useState({
    code: '',
    name: '',
    unitType: '',
    area: '',
    floor: '',
    building: '',
    totalPrice: '',
    status: 'متاحة',
    notes: ''
  })
  
  const router = useRouter()
  const { notifications, addNotification, removeNotification } = useNotifications()

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'n':
            e.preventDefault()
            setShowAddModal(true)
            break
          case 'f':
            e.preventDefault()
            document.getElementById('search-input')?.focus()
            break
          case 'Escape':
            e.preventDefault()
            setShowAddModal(false)
            setEditingUnit(null)
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [])

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
      
      const [unitsResponse, unitPartnersResponse] = await Promise.all([
        fetch('/api/units', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/unit-partners', { headers: { 'Authorization': `Bearer ${token}` } })
      ])
      
      const [unitsData, unitPartnersData] = await Promise.all([
        unitsResponse.json(),
        unitPartnersResponse.json()
      ])
      
      if (unitsData.success) {
        setUnits(unitsData.data)
      } else {
        setError(unitsData.error || 'خطأ في تحميل الوحدات')
      }

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

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newUnit.code) {
      addNotification({
        type: 'error',
        title: 'خطأ في البيانات',
        message: 'الرجاء إدخال كود الوحدة'
      })
      return
    }

    // فحص تكرار كود الوحدة
    if (checkDuplicateCode(newUnit.code, units)) {
      addNotification({
        type: 'error',
        title: 'خطأ في البيانات',
        message: 'كود الوحدة موجود بالفعل'
      })
      return
    }

    // إغلاق النافذة فوراً وإظهار النجاح
    setShowAddModal(false)
    setSuccess('تم إضافة الوحدة بنجاح!')
    setError(null)
    
    // إضافة الوحدة للقائمة فوراً مع ID مؤقت
    const tempUnit = {
      ...newUnit,
      id: `temp-${Date.now()}`,
      totalPrice: parseFloat(newUnit.totalPrice),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setUnits(prev => [tempUnit, ...prev])

    // إعادة تعيين النموذج
    setNewUnit({
      code: '',
      name: '',
      unitType: '',
      area: '',
      floor: '',
      building: '',
      totalPrice: '',
      status: 'متاحة',
      notes: ''
    })

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
        // استبدال الوحدة المؤقتة بالوحدة الحقيقية
        setUnits(prev => prev.map(unit => 
          unit.id === tempUnit.id ? data.data : unit
        ))
        addNotification({
          type: 'success',
          title: 'تم الحفظ بنجاح',
          message: 'تم إضافة الوحدة بنجاح'
        })
      } else {
        // في حالة فشل الحفظ، نزيل الوحدة المؤقتة ونعيد النافذة
        setUnits(prev => prev.filter(unit => unit.id !== tempUnit.id))
        setShowAddModal(true)
        setError(data.error || 'خطأ في إضافة الوحدة')
        setSuccess(null)
        addNotification({
          type: 'error',
          title: 'خطأ في الحفظ',
          message: data.error || 'فشل في إضافة الوحدة'
        })
      }
    } catch (err) {
      console.error('Add unit error:', err)
      // في حالة فشل الحفظ، نزيل الوحدة المؤقتة ونعيد النافذة
      setUnits(prev => prev.filter(unit => unit.id !== tempUnit.id))
      setShowAddModal(true)
      setError('خطأ في إضافة الوحدة')
      setSuccess(null)
      addNotification({
        type: 'error',
        title: 'خطأ في الحفظ',
        message: 'فشل في إضافة الوحدة'
      })
    }
  }

  const handleEditUnit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingUnit) return

    // إغلاق النافذة فوراً وإظهار النجاح
    setShowAddModal(false)
    setEditingUnit(null)
    setSuccess('تم تحديث الوحدة بنجاح!')
    setError(null)

    // تحديث الوحدة في القائمة فوراً
    const updatedUnit = {
      ...editingUnit,
      ...newUnit,
      totalPrice: parseFloat(newUnit.totalPrice),
      updatedAt: new Date().toISOString()
    }
    setUnits(prev => prev.map(unit => 
      unit.id === editingUnit.id ? updatedUnit : unit
    ))

    // إعادة تعيين النموذج
    setNewUnit({
      code: '',
      name: '',
      unitType: '',
      area: '',
      floor: '',
      building: '',
      totalPrice: '',
      status: 'متاحة',
      notes: ''
    })

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/units/${editingUnit.id}`, {
        method: 'PUT',
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
        // استبدال الوحدة المحدثة بالبيانات الحقيقية من الخادم
        setUnits(prev => prev.map(unit => 
          unit.id === editingUnit.id ? data.data : unit
        ))
        addNotification({
          type: 'success',
          title: 'تم التحديث بنجاح',
          message: 'تم تحديث الوحدة بنجاح'
        })
      } else {
        // في حالة فشل التحديث، نعيد البيانات الأصلية
        fetchData()
        setError(data.error || 'خطأ في تحديث الوحدة')
        setSuccess(null)
        addNotification({
          type: 'error',
          title: 'خطأ في التحديث',
          message: data.error || 'فشل في تحديث الوحدة'
        })
      }
    } catch (err) {
      console.error('Update unit error:', err)
      // في حالة فشل التحديث، نعيد البيانات الأصلية
      fetchData()
      setError('خطأ في تحديث الوحدة')
      setSuccess(null)
      addNotification({
        type: 'error',
        title: 'خطأ في التحديث',
        message: 'فشل في تحديث الوحدة'
      })
    }
  }

  const handleDeleteUnit = async (unitId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الوحدة؟')) return

    // إضافة الوحدة لقائمة الحذف وإظهار الحركة فوراً
    setDeletingUnits(prev => {
      const newSet = new Set(prev)
      newSet.add(unitId)
      return newSet
    })
    
    // إزالة الوحدة من القائمة فوراً مع الحركة
    setUnits(prev => prev.filter(unit => unit.id !== unitId))

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/units/${unitId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()
      if (data.success) {
        setSuccess('تم حذف الوحدة بنجاح!')
        setError(null)
        addNotification({
          type: 'success',
          title: 'تم الحذف بنجاح',
          message: 'تم حذف الوحدة بنجاح'
        })
      } else {
        // في حالة فشل الحذف، نعيد الوحدة للقائمة
        fetchData()
        setError(data.error || 'خطأ في حذف الوحدة')
        setSuccess(null)
        addNotification({
          type: 'error',
          title: 'خطأ في الحذف',
          message: data.error || 'فشل في حذف الوحدة'
        })
      }
    } catch (err) {
      console.error('Delete unit error:', err)
      // في حالة فشل الحذف، نعيد الوحدة للقائمة
      fetchData()
      setError('خطأ في حذف الوحدة')
      setSuccess(null)
      addNotification({
        type: 'error',
        title: 'خطأ في الحذف',
        message: 'فشل في حذف الوحدة'
      })
    } finally {
      // إزالة الوحدة من قائمة الحذف
      setDeletingUnits(prev => {
        const newSet = new Set(prev)
        newSet.delete(unitId)
        return newSet
      })
    }
  }

  const openEditModal = (unit: Unit) => {
    setEditingUnit(unit)
    setNewUnit({
      code: unit.code,
      name: unit.name || '',
      unitType: unit.unitType,
      area: unit.area || '',
      floor: unit.floor || '',
      building: unit.building || '',
      totalPrice: unit.totalPrice.toString(),
      status: unit.status,
      notes: unit.notes || ''
    })
    setShowAddModal(true)
  }

  const getUnitPartners = (unitId: string) => {
    return unitPartners.filter(up => up.unitId === unitId)
  }

  const getPartnerName = (partnerId: string) => {
    // This would need to be implemented with actual partner data
    return `شريك ${partnerId.slice(-4)}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">جاري التحميل...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">🏠</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">إدارة الوحدات</h1>
                <p className="text-gray-600">نظام متطور لإدارة الوحدات العقارية</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 space-x-reverse">
              <ModernButton onClick={() => setShowAddModal(true)}>
                <span className="mr-2">➕</span>
                إضافة وحدة جديدة
                <span className="mr-2 text-xs opacity-70">Ctrl+N</span>
              </ModernButton>
              <ModernButton variant="secondary" onClick={() => router.push('/')}>
                العودة للرئيسية
              </ModernButton>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Filters */}
        <ModernCard className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="relative">
                <input
                  id="search-input"
                  type="text"
                  placeholder="🔍 ابحث في الوحدات... (Ctrl+F)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-80 px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 font-bold placeholder:text-gray-500 placeholder:font-normal"
                />
              </div>
              <ModernButton variant="secondary" size="sm">
                📊 تصدير CSV
              </ModernButton>
              <ModernButton variant="secondary" size="sm">
                🖨️ طباعة PDF
              </ModernButton>
            </div>
            <div className="text-sm text-gray-500">
              {units.length} وحدة
            </div>
          </div>
        </ModernCard>

        {/* Units List */}
        <ModernCard>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">قائمة الوحدات</h2>
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="text-sm text-gray-500">آخر تحديث:</span>
              <span className="text-sm font-medium text-gray-700">{new Date().toLocaleString('ar-SA')}</span>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center">
                <span className="text-red-500 mr-2">⚠️</span>
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✅</span>
                <span className="text-green-700">{success}</span>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-right py-4 px-6 font-bold text-gray-900 text-sm uppercase tracking-wide">كود الوحدة</th>
                  <th className="text-right py-4 px-6 font-bold text-gray-900 text-sm uppercase tracking-wide">الاسم</th>
                  <th className="text-right py-4 px-6 font-bold text-gray-900 text-sm uppercase tracking-wide">النوع</th>
                  <th className="text-right py-4 px-6 font-bold text-gray-900 text-sm uppercase tracking-wide">المساحة</th>
                  <th className="text-right py-4 px-6 font-bold text-gray-900 text-sm uppercase tracking-wide">الطابق</th>
                  <th className="text-right py-4 px-6 font-bold text-gray-900 text-sm uppercase tracking-wide">المبنى</th>
                  <th className="text-right py-4 px-6 font-bold text-gray-900 text-sm uppercase tracking-wide">السعر</th>
                  <th className="text-right py-4 px-6 font-bold text-gray-900 text-sm uppercase tracking-wide">الحالة</th>
                  <th className="text-right py-4 px-6 font-bold text-gray-900 text-sm uppercase tracking-wide">الشركاء</th>
                  <th className="text-right py-4 px-6 font-bold text-gray-900 text-sm uppercase tracking-wide">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {units.filter(unit => 
                  search === '' || 
                  unit.code.toLowerCase().includes(search.toLowerCase()) ||
                  (unit.name && unit.name.toLowerCase().includes(search.toLowerCase())) ||
                  unit.unitType.toLowerCase().includes(search.toLowerCase())
                ).map((unit) => {
                  const partners = getUnitPartners(unit.id)
                  return (
                    <tr 
                      key={unit.id} 
                      className={`
                        border-b border-gray-100 hover:bg-gray-50/50 transition-all duration-300
                        ${deletingUnits.has(unit.id) 
                          ? 'transform translate-x-full opacity-0 scale-95' 
                          : 'transform translate-x-0 opacity-100 scale-100'
                        }
                      `}
                    >
                      <td className="py-4 px-6">
                        <div className="text-gray-900 font-bold text-base">{unit.code}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-gray-800 font-semibold">{unit.name || '-'}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-gray-800 font-semibold">{unit.unitType}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-gray-800 font-semibold">{unit.area || '-'}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-gray-800 font-semibold">{unit.floor || '-'}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-gray-800 font-semibold">{unit.building || '-'}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-green-800">{formatCurrency(unit.totalPrice)}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          unit.status === 'متاحة' 
                            ? 'bg-green-100 text-green-800' 
                            : unit.status === 'محجوزة'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {unit.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-600">
                          {partners.length > 0 ? (
                            <div>
                              {partners.map((partner, index) => (
                                <div key={index}>
                                  {getPartnerName(partner.partnerId)} ({partner.percentage}%)
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">لا يوجد شركاء</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <ModernButton size="sm" variant="secondary" onClick={() => openEditModal(unit)}>
                            ✏️ تعديل
                          </ModernButton>
                          <ModernButton size="sm" variant="danger" onClick={() => handleDeleteUnit(unit.id)}>
                            🗑️ حذف
                          </ModernButton>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </ModernCard>
      </div>

      {/* Add/Edit Unit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-4 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingUnit ? 'تعديل الوحدة' : 'إضافة وحدة جديدة'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingUnit(null)
                    setNewUnit({
                      code: '',
                      name: '',
                      unitType: '',
                      area: '',
                      floor: '',
                      building: '',
                      totalPrice: '',
                      status: 'متاحة',
                      notes: ''
                    })
                  }}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors duration-200"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={editingUnit ? handleEditUnit : handleAddUnit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ModernInput
                  label="كود الوحدة *"
                  type="text"
                  value={newUnit.code}
                  onChange={(e: any) => setNewUnit({...newUnit, code: e.target.value})}
                  placeholder="كود الوحدة"
                  required
                />
                
                <ModernInput
                  label="اسم الوحدة"
                  type="text"
                  value={newUnit.name}
                  onChange={(e: any) => setNewUnit({...newUnit, name: e.target.value})}
                  placeholder="اسم الوحدة"
                />
                
                <ModernSelect
                  label="نوع الوحدة *"
                  value={newUnit.unitType}
                  onChange={(e: any) => setNewUnit({...newUnit, unitType: e.target.value})}
                  required
                >
                  <option value="">اختر نوع الوحدة...</option>
                  <option value="شقة">شقة</option>
                  <option value="فيلا">فيلا</option>
                  <option value="محل">محل</option>
                  <option value="مكتب">مكتب</option>
                  <option value="مستودع">مستودع</option>
                </ModernSelect>
                
                <ModernInput
                  label="المساحة"
                  type="text"
                  value={newUnit.area}
                  onChange={(e: any) => setNewUnit({...newUnit, area: e.target.value})}
                  placeholder="المساحة بالمتر المربع"
                />
                
                <ModernInput
                  label="الطابق"
                  type="text"
                  value={newUnit.floor}
                  onChange={(e: any) => setNewUnit({...newUnit, floor: e.target.value})}
                  placeholder="رقم الطابق"
                />
                
                <ModernInput
                  label="المبنى"
                  type="text"
                  value={newUnit.building}
                  onChange={(e: any) => setNewUnit({...newUnit, building: e.target.value})}
                  placeholder="اسم المبنى"
                />
                
                <ModernInput
                  label="السعر الإجمالي *"
                  type="number"
                  value={newUnit.totalPrice}
                  onChange={(e: any) => setNewUnit({...newUnit, totalPrice: e.target.value})}
                  placeholder="السعر الإجمالي"
                  required
                />
                
                <ModernSelect
                  label="الحالة"
                  value={newUnit.status}
                  onChange={(e: any) => setNewUnit({...newUnit, status: e.target.value})}
                >
                  <option value="متاحة">متاحة</option>
                  <option value="محجوزة">محجوزة</option>
                  <option value="مباعة">مباعة</option>
                </ModernSelect>
                
                <div className="md:col-span-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">ملاحظات</label>
                    <textarea
                      value={newUnit.notes}
                      onChange={(e: any) => setNewUnit({...newUnit, notes: e.target.value})}
                      placeholder="ملاحظات إضافية"
                      rows={3}
                      className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 space-x-reverse mt-8 pt-6 border-t border-gray-200">
                <ModernButton variant="secondary" onClick={() => {
                  setShowAddModal(false)
                  setEditingUnit(null)
                  setNewUnit({
                    code: '',
                    name: '',
                    unitType: '',
                    area: '',
                    floor: '',
                    building: '',
                    totalPrice: '',
                    status: 'متاحة',
                    notes: ''
                  })
                }}>
                  إلغاء
                </ModernButton>
                <ModernButton type="submit">
                  <span className="mr-2">💾</span>
                  {editingUnit ? 'تحديث الوحدة' : 'إضافة الوحدة'}
                </ModernButton>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <NotificationSystem 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </div>
  )
}