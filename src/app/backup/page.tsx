'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ModernCard from '../../components/ModernCard'
import ModernButton from '../../components/ModernButton'
import SidebarToggle from '../../components/SidebarToggle'
import Sidebar from '../../components/Sidebar'
import NavigationButtons from '../../components/NavigationButtons'
import { NotificationSystem } from '../../components/NotificationSystem'

interface Backup {
  id: string
  filename: string
  size: number
  createdAt: string
  type: 'manual' | 'automatic'
  status: 'completed' | 'failed' | 'in_progress'
  description?: string
}

interface BackupSettings {
  autoBackup: boolean
  frequency: 'daily' | 'weekly' | 'monthly'
  maxBackups: number
  compression: boolean
  encryption: boolean
  cloudStorage: boolean
}

const BackupPage = () => {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [backups, setBackups] = useState<Backup[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [settings, setSettings] = useState<BackupSettings>({
    autoBackup: true,
    frequency: 'daily',
    maxBackups: 7,
    compression: true,
    encryption: false,
    cloudStorage: false
  })
  const [notifications, setNotifications] = useState<Array<{id: string, type: 'success' | 'error' | 'info', title: string, message: string, timestamp: Date}>>([])

  const addNotification = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    const id = Date.now().toString()
    setNotifications(prev => [...prev, { 
      id, 
      type, 
      title,
      message, 
      timestamp: new Date() 
    }])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 5000)
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const fetchBackups = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('authToken')
      if (!token) {
        router.push('/login')
        return
      }

      // Mock data for demonstration
      const mockBackups: Backup[] = [
        {
          id: '1',
          filename: 'backup-2024-01-15-full.zip',
          size: 15728640, // 15MB
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'manual',
          status: 'completed',
          description: 'نسخة احتياطية كاملة'
        },
        {
          id: '2',
          filename: 'backup-2024-01-14-auto.zip',
          size: 10485760, // 10MB
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'automatic',
          status: 'completed',
          description: 'نسخة احتياطية تلقائية'
        },
        {
          id: '3',
          filename: 'backup-2024-01-13-incremental.zip',
          size: 5242880, // 5MB
          createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'automatic',
          status: 'completed',
          description: 'نسخة احتياطية تدريجية'
        }
      ]

      setBackups(mockBackups)

    } catch (error) {
      console.error('Error fetching backups:', error)
      addNotification('error', 'خطأ في تحميل النسخ الاحتياطية', 'فشل في تحميل قائمة النسخ الاحتياطية')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBackups()
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return
      }
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'b':
            e.preventDefault()
            setSidebarOpen(!sidebarOpen)
            break
          case 'n':
            e.preventDefault()
            createBackup()
            break
          case 'Escape':
            e.preventDefault()
            setSidebarOpen(false)
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [sidebarOpen])

  const createBackup = async () => {
    setCreating(true)
    try {
      addNotification('info', 'جاري إنشاء النسخة الاحتياطية', 'يرجى الانتظار...')
      
      // Simulate backup creation
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const newBackup: Backup = {
        id: Date.now().toString(),
        filename: `backup-${new Date().toISOString().split('T')[0]}-manual.zip`,
        size: Math.floor(Math.random() * 20000000) + 5000000, // 5-25MB
        createdAt: new Date().toISOString(),
        type: 'manual',
        status: 'completed',
        description: 'نسخة احتياطية يدوية جديدة'
      }

      setBackups(prev => [newBackup, ...prev])
      addNotification('success', 'تم إنشاء النسخة الاحتياطية', 'تم إنشاء النسخة الاحتياطية بنجاح')

    } catch (error) {
      console.error('Create backup error:', error)
      addNotification('error', 'خطأ في إنشاء النسخة الاحتياطية', 'فشل في إنشاء النسخة الاحتياطية')
    } finally {
      setCreating(false)
    }
  }

  const downloadBackup = async (backup: Backup) => {
    try {
      addNotification('info', 'جاري تحميل النسخة الاحتياطية', 'يرجى الانتظار...')
      
      // Simulate download
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Create a mock download
      const blob = new Blob(['Mock backup content'], { type: 'application/zip' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = backup.filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      addNotification('success', 'تم تحميل النسخة الاحتياطية', 'تم تحميل النسخة الاحتياطية بنجاح')

    } catch (error) {
      console.error('Download backup error:', error)
      addNotification('error', 'خطأ في تحميل النسخة الاحتياطية', 'فشل في تحميل النسخة الاحتياطية')
    }
  }

  const deleteBackup = async (backupId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه النسخة الاحتياطية؟')) return

    try {
      setBackups(prev => prev.filter(b => b.id !== backupId))
      addNotification('success', 'تم حذف النسخة الاحتياطية', 'تم حذف النسخة الاحتياطية بنجاح')

    } catch (error) {
      console.error('Delete backup error:', error)
      addNotification('error', 'خطأ في حذف النسخة الاحتياطية', 'فشل في حذف النسخة الاحتياطية')
    }
  }

  const saveSettings = () => {
    addNotification('success', 'تم حفظ الإعدادات', 'تم حفظ إعدادات النسخ الاحتياطية بنجاح')
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-GB')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'مكتملة'
      case 'failed': return 'فشلت'
      case 'in_progress': return 'جاري العمل'
      default: return 'غير معروف'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل النسخ الاحتياطية...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <NotificationSystem notifications={notifications} onRemove={removeNotification} />
      
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'mr-80' : 'mr-0'}`}>
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Left side - Menu button and title */}
              <div className="flex items-center space-x-4 space-x-reverse">
                <SidebarToggle onToggle={() => setSidebarOpen(!sidebarOpen)} />
                
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-white text-xl">💾</span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">النسخ الاحتياطية</h1>
                    <p className="text-gray-600">نظام متطور لإدارة النسخ الاحتياطية</p>
                  </div>
                </div>
              </div>

              {/* Right side - Actions */}
              <div className="flex items-center space-x-3 space-x-reverse">
                <NavigationButtons />
                
                <div className="hidden md:flex items-center space-x-2 space-x-reverse">
                  <button
                    onClick={() => window.location.reload()}
                    className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105"
                    title="تحديث الصفحة"
                  >
                    <span className="text-gray-600">🔄</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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

            <ModernCard className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {formatFileSize(backups.reduce((total, backup) => total + backup.size, 0))}
                </div>
                <div className="text-orange-800 font-medium">إجمالي الحجم</div>
              </div>
            </ModernCard>
          </div>

          {/* Quick Actions */}
          <ModernCard className="mb-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">إجراءات سريعة</h2>
              <div className="flex items-center space-x-3 space-x-reverse">
                <ModernButton
                  onClick={createBackup}
                  disabled={creating}
                  className={creating ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  <span className="mr-2">{creating ? '⏳' : '➕'}</span>
                  {creating ? 'جاري الإنشاء...' : 'إنشاء نسخة احتياطية'}
                </ModernButton>
                <ModernButton
                  onClick={fetchBackups}
                  variant="secondary"
                >
                  <span className="mr-2">🔄</span>
                  تحديث القائمة
                </ModernButton>
              </div>
            </div>
          </ModernCard>

          {/* Backups List */}
          <ModernCard className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">قائمة النسخ الاحتياطية</h2>
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className="text-sm text-gray-500">آخر تحديث:</span>
                <span className="text-sm font-medium text-gray-700">{new Date().toLocaleString('en-GB')}</span>
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
                      <th className="text-right py-4 px-6 font-semibold text-gray-700">الحالة</th>
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
                          {backup.description && (
                            <div className="text-sm text-gray-500">{backup.description}</div>
                          )}
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
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(backup.status)}`}>
                            {getStatusText(backup.status)}
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
                            <ModernButton 
                              size="sm" 
                              variant="primary" 
                              onClick={() => downloadBackup(backup)}
                            >
                              📥 تحميل
                            </ModernButton>
                            <ModernButton 
                              size="sm" 
                              variant="danger" 
                              onClick={() => deleteBackup(backup.id)}
                            >
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800">النسخ التلقائية</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">تفعيل النسخ التلقائية</span>
                    <input 
                      type="checkbox" 
                      checked={settings.autoBackup}
                      onChange={(e) => setSettings({...settings, autoBackup: e.target.checked})}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">تكرار النسخ</span>
                    <select 
                      value={settings.frequency}
                      onChange={(e) => setSettings({...settings, frequency: e.target.value as any})}
                      className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="daily">يومي</option>
                      <option value="weekly">أسبوعي</option>
                      <option value="monthly">شهري</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">عدد النسخ المحفوظة</span>
                    <input 
                      type="number" 
                      value={settings.maxBackups}
                      onChange={(e) => setSettings({...settings, maxBackups: parseInt(e.target.value)})}
                      className="w-20 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                      max="30"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800">إعدادات التخزين</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">ضغط الملفات</span>
                    <input 
                      type="checkbox" 
                      checked={settings.compression}
                      onChange={(e) => setSettings({...settings, compression: e.target.checked})}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">تشفير النسخ</span>
                    <input 
                      type="checkbox" 
                      checked={settings.encryption}
                      onChange={(e) => setSettings({...settings, encryption: e.target.checked})}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">التخزين السحابي</span>
                    <input 
                      type="checkbox" 
                      checked={settings.cloudStorage}
                      onChange={(e) => setSettings({...settings, cloudStorage: e.target.checked})}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  <p>💡 نصيحة: قم بإنشاء نسخة احتياطية قبل إجراء أي تغييرات مهمة</p>
                </div>
                <ModernButton onClick={saveSettings} variant="primary">
                  <span className="mr-2">💾</span>
                  حفظ الإعدادات
                </ModernButton>
              </div>
            </div>
          </ModernCard>
        </div>
      </div>
    </div>
  )
}

export default BackupPage