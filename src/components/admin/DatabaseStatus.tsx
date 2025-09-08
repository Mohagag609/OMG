'use client'

import { useState, useEffect } from 'react'

interface DatabaseStatus {
  type: string
  connectionString: string
  isConnected: boolean
  lastTested: string
  environment: {
    DATABASE_URL: string
    DATABASE_TYPE: string
  }
}

export default function DatabaseStatus() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/database/status')
      const data = await response.json()
      
      if (data.success) {
        setStatus(data.data)
        setError(null)
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError(`خطأ في تحميل الحالة: ${err instanceof Error ? err.message : 'خطأ غير معروف'}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStatus()
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">حالة قاعدة البيانات</h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-red-800 mb-4">خطأ في تحميل الحالة</h3>
        <p className="text-red-700">{error}</p>
        <button 
          onClick={loadStatus}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          إعادة المحاولة
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-800">حالة قاعدة البيانات</h3>
        <button 
          onClick={loadStatus}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          تحديث
        </button>
      </div>
      
      {status && (
        <div className="space-y-3">
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-700 w-24">النوع:</span>
            <span className="text-sm text-gray-600">{status.type}</span>
          </div>
          
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-700 w-24">الحالة:</span>
            <span className={`text-sm ${status.isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {status.isConnected ? '✅ متصل' : '❌ غير متصل'}
            </span>
          </div>
          
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-700 w-24">الرابط:</span>
            <span className="text-sm text-gray-600 font-mono">{status.connectionString}</span>
          </div>
          
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-700 w-24">آخر اختبار:</span>
            <span className="text-sm text-gray-600">
              {new Date(status.lastTested).toLocaleString('ar-SA')}
            </span>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">متغيرات البيئة:</h4>
            <div className="space-y-1">
              <div className="flex items-center">
                <span className="text-xs text-gray-600 w-20">DATABASE_URL:</span>
                <span className={`text-xs ${status.environment.DATABASE_URL === 'موجود' ? 'text-green-600' : 'text-red-600'}`}>
                  {status.environment.DATABASE_URL}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-xs text-gray-600 w-20">DATABASE_TYPE:</span>
                <span className="text-xs text-gray-600">{status.environment.DATABASE_TYPE}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}