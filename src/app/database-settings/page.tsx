'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { NotificationSystem, useNotifications } from '@/components/NotificationSystem'
import Layout from '@/components/Layout'

// Database Types
type DatabaseType = 'sqlite' | 'postgresql'

interface DatabaseSettings {
  type: DatabaseType
  connectionString: string
  isConnected: boolean
  lastTested?: string
  status?: 'loading' | 'connected' | 'disconnected' | 'error'
}

// UI Components
const StatusBadge = ({ status, children }: { status: string, children: React.ReactNode }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'disconnected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'loading': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
      {children}
    </span>
  )
}

const ActionButton = ({ 
  onClick, 
  disabled = false, 
  variant = 'primary', 
  loading = false,
  children 
}: {
  onClick: () => void
  disabled?: boolean
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'secondary'
  loading?: boolean
  children: React.ReactNode
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary': return 'bg-blue-600 hover:bg-blue-700 text-white'
      case 'success': return 'bg-green-600 hover:bg-green-700 text-white'
      case 'warning': return 'bg-yellow-600 hover:bg-yellow-700 text-white'
      case 'danger': return 'bg-red-600 hover:bg-red-700 text-white'
      case 'secondary': return 'bg-gray-600 hover:bg-gray-700 text-white'
      default: return 'bg-blue-600 hover:bg-blue-700 text-white'
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${getVariantClasses()}`}
    >
      {loading ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          جاري المعالجة...
        </div>
      ) : (
        children
      )}
    </button>
  )
}

const DatabaseCard = ({ 
  type, 
  isSelected, 
  onSelect, 
  description, 
  icon 
}: {
  type: DatabaseType
  isSelected: boolean
  onSelect: () => void
  description: string
  icon: string
}) => (
  <div 
    className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
      isSelected 
        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
    }`}
    onClick={onSelect}
  >
    <div className="flex items-center space-x-4 space-x-reverse">
      <div className="text-3xl">{icon}</div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {type === 'sqlite' ? 'SQLite' : 'PostgreSQL'}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {description}
        </p>
      </div>
      {isSelected && (
        <div className="text-blue-600 dark:text-blue-400">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  </div>
)

export default function DatabaseSettings() {
  const [settings, setSettings] = useState<DatabaseSettings>({
    type: 'sqlite',
    connectionString: '',
    isConnected: false,
    status: 'loading'
  })
  
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [connectionString, setConnectionString] = useState('')
  const [initialized, setInitialized] = useState(false)
  
  const router = useRouter()
  const { notifications, addNotification, removeNotification } = useNotifications()

  // Load database settings - simplified without notifications
  const loadSettings = useCallback(async () => {
    if (loading === false) return // Prevent reloading if already loaded
    
    try {
      setSettings(prev => ({ ...prev, status: 'loading' }))
      
      // Try to load from localStorage first
      const backupConfig = localStorage.getItem('database-config-backup')
      if (backupConfig) {
        try {
          const config = JSON.parse(backupConfig)
          setSettings({
            ...config,
            status: config.isConnected ? 'connected' : 'disconnected'
          })
          setConnectionString(config.connectionString)
          console.log('📋 تم تحميل الإعدادات من النسخة الاحتياطية')
          setLoading(false)
          return
        } catch (parseError) {
          console.error('❌ خطأ في تحليل النسخة الاحتياطية:', parseError)
        }
      }
      
      const response = await fetch('/api/database/settings')
      const data = await response.json()
      
      if (data.success && data.data) {
        const loadedSettings = data.data
        console.log('📋 تم تحميل الإعدادات بنجاح:', loadedSettings.type)
        console.log('🔌 حالة الاتصال:', loadedSettings.isConnected ? 'متصل' : 'غير متصل')
        
        setSettings({
          ...loadedSettings,
          status: loadedSettings.isConnected ? 'connected' : 'disconnected'
        })
        setConnectionString(loadedSettings.connectionString)
        
        // If database is connected, show success message
        if (loadedSettings.isConnected) {
          addNotification({
            type: 'success',
            title: 'تم تحميل الإعدادات',
            message: `قاعدة البيانات ${loadedSettings.type} متصلة بنجاح`
          })
        } else {
          addNotification({
            type: 'warning',
            title: 'تحذير',
            message: 'قاعدة البيانات غير متصلة، يرجى اختبار الاتصال'
          })
        }
      } else {
        console.log('⚠️ فشل في تحميل الإعدادات من الخادم')
        // Default to SQLite
        const defaultSettings = {
          type: 'sqlite' as DatabaseType,
          connectionString: 'file:./prisma/dev.db',
          isConnected: false,
          status: 'disconnected' as const
        }
        setSettings(defaultSettings)
        setConnectionString(defaultSettings.connectionString)
        
        addNotification({
          type: 'error',
          title: 'خطأ في تحميل الإعدادات',
          message: 'فشل في تحميل إعدادات قاعدة البيانات'
        })
      }
    } catch (error) {
      console.error('خطأ في تحميل الإعدادات:', error)
      
      // Try to load from localStorage as fallback
      const backupConfig = localStorage.getItem('database-config-backup')
      if (backupConfig) {
        try {
          const config = JSON.parse(backupConfig)
          setSettings({
            ...config,
            status: config.isConnected ? 'connected' : 'disconnected'
          })
          setConnectionString(config.connectionString)
          console.log('📋 تم تحميل الإعدادات من النسخة الاحتياطية بعد الخطأ')
          setLoading(false)
          return
        } catch (parseError) {
          console.error('❌ خطأ في تحليل النسخة الاحتياطية:', parseError)
        }
      }
      
      const defaultSettings = {
        type: 'sqlite' as DatabaseType,
        connectionString: 'file:./prisma/dev.db',
        isConnected: false,
        status: 'error' as const
      }
      setSettings(defaultSettings)
      setConnectionString(defaultSettings.connectionString)
    } finally {
      setLoading(false)
    }
  }, [loading])

  // Test database connection - with protection against multiple calls
  const testConnection = async () => {
    if (testing) return // Prevent multiple simultaneous tests
    
    if (!connectionString.trim()) {
      addNotification({
        type: 'error',
        title: 'خطأ في الإدخال',
        message: 'يرجى إدخال رابط الاتصال أولاً'
      })
      return
    }

    setTesting(true)
    setSettings(prev => ({ ...prev, status: 'loading' }))
    
    try {
      const response = await fetch('/api/database/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionString,
          type: settings.type
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        const updatedSettings = { 
          ...settings, 
          isConnected: true, 
          status: 'connected',
          lastTested: new Date().toISOString(),
          connectionString: connectionString // Update connection string
        }
        
        setSettings(updatedSettings)
        
        // Save the updated settings to the server
        try {
          await fetch('/api/database/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: settings.type,
              connectionString: connectionString
            })
          })
          console.log('💾 تم حفظ الإعدادات المحدثة بعد الاختبار الناجح')
        } catch (saveError) {
          console.error('⚠️ فشل في حفظ الإعدادات المحدثة:', saveError)
        }
        
        addNotification({
          type: 'success',
          title: 'نجح الاختبار',
          message: 'تم اختبار الاتصال وإنشاء الجداول بنجاح'
        })
      } else {
        setSettings(prev => ({ 
          ...prev, 
          isConnected: false, 
          status: 'error' 
        }))
        
        addNotification({
          type: 'error',
          title: 'فشل الاختبار',
          message: data.error || 'فشل في اختبار الاتصال'
        })
      }
    } catch (error) {
      console.error('خطأ في اختبار الاتصال:', error)
      setSettings(prev => ({ 
        ...prev, 
        isConnected: false, 
        status: 'error' 
      }))
      
      addNotification({
        type: 'error',
        title: 'خطأ في الاتصال',
        message: 'فشل في اختبار الاتصال'
      })
    } finally {
      setTesting(false)
    }
  }

  // Save database settings - with protection against multiple calls
  const saveSettings = async () => {
    if (saving) return // Prevent multiple simultaneous saves
    
    if (!connectionString.trim()) {
      addNotification({
        type: 'error',
        title: 'خطأ في الإدخال',
        message: 'يرجى إدخال رابط الاتصال أولاً'
      })
      return
    }

    setSaving(true)
    
    try {
      console.log('💾 بدء حفظ الإعدادات...', { type: settings.type, connectionString: connectionString.substring(0, 50) + '...' })
      
      const response = await fetch('/api/database/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: settings.type,
          connectionString
        })
      })
      
      console.log('📡 استجابة الخادم:', response.status, response.statusText)
      
      const data = await response.json()
      console.log('📄 بيانات الاستجابة:', data)
      
      if (data.success) {
        setSettings(prev => ({ 
          ...prev, 
          connectionString,
          isConnected: false, // Reset connection status after save
          status: 'disconnected'
        }))
        
        addNotification({
          type: 'success',
          title: 'تم الحفظ',
          message: 'تم حفظ إعدادات قاعدة البيانات بنجاح. يمكنك الآن اختبار الاتصال.'
        })
      } else {
        console.error('❌ فشل في الحفظ:', data.error)
        
        // Try direct save as fallback
        console.log('🔄 محاولة الحفظ المباشر كحل بديل...')
        try {
          const directConfig = {
            type: settings.type,
            connectionString: connectionString,
            isConnected: false,
            savedAt: new Date().toISOString(),
            version: '2.0',
            persistent: true
          }
          
          // Save to localStorage as backup
          localStorage.setItem('database-config-backup', JSON.stringify(directConfig))
          
          setSettings(prev => ({ 
            ...prev, 
            connectionString,
            isConnected: false,
            status: 'disconnected'
          }))
          
          addNotification({
            type: 'warning',
            title: 'تم الحفظ محلياً',
            message: 'تم حفظ الإعدادات في المتصفح. استخدم زر "تحميل ملف الإعدادات" لحفظها يدوياً.'
          })
        } catch (directError) {
          console.error('❌ فشل حتى الحفظ المباشر:', directError)
          addNotification({
            type: 'error',
            title: 'خطأ في الحفظ',
            message: data.error || 'فشل في حفظ الإعدادات. يرجى المحاولة مرة أخرى.'
          })
        }
      }
    } catch (error) {
      console.error('❌ خطأ في حفظ الإعدادات:', error)
      
      // Try direct save as fallback
      console.log('🔄 محاولة الحفظ المباشر كحل بديل...')
      try {
        const directConfig = {
          type: settings.type,
          connectionString: connectionString,
          isConnected: false,
          savedAt: new Date().toISOString(),
          version: '2.0',
          persistent: true
        }
        
        // Save to localStorage as backup
        localStorage.setItem('database-config-backup', JSON.stringify(directConfig))
        
        setSettings(prev => ({ 
          ...prev, 
          connectionString,
          isConnected: false,
          status: 'disconnected'
        }))
        
        addNotification({
          type: 'warning',
          title: 'تم الحفظ محلياً',
          message: 'تم حفظ الإعدادات في المتصفح. استخدم زر "تحميل ملف الإعدادات" لحفظها يدوياً.'
        })
      } catch (directError) {
        console.error('❌ فشل حتى الحفظ المباشر:', directError)
        addNotification({
          type: 'error',
          title: 'خطأ في الاتصال',
          message: 'فشل في حفظ الإعدادات. تحقق من اتصال الإنترنت.'
        })
      }
    } finally {
      setSaving(false)
    }
  }

  // Reset database - with protection against multiple calls
  const resetDatabase = async () => {
    if (resetting) return // Prevent multiple simultaneous resets
    
    if (!confirm('هل أنت متأكد من إعادة تهيئة قاعدة البيانات؟ سيتم حذف جميع البيانات!')) {
      return
    }

    setResetting(true)
    
    try {
      const response = await fetch('/api/database/reset-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSettings(prev => ({ 
          ...prev, 
          isConnected: true,
          status: 'connected'
        }))
        
        addNotification({
          type: 'success',
          title: 'تم إعادة التهيئة',
          message: 'تم إعادة تهيئة قاعدة البيانات بنجاح'
        })
      } else {
        addNotification({
          type: 'error',
          title: 'خطأ في إعادة التهيئة',
          message: data.error || 'فشل في إعادة تهيئة قاعدة البيانات'
        })
      }
    } catch (error) {
      console.error('خطأ في إعادة تهيئة قاعدة البيانات:', error)
      addNotification({
        type: 'error',
        title: 'خطأ في الاتصال',
        message: 'فشل في إعادة تهيئة قاعدة البيانات'
      })
    } finally {
      setResetting(false)
    }
  }

  // Handle database type change - simplified
  const handleTypeChange = (type: DatabaseType) => {
    const defaultConnectionString = type === 'sqlite' 
      ? 'file:./prisma/dev.db'
      : 'postgresql://username:password@host:port/database'
    
    setSettings(prev => ({
      ...prev,
      type,
      connectionString: defaultConnectionString,
      isConnected: false,
      status: 'disconnected'
    }))
    setConnectionString(defaultConnectionString)
    
    addNotification({
      type: 'info',
      title: 'تم تغيير نوع قاعدة البيانات',
      message: `تم التبديل إلى ${type === 'sqlite' ? 'SQLite' : 'PostgreSQL'}. احفظ الإعدادات قبل الاختبار.`
    })
  }

  // Initialize - only run once
  useEffect(() => {
    if (initialized || loading === false) return // Prevent multiple initializations
    
    const token = localStorage.getItem('authToken')
    if (!token) {
      router.push('/login')
      return
    }
    
    setInitialized(true)
    loadSettings()
  }, [initialized, loading, loadSettings, router]) // Include all dependencies

  if (loading) {
    return (
      <Layout title="إعدادات قاعدة البيانات" subtitle="إدارة اتصال قاعدة البيانات" icon="🗄️">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">جاري تحميل الإعدادات...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="إعدادات قاعدة البيانات" subtitle="إدارة اتصال قاعدة البيانات" icon="🗄️">
      <NotificationSystem 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
      
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Current Status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            حالة قاعدة البيانات الحالية
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl mb-2">
                {settings.type === 'sqlite' ? '🗃️' : '🐘'}
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                نوع قاعدة البيانات
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {settings.type === 'sqlite' ? 'SQLite' : 'PostgreSQL'}
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl mb-2">
                {settings.status === 'connected' ? '✅' : settings.status === 'error' ? '❌' : '⚠️'}
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                حالة الاتصال
              </h3>
              <StatusBadge status={settings.status || 'disconnected'}>
                {settings.status === 'connected' ? 'متصل' : 
                 settings.status === 'error' ? 'خطأ' : 
                 settings.status === 'loading' ? 'جاري التحميل' : 'غير متصل'}
              </StatusBadge>
            </div>
            
            <div className="text-center">
              <div className="text-2xl mb-2">🕒</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                آخر اختبار
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {settings.lastTested ? 
                  new Date(settings.lastTested).toLocaleString('ar-SA') : 
                  'لم يتم الاختبار'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Database Type Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            اختيار نوع قاعدة البيانات
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DatabaseCard
              type="sqlite"
              isSelected={settings.type === 'sqlite'}
              onSelect={() => handleTypeChange('sqlite')}
              description="قاعدة بيانات محلية سريعة ومناسبة للتطوير والاختبار"
              icon="🗃️"
            />
            
            <DatabaseCard
              type="postgresql"
              isSelected={settings.type === 'postgresql'}
              onSelect={() => handleTypeChange('postgresql')}
              description="قاعدة بيانات خادم قوية ومناسبة للإنتاج والتطبيقات الكبيرة"
              icon="🐘"
            />
          </div>
        </div>

        {/* Connection Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            إعدادات الاتصال
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                رابط الاتصال
              </label>
              <textarea
                value={connectionString}
                onChange={(e) => setConnectionString(e.target.value)}
                placeholder={settings.type === 'sqlite' 
                  ? 'file:./prisma/dev.db' 
                  : 'postgresql://username:password@host:port/database'
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {settings.type === 'sqlite' 
                  ? 'مثال: file:./prisma/dev.db'
                  : 'مثال: postgresql://username:password@host:port/database'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            العمليات
          </h2>
          
          <div className="flex flex-wrap gap-4">
            <ActionButton
              onClick={saveSettings}
              disabled={saving || !connectionString.trim()}
              loading={saving}
              variant="primary"
            >
              💾 حفظ الإعدادات
            </ActionButton>
            
            <ActionButton
              onClick={testConnection}
              disabled={testing || !connectionString.trim()}
              loading={testing}
              variant={settings.isConnected ? 'success' : 'warning'}
            >
              🔍 اختبار الاتصال
            </ActionButton>
            
            <ActionButton
              onClick={resetDatabase}
              disabled={resetting}
              loading={resetting}
              variant="danger"
            >
              🔄 إعادة تهيئة قاعدة البيانات
            </ActionButton>
            
            <ActionButton
              onClick={() => window.location.reload()}
              variant="secondary"
            >
              🔄 إعادة تحميل الصفحة
            </ActionButton>
            
            <ActionButton
              onClick={() => {
                const config = {
                  type: settings.type,
                  connectionString: connectionString,
                  isConnected: false,
                  savedAt: new Date().toISOString(),
                  version: '2.0',
                  persistent: true
                };
                
                const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'database-config.json';
                a.click();
                URL.revokeObjectURL(url);
                
                addNotification({
                  type: 'info',
                  title: 'تم تحميل ملف الإعدادات',
                  message: 'تم تحميل ملف الإعدادات. يمكنك حفظه يدوياً في مجلد المشروع.'
                });
              }}
              variant="secondary"
            >
              📥 تحميل ملف الإعدادات
            </ActionButton>
            
            <ActionButton
              onClick={() => {
                localStorage.removeItem('database-config-backup');
                addNotification({
                  type: 'info',
                  title: 'تم مسح النسخة الاحتياطية',
                  message: 'تم مسح النسخة الاحتياطية من المتصفح.'
                });
              }}
              variant="secondary"
            >
              🗑️ مسح النسخة الاحتياطية
            </ActionButton>
          </div>
        </div>

        {/* Information */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
          <h3 className="font-bold text-blue-900 dark:text-blue-200 mb-4">معلومات مهمة:</h3>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
            <li>• اختبار الاتصال سيقوم بإنشاء الجداول تلقائياً إذا لم تكن موجودة</li>
            <li>• إعادة تهيئة قاعدة البيانات ستحذف جميع البيانات وتعيد إنشاء البيانات الافتراضية</li>
            <li>• تأكد من صحة رابط قاعدة البيانات قبل الحفظ</li>
            <li>• النظام يدعم SQLite للتطوير المحلي و PostgreSQL للإنتاج</li>
            <li>• بعد تغيير نوع قاعدة البيانات، يجب اختبار الاتصال مرة أخرى</li>
            <li>• <strong>ترتيب العمليات:</strong> احفظ الإعدادات أولاً، ثم اختبر الاتصال</li>
            <li>• <strong>في حالة فشل الحفظ:</strong> جرب إعادة تحميل الصفحة أو تحقق من اتصال الإنترنت</li>
            <li>• <strong>للمساعدة:</strong> افتح Developer Tools (F12) وافحص Console للأخطاء</li>
            <li>• <strong>في حالة فشل الحفظ:</strong> تأكد من أن الخادم يعمل وأن لديك صلاحيات الكتابة</li>
            <li>• <strong>حل بديل:</strong> يمكنك تعديل ملف database-config.json يدوياً</li>
            <li>• <strong>النسخة الاحتياطية:</strong> يتم حفظ الإعدادات في المتصفح كنسخة احتياطية</li>
            <li>• <strong>استعادة الإعدادات:</strong> الصفحة تحمل الإعدادات من النسخة الاحتياطية تلقائياً</li>
          </ul>
        </div>
      </div>
    </Layout>
  )
}