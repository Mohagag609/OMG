'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Voucher } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatting'
import { NotificationSystem, useNotifications } from '@/components/NotificationSystem'

import Layout from '@/components/Layout'
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

export default function Vouchers() {
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [deletingVouchers, setDeletingVouchers] = useState<Set<string>>(new Set())
  
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
            setTypeFilter('')
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
    
    fetchVouchers()
  }, [])

  const fetchVouchers = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/vouchers', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      const data = await response.json()
      if (data.success) {
        setVouchers(data.data)
      } else {
        setError(data.error || 'خطأ في تحميل السندات')
      }
    } catch (err) {
      console.error('Error fetching vouchers:', err)
      setError('خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteVoucher = async (voucherId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا السند؟')) return

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/vouchers/${voucherId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()
      if (data.success) {
        setSuccess('تم حذف السند بنجاح!')
        setError(null)
        fetchVouchers()
        addNotification({
          type: 'success',
          title: 'تم الحذف بنجاح',
          message: 'تم حذف السند بنجاح'
        })
      } else {
        setError(data.error || 'خطأ في حذف السند')
        setSuccess(null)
        addNotification({
          type: 'error',
          title: 'خطأ في الحذف',
          message: data.error || 'فشل في حذف السند'
        })
      }
    } catch (err) {
      console.error('Delete voucher error:', err)
      setError('خطأ في حذف السند')
      setSuccess(null)
      addNotification({
        type: 'error',
        title: 'خطأ في الحذف',
        message: 'فشل في حذف السند'
      })
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'receipt':
        return 'bg-green-100 text-green-800'
      case 'payment':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'receipt':
        return 'سند قبض'
      case 'payment':
        return 'سند دفع'
      default:
        return type
    }
  }

  const filteredVouchers = vouchers.filter(voucher => {
    const matchesSearch = search === '' || 
      voucher.description.toLowerCase().includes(search.toLowerCase()) ||
      voucher.payer?.toLowerCase().includes(search.toLowerCase()) ||
      voucher.beneficiary?.toLowerCase().includes(search.toLowerCase())
    
    const matchesType = typeFilter === '' || voucher.type === typeFilter
    
    return matchesSearch && matchesType
  })

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-700">جاري التحميل...</h2>
          </div>
        </div>
      </Layout>
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
                <span className="text-white text-xl">📄</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">إدارة السندات</h1>
                <p className="text-gray-600">نظام متطور لإدارة سندات القبض والدفع</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 space-x-reverse">
              <ModernButton variant="secondary" onClick={() => router.push('/treasury')}>
                💰 إدارة الخزائن
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
                  placeholder="🔍 ابحث في السندات... (Ctrl+F)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-80 px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
              >
                <option value="">جميع الأنواع</option>
                <option value="receipt">سند قبض</option>
                <option value="payment">سند دفع</option>
              </select>
              <ModernButton variant="secondary" size="sm">
                📊 تصدير CSV
              </ModernButton>
              <ModernButton variant="secondary" size="sm">
                🖨️ طباعة PDF
              </ModernButton>
            </div>
            <div className="text-sm text-gray-500">
              {filteredVouchers.length} سند
            </div>
          </div>
        </ModernCard>

        {/* Vouchers List */}
        <ModernCard>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">قائمة السندات</h2>
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

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-right py-4 px-6 font-semibold text-gray-700">النوع</th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-700">التاريخ</th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-700">المبلغ</th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-700">الخزنة</th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-700">الوصف</th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-700">المدفوع له</th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-700">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredVouchers.map((voucher) => (
                  <tr key={voucher.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors duration-150">
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(voucher.type)}`}>
                        {getTypeLabel(voucher.type)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-gray-600">{formatDate(voucher.date)}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className={`font-semibold ${voucher.type === 'receipt' ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(voucher.amount)}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-gray-600">{voucher.safe?.name || 'غير محدد'}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-gray-600 max-w-xs truncate">{voucher.description}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-gray-600">{voucher.payer || voucher.beneficiary || '-'}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <ModernButton size="sm" variant="secondary">
                          👁️ عرض
                        </ModernButton>
                        <ModernButton size="sm" variant="danger" onClick={() => handleDeleteVoucher(voucher.id)}>
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