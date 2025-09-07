'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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

const ModernInput = ({ label, className = '', ...props }: any) => (
  <div className="space-y-2">
    {label && <label className="text-sm font-bold text-gray-900">{label}</label>}
    <input 
      className={`w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 font-bold placeholder:text-gray-500 placeholder:font-normal ${className}`}
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

interface DatabaseSettings {
  type: 'sqlite' | 'postgresql'
  connectionString: string
  isConnected: boolean
  lastTested?: string
}

export default function DatabaseSettings() {
  const [settings, setSettings] = useState<DatabaseSettings>({
    type: 'postgresql',
    connectionString: '',
    isConnected: false
  })
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const router = useRouter()
  const { notifications, addNotification, removeNotification } = useNotifications()

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      router.push('/login')
      return
    }
    
    loadDatabaseSettings()
  }, [])

  const loadDatabaseSettings = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/database/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      const data = await response.json()
      if (data.success) {
        setSettings(data.data)
      } else {
        // إعدادات افتراضية
        setSettings({
          type: 'postgresql',
          connectionString: 'postgresql://username:password@host:port/database',
          isConnected: false
        })
      }
    } catch (err) {
      console.error('Error loading database settings:', err)
      addNotification({
        type: 'error',
        title: 'خطأ في التحميل',
        message: 'فشل في تحميل إعدادات قاعدة البيانات'
      })
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async () => {
    setTesting(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/database/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: settings.type,
          connectionString: settings.connectionString
        })
      })

      const data = await response.json()
      if (data.success) {
        setSettings(prev => ({
          ...prev,
          isConnected: true,
          lastTested: new Date().toLocaleString('ar-SA')
        }))
        addNotification({
          type: 'success',
          title: 'تم ربط القاعدة بنجاح!',
          message: `تم الاتصال بقاعدة البيانات ${settings.type === 'sqlite' ? 'SQLite' : 'PostgreSQL'} بنجاح`
        })
      } else {
        setSettings(prev => ({
          ...prev,
          isConnected: false
        }))
        addNotification({
          type: 'error',
          title: 'فشل في الاتصال',
          message: data.error || 'فشل في الاتصال بقاعدة البيانات'
        })
      }
    } catch (err) {
      console.error('Error testing connection:', err)
      addNotification({
        type: 'error',
        title: 'خطأ في الاختبار',
        message: 'فشل في اختبار الاتصال بقاعدة البيانات'
      })
    } finally {
      setTesting(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/database/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      })

      const data = await response.json()
      if (data.success) {
        addNotification({
          type: 'success',
          title: 'تم الحفظ بنجاح',
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
      console.error('Error saving settings:', err)
      addNotification({
        type: 'error',
        title: 'خطأ في الحفظ',
        message: 'فشل في حفظ إعدادات قاعدة البيانات'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleTypeChange = (type: 'sqlite' | 'postgresql') => {
    setSettings(prev => ({
      ...prev,
      type,
      connectionString: type === 'sqlite' 
        ? 'file:./prisma/dev.db'
        : 'postgresql://username:password@host:port/database',
      isConnected: false
    }))
  }

  if (loading) {
    return (
      <Layout title="إعدادات قاعدة البيانات" subtitle="إدارة اتصال قاعدة البيانات" icon="🗄️">
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
    <Layout title="إعدادات قاعدة البيانات" subtitle="إدارة اتصال قاعدة البيانات" icon="🗄️">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* حالة الاتصال */}
        <ModernCard>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">حالة الاتصال</h2>
            <div className={`px-4 py-2 rounded-xl font-bold ${
              settings.isConnected 
                ? 'bg-green-100 text-green-900' 
                : 'bg-red-100 text-red-900'
            }`}>
              {settings.isConnected ? '✅ متصل' : '❌ غير متصل'}
            </div>
          </div>
          
          {settings.lastTested && (
            <div className="text-sm text-gray-600">
              آخر اختبار: {settings.lastTested}
            </div>
          )}
        </ModernCard>

        {/* إعدادات قاعدة البيانات */}
        <ModernCard>
          <h2 className="text-xl font-bold text-gray-900 mb-6">إعدادات قاعدة البيانات</h2>
          
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

            {/* معلومات قاعدة البيانات */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-bold text-gray-900 mb-3">
                {settings.type === 'sqlite' ? 'SQLite' : 'PostgreSQL'} - معلومات الاتصال
              </h3>
              
              {settings.type === 'sqlite' ? (
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    <strong>المسار:</strong> ملف قاعدة البيانات المحلي
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>المميزات:</strong> سريع، لا يحتاج خادم، مناسب للتطوير
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    <strong>الخادم:</strong> خادم قاعدة بيانات خارجي
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>المميزات:</strong> قوي، يدعم عدة مستخدمين، مناسب للإنتاج
                  </div>
                </div>
              )}
            </div>

            {/* رابط الاتصال */}
            <ModernInput
              label="رابط الاتصال"
              type="text"
              value={settings.connectionString}
              onChange={(e: any) => setSettings(prev => ({ ...prev, connectionString: e.target.value }))}
              placeholder={settings.type === 'sqlite' 
                ? 'file:./prisma/dev.db' 
                : 'postgresql://username:password@host:port/database'
              }
            />

            {/* أمثلة */}
            <div className="bg-blue-50 rounded-xl p-4">
              <h4 className="font-bold text-blue-900 mb-2">أمثلة على روابط الاتصال:</h4>
              <div className="text-sm text-blue-800 space-y-1">
                {settings.type === 'sqlite' ? (
                  <>
                    <div><code>file:./prisma/dev.db</code> - ملف محلي</div>
                    <div><code>file:/absolute/path/to/database.db</code> - مسار مطلق</div>
                  </>
                ) : (
                  <>
                    <div><code>postgresql://user:pass@localhost:5432/dbname</code> - محلي</div>
                    <div><code>postgresql://user:pass@host.com:5432/dbname?sslmode=require</code> - خارجي مع SSL</div>
                  </>
                )}
              </div>
            </div>
          </div>
        </ModernCard>

        {/* أزرار التحكم */}
        <ModernCard>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <ModernButton 
                onClick={testConnection}
                disabled={testing || !settings.connectionString}
                variant={settings.isConnected ? 'success' : 'warning'}
              >
                {testing ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    جاري الاختبار...
                  </>
                ) : (
                  <>
                    <span className="mr-2">🔍</span>
                    اختبار الاتصال
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
                    <span className="animate-spin mr-2">⏳</span>
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <span className="mr-2">💾</span>
                    حفظ الإعدادات
                  </>
                )}
              </ModernButton>
            </div>

            <div className="text-sm text-gray-500">
              {settings.isConnected ? '✅ تم ربط القاعدة بنجاح' : '❌ غير متصل'}
            </div>
          </div>
        </ModernCard>

        {/* معلومات إضافية */}
        <ModernCard>
          <h3 className="text-lg font-bold text-gray-900 mb-4">معلومات إضافية</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div>
              <strong>SQLite:</strong> قاعدة بيانات خفيفة وسريعة، مناسبة للتطوير والاختبار
            </div>
            <div>
              <strong>PostgreSQL:</strong> قاعدة بيانات قوية ومتقدمة، مناسبة للإنتاج والتطبيقات الكبيرة
            </div>
            <div className="text-yellow-600 font-medium">
              ⚠️ تأكد من صحة رابط الاتصال قبل الحفظ
            </div>
          </div>
        </ModernCard>
      </div>
      
      <NotificationSystem 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </Layout>
  )
}