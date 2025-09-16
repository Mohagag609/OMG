'use client'

import { useState, useEffect, memo } from 'react'
import { useRouter } from 'next/navigation'
import { Broker } from '@/types'
import { formatDate } from '@/utils/formatting'
import { NotificationSystem, useNotifications } from '@/components/NotificationSystem'
import { checkDuplicateName, checkDuplicatePhone } from '@/utils/duplicateCheck'
import SidebarToggle from '@/components/SidebarToggle'
import Sidebar from '@/components/Sidebar'
import NavigationButtons from '@/components/NavigationButtons'

// FIXED: Proper TypeScript interfaces for components
// interface ModernCardProps {
//   children: React.ReactNode
//   className?: string
//   onClick?: () => void
// }

interface ModernButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

// FIXED: Memoized components for better performance
const ModernCard = memo(({ children, className = '', ...props }: { children: React.ReactNode, className?: string, [key: string]: any }) => (
  <div className={`bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-xl shadow-gray-900/5 p-6 ${className}`} {...props}>
    {children}
  </div>
))

const ModernButton = memo(({ children, variant = 'primary', size = 'md', className = '', ...props }: ModernButtonProps) => {
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

ModernCard.displayName = 'ModernCard'
ModernButton.displayName = 'ModernButton'

const ModernInput = ({ label, className = '', ...props }: any) => (
  <div className="space-y-2">
    {label && <label className="text-sm font-bold text-gray-900">{label}</label>}
    <input 
      className={`w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 font-bold placeholder:text-gray-500 placeholder:font-normal ${className}`}
      {...props}
    />
  </div>
)

const ModernTextarea = ({ label, className = '', ...props }: any) => (
  <div className="space-y-2">
    {label && <label className="text-sm font-bold text-gray-900">{label}</label>}
    <textarea 
      className={`w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 font-bold placeholder:text-gray-500 placeholder:font-normal resize-none ${className}`}
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

export default function Brokers() {
  const [brokers, setBrokers] = useState<Broker[]>([])
  const [brokerDues, setBrokerDues] = useState<any[]>([])
  const [safes, setSafes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingBroker, setEditingBroker] = useState<Broker | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [deletingBrokers, setDeletingBrokers] = useState<Set<string>>(new Set())
  const [newBroker, setNewBroker] = useState({
    name: '',
    phone: '',
    notes: '',
    commissionRate: 0,
    status: 'نشط'
  })
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [showDuesModal, setShowDuesModal] = useState(false)
  const [selectedBroker, setSelectedBroker] = useState<Broker | null>(null)
  const [showPayModal, setShowPayModal] = useState(false)
  const [selectedDue, setSelectedDue] = useState<any>(null)
  const [paymentData, setPaymentData] = useState({
    safeId: '',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: ''
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  const router = useRouter()
  const { notifications, addNotification, removeNotification } = useNotifications()

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'b':
            e.preventDefault()
            setSidebarOpen(!sidebarOpen)
            break
          case 'n':
            e.preventDefault()
            setShowAddForm(true)
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

  useEffect(() => {
    // Authentication removed - direct access
    fetchBrokers()
    fetchBrokerDues()
    fetchSafes()
  }, [])

  const fetchBrokers = async () => {
    try {
      // Authentication removed - direct access
      const response = await fetch('/.netlify/functions/brokers', {
        headers: {}
      })
      
      const data = await response.json()
      if (data.success) {
        setBrokers(data.data || [])
        setError(null)
      } else {
        setError(data.error || 'خطأ في تحميل السماسرة')
        addNotification({
          type: 'error',
          title: 'خطأ في التحميل',
          message: data.error || 'فشل في تحميل السماسرة'
        })
      }
    } catch (err) {
      setError('خطأ في الاتصال')
      addNotification({
        type: 'error',
        title: 'خطأ في الاتصال',
        message: 'فشل في الاتصال بالخادم'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchBrokerDues = async () => {
    try {
      // Authentication removed - direct access
      const response = await fetch('/.netlify/functions/broker-due', {
        headers: {}
      })
      
      const data = await response.json()
      if (data.success) {
        setBrokerDues(data.data || [])
      }
    } catch (err) {
    }
  }

  const fetchSafes = async () => {
    try {
      // Authentication removed - direct access
      const response = await fetch('/.netlify/functions/safes', {
        headers: {}
      })
      
      const data = await response.json()
      if (data.success) {
        setSafes(data.data || [])
      }
    } catch (err) {
    }
  }

  // FIXED: Memoized function


  const handleAddBroker = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newBroker.name.trim()) {
      setError('الرجاء إدخال اسم السمسار')
      addNotification({
        type: 'error',
        title: 'خطأ في البيانات',
        message: 'الرجاء إدخال اسم السمسار'
      })
      return
    }

    // فحص تكرار الاسم
    if (checkDuplicateName(newBroker.name, brokers)) {
      setError('اسم السمسار موجود بالفعل')
      addNotification({
        type: 'error',
        title: 'خطأ في البيانات',
        message: 'اسم السمسار موجود بالفعل'
      })
      return
    }

    // فحص تكرار رقم الهاتف (إذا تم إدخاله)
    if (newBroker.phone && checkDuplicatePhone(newBroker.phone, brokers)) {
      setError('رقم الهاتف موجود بالفعل')
      addNotification({
        type: 'error',
        title: 'خطأ في البيانات',
        message: 'رقم الهاتف موجود بالفعل'
      })
      return
    }

    try {
      // Authentication removed - direct access
      const response = await fetch('/.netlify/functions/brokers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBroker)
      })

      const data = await response.json()
      if (data.success) {
        setShowAddForm(false)
        setSuccess('تم إضافة السمسار بنجاح!')
        setError(null)
        setNewBroker({
          name: '',
          phone: '',
          notes: '',
          commissionRate: 0,
          status: 'نشط'
        })
        fetchBrokers()
        addNotification({
          type: 'success',
          title: 'تم الإضافة بنجاح',
          message: 'تم إضافة السمسار بنجاح'
        })
      } else {
        setError(data.error || 'خطأ في إضافة السمسار')
        setSuccess(null)
        addNotification({
          type: 'error',
          title: 'خطأ في الإضافة',
          message: data.error || 'فشل في إضافة السمسار'
        })
      }
    } catch (err) {
      setError('خطأ في إضافة السمسار')
      setSuccess(null)
      addNotification({
        type: 'error',
        title: 'خطأ في الإضافة',
        message: 'فشل في إضافة السمسار'
      })
    }
  }

  // FIXED: Memoized function


  const handleEditBroker = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingBroker || !editingBroker.name.trim()) {
      setError('الرجاء إدخال اسم السمسار')
      return
    }

    try {
      // Authentication removed - direct access
      const response = await fetch(`/api/brokers?id=${editingBroker.id}`, { method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingBroker.name,
          phone: editingBroker.phone,
          notes: editingBroker.notes,
          commissionRate: editingBroker.commissionRate || 0,
          status: editingBroker.status || 'نشط'
        })
      })

      const data = await response.json()
      if (data.success) {
        setShowEditForm(false)
        setEditingBroker(null)
        setSuccess('تم تحديث السمسار بنجاح!')
        setError(null)
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
      setError('خطأ في تحديث السمسار')
      setSuccess(null)
      addNotification({
        type: 'error',
        title: 'خطأ في التحديث',
        message: 'فشل في تحديث السمسار'
      })
    }
  }

  // FIXED: Memoized function


  const handleDeleteBroker = async (brokerId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا السمسار؟')) return

    try {
      setDeletingBrokers(prev => new Set(prev).add(brokerId))
      // Authentication removed - direct access
      const response = await fetch(`/api/brokers?id=${brokerId}`, { method: 'DELETE',
        headers: {}
      })

      const data = await response.json()
      if (data.success) {
        setSuccess('تم حذف السمسار بنجاح!')
        setError(null)
        fetchBrokers()
        addNotification({
          type: 'success',
          title: 'تم الحذف بنجاح',
          message: 'تم حذف السمسار بنجاح'
        })
      } else {
        setError(data.error || 'خطأ في حذف السمسار')
        setSuccess(null)
        addNotification({
          type: 'error',
          title: 'خطأ في الحذف',
          message: data.error || 'فشل في حذف السمسار'
        })
      }
    } catch (err) {
      setError('خطأ في حذف السمسار')
      setSuccess(null)
      addNotification({
        type: 'error',
        title: 'خطأ في الحذف',
        message: 'فشل في حذف السمسار'
      })
    } finally {
      setDeletingBrokers(prev => {
        const newSet = new Set(prev)
        newSet.delete(brokerId)
        return newSet
      })
    }
  }

  const startEdit = (broker: Broker) => {
    setEditingBroker({ ...broker })
    setShowEditForm(true)
    setShowAddForm(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'نشط':
        return 'bg-green-100 text-green-800'
      case 'غير نشط':
        return 'bg-red-100 text-red-800'
      case 'معلق':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getDueStatusColor = (status: string) => {
    switch (status) {
      case 'مدفوع':
        return 'bg-green-100 text-green-800'
      case 'معلق':
        return 'bg-yellow-100 text-yellow-800'
      case 'متأخر':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // FIXED: Memoized function


  const handlePayDue = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedDue || !paymentData.safeId) {
      addNotification({
        type: 'error',
        title: 'خطأ في البيانات',
        message: 'الرجاء تحديد الخزنة'
      })
      return
    }

    try {
      // Authentication removed - direct access
      const response = await fetch(`/api/broker-due/${selectedDue.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      })

      const data = await response.json()
      if (data.success) {
        setShowPayModal(false)
        setSuccess('تم دفع العمولة بنجاح!')
        setError(null)
        setPaymentData({
          safeId: '',
          paymentDate: new Date().toISOString().split('T')[0],
          notes: ''
        })
        fetchBrokerDues()
        addNotification({
          type: 'success',
          title: 'تم الدفع بنجاح',
          message: 'تم دفع العمولة بنجاح'
        })
      } else {
        setError(data.error || 'خطأ في دفع العمولة')
        setSuccess(null)
        addNotification({
          type: 'error',
          title: 'خطأ في الدفع',
          message: data.error || 'فشل في دفع العمولة'
        })
      }
    } catch (err) {
      setError('خطأ في دفع العمولة')
      setSuccess(null)
      addNotification({
        type: 'error',
        title: 'خطأ في الدفع',
        message: 'فشل في دفع العمولة'
      })
    }
  }

  const openDuesModal = (broker: Broker) => {
    setSelectedBroker(broker)
    setShowDuesModal(true)
  }

  const openPayModal = (due: any) => {
    setSelectedDue(due)
    setShowPayModal(true)
  }

  const exportToCSV = () => {
    const headers = ['الاسم', 'رقم الهاتف', 'نسبة العمولة', 'الحالة', 'الملاحظات', 'تاريخ الإضافة']
    const csvContent = [
      headers.join(','),
      ...brokers.map(broker => [
        broker.name,
        broker.phone || '',
        (broker as any).commissionRate || 0,
        (broker as any).status || 'نشط',
        broker.notes || '',
        formatDate(broker.createdAt || new Date())
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `brokers_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const printBrokers = () => {
    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <title>تقرير السماسرة</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
            th { background-color: #f2f2f2; }
            .header { text-align: center; margin-bottom: 30px; }
            .date { text-align: left; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>تقرير السماسرة</h1>
            <p class="date">تاريخ الطباعة: ${new Date().toLocaleString('en-GB')}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>الاسم</th>
                <th>رقم الهاتف</th>
                <th>نسبة العمولة</th>
                <th>الحالة</th>
                <th>الملاحظات</th>
                <th>تاريخ الإضافة</th>
              </tr>
            </thead>
            <tbody>
              ${brokers.map(broker => `
                <tr>
                  <td>${broker.name}</td>
                  <td>${broker.phone || '-'}</td>
                  <td>${(broker as any).commissionRate || 0}%</td>
                  <td>${(broker as any).status || 'نشط'}</td>
                  <td>${broker.notes || '-'}</td>
                  <td>${formatDate(broker.createdAt || new Date())}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `
    
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const filteredBrokers = brokers.filter(broker => {
    const matchesSearch = search === '' || 
      broker.name.toLowerCase().includes(search.toLowerCase()) ||
      (broker.phone && broker.phone.toLowerCase().includes(search.toLowerCase())) ||
      (broker.notes && broker.notes.toLowerCase().includes(search.toLowerCase()))
    
    const matchesStatus = filterStatus === 'all' || (broker as any).status === filterStatus
    
    return matchesSearch && matchesStatus
  }).sort((a, b) => {
    let aValue, bValue
    
    switch (sortBy) {
      case 'name':
        aValue = a.name
        bValue = b.name
        break
      case 'phone':
        aValue = a.phone || ''
        bValue = b.phone || ''
        break
      case 'commissionRate':
        aValue = (a as any).commissionRate || 0
        bValue = (b as any).commissionRate || 0
        break
      case 'status':
        aValue = (a as any).status || 'نشط'
        bValue = (b as any).status || 'نشط'
        break
      case 'createdAt':
        aValue = new Date(a.createdAt || 0).getTime()
        bValue = new Date(b.createdAt || 0).getTime()
        break
      default:
        aValue = a.name
        bValue = b.name
    }
    
    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    }
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
                  <span className="text-white text-xl">🤝</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">إدارة السماسرة</h1>
                  <p className="text-gray-600">نظام متطور لإدارة السماسرة والعمولات</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 space-x-reverse">
                <ModernButton variant="secondary" onClick={() => router.push('/contracts')}>
                  📋 العقود المرتبطة
                </ModernButton>
                <NavigationButtons />
              </div>
            </div>
          </div>
        </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Add Broker Form */}
        {showAddForm && (
          <ModernCard className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">إضافة سمسار جديد</h2>
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

            <form onSubmit={handleAddBroker} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ModernInput
                  label="اسم السمسار *"
                  type="text"
                  value={newBroker.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewBroker({...newBroker, name: e.target.value})}
                  placeholder="أدخل اسم السمسار"
                  required
                />
                
                <ModernInput
                  label="رقم الهاتف"
                  type="tel"
                  value={newBroker.phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewBroker({...newBroker, phone: e.target.value})}
                  placeholder="أدخل رقم الهاتف"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ModernInput
                  label="نسبة العمولة (%)"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={newBroker.commissionRate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewBroker({...newBroker, commissionRate: parseFloat(e.target.value) || 0})}
                  placeholder="أدخل نسبة العمولة"
                />
                
                <ModernSelect
                  label="الحالة"
                  value={newBroker.status}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewBroker({...newBroker, status: e.target.value})}
                >
                  <option value="نشط">نشط</option>
                  <option value="غير نشط">غير نشط</option>
                  <option value="معلق">معلق</option>
                </ModernSelect>
              </div>
              
              <ModernTextarea
                label="ملاحظات"
                value={newBroker.notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewBroker({...newBroker, notes: e.target.value})}
                placeholder="أدخل أي ملاحظات إضافية"
                rows={3}
              />
              
              <div className="flex items-center justify-end space-x-3 space-x-reverse pt-6 border-t border-gray-200">
                <ModernButton variant="secondary" onClick={() => setShowAddForm(false)}>
                  إلغاء
                </ModernButton>
                <ModernButton type="submit">
                  <span className="mr-2">➕</span>
                  إضافة السمسار
                </ModernButton>
              </div>
            </form>
          </ModernCard>
        )}

        {/* Edit Broker Form */}
        {showEditForm && editingBroker && (
          <ModernCard className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">تعديل السمسار</h2>
              <button
                onClick={() => setShowEditForm(false)}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors duration-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditBroker} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ModernInput
                  label="اسم السمسار *"
                  type="text"
                  value={editingBroker.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingBroker({...editingBroker, name: e.target.value})}
                  placeholder="أدخل اسم السمسار"
                  required
                />
                
                <ModernInput
                  label="رقم الهاتف"
                  type="tel"
                  value={editingBroker.phone || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingBroker({...editingBroker, phone: e.target.value})}
                  placeholder="أدخل رقم الهاتف"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ModernInput
                  label="نسبة العمولة (%)"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={editingBroker.commissionRate || 0}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingBroker({...editingBroker, commissionRate: parseFloat(e.target.value) || 0})}
                  placeholder="أدخل نسبة العمولة"
                />
                
                <ModernSelect
                  label="الحالة"
                  value={editingBroker.status || 'نشط'}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditingBroker({...editingBroker, status: e.target.value})}
                >
                  <option value="نشط">نشط</option>
                  <option value="غير نشط">غير نشط</option>
                  <option value="معلق">معلق</option>
                </ModernSelect>
              </div>
              
              <ModernTextarea
                label="ملاحظات"
                value={editingBroker.notes || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditingBroker({...editingBroker, notes: e.target.value})}
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

        {/* Search and Filters */}
        <ModernCard className="mb-8">
          <div className="space-y-6">
            {/* Search and Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 space-x-reverse">
                <div className="relative">
                  <input
                    id="search-input"
                    type="text"
                    placeholder="🔍 ابحث في السماسرة... (Ctrl+F)"
                    value={search}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                    className="w-80 px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
                <ModernButton variant="secondary" size="sm" onClick={exportToCSV}>
                  📊 تصدير CSV
                </ModernButton>
                <ModernButton variant="secondary" size="sm" onClick={printBrokers}>
                  🖨️ طباعة PDF
                </ModernButton>
              </div>
              <div className="flex items-center space-x-3 space-x-reverse">
                <ModernButton onClick={() => setShowAddForm(true)}>
                  <span className="mr-2">➕</span>
                  إضافة سمسار جديد
                  <span className="mr-2 text-xs opacity-70">Ctrl+N</span>
                </ModernButton>
                <div className="text-sm text-gray-500">
                  {filteredBrokers.length} سمسار
                </div>
              </div>
            </div>

            {/* Advanced Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <ModernSelect
                label="فلتر الحالة"
                value={filterStatus}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterStatus(e.target.value)}
              >
                <option value="all">جميع الحالات</option>
                <option value="نشط">نشط</option>
                <option value="غير نشط">غير نشط</option>
                <option value="معلق">معلق</option>
              </ModernSelect>

              <ModernSelect
                label="ترتيب حسب"
                value={sortBy}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value)}
              >
                <option value="name">الاسم</option>
                <option value="phone">رقم الهاتف</option>
                <option value="commissionRate">نسبة العمولة</option>
                <option value="status">الحالة</option>
                <option value="createdAt">تاريخ الإضافة</option>
              </ModernSelect>

              <ModernSelect
                label="اتجاه الترتيب"
                value={sortOrder}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortOrder(e.target.value as 'asc' | 'desc')}
              >
                <option value="asc">تصاعدي</option>
                <option value="desc">تنازلي</option>
              </ModernSelect>

              <div className="flex items-end">
                <ModernButton 
                  variant="info" 
                  size="sm" 
                  onClick={() => {
                    setSearch('')
                    setFilterStatus('all')
                    setSortBy('name')
                    setSortOrder('asc')
                  }}
                >
                  🔄 إعادة تعيين
                </ModernButton>
              </div>
            </div>
          </div>
        </ModernCard>

        {/* Brokers List */}
        <ModernCard>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">قائمة السماسرة</h2>
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

          {filteredBrokers.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl text-gray-400">🤝</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">لا توجد سماسرة</h3>
              <p className="text-gray-500 mb-6">لم يتم إضافة أي سماسرة بعد. ابدأ بإضافة سمسار جديد</p>
              <ModernButton onClick={() => setShowAddForm(true)}>
                <span className="mr-2">➕</span>
                إضافة سمسار جديد
              </ModernButton>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-right py-4 px-6 font-semibold text-gray-700">الاسم</th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-700">رقم الهاتف</th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-700">نسبة العمولة</th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-700">الحالة</th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-700">الملاحظات</th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-700">تاريخ الإضافة</th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-700">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBrokers.map((broker) => (
                    <tr 
                      key={broker.id} 
                      className={`border-b border-gray-100 hover:bg-blue-50/50 transition-colors duration-150 ${
                        deletingBrokers.has(broker.id) ? 'opacity-50' : ''
                      }`}
                    >
                      <td className="py-4 px-6">
                        <div className="font-medium text-gray-900">{broker.name}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-gray-600">{broker.phone || '-'}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-green-600">
                          {(broker as any).commissionRate || 0}%
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor((broker as any).status || 'نشط')}`}>
                          {(broker as any).status || 'نشط'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-gray-600 max-w-xs truncate">{broker.notes || '-'}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-gray-600">{formatDate(broker.createdAt || new Date())}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <ModernButton 
                            size="sm" 
                            variant="info" 
                            onClick={() => openDuesModal(broker)}
                          >
                            💰 العمولات
                          </ModernButton>
                          <ModernButton 
                            size="sm" 
                            variant="warning" 
                            onClick={() => startEdit(broker)}
                          >
                            ✏️ تعديل
                          </ModernButton>
                          <ModernButton 
                            size="sm" 
                            variant="danger" 
                            onClick={() => handleDeleteBroker(broker.id)}
                            disabled={deletingBrokers.has(broker.id)}
                          >
                            {deletingBrokers.has(broker.id) ? '⏳' : '🗑️'} حذف
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

      {/* Broker Dues Modal */}
      {showDuesModal && selectedBroker && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-4 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  عمولات السمسار: {selectedBroker.name}
                </h2>
                <button
                  onClick={() => setShowDuesModal(false)}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors duration-200"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-right py-4 px-6 font-semibold text-gray-700">المبلغ</th>
                      <th className="text-right py-4 px-6 font-semibold text-gray-700">تاريخ الاستحقاق</th>
                      <th className="text-right py-4 px-6 font-semibold text-gray-700">الحالة</th>
                      <th className="text-right py-4 px-6 font-semibold text-gray-700">الملاحظات</th>
                      <th className="text-right py-4 px-6 font-semibold text-gray-700">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {brokerDues
                      .filter(due => due.brokerId === selectedBroker.id)
                      .map((due) => (
                        <tr key={due.id} className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors duration-150">
                          <td className="py-4 px-6">
                            <div className="font-semibold text-green-600">
                              {due.amount.toLocaleString()} ج.م
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="text-gray-600">{formatDate(due.dueDate)}</div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDueStatusColor(due.status)}`}>
                              {due.status}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="text-gray-600 max-w-xs truncate">{due.notes || '-'}</div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-2 space-x-reverse">
                              {due.status === 'معلق' && (
                                <ModernButton 
                                  size="sm" 
                                  variant="success" 
                                  onClick={() => openPayModal(due)}
                                >
                                  💳 دفع
                                </ModernButton>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pay Due Modal */}
      {showPayModal && selectedDue && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-4 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  دفع عمولة السمسار
                </h2>
                <button
                  onClick={() => setShowPayModal(false)}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors duration-200"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handlePayDue} className="p-6">
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-xl">
                  <h3 className="font-semibold text-blue-900 mb-2">تفاصيل العمولة</h3>
                  <p className="text-blue-800">المبلغ: {selectedDue.amount.toLocaleString()} ج.م</p>
                  <p className="text-blue-800">السمسار: {selectedDue.broker?.name}</p>
                </div>

                <ModernSelect
                  label="الخزنة *"
                  value={paymentData.safeId}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPaymentData({...paymentData, safeId: e.target.value})}
                  required
                >
                  <option value="">اختر الخزنة</option>
                  {safes.map((safe) => (
                    <option key={safe.id} value={safe.id}>
                      {safe.name} - الرصيد: {safe.balance.toLocaleString()} ج.م
                    </option>
                  ))}
                </ModernSelect>

                <ModernInput
                  label="تاريخ الدفع"
                  type="date"
                  value={paymentData.paymentDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPaymentData({...paymentData, paymentDate: e.target.value})}
                />
                
                <ModernTextarea
                  label="ملاحظات إضافية"
                  value={paymentData.notes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPaymentData({...paymentData, notes: e.target.value})}
                  placeholder="أدخل أي ملاحظات إضافية"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-end space-x-3 space-x-reverse pt-6 border-t border-gray-200 mt-6">
                <ModernButton variant="secondary" onClick={() => setShowPayModal(false)}>
                  إلغاء
                </ModernButton>
                <ModernButton type="submit">
                  <span className="mr-2">💳</span>
                  دفع العمولة
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
    </div>
  )
}