'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Installment } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatting'
import { NotificationSystem, useNotifications } from '@/components/NotificationSystem'

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

export default function Installments() {
  const [installments, setInstallments] = useState<Installment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [deletingInstallments, setDeletingInstallments] = useState<Set<string>>(new Set())
  
  const router = useRouter()
  const { notifications, addNotification, removeNotification } = useNotifications()

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'f':
            e.preventDefault()
            document.getElementById('search-input')?.focus()
            break
          case 'Escape':
            e.preventDefault()
            setSearch('')
            setStatusFilter('')
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
    
    fetchInstallments()
  }, [router])

  const fetchInstallments = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/installments', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      const data = await response.json()
      if (data.success) {
        setInstallments(data.data)
      } else {
        setError(data.error || 'خطأ في تحميل الأقساط')
      }
    } catch (err) {
      console.error('Error fetching installments:', err)
      setError('خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  const handlePayInstallment = async (installmentId: string) => {
    if (!confirm('هل أنت متأكد من تسديد هذا القسط؟')) return

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/installments/${installmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'مدفوع' })
      })

      const data = await response.json()
      if (data.success) {
        setSuccess('تم تسديد القسط بنجاح!')
        setError(null)
        fetchInstallments()
        addNotification({
          type: 'success',
          title: 'تم التسديد بنجاح',
          message: 'تم تسديد القسط بنجاح'
        })
      } else {
        setError(data.error || 'خطأ في تسديد القسط')
        setSuccess(null)
        addNotification({
          type: 'error',
          title: 'خطأ في التسديد',
          message: data.error || 'فشل في تسديد القسط'
        })
      }
    } catch (err) {
      console.error('Pay installment error:', err)
      setError('خطأ في تسديد القسط')
      setSuccess(null)
      addNotification({
        type: 'error',
        title: 'خطأ في التسديد',
        message: 'فشل في تسديد القسط'
      })
    }
  }

  const handleDeleteInstallment = async (installmentId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا القسط؟')) return

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/installments/${installmentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()
      if (data.success) {
        setSuccess('تم حذف القسط بنجاح!')
        setError(null)
        fetchInstallments()
        addNotification({
          type: 'success',
          title: 'تم الحذف بنجاح',
          message: 'تم حذف القسط بنجاح'
        })
      } else {
        setError(data.error || 'خطأ في حذف القسط')
        setSuccess(null)
        addNotification({
          type: 'error',
          title: 'خطأ في الحذف',
          message: data.error || 'فشل في حذف القسط'
        })
      }
    } catch (err) {
      console.error('Delete installment error:', err)
      setError('خطأ في حذف القسط')
      setSuccess(null)
      addNotification({
        type: 'error',
        title: 'خطأ في الحذف',
        message: 'فشل في حذف القسط'
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'مدفوع':
        return 'bg-green-100 text-green-800'
      case 'مستحق':
        return 'bg-yellow-100 text-yellow-800'
      case 'متأخر':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredInstallments = installments.filter(installment => {
    const matchesSearch = search === '' || 
      installment.unit?.code.toLowerCase().includes(search.toLowerCase()) ||
      installment.notes?.toLowerCase().includes(search.toLowerCase())
    
    const matchesStatus = statusFilter === '' || installment.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

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
                <span className="text-white text-xl">📅</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">إدارة الأقساط</h1>
                <p className="text-gray-600">نظام متطور لإدارة أقساط العقود</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 space-x-reverse">
              <ModernButton variant="secondary" onClick={() => router.push('/contracts')}>
                📋 إضافة عقد جديد
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
                  placeholder="🔍 ابحث في الأقساط... (Ctrl+F)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-80 px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
              >
                <option value="">جميع الحالات</option>
                <option value="مستحق">مستحق</option>
                <option value="مدفوع">مدفوع</option>
                <option value="متأخر">متأخر</option>
              </select>
              <ModernButton variant="secondary" size="sm">
                📊 تصدير CSV
              </ModernButton>
              <ModernButton variant="secondary" size="sm">
                🖨️ طباعة PDF
              </ModernButton>
            </div>
            <div className="text-sm text-gray-500">
              {filteredInstallments.length} قسط
            </div>
          </div>
        </ModernCard>

        {/* Installments List */}
        <ModernCard>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">قائمة الأقساط</h2>
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
                  <th className="text-right py-4 px-6 font-semibold text-gray-700">الوحدة</th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-700">المبلغ</th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-700">تاريخ الاستحقاق</th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-700">الحالة</th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-700">الملاحظات</th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-700">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredInstallments.map((installment) => (
                  <tr key={installment.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors duration-150">
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">{installment.unit?.code || 'غير محدد'}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-green-600">{formatCurrency(installment.amount)}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-gray-600">{formatDate(installment.dueDate)}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(installment.status)}`}>
                        {installment.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-gray-600 max-w-xs truncate">{installment.notes || '-'}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        {installment.status !== 'مدفوع' && (
                          <ModernButton 
                            size="sm" 
                            variant="success" 
                            onClick={() => handlePayInstallment(installment.id)}
                          >
                            💰 تسديد
                          </ModernButton>
                        )}
                        <ModernButton size="sm" variant="danger" onClick={() => handleDeleteInstallment(installment.id)}>
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
      
      <NotificationSystem 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </div>
  )
}