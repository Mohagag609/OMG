'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { NotificationSystem, useNotifications } from '@/components/NotificationSystem'
import Layout from '@/components/Layout'

// Modern UI Components
const ModernButton = ({ children, onClick, disabled = false, variant = 'primary', className = '' }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
      variant === 'primary' 
        ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400' 
        : variant === 'success'
        ? 'bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400'
        : variant === 'warning'
        ? 'bg-yellow-600 text-white hover:bg-yellow-700 disabled:bg-gray-400'
        : variant === 'danger'
        ? 'bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400'
        : 'bg-gray-600 text-white hover:bg-gray-700 disabled:bg-gray-400'
    } ${className}`}
  >
    {children}
  </button>
)

const ModernInput = ({ label, type = 'text', value, onChange, placeholder, required = false, disabled = false }: any) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
    />
  </div>
)

const ModernSelect = ({ label, value, onChange, children }: any) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
    </label>
    <select
      value={value}
      onChange={onChange}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
    >
      {children}
    </select>
  </div>
)

interface DatabaseSettings {
  type: 'sqlite' | 'postgresql'
  connectionString: string
  isConnected: boolean
  lastTested?: string
}

export default function DatabaseSettings() {
  const [settings, setSettings] = useState<DatabaseSettings>({
    type: 'sqlite',
    connectionString: '',
    isConnected: false
  })
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [tempConnectionString, setTempConnectionString] = useState('')
  
  const router = useRouter()
  const { notifications, addNotification, removeNotification } = useNotifications()

  const loadDatabaseSettings = useCallback(async () => {
    try {
      console.log('📋 تحميل إعدادات قاعدة البيانات...')
      const response = await fetch('/api/database/settings')
      
      const data = await response.json()
      if (data.success && data.data) {
        setSettings(data.data)
        setTempConnectionString(data.data.connectionString)
        console.log('✅ تم تحميل الإعدادات:', data.data.type)
      } else {
        // إعدادات افتراضية - SQLite
        const defaultConnectionString = 'file:./prisma/dev.db'
        setSettings({
          type: 'sqlite',
          connectionString: defaultConnectionString,
          isConnected: false
        })
        setTempConnectionString(defaultConnectionString)
        console.log('📋 استخدام الإعدادات الافتراضية')
      }
    } catch (err) {
      console.error('❌ خطأ في تحميل الإعدادات:', err)
      // إعدادات افتراضية في حالة الخطأ
      const defaultConnectionString = 'file:./prisma/dev.db'
      setSettings({
        type: 'sqlite',
        connectionString: defaultConnectionString,
        isConnected: false
      })
      setTempConnectionString(defaultConnectionString)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      router.push('/login')
      return
    }
    
    loadDatabaseSettings()
  }, [router, loadDatabaseSettings])

  const testConnection = async () => {
    setTesting(true)
    try {
      console.log('🔍 اختبار الاتصال...')
      const response = await fetch('/api/database/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connectionString: tempConnectionString,
          type: settings.type
        })
      })
      
      const data = await response.json()
      if (data.success) {
        setSettings(prev => ({ ...prev, isConnected: true }))
        addNotification({
          type: 'success',
          title: 'نجح الاختبار',
          message: 'تم اختبار الاتصال وإنشاء الجداول بنجاح'
        })
      } else {
        setSettings(prev => ({ ...prev, isConnected: false }))
        addNotification({
          type: 'error',
          title: 'فشل الاختبار',
          message: data.error || 'فشل في اختبار الاتصال'
        })
      }
    } catch (err) {
      console.error('❌ خطأ في اختبار الاتصال:', err)
      setSettings(prev => ({ ...prev, isConnected: false }))
      addNotification({
        type: 'error',
        title: 'خطأ في الاتصال',
        message: 'فشل في اختبار الاتصال'
      })
    } finally {
      setTesting(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      console.log('💾 حفظ الإعدادات...')
      const response = await fetch('/api/database/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: settings.type,
          connectionString: tempConnectionString
        })
      })
      
      const data = await response.json()
      if (data.success) {
        setSettings(prev => ({ 
          ...prev, 
          connectionString: tempConnectionString,
          isConnected: false 
        }))
        addNotification({
          type: 'success',
          title: 'تم الحفظ',
          message: 'تم حفظ إعدادات قاعدة البيانات بنجاح'
        })
      } else {
        addNotification({
          type: 'error',
          title: 'خطأ في الحفظ',
          message: data.error || 'فشل في حفظ الإعدادات'
        })
      }
    } catch (err) {
      console.error('❌ خطأ في حفظ الإعدادات:', err)
      addNotification({
        type: 'error',
        title: 'خطأ في الاتصال',
        message: 'فشل في حفظ الإعدادات'
      })
    } finally {
      setSaving(false)
    }
  }

  const resetDatabase = async () => {
    if (!confirm('هل أنت متأكد من إعادة تهيئة قاعدة البيانات؟ سيتم حذف جميع البيانات!')) {
      return
    }

    setResetting(true)
    try {
      console.log('🔄 إعادة تهيئة قاعدة البيانات...')
      const response = await fetch('/api/database/reset-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      const data = await response.json()
      if (data.success) {
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
    } catch (err) {
      console.error('❌ خطأ في إعادة تهيئة قاعدة البيانات:', err)
      addNotification({
        type: 'error',
        title: 'خطأ في الاتصال',
        message: 'فشل في إعادة تهيئة قاعدة البيانات'
      })
    } finally {
      setResetting(false)
    }
  }

  const handleTypeChange = (type: 'sqlite' | 'postgresql') => {
    const newConnectionString = type === 'sqlite' 
      ? 'file:./prisma/dev.db'
      : 'postgresql://neondb_owner:npg_ZBrYxkMEL91f@ep-mute-violet-ad0dmo9y-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
    
    setSettings(prev => ({
      ...prev,
      type,
      connectionString: newConnectionString,
      isConnected: false
    }))
    setTempConnectionString(newConnectionString)
    
    addNotification({
      type: 'info',
      title: 'تم تغيير نوع قاعدة البيانات',
      message: `تم التبديل إلى ${type === 'sqlite' ? 'SQLite' : 'PostgreSQL'}`
    })
  }

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
      
      <div className="max-w-4xl mx-auto space-y-6">
        {/* معلومات الاتصال الحالية */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            حالة الاتصال الحالية
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                نوع قاعدة البيانات
              </label>
              <div className={`px-3 py-2 rounded-lg ${
                settings.type === 'postgresql' 
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                  : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              }`}>
                {settings.type === 'postgresql' ? 'PostgreSQL' : 'SQLite'}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                حالة الاتصال
              </label>
              <div className={`px-3 py-2 rounded-lg ${
                settings.isConnected 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {settings.isConnected ? 'متصل' : 'غير متصل'}
              </div>
            </div>
          </div>
        </div>

        {/* إعدادات قاعدة البيانات */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            إعدادات قاعدة البيانات
          </h2>
          
          <div className="space-y-6">
            {/* نوع قاعدة البيانات */}
            <ModernSelect
              label="نوع قاعدة البيانات"
              value={settings.type}
              onChange={(e: any) => handleTypeChange(e.target.value)}
            >
              <option value="sqlite">SQLite (محلي)</option>
              <option value="postgresql">PostgreSQL (خادم)</option>
            </ModernSelect>

            {/* رابط الاتصال */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                رابط الاتصال
              </label>
              <div className="flex items-center space-x-2 space-x-reverse">
                <input
                  type="text"
                  value={tempConnectionString}
                  onChange={(e: any) => setTempConnectionString(e.target.value)}
                  placeholder={settings.type === 'sqlite' 
                    ? 'file:./prisma/dev.db' 
                    : 'postgresql://neondb_owner:npg_ZBrYxkMEL91f@ep-mute-violet-ad0dmo9y-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
                  }
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white border-gray-300 dark:border-gray-600"
                  required
                />
                <button
                  type="button"
                  onClick={() => {
                    setSettings(prev => ({ ...prev, connectionString: tempConnectionString }))
                    addNotification({
                      type: 'success',
                      title: 'تم الحفظ',
                      message: 'تم حفظ رابط قاعدة البيانات بنجاح'
                    })
                  }}
                  className="px-3 py-2 text-sm font-medium rounded-lg border bg-green-100 text-green-700 border-green-300 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-700 transition-colors"
                >
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTempConnectionString(settings.connectionString)
                  }}
                  className="px-3 py-2 text-sm font-medium rounded-lg border bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700 transition-colors"
                >
                  إلغاء
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                يمكنك تعديل رابط قاعدة البيانات مباشرة أو استخدام الأزرار أدناه
              </p>
            </div>

            {/* أمثلة */}
            <div className="bg-blue-50 rounded-xl p-4">
              <h4 className="font-bold text-blue-900 mb-2">أمثلة على روابط الاتصال:</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>SQLite:</strong> file:./prisma/dev.db</p>
                <p><strong>PostgreSQL:</strong> postgresql://username:password@host:port/database</p>
              </div>
            </div>
          </div>
        </div>

        {/* أزرار التحكم */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            العمليات
          </h2>
          
          <div className="flex flex-wrap gap-4">
            <ModernButton 
              onClick={testConnection}
              disabled={testing || !tempConnectionString}
              variant={settings.isConnected ? 'success' : 'warning'}
            >
              {testing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  جاري الاختبار...
                </>
              ) : (
                <>
                  🔍 اختبار الاتصال
                </>
              )}
            </ModernButton>

            <ModernButton 
              onClick={saveSettings}
              disabled={saving}
              variant="primary"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  جاري الحفظ...
                </>
              ) : (
                <>
                  💾 حفظ الإعدادات
                </>
              )}
            </ModernButton>

            <ModernButton 
              onClick={resetDatabase}
              disabled={resetting}
              variant="danger"
            >
              {resetting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  جاري إعادة التهيئة...
                </>
              ) : (
                <>
                  🔄 إعادة تهيئة قاعدة البيانات
                </>
              )}
            </ModernButton>
          </div>
        </div>

        {/* معلومات إضافية */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">معلومات مهمة:</h3>
          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <li>• اختبار الاتصال سيقوم بإنشاء الجداول تلقائياً إذا لم تكن موجودة</li>
            <li>• إعادة تهيئة قاعدة البيانات ستحذف جميع البيانات وتعيد إنشاء البيانات الافتراضية</li>
            <li>• تأكد من صحة رابط قاعدة البيانات قبل الحفظ</li>
            <li>• النظام يدعم SQLite للتطوير المحلي و PostgreSQL للإنتاج</li>
          </ul>
        </div>
      </div>
    </Layout>
  )
}