'use client'

import { useState, useEffect } from 'react'
import { testDatabaseConnection, getDatabaseConfig, DATABASE_CONFIGS } from '@/lib/database'

export default function DatabaseSettingsPage() {
  const [currentConfig, setCurrentConfig] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadCurrentConfig()
  }, [])

  const loadCurrentConfig = async () => {
    try {
      const result = await testDatabaseConnection()
      setCurrentConfig(result.config)
    } catch (error) {
      console.error('Error loading config:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const switchDatabase = async (dbType: 'sqlite' | 'postgresql') => {
    setIsLoading(true)
    setMessage('')
    
    try {
      const response = await fetch('/api/database/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ databaseType: dbType })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setMessage(`✅ تم التبديل إلى ${DATABASE_CONFIGS[dbType].name} بنجاح`)
        await loadCurrentConfig()
      } else {
        setMessage(`❌ فشل التبديل: ${result.error}`)
      }
    } catch (error) {
      setMessage(`❌ خطأ: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">إعدادات قاعدة البيانات</h1>
            <p className="text-gray-600 mt-2">إدارة وإعداد قواعد البيانات المختلفة</p>
          </div>

          <div className="p-6">
            {message && (
              <div className={`mb-6 p-4 rounded-lg ${
                message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {message}
              </div>
            )}

            {/* Current Database Status */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">قاعدة البيانات الحالية</h2>
              {currentConfig && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-blue-900">{currentConfig.name}</h3>
                      <p className="text-blue-700 text-sm mt-1">{currentConfig.description}</p>
                      <p className="text-blue-600 text-xs mt-2 font-mono">{currentConfig.url}</p>
                    </div>
                    <div className="text-green-600">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Database Options */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">التبديل بين قواعد البيانات</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(DATABASE_CONFIGS).map(([key, config]) => (
                  <div key={key} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900">{config.name}</h3>
                        <p className="text-gray-600 text-sm mt-1">{config.description}</p>
                      </div>
                      {currentConfig?.type === key && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          نشط
                        </span>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded mb-3">
                      {config.url}
                    </div>
                    
                    <button
                      onClick={() => switchDatabase(key as 'sqlite' | 'postgresql')}
                      disabled={isLoading || currentConfig?.type === key}
                      className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentConfig?.type === key
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isLoading ? 'جاري التبديل...' : 'التبديل إلى هذا النوع'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-medium text-yellow-900 mb-2">تعليمات مهمة:</h3>
              <ul className="text-yellow-800 text-sm space-y-1">
                <li>• عند التبديل إلى PostgreSQL، تأكد من تثبيت وتشغيل PostgreSQL</li>
                <li>• استخدم الأمر <code className="bg-yellow-100 px-1 rounded">npm run setup-postgresql</code> لإعداد PostgreSQL</li>
                <li>• بعد التبديل، استخدم <code className="bg-yellow-100 px-1 rounded">npm run db:push</code> لتطبيق المخطط</li>
                <li>• استخدم <code className="bg-yellow-100 px-1 rounded">npm run db:seed</code> لإدراج البيانات التجريبية</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}