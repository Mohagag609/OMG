'use client'

import { useState } from 'react'

interface FormData {
  adminKey: string
  type: 'sqlite' | 'postgresql-local' | 'postgresql-cloud'
  connectionString: string
}

export default function SimpleDbSwitch() {
  const [formData, setFormData] = useState<FormData>({
    adminKey: '',
    type: 'sqlite',
    connectionString: 'file:./prisma/dev.db'
  })
  
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    data?: any
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      console.log('🔄 إرسال البيانات:', formData)
      
      const response = await fetch('/api/database/switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      console.log('📡 Response status:', response.status)
      console.log('📡 Response ok:', response.ok)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('📦 Response data:', data)
      setResult(data)
    } catch (error) {
      console.error('❌ خطأ في الطلب:', error)
      setResult({
        success: false,
        message: `خطأ في الاتصال: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTypeChange = (type: FormData['type']) => {
    setFormData(prev => ({
      ...prev,
      type,
      connectionString: type === 'sqlite' 
        ? 'file:./prisma/dev.db'
        : type === 'postgresql-local'
        ? 'postgresql://postgres:password@localhost:5432/estate_management'
        : ''
    }))
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        تبديل قاعدة البيانات
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Admin Key */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            مفتاح الأدمن
          </label>
          <input
            type="password"
            value={formData.adminKey}
            onChange={(e) => setFormData(prev => ({ ...prev, adminKey: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="أدخل مفتاح الأدمن"
            required
          />
        </div>

        {/* Database Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            نوع قاعدة البيانات
          </label>
          <select
            value={formData.type}
            onChange={(e) => handleTypeChange(e.target.value as FormData['type'])}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="sqlite">SQLite (محلي)</option>
            <option value="postgresql-local">PostgreSQL (محلي)</option>
            <option value="postgresql-cloud">PostgreSQL (سحابي)</option>
          </select>
        </div>

        {/* Connection String */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            رابط قاعدة البيانات
          </label>
          <input
            type="text"
            value={formData.connectionString}
            onChange={(e) => setFormData(prev => ({ ...prev, connectionString: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={
              formData.type === 'sqlite' 
                ? 'file:./prisma/dev.db'
                : formData.type === 'postgresql-local'
                ? 'postgresql://postgres:password@localhost:5432/estate_management'
                : 'postgresql://username:password@host:port/database?sslmode=require'
            }
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            {formData.type === 'sqlite' && 'مثال: file:./prisma/dev.db'}
            {formData.type === 'postgresql-local' && 'مثال: postgresql://postgres:password@localhost:5432/estate_management'}
            {formData.type === 'postgresql-cloud' && 'مثال: postgresql://username:password@host:port/database?sslmode=require'}
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !formData.adminKey || !formData.connectionString}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'جاري التبديل...' : 'تبديل قاعدة البيانات'}
        </button>
      </form>

      {/* Result */}
      {result && (
        <div className={`mt-6 p-4 rounded-md ${
          result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center mb-2">
            <span className={`text-sm font-medium ${
              result.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {result.success ? '✅ نجح' : '❌ فشل'}
            </span>
          </div>
          <p className={`text-sm ${
            result.success ? 'text-green-700' : 'text-red-700'
          }`}>
            {result.message}
          </p>
          {result.data && (
            <div className="mt-2 text-xs text-gray-600">
              <p>النوع: {result.data.type}</p>
              <p>الحالة: {result.data.connected ? 'متصل' : 'غير متصل'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}