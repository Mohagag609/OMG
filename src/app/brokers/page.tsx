'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Broker } from '@/types'
import { formatDate } from '@/utils/formatting'
import { NotificationSystem, useNotifications } from '@/components/NotificationSystem'
import { checkDuplicateName, checkDuplicatePhone } from '@/utils/duplicateCheck'

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

export default function Brokers() {
  const [brokers, setBrokers] = useState<Broker[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingBroker, setEditingBroker] = useState<Broker | null>(null)
  const [deletingBrokers, setDeletingBrokers] = useState<Set<string>>(new Set())
  const [newBroker, setNewBroker] = useState({
    name: '',
    phone: '',
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
            setEditingBroker(null)
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
    
    fetchBrokers()
  }, [router])

  const fetchBrokers = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/brokers', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      const data = await response.json()
      if (data.success) {
        setBrokers(data.data)
      } else {
        setError(data.error || 'خطأ في تحميل السماسرة')
      }
    } catch (err) {
      console.error('Error fetching brokers:', err)
      setError('خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  const handleAddBroker = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newBroker.name) {
      addNotification({
        type: 'error',
        title: 'خطأ في البيانات',
        message: 'الرجاء إدخال اسم السمسار'
      })
      return
    }

    // فحص تكرار الاسم
    if (checkDuplicateName(newBroker.name, brokers)) {
      addNotification({
        type: 'error',
        title: 'خطأ في البيانات',
        message: 'اسم السمسار موجود بالفعل'
      })
      return
    }

    // فحص تكرار رقم الهاتف (إذا تم إدخاله)
    if (newBroker.phone && checkDuplicatePhone(newBroker.phone, brokers)) {
      addNotification({
        type: 'error',
        title: 'خطأ في البيانات',
        message: 'رقم الهاتف موجود بالفعل'
      })
      return
    }

    // إغلاق النافذة فوراً وإظهار النجاح
    setShowAddModal(false)
    setSuccess('تم إضافة السمسار بنجاح!')
    setError(null)
    
    // إضافة السمسار للقائمة فوراً مع ID مؤقت
    const tempBroker = {
      ...newBroker,
      id: `temp-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setBrokers(prev => [tempBroker, ...prev])

    // إعادة تعيين النموذج
    setNewBroker({
      name: '',
      phone: '',
      notes: ''
    })

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/brokers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newBroker)
      })

      const data = await response.json()
      if (data.success) {
        // استبدال السمسار المؤقت بالسمسار الحقيقي
        setBrokers(prev => prev.map(broker => 
          broker.id === tempBroker.id ? data.data : broker
        ))
        addNotification({
          type: 'success',
          title: 'تم الحفظ بنجاح',
          message: 'تم إضافة السمسار بنجاح'
        })
      } else {
        // في حالة فشل الحفظ، نزيل السمسار المؤقت ونعيد النافذة
        setBrokers(prev => prev.filter(broker => broker.id !== tempBroker.id))
        setShowAddModal(true)
        setError(data.error || 'خطأ في إضافة السمسار')
        setSuccess(null)
        addNotification({
          type: 'error',
          title: 'خطأ في الحفظ',
          message: data.error || 'فشل في إضافة السمسار'
        })
      }
    } catch (err) {
      console.error('Add broker error:', err)
      // في حالة فشل الحفظ، نزيل السمسار المؤقت ونعيد النافذة
      setBrokers(prev => prev.filter(broker => broker.id !== tempBroker.id))
      setShowAddModal(true)
      setError('خطأ في إضافة السمسار')
      setSuccess(null)
      addNotification({
        type: 'error',
        title: 'خطأ في الحفظ',
        message: 'فشل في إضافة السمسار'
      })
    }
  }

  const handleEditBroker = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingBroker) return

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/brokers/${editingBroker.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newBroker)
      })

      const data = await response.json()
      if (data.success) {
        setShowAddModal(false)
        setEditingBroker(null)
        setSuccess('تم تحديث السمسار بنجاح!')
        setError(null)
        setNewBroker({
          name: '',
          phone: '',
          notes: ''
        })
        fetchBrokers()
        addNotification({
          type: 'success',
          title: 'تم التحديث بنجاح',
          message: 'تم تحديث السمسار بنجاح'
        })
      } else {
        setError(data.error || 'خطأ في تحديث السمسار')
        setSuccess(null)
        addNotification({
          type: 'error',
          title: 'خطأ في التحديث',
          message: data.error || 'فشل في تحديث السمسار'
        })
      }
    } catch (err) {
      console.error('Update broker error:', err)
      setError('خطأ في تحديث السمسار')
      setSuccess(null)
      addNotification({
        type: 'error',
        title: 'خطأ في التحديث',
        message: 'فشل في تحديث السمسار'
      })
    }
  }

  const handleDeleteBroker = async (brokerId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا السمسار؟')) return

    // إضافة السمسار لقائمة الحذف وإظهار الحركة فوراً
    setDeletingBrokers(prev => {
      const newSet = new Set(prev)
      newSet.add(brokerId)
      return newSet
    })
    
    // إزالة السمسار من القائمة فوراً مع الحركة
    setBrokers(prev => prev.filter(broker => broker.id !== brokerId))

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/brokers/${brokerId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()
      if (data.success) {
        setSuccess('تم حذف السمسار بنجاح!')
        setError(null)
        addNotification({
          type: 'success',
          title: 'تم الحذف بنجاح',
          message: 'تم حذف السمسار بنجاح'
        })
      } else {
        // في حالة فشل الحذف، نعيد السمسار للقائمة
        fetchBrokers()
        setError(data.error || 'خطأ في حذف السمسار')
        setSuccess(null)
        addNotification({
          type: 'error',
          title: 'خطأ في الحذف',
          message: data.error || 'فشل في حذف السمسار'
        })
      }
    } catch (err) {
      console.error('Delete broker error:', err)
      // في حالة فشل الحذف، نعيد السمسار للقائمة
      fetchBrokers()
      setError('خطأ في حذف السمسار')
      setSuccess(null)
      addNotification({
        type: 'error',
        title: 'خطأ في الحذف',
        message: 'فشل في حذف السمسار'
      })
    } finally {
      // إزالة السمسار من قائمة الحذف
      setDeletingBrokers(prev => {
        const newSet = new Set(prev)
        newSet.delete(brokerId)
        return newSet
      })
    }
  }

  const openEditModal = (broker: Broker) => {
    setEditingBroker(broker)
    setNewBroker({
      name: broker.name,
      phone: broker.phone || '',
      notes: broker.notes || ''
    })
    setShowAddModal(true)
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
                <span className="text-white text-xl">🤝</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">إدارة السماسرة</h1>
                <p className="text-gray-600">نظام متطور لإدارة السماسرة</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 space-x-reverse">
              <ModernButton onClick={() => setShowAddModal(true)}>
                <span className="mr-2">➕</span>
                إضافة سمسار جديد
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
                  placeholder="🔍 ابحث في السماسرة... (Ctrl+F)"
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
              {brokers.length} سمسار
            </div>
          </div>
        </ModernCard>

        {/* Brokers List */}
        <ModernCard>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">قائمة السماسرة</h2>
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
                  <th className="text-right py-4 px-6 font-bold text-gray-900 text-sm uppercase tracking-wide">الاسم</th>
                  <th className="text-right py-4 px-6 font-bold text-gray-900 text-sm uppercase tracking-wide">رقم الهاتف</th>
                  <th className="text-right py-4 px-6 font-bold text-gray-900 text-sm uppercase tracking-wide">الملاحظات</th>
                  <th className="text-right py-4 px-6 font-bold text-gray-900 text-sm uppercase tracking-wide">تاريخ الإضافة</th>
                  <th className="text-right py-4 px-6 font-bold text-gray-900 text-sm uppercase tracking-wide">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {brokers.filter(broker => 
                  search === '' || 
                  broker.name.toLowerCase().includes(search.toLowerCase()) ||
                  (broker.phone && broker.phone.toLowerCase().includes(search.toLowerCase()))
                ).map((broker) => (
                  <tr 
                    key={broker.id} 
                    className={`
                      border-b border-gray-100 hover:bg-gray-50/50 transition-all duration-300
                      ${deletingBrokers.has(broker.id) 
                        ? 'transform translate-x-full opacity-0 scale-95' 
                        : 'transform translate-x-0 opacity-100 scale-100'
                      }
                    `}
                  >
                    <td className="py-4 px-6">
                      <div className="text-gray-900 font-bold text-base">{broker.name}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-gray-800 font-semibold">{broker.phone || '-'}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-gray-800 font-semibold max-w-xs truncate">{broker.notes || '-'}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-gray-800 font-semibold">{formatDate(broker.createdAt || new Date())}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <ModernButton size="sm" variant="secondary" onClick={() => openEditModal(broker)}>
                          ✏️ تعديل
                        </ModernButton>
                        <ModernButton size="sm" variant="danger" onClick={() => handleDeleteBroker(broker.id)}>
                          🗑️ حذف
                        </ModernButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ModernCard>
      </div>

      {/* Add/Edit Broker Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-4 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingBroker ? 'تعديل السمسار' : 'إضافة سمسار جديد'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingBroker(null)
                    setNewBroker({
                      name: '',
                      phone: '',
                      notes: ''
                    })
                  }}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors duration-200"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={editingBroker ? handleEditBroker : handleAddBroker} className="p-6">
              <div className="space-y-6">
                <ModernInput
                  label="اسم السمسار *"
                  type="text"
                  value={newBroker.name}
                  onChange={(e: any) => setNewBroker({...newBroker, name: e.target.value})}
                  placeholder="اسم السمسار"
                />
                
                <ModernInput
                  label="رقم الهاتف"
                  type="tel"
                  value={newBroker.phone}
                  onChange={(e: any) => setNewBroker({...newBroker, phone: e.target.value})}
                  placeholder="رقم الهاتف"
                />
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">ملاحظات</label>
                  <textarea
                    value={newBroker.notes}
                    onChange={(e: any) => setNewBroker({...newBroker, notes: e.target.value})}
                    placeholder="ملاحظات إضافية"
                    rows={4}
                    className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 space-x-reverse mt-8 pt-6 border-t border-gray-200">
                <ModernButton variant="secondary" onClick={() => {
                  setShowAddModal(false)
                  setEditingBroker(null)
                  setNewBroker({
                    name: '',
                    phone: '',
                    notes: ''
                  })
                }}>
                  إلغاء
                </ModernButton>
                <ModernButton type="submit">
                  <span className="mr-2">💾</span>
                  {editingBroker ? 'تحديث السمسار' : 'إضافة السمسار'}
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