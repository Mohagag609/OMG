'use client'

import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { useRouter } from 'next/navigation'
import { Partner } from '@/types'
import { formatDate } from '@/utils/formatting'
import { checkDuplicateName, checkDuplicatePhone } from '@/utils/duplicateCheck'
import { NotificationSystem, useNotifications } from '@/components/NotificationSystem'
import SidebarToggle from '@/components/SidebarToggle'
import Sidebar from '@/components/Sidebar'
import NavigationButtons from '@/components/NavigationButtons'

// FIXED: Proper TypeScript interfaces for components
interface ModernCardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

interface ModernButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

interface ModernInputProps {
  label?: string
  className?: string
  type?: string
  value?: string | number
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  required?: boolean
  readOnly?: boolean
  min?: string | number
  max?: string | number
  step?: string | number
}

interface ModernTextareaProps {
  label?: string
  className?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  placeholder?: string
  rows?: number
}

// FIXED: Memoized components to prevent unnecessary re-renders
const ModernCard = memo<ModernCardProps>(({ children, className = '', ...props }) => (
  <div className={`bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-xl shadow-gray-900/5 p-6 ${className}`} {...props}>
    {children}
  </div>
))
ModernCard.displayName = 'ModernCard'

const ModernButton = memo<ModernButtonProps>(({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
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
})
ModernButton.displayName = 'ModernButton'

const ModernInput = memo<ModernInputProps>(({ label, className = '', ...props }) => (
  <div className="space-y-2">
    {label && <label className="text-sm font-bold text-gray-900">{label}</label>}
    <input 
      className={`w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 font-bold placeholder:text-gray-500 placeholder:font-normal ${className}`}
      {...props}
    />
  </div>
))
ModernInput.displayName = 'ModernInput'

const ModernTextarea = memo<ModernTextareaProps>(({ label, className = '', ...props }) => (
  <div className="space-y-2">
    {label && <label className="text-sm font-bold text-gray-900">{label}</label>}
    <textarea 
      className={`w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 font-bold placeholder:text-gray-500 placeholder:font-normal resize-none ${className}`}
      {...props}
    />
  </div>
))
ModernTextarea.displayName = 'ModernTextarea'

export default function Partners() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [deletingPartners, setDeletingPartners] = useState<Set<string>>(new Set())
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [newPartner, setNewPartner] = useState({
    name: '',
    phone: '',
    notes: ''
  })
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  
  const router = useRouter()
  const { notifications, addNotification, removeNotification } = useNotifications()

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle shortcuts when not in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return
      }

      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'b':
            e.preventDefault()
            setSidebarOpen(!sidebarOpen)
            break
          case 'f':
            e.preventDefault()
            document.getElementById('search-input')?.focus()
            break
          case 'Escape':
            e.preventDefault()
            setSearch('')
            setShowAddForm(false)
            setShowEditForm(false)
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [sidebarOpen])

  // FIXED: Memoized fetchPartners function to prevent unnecessary re-renders
  const fetchPartners = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        router.push('/login')
        return
      }
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
        setError(null)
      } else {
        setError(data.error || 'خطأ في تحميل الشركاء')
        addNotification({
          type: 'error',
          title: 'خطأ في التحميل',
          message: data.error || 'فشل في تحميل الشركاء'
        })
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
      }
      setError('خطأ في الاتصال')
      addNotification({
        type: 'error',
        title: 'خطأ في الاتصال',
        message: 'فشل في الاتصال بالخادم'
      })
    } finally {
      setLoading(false)
    }
  }, [router, addNotification]) // FIXED: Added proper dependencies

  useEffect(() => {
    const token = localStorage.getItem('authToken')
      if (!token) {
        router.push('/login')
        return
      }
    if (!token) {
      router.push('/login')
      return
    }
    
    fetchPartners()
  }, [fetchPartners, router]) // FIXED: Added proper dependencies

  const handleAddPartner = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newPartner.name.trim()) {
      setError('الرجاء إدخال اسم الشريك')
      addNotification({
        type: 'error',
        title: 'خطأ في البيانات',
        message: 'الرجاء إدخال اسم الشريك'
      })
      return
    }

    // فحص تكرار الاسم
    if (checkDuplicateName(newPartner.name, partners)) {
      setError('اسم الشريك موجود بالفعل')
      addNotification({
        type: 'error',
        title: 'خطأ في البيانات',
        message: 'اسم الشريك موجود بالفعل'
      })
      return
    }

    // فحص تكرار رقم الهاتف (إذا تم إدخاله)
    if (newPartner.phone && checkDuplicatePhone(newPartner.phone, partners)) {
      setError('رقم الهاتف موجود بالفعل')
      addNotification({
        type: 'error',
        title: 'خطأ في البيانات',
        message: 'رقم الهاتف موجود بالفعل'
      })
      return
    }

    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        router.push('/login')
        return
      }
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
        addNotification({
          type: 'success',
          title: 'تم الإضافة بنجاح',
          message: 'تم إضافة الشريك بنجاح'
        })
      } else {
        setError(data.error || 'خطأ في إضافة الشريك')
        setSuccess(null)
        addNotification({
          type: 'error',
          title: 'خطأ في الإضافة',
          message: data.error || 'فشل في إضافة الشريك'
        })
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
      }
      setError('خطأ في إضافة الشريك')
      setSuccess(null)
      addNotification({
        type: 'error',
        title: 'خطأ في الإضافة',
        message: 'فشل في إضافة الشريك'
      })
    }
  }

  const handleEditPartner = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingPartner || !editingPartner.name.trim()) {
      setError('الرجاء إدخال اسم الشريك')
      return
    }

    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        router.push('/login')
        return
      }
      const response = await fetch(`/api/partners?id=${editingPartner.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editingPartner.name,
          phone: editingPartner.phone,
          notes: editingPartner.notes
        })
      })

      if (!response.ok) {
        throw new Error('فشل في تحديث الشريك')
      }

      const data = await response.json()
      if (data.success) {
        setShowEditForm(false)
        setEditingPartner(null)
        setSuccess('تم تحديث الشريك بنجاح!')
        setError(null)
        fetchPartners()
        addNotification({
          type: 'success',
          title: 'تم التحديث بنجاح',
          message: 'تم تحديث الشريك بنجاح'
        })
      } else {
        setError(data.error || 'خطأ في تحديث الشريك')
        setSuccess(null)
        addNotification({
          type: 'error',
          title: 'خطأ في التحديث',
          message: data.error || 'فشل في تحديث الشريك'
        })
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
      }
      setError('خطأ في تحديث الشريك')
      setSuccess(null)
      addNotification({
        type: 'error',
        title: 'خطأ في التحديث',
        message: 'فشل في تحديث الشريك'
      })
    }
  }

  const handleDeletePartner = async (partnerId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الشريك؟')) return

    try {
      setDeletingPartners(prev => new Set(prev).add(partnerId))
      const token = localStorage.getItem('authToken')
      if (!token) {
        router.push('/login')
        return
      }
      const response = await fetch(`/api/partners?id=${partnerId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()
      if (data.success) {
        setSuccess('تم حذف الشريك بنجاح!')
        setError(null)
        fetchPartners()
        addNotification({
          type: 'success',
          title: 'تم الحذف بنجاح',
          message: 'تم حذف الشريك بنجاح'
        })
      } else {
        setError(data.error || 'خطأ في حذف الشريك')
        setSuccess(null)
        addNotification({
          type: 'error',
          title: 'خطأ في الحذف',
          message: data.error || 'فشل في حذف الشريك'
        })
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
      }
      setError('خطأ في حذف الشريك')
      setSuccess(null)
      addNotification({
        type: 'error',
        title: 'خطأ في الحذف',
        message: 'فشل في حذف الشريك'
      })
    } finally {
      setDeletingPartners(prev => {
        const newSet = new Set(prev)
        newSet.delete(partnerId)
        return newSet
      })
    }
  }

  const startEdit = (partner: Partner) => {
    setEditingPartner({ ...partner })
    setShowEditForm(true)
    setShowAddForm(false)
  }

  // FIXED: Memoized filtered partners to prevent unnecessary recalculations
  const filteredPartners = useMemo(() => {
    return partners.filter(partner => 
      search === '' || 
      partner.name.toLowerCase().includes(search.toLowerCase()) ||
      (partner.phone && partner.phone.toLowerCase().includes(search.toLowerCase())) ||
      (partner.notes && partner.notes.toLowerCase().includes(search.toLowerCase()))
    )
  }, [partners, search])

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
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:mr-72' : ''}`}>
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 space-x-reverse">
                <SidebarToggle onToggle={() => setSidebarOpen(!sidebarOpen)} />
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">👥</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">إدارة الشركاء</h1>
                  <p className="text-gray-600">نظام متطور لإدارة الشركاء والمستثمرين</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 space-x-reverse">
                <ModernButton variant="secondary" onClick={() => router.push('/partner-debts')}>
                  💰 ديون الشركاء
                </ModernButton>
                <ModernButton variant="secondary" onClick={() => router.push('/partner-groups')}>
                  👥 مجموعات الشركاء
                </ModernButton>
                <NavigationButtons />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Add Partner Form */}
        {showAddForm && (
          <ModernCard className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">إضافة شريك جديد</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors duration-200"
              >
                ✕
              </button>
            </div>

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center">
                  <span className="text-green-500 mr-2">✅</span>
                  <span className="text-green-700">{success}</span>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center">
                  <span className="text-red-500 mr-2">⚠️</span>
                  <span className="text-red-700">{error}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleAddPartner} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ModernInput
                  label="اسم الشريك *"
                  type="text"
                  value={newPartner.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPartner({...newPartner, name: e.target.value})}
                  placeholder="أدخل اسم الشريك"
                  required
                />
                
                <ModernInput
                  label="رقم الهاتف"
                  type="tel"
                  value={newPartner.phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPartner({...newPartner, phone: e.target.value})}
                  placeholder="أدخل رقم الهاتف"
                />
              </div>
              
              <ModernTextarea
                label="ملاحظات"
                value={newPartner.notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewPartner({...newPartner, notes: e.target.value})}
                placeholder="أدخل أي ملاحظات إضافية"
                rows={3}
              />
              
              <div className="flex items-center justify-end space-x-3 space-x-reverse pt-6 border-t border-gray-200">
                <ModernButton variant="secondary" onClick={() => setShowAddForm(false)}>
                  إلغاء
                </ModernButton>
                <ModernButton type="submit">
                  <span className="mr-2">➕</span>
                  إضافة الشريك
                </ModernButton>
              </div>
            </form>
          </ModernCard>
        )}

        {/* Edit Partner Form */}
        {showEditForm && editingPartner && (
          <ModernCard className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">تعديل الشريك</h2>
              <button
                onClick={() => setShowEditForm(false)}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors duration-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditPartner} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ModernInput
                  label="اسم الشريك *"
                  type="text"
                  value={editingPartner.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingPartner({...editingPartner, name: e.target.value})}
                  placeholder="أدخل اسم الشريك"
                  required
                />
                
                <ModernInput
                  label="رقم الهاتف"
                  type="tel"
                  value={editingPartner.phone || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingPartner({...editingPartner, phone: e.target.value})}
                  placeholder="أدخل رقم الهاتف"
                />
              </div>
              
              <ModernTextarea
                label="ملاحظات"
                value={editingPartner.notes || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditingPartner({...editingPartner, notes: e.target.value})}
                placeholder="أدخل أي ملاحظات إضافية"
                rows={3}
              />
              
              <div className="flex items-center justify-end space-x-3 space-x-reverse pt-6 border-t border-gray-200">
                <ModernButton variant="secondary" onClick={() => setShowEditForm(false)}>
                  إلغاء
                </ModernButton>
                <ModernButton type="submit">
                  <span className="mr-2">💾</span>
                  حفظ التغييرات
                </ModernButton>
              </div>
            </form>
          </ModernCard>
        )}

        {/* Search and Actions */}
        <ModernCard className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="relative">
                <input
                  id="search-input"
                  type="text"
                  placeholder="🔍 ابحث في الشركاء... (Ctrl+F)"
                  value={search}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                  className="w-80 px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                />
              </div>
            </div>
            <div className="flex items-center space-x-3 space-x-reverse">
              <ModernButton onClick={() => setShowAddForm(true)}>
                <span className="mr-2">➕</span>
                إضافة شريك جديد
              </ModernButton>
              <div className="text-sm text-gray-500">
                {filteredPartners.length} شريك
              </div>
            </div>
          </div>
        </ModernCard>

        {/* Partners List */}
        <ModernCard>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">قائمة الشركاء</h2>
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="text-sm text-gray-500">آخر تحديث:</span>
              <span className="text-sm font-medium text-gray-700">{new Date().toLocaleString('en-GB')}</span>
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

          {filteredPartners.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl text-gray-400">👥</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">لا توجد شركاء</h3>
              <p className="text-gray-500 mb-6">لم يتم إضافة أي شركاء بعد. ابدأ بإضافة شريك جديد</p>
              <ModernButton onClick={() => setShowAddForm(true)}>
                <span className="mr-2">➕</span>
                إضافة شريك جديد
              </ModernButton>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-right py-4 px-6 font-semibold text-gray-700">اسم الشريك</th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-700">رقم الهاتف</th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-700">ملاحظات</th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-700">تاريخ الإضافة</th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-700">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPartners.map((partner) => (
                    <tr 
                      key={partner.id} 
                      className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors duration-150"
                    >
                      <td className="py-4 px-6">
                        <div className="font-medium text-gray-900">{partner.name}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-gray-600">{partner.phone || '-'}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-gray-600 max-w-xs truncate">{partner.notes || '-'}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-gray-600">{partner.createdAt ? formatDate(partner.createdAt) : '-'}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <ModernButton 
                            size="sm" 
                            variant="info" 
                            onClick={() => router.push(`/partners/${partner.id}`)}
                          >
                            👁️ تفاصيل
                          </ModernButton>
                          <ModernButton 
                            size="sm" 
                            variant="warning" 
                            onClick={() => startEdit(partner)}
                          >
                            ✏️ تعديل
                          </ModernButton>
                          <ModernButton 
                            size="sm" 
                            variant="danger" 
                            onClick={() => handleDeletePartner(partner.id)}
                            disabled={deletingPartners.has(partner.id)}
                          >
                            {deletingPartners.has(partner.id) ? '⏳' : '🗑️'} حذف
                          </ModernButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ModernCard>
        </div>
        
        <NotificationSystem 
          notifications={notifications} 
          onRemove={removeNotification} 
        />
      </div>
    </div>
  )
}