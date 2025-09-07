'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// واجهة البيانات
interface DbInfo {
  url: string
  dbType: string
  isConnected: boolean
  connectionMessage: string
}

// مكون صفحة إدارة قاعدة البيانات
export default function DbSettingsPage() {
  const router = useRouter()
  const [dbInfo, setDbInfo] = useState<DbInfo | null>(null)
  const [newUrl, setNewUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [creatingTables, setCreatingTables] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null)

  // تحميل معلومات قاعدة البيانات الحالية
  const loadDbInfo = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/get-db-url')
      const data = await response.json()

      if (data.success) {
        setDbInfo(data.data)
        setNewUrl(data.data.url)
      } else {
        setMessage({ type: 'error', text: data.error || 'فشل في تحميل معلومات قاعدة البيانات' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: `خطأ في تحميل المعلومات: ${error.message}` })
    } finally {
      setLoading(false)
    }
  }

  // إنشاء الجداول في قاعدة البيانات الحالية
  const createTables = async () => {
    try {
      setCreatingTables(true)
      const response = await fetch('/api/admin/create-tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', text: `تم إنشاء الجداول بنجاح في ${data.dbType}` })
      } else {
        setMessage({ type: 'error', text: data.error || 'فشل في إنشاء الجداول' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: `خطأ في إنشاء الجداول: ${error.message}` })
    } finally {
      setCreatingTables(false)
    }
  }

  // حفظ URL قاعدة البيانات الجديد
  const saveDbUrl = async () => {
    if (!newUrl.trim()) {
      setMessage({ type: 'error', text: 'يرجى إدخال URL قاعدة البيانات' })
      return
    }

    try {
      setSaving(true)
      const response = await fetch('/api/admin/set-db-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl })
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', text: data.message })
        // إعادة تحميل المعلومات
        await loadDbInfo()
      } else {
        setMessage({ 
          type: data.warning ? 'warning' : 'error', 
          text: data.error || data.warning || 'فشل في حفظ URL قاعدة البيانات' 
        })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: `خطأ في الحفظ: ${error.message}` })
    } finally {
      setSaving(false)
    }
  }

  // تحميل المعلومات عند تحميل الصفحة
  useEffect(() => {
    loadDbInfo()
  }, [])

  // إخفاء الرسالة بعد 5 ثواني
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                إدارة قاعدة البيانات
              </h1>
              <p className="text-gray-600">
                تغيير قاعدة البيانات الحالية بدون إعادة نشر
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              العودة
            </button>
          </div>
        </div>

        {/* Current Database Info */}
        {dbInfo && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              قاعدة البيانات الحالية
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  نوع قاعدة البيانات
                </label>
                <div className="flex items-center">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    dbInfo.dbType === 'postgresql' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {dbInfo.dbType === 'postgresql' ? 'PostgreSQL' : 'SQLite'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  حالة الاتصال
                </label>
                <div className="flex items-center">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    dbInfo.isConnected 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {dbInfo.isConnected ? 'متصل' : 'غير متصل'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL قاعدة البيانات
              </label>
              <div className="bg-gray-50 p-3 rounded-lg font-mono text-sm break-all">
                {dbInfo.url}
              </div>
            </div>

            {!dbInfo.isConnected && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">
                  <strong>تحذير:</strong> {dbInfo.connectionMessage}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Change Database */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            تغيير قاعدة البيانات
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL قاعدة البيانات الجديد
              </label>
              <input
                type="text"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="postgres://user:pass@host:port/db?sslmode=require"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={saving}
              />
              <p className="mt-2 text-sm text-gray-600">
                أمثلة صحيحة:
                <br />
                • <code className="bg-gray-100 px-2 py-1 rounded">postgres://user:pass@localhost:5432/mydb</code>
                <br />
                • <code className="bg-gray-100 px-2 py-1 rounded">postgresql://user:pass@neon-host/db?sslmode=require</code>
                <br />
                • <code className="bg-gray-100 px-2 py-1 rounded">sqlite://./local.db</code>
              </p>
            </div>

            <div className="flex items-center space-x-4 space-x-reverse">
              <button
                onClick={saveDbUrl}
                disabled={saving || !newUrl.trim()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
              >
                {saving ? 'جاري الحفظ...' : 'حفظ التغيير'}
              </button>

              <button
                onClick={loadDbInfo}
                disabled={loading}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                {loading ? 'جاري التحديث...' : 'تحديث'}
              </button>
            </div>
          </div>
        </div>

        {/* Create Tables Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            إدارة الجداول
          </h2>
          <p className="text-gray-600 mb-4">
            إنشاء الجداول المطلوبة في قاعدة البيانات الحالية
          </p>
          
          <button
            onClick={createTables}
            disabled={creatingTables}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
          >
            {creatingTables ? 'جاري إنشاء الجداول...' : 'إنشاء الجداول'}
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200'
              : message.type === 'warning'
              ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            <div className="flex items-center">
              <span className="mr-2">
                {message.type === 'success' ? '✅' : message.type === 'warning' ? '⚠️' : '❌'}
              </span>
              <span className="font-medium">{message.text}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}