'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useNotifications } from './NotificationSystem'

// Interfaces
interface Settings {
  theme: 'dark' | 'light'
  fontSize: number
  language: 'ar' | 'en'
  currency: string
  dateFormat: string
  notifications: boolean
  autoSave: boolean
  backupFrequency: 'daily' | 'weekly' | 'monthly' | 'never'
}

interface DbSettings {
  provider: 'postgresql' | 'sqlite'
  host: string
  port: string
  user: string
  password: string
  database: string
  filePath: string // For SQLite
  ssl: boolean // For PostgreSQL
}

interface SettingsProps {
  onSettingsChange: (settings: Settings) => void
}

// Main Component
export function Settings({ onSettingsChange }: SettingsProps) {
  // Client-side settings state
  const [settings, setSettings] = useState<Settings>({
    theme: 'dark',
    fontSize: 16,
    language: 'ar',
    currency: 'EGP',
    dateFormat: 'DD/MM/YYYY',
    notifications: true,
    autoSave: true,
    backupFrequency: 'weekly'
  })

  // Database settings state
  const [dbSettings, setDbSettings] = useState<DbSettings>({
    provider: 'postgresql',
    host: 'localhost',
    port: '5432',
    user: '',
    password: '',
    database: '',
    filePath: 'prisma/dev.db',
    ssl: false
  })
  const [dbTestResult, setDbTestResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isTestingDb, setIsTestingDb] = useState(false)
  const [isSavingDb, setIsSavingDb] = useState(false)
  const router = useRouter()

  const { addNotification } = useNotifications()

  // Effect for client-side settings
  useEffect(() => {
    const savedSettings = localStorage.getItem('app-settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings(prev => ({ ...prev, ...parsed }))
      } catch (error) {
        console.error('Error loading settings:', error)
      }
    }
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme)
    document.documentElement.style.fontSize = `${settings.fontSize}px`
    localStorage.setItem('app-settings', JSON.stringify(settings))
    onSettingsChange(settings)
  }, [settings, onSettingsChange])

  // Effect for database settings
  useEffect(() => {
    fetch('/api/database/settings')
      .then(res => res.json())
      .then(data => {
        if (data.provider && data.databaseUrl) {
          const parsedUrl = parseDatabaseUrl(data.provider, data.databaseUrl)
          setDbSettings(prev => ({
            ...prev,
            provider: data.provider,
            ...parsedUrl
          }))
        }
      })
      .catch(err => console.error('Failed to fetch DB settings:', err))
  }, [])

  // Handlers for client-side settings
  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    addNotification({ type: 'success', title: 'تم حفظ الإعدادات', message: 'تم تحديث الإعدادات بنجاح' })
  }

  const resetSettings = () => {
    const defaultSettings: Settings = {
      theme: 'dark',
      fontSize: 16,
      language: 'ar',
      currency: 'EGP',
      dateFormat: 'DD/MM/YYYY',
      notifications: true,
      autoSave: true,
      backupFrequency: 'weekly'
    }
    setSettings(defaultSettings)
    addNotification({ type: 'info', title: 'تم إعادة تعيين الإعدادات', message: 'تم استعادة الإعدادات الافتراضية' })
  }

  // Handlers for database settings
  const handleDbInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setDbSettings(prev => ({ ...prev, [name]: value }))
    setDbTestResult(null) // Reset test result on change
  }

  const handleTestConnection = async () => {
    setIsTestingDb(true)
    setDbTestResult(null)
    const databaseUrl = constructDatabaseUrl(dbSettings)

    try {
      const res = await fetch('/api/database/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', provider: dbSettings.provider, databaseUrl })
      })
      const data = await res.json()
      if (res.ok) {
        setDbTestResult({ type: 'success', message: 'تم اختبار الاتصال بنجاح!' })
      } else {
        setDbTestResult({ type: 'error', message: `فشل الاتصال: ${data.error || data.message}` })
      }
    } catch (error: any) {
      setDbTestResult({ type: 'error', message: `حدث خطأ: ${error.message}` })
    } finally {
      setIsTestingDb(false)
    }
  }

  const handleSaveDbSettings = async () => {
    setIsSavingDb(true)
    const databaseUrl = constructDatabaseUrl(dbSettings)

    try {
      const res = await fetch('/api/database/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', provider: dbSettings.provider, databaseUrl })
      })
      const data = await res.json()
      if (res.ok) {
        addNotification({ type: 'success', title: 'تم حفظ الإعدادات بنجاح', message: 'جاري إعادة توجيهك إلى صفحة تسجيل الدخول...' })
        // Use a timeout to allow the user to see the message before redirecting
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      } else {
        addNotification({ type: 'error', title: 'فشل حفظ الإعدادات', message: data.error || data.message })
      }
    } catch (error: any) {
      addNotification({ type: 'error', title: 'خطأ فادح', message: error.message })
    } finally {
      setIsSavingDb(false)
    }
  }


  return (
    <div className="panel">
      <h2>الإعدادات</h2>
      
      <div className="grid-2" style={{ gap: '20px', gridTemplateColumns: '1fr 1fr' }}>
        {/* Client Settings Cards */}
        <div className="card">
          <h3>المظهر</h3>
          <div className="form-group">
            <label className="form-label">السمة</label>
            <select className="select" value={settings.theme} onChange={(e) => updateSetting('theme', e.target.value as 'dark' | 'light')}>
              <option value="dark">داكن</option>
              <option value="light">فاتح</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">حجم الخط</label>
            <select className="select" value={settings.fontSize} onChange={(e) => updateSetting('fontSize', Number(e.target.value))}>
              <option value="14">صغير (14px)</option>
              <option value="16">متوسط (16px)</option>
              <option value="18">كبير (18px)</option>
              <option value="20">كبير جداً (20px)</option>
            </select>
          </div>
        </div>

        <div className="card">
          <h3>اللغة والعملة</h3>
          <div className="form-group">
            <label className="form-label">اللغة</label>
            <select className="select" value={settings.language} onChange={(e) => updateSetting('language', e.target.value as 'ar' | 'en')}>
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">العملة</label>
            <select className="select" value={settings.currency} onChange={(e) => updateSetting('currency', e.target.value)}>
              <option value="EGP">جنيه مصري (EGP)</option>
              <option value="USD">دولار أمريكي (USD)</option>
            </select>
          </div>
        </div>

        {/* Database Settings Card */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h3>إعدادات قاعدة البيانات</h3>
          <div className="form-group">
            <label className="form-label">نوع قاعدة البيانات</label>
            <select className="select" name="provider" value={dbSettings.provider} onChange={handleDbInputChange}>
              <option value="postgresql">PostgreSQL</option>
              <option value="sqlite">SQLite</option>
            </select>
          </div>

          {dbSettings.provider === 'postgresql' && (
            <div className="grid-2">
              <div className="form-group"><label>المضيف</label><input type="text" name="host" value={dbSettings.host} onChange={handleDbInputChange} className="input"/></div>
              <div className="form-group"><label>المنفذ</label><input type="text" name="port" value={dbSettings.port} onChange={handleDbInputChange} className="input"/></div>
              <div className="form-group"><label>المستخدم</label><input type="text" name="user" value={dbSettings.user} onChange={handleDbInputChange} className="input"/></div>
              <div className="form-group"><label>كلمة المرور</label><input type="password" name="password" value={dbSettings.password} onChange={handleDbInputChange} className="input"/></div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>اسم القاعدة</label><input type="text" name="database" value={dbSettings.database} onChange={handleDbInputChange} className="input"/></div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="ssl"
                    checked={dbSettings.ssl}
                    onChange={(e) => setDbSettings(prev => ({ ...prev, ssl: e.target.checked }))}
                  />
                  تفعيل اتصال آمن (SSL)
                </label>
              </div>
            </div>
          )}

          {dbSettings.provider === 'sqlite' && (
            <div className="form-group">
              <label>مسار الملف</label>
              <input type="text" name="filePath" value={dbSettings.filePath} onChange={handleDbInputChange} className="input" placeholder="e.g., prisma/dev.db" />
            </div>
          )}

          {dbTestResult && (
            <div className={`alert ${dbTestResult.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginTop: '15px' }}>
              {dbTestResult.message}
            </div>
          )}

          <div className="tools" style={{ marginTop: '20px', justifyContent: 'flex-end' }}>
            <button className="btn" onClick={handleTestConnection} disabled={isTestingDb}>
              {isTestingDb ? 'جاري الاختبار...' : 'اختبار الاتصال'}
            </button>
            <button className="btn primary" onClick={handleSaveDbSettings} disabled={isSavingDb}>
              {isSavingDb ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
            </button>
          </div>
        </div>

      </div>

      <div className="tools" style={{ marginTop: '20px' }}>
        <button className="btn secondary" onClick={resetSettings}>
          إعادة تعيين الإعدادات العامة
        </button>
      </div>
    </div>
  )
}

// Helper functions
function parseDatabaseUrl(provider: string, url: string): Partial<DbSettings> {
  const settings: Partial<DbSettings> = {}
  if (provider === 'postgresql') {
    try {
      const parsed = new URL(url)
      settings.host = parsed.hostname
      settings.port = parsed.port
      settings.user = parsed.username
      settings.password = parsed.password
      settings.database = parsed.pathname.slice(1)
      settings.ssl = parsed.searchParams.get('sslmode') === 'require'
    } catch (e) {
      console.error("Invalid PostgreSQL URL, couldn't parse:", url)
    }
  } else if (provider === 'sqlite') {
    settings.filePath = url.replace(/^file:/, '')
  }
  return settings
}

function constructDatabaseUrl(settings: DbSettings): string {
  if (settings.provider === 'postgresql') {
    let url = `postgresql://${settings.user}:${settings.password}@${settings.host}:${settings.port}/${settings.database}`
    if (settings.ssl) {
      url += '?sslmode=require'
    }
    return url
  } else {
    // Ensure it starts with "file:"
    return settings.filePath.startsWith('file:') ? settings.filePath : `file:${settings.filePath}`
  }
}