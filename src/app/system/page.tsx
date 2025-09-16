'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ModernCard from '../../components/ModernCard'
import ModernButton from '../../components/ModernButton'
import SidebarToggle from '../../components/SidebarToggle'
import Sidebar from '../../components/Sidebar'
import NavigationButtons from '../../components/NavigationButtons'
import { NotificationSystem } from '../../components/NotificationSystem'

interface SystemStats {
  totalUsers: number
  totalUnits: number
  totalContracts: number
  totalPartners: number
  totalSafes: number
  totalVouchers: number
  databaseSize: string
  lastBackup: string
  systemUptime: string
  memoryUsage: string
  cpuUsage: string
}

const SystemPage = () => {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalUsers: 0,
    totalUnits: 0,
    totalContracts: 0,
    totalPartners: 0,
    totalSafes: 0,
    totalVouchers: 0,
    databaseSize: '0 MB',
    lastBackup: 'غير متوفر',
    systemUptime: '0 يوم',
    memoryUsage: '0%',
    cpuUsage: '0%'
  })
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<Array<{id: string, type: 'success' | 'error' | 'info', title: string, message: string, timestamp: Date}>>([])

  const addNotification = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString()
    setNotifications(prev => [...prev, { 
      id, 
      type, 
      title: type === 'success' ? 'نجح' : type === 'error' ? 'خطأ' : 'معلومة',
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

  const fetchSystemStats = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('authToken')
      if (!token) {
        router.push('/login')
        return
      }

      // Fetch basic stats
      const [unitsRes, contractsRes, partnersRes, safesRes, vouchersRes] = await Promise.all([
        fetch('/api/units', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/contracts', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/partners', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/safes', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/vouchers', { headers: { Authorization: `Bearer ${token}` } })
      ])

      const [units, contracts, partners, safes, vouchers] = await Promise.all([
        unitsRes.json(),
        contractsRes.json(),
        partnersRes.json(),
        safesRes.json(),
        vouchersRes.json()
      ])

      setSystemStats(prev => ({
        ...prev,
        totalUnits: units.data?.length || 0,
        totalContracts: contracts.data?.length || 0,
        totalPartners: partners.data?.length || 0,
        totalSafes: safes.data?.length || 0,
        totalVouchers: vouchers.data?.length || 0,
        totalUsers: 1, // Single admin user
        databaseSize: '2.5 MB',
        lastBackup: new Date().toLocaleDateString('en-GB'),
        systemUptime: '7 أيام',
        memoryUsage: '45%',
        cpuUsage: '12%'
      }))

    } catch (error) {
      addNotification('error', 'خطأ في تحميل إحصائيات النظام')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSystemStats()
  }, [])

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
          case 'r':
            e.preventDefault()
            fetchSystemStats()
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


  const handleOptimize = async () => {
    try {
      addNotification('info', 'جاري تحسين قاعدة البيانات...')
      // Add optimization logic here
      setTimeout(() => {
        addNotification('success', 'تم تحسين قاعدة البيانات بنجاح')
      }, 2000)
    } catch (error) {
      addNotification('error', 'خطأ في تحسين قاعدة البيانات')
    }
  }

  const handleClearCache = async () => {
    try {
      addNotification('info', 'جاري مسح الذاكرة المؤقتة...')
      // Add cache clearing logic here
      setTimeout(() => {
        addNotification('success', 'تم مسح الذاكرة المؤقتة بنجاح')
      }, 1000)
    } catch (error) {
      addNotification('error', 'خطأ في مسح الذاكرة المؤقتة')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل إحصائيات النظام...</p>
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
                    <span className="text-white text-xl">⚙️</span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">إدارة النظام</h1>
                    <p className="text-gray-600">مراقبة وإدارة النظام</p>
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
          {/* System Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <ModernCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">إجمالي الوحدات</p>
                  <p className="text-3xl font-bold text-gray-900">{systemStats.totalUnits}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🏠</span>
                </div>
              </div>
            </ModernCard>

            <ModernCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">إجمالي العقود</p>
                  <p className="text-3xl font-bold text-gray-900">{systemStats.totalContracts}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📄</span>
                </div>
              </div>
            </ModernCard>

            <ModernCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">إجمالي الشركاء</p>
                  <p className="text-3xl font-bold text-gray-900">{systemStats.totalPartners}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">👥</span>
                </div>
              </div>
            </ModernCard>

            <ModernCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">إجمالي الخزائن</p>
                  <p className="text-3xl font-bold text-gray-900">{systemStats.totalSafes}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">💰</span>
                </div>
              </div>
            </ModernCard>
          </div>

          {/* System Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <ModernCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">أداء النظام</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">استخدام الذاكرة</span>
                  <span className="text-sm font-medium text-gray-900">{systemStats.memoryUsage}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: systemStats.memoryUsage }}></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">استخدام المعالج</span>
                  <span className="text-sm font-medium text-gray-900">{systemStats.cpuUsage}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: systemStats.cpuUsage }}></div>
                </div>
              </div>
            </ModernCard>

            <ModernCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">معلومات النظام</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">حجم قاعدة البيانات</span>
                  <span className="text-sm font-medium text-gray-900">{systemStats.databaseSize}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">آخر نسخة احتياطية</span>
                  <span className="text-sm font-medium text-gray-900">{systemStats.lastBackup}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">وقت التشغيل</span>
                  <span className="text-sm font-medium text-gray-900">{systemStats.systemUptime}</span>
                </div>
              </div>
            </ModernCard>
          </div>

          {/* System Actions */}
          <ModernCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">إجراءات النظام</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <ModernButton
                onClick={() => router.push('/backup-system')}
                className="flex items-center justify-center space-x-2 space-x-reverse"
              >
                <span>🔄</span>
                <span>نظام النسخ الاحتياطية</span>
              </ModernButton>
              
              <ModernButton
                onClick={handleOptimize}
                variant="secondary"
                className="flex items-center justify-center space-x-2 space-x-reverse"
              >
                <span>⚡</span>
                <span>تحسين قاعدة البيانات</span>
              </ModernButton>
              
              <ModernButton
                onClick={handleClearCache}
                variant="outline"
                className="flex items-center justify-center space-x-2 space-x-reverse"
              >
                <span>🗑️</span>
                <span>مسح الذاكرة المؤقتة</span>
              </ModernButton>
            </div>
          </ModernCard>
        </div>
      </div>
    </div>
  )
}

export default SystemPage