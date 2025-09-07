'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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

interface Backup {
  id: string
  filename: string
  size: number
  createdAt: string
  type: 'manual' | 'automatic'
}

export default function Backup() {
  const [backups, setBackups] = useState<Backup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [deletingBackups, setDeletingBackups] = useState<Set<string>>(new Set())
  
  const router = useRouter()
  const { notifications, addNotification, removeNotification } = useNotifications()

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      router.push('/login')
      return
    }
    
    fetchBackups()
  }, [router])

  const fetchBackups = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/backup/list', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      const data = await response.json()
      if (data.success) {
        setBackups(data.data)
      } else {
        setError(data.error || 'خطأ في تحميل النسخ الاحتياطية')
      }
    } catch (err) {
      console.error('Error fetching backups:', err)
      setError('خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  const createBackup = async () => {
    setCreating(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/backup/create', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()
      if (data.success) {
        setSuccess('تم إنشاء النسخة الاحتياطية بنجاح!')
        setError(null)
        fetchBackups()
        addNotification({
          type: 'success',
          title: 'تم الإنشاء بنجاح',
          message: 'تم إنشاء النسخة الاحتياطية بنجاح'
        })
      } else {
        setError(data.error || 'خطأ في إنشاء النسخة الاحتياطية')
        setSuccess(null)
        addNotification({
          type: 'error',
          title: 'خطأ في الإنشاء',
          message: data.error || 'فشل في إنشاء النسخة الاحتياطية'
        })
      }
    } catch (err) {
      console.error('Create backup error:', err)
      setError('خطأ في إنشاء النسخة الاحتياطية')
      setSuccess(null)
      addNotification({
        type: 'error',
        title: 'خطأ في الإنشاء',
        message: 'فشل في إنشاء النسخة الاحتياطية'
      })
    } finally {
      setCreating(false)
    }
  }

  const downloadBackup = async (backupId: string) => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/backup/${backupId}/download`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `backup-${backupId}.zip`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        addNotification({
          type: 'success',
          title: 'تم التحميل بنجاح',
          message: 'تم تحميل النسخة الاحتياطية بنجاح'
        })
      } else {
        throw new Error('فشل في تحميل النسخة الاحتياطية')
      }
    } catch (err) {
      console.error('Download backup error:', err)
      addNotification({
        type: 'error',
        title: 'خطأ في التحميل',
        message: 'فشل في تحميل النسخة الاحتياطية'
      })
    }
  }

  const deleteBackup = async (backupId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه النسخة الاحتياطية؟')) return

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/backup/${backupId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()
      if (data.success) {
        setSuccess('تم حذف النسخة الاحتياطية بنجاح!')
        setError(null)
        fetchBackups()
        addNotification({
          type: 'success',
          title: 'تم الحذف بنجاح',
          message: 'تم حذف النسخة الاحتياطية بنجاح'
        })
      } else {
        setError(data.error || 'خطأ في حذف النسخة الاحتياطية')
        setSuccess(null)
        addNotification({
          type: 'error',
          title: 'خطأ في الحذف',
          message: data.error || 'فشل في حذف النسخة الاحتياطية'
        })
      }
    } catch (err) {
      console.error('Delete backup error:', err)
      setError('خطأ في حذف النسخة الاحتياطية')
      setSuccess(null)
      addNotification({
        type: 'error',
        title: 'خطأ في الحذف',
        message: 'فشل في حذف النسخة الاحتياطية'
      })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-SA')
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
                <span className="text-white text-xl">💾</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">النسخ الاحتياطية</h1>
                <p className="text-gray-600">نظام متطور لإدارة النسخ الاحتياطية</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 space-x-reverse">
              <ModernButton 
                onClick={createBackup}
                disabled={creating}
                className={creating ? 'opacity-50 cursor-not-allowed' : ''}
              >
                <span className="mr-2">{creating ? '⏳' : '➕'}</span>
                {creating ? 'جاري الإنشاء...' : 'إنشاء نسخة احتياطية'}
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
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <ModernCard className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{backups.length}</div>
              <div className="text-blue-800 font-medium">إجمالي النسخ</div>
            </div>
          </ModernCard>
          
          <ModernCard className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {backups.filter(b => b.type === 'manual').length}
              </div>
              <div className="text-green-800 font-medium">نسخ يدوية</div>
            </div>
          </ModernCard>
          
          <ModernCard className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {backups.filter(b => b.type === 'automatic').length}
              </div>
              <div className="text-purple-800 font-medium">نسخ تلقائية</div>
            </div>
          </ModernCard>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <ModernCard className="mb-8 bg-red-50 border-red-200">
            <div className="flex items-center">
              <span className="text-red-500 mr-3 text-xl">⚠️</span>
              <span className="text-red-700">{error}</span>
            </div>
          </ModernCard>
        )}

        {success && (
          <ModernCard className="mb-8 bg-green-50 border-green-200">
            <div className="flex items-center">
              <span className="text-green-500 mr-3 text-xl">✅</span>
              <span className="text-green-700">{success}</span>
            </div>
          </ModernCard>
        )}

        {/* Backups List */}
        <ModernCard>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">قائمة النسخ الاحتياطية</h2>
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="text-sm text-gray-500">آخر تحديث:</span>
              <span className="text-sm font-medium text-gray-700">{new Date().toLocaleString('ar-SA')}</span>
            </div>
          </div>

          {backups.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💾</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">لا توجد نسخ احتياطية</h3>
              <p className="text-gray-600 mb-6">قم بإنشاء نسخة احتياطية لحماية بياناتك</p>
              <ModernButton onClick={createBackup} disabled={creating}>
                <span className="mr-2">{creating ? '⏳' : '➕'}</span>
                {creating ? 'جاري الإنشاء...' : 'إنشاء أول نسخة احتياطية'}
              </ModernButton>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-right py-4 px-6 font-semibold text-gray-700">اسم الملف</th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-700">النوع</th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-700">الحجم</th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-700">تاريخ الإنشاء</th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-700">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map((backup) => (
                    <tr key={backup.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors duration-150">
                      <td className="py-4 px-6">
                        <div className="font-medium text-gray-900">{backup.filename}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          backup.type === 'manual' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {backup.type === 'manual' ? 'يدوي' : 'تلقائي'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-gray-600">{formatFileSize(backup.size)}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-gray-600">{formatDate(backup.createdAt)}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <ModernButton size="sm" variant="success" onClick={() => downloadBackup(backup.id)}>
                            📥 تحميل
                          </ModernButton>
                          <ModernButton size="sm" variant="danger" onClick={() => deleteBackup(backup.id)}>
                            🗑️ حذف
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

        {/* Backup Settings */}
        <ModernCard>
          <h2 className="text-xl font-bold text-gray-900 mb-6">إعدادات النسخ الاحتياطية</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">النسخ التلقائية</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">تفعيل النسخ التلقائية</span>
                  <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">تكرار النسخ</span>
                  <select className="px-3 py-2 border border-gray-200 rounded-lg">
                    <option value="daily">يومي</option>
                    <option value="weekly">أسبوعي</option>
                    <option value="monthly">شهري</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">عدد النسخ المحفوظة</span>
                  <input type="number" defaultValue="7" className="w-20 px-3 py-2 border border-gray-200 rounded-lg" />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">إعدادات التخزين</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">ضغط الملفات</span>
                  <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">تشفير النسخ</span>
                  <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">التخزين السحابي</span>
                  <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <ModernButton variant="success">
              <span className="mr-2">💾</span>
              حفظ الإعدادات
            </ModernButton>
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