'use client'

import { useState } from 'react'
import { DbType } from '@/lib/env'

interface DbSettingsFormProps {
  className?: string
}

interface FormData {
  adminKey: string
  type: DbType
  seed: boolean
  pg: {
    host: string
    port: string
    user: string
    password: string
    database: string
  }
  cloudUrl: string
}

interface ApiResponse {
  ok: boolean
  message: string
  redeployTriggered?: boolean
  logs?: string[]
}

export default function DbSettingsForm({ className = '' }: DbSettingsFormProps) {
  const [formData, setFormData] = useState<FormData>({
    adminKey: '',
    type: 'sqlite',
    seed: false,
    pg: {
      host: 'localhost',
      port: '5432',
      user: 'postgres',
      password: '',
      database: 'estate_management'
    },
    cloudUrl: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [showLogs, setShowLogs] = useState(false)

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePgChange = (field: keyof FormData['pg'], value: string) => {
    setFormData(prev => ({
      ...prev,
      pg: {
        ...prev.pg,
        [field]: value
      }
    }))
  }

  const handleSubmit = async (action: 'init' | 'switch' | 'wipe') => {
    setLoading(true)
    setResponse(null)
    setShowLogs(false)

    try {
      let endpoint = ''
      let payload: any = {}

      switch (action) {
        case 'init':
          endpoint = '/api/db-admin/init'
          payload = {
            type: formData.type,
            mode: 'new',
            seed: formData.seed,
            ...(formData.type === 'postgresql-local' && { pg: formData.pg }),
            ...(formData.type === 'postgresql-cloud' && { cloudUrl: formData.cloudUrl })
          }
          break
        case 'switch':
          endpoint = '/api/db-admin/switch'
          payload = {
            type: formData.type,
            seed: formData.seed,
            ...(formData.type === 'postgresql-local' && { pg: formData.pg }),
            ...(formData.type === 'postgresql-cloud' && { cloudUrl: formData.cloudUrl })
          }
          break
        case 'wipe':
          endpoint = '/api/db-admin/wipe'
          payload = { confirm: true }
          break
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': formData.adminKey
        },
        body: JSON.stringify(payload)
      })

      const data: ApiResponse = await res.json()
      setResponse(data)
      
      if (data.logs && data.logs.length > 0) {
        setShowLogs(true)
      }
    } catch (error) {
      setResponse({
        ok: false,
        message: error instanceof Error ? error.message : 'خطأ في الاتصال'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        إعدادات قاعدة البيانات
      </h2>

      {/* Admin Key */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          مفتاح الأدمن
        </label>
        <input
          type="password"
          value={formData.adminKey}
          onChange={(e) => handleInputChange('adminKey', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="أدخل مفتاح الأدمن"
        />
      </div>

      {/* Database Type */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          نوع قاعدة البيانات
        </label>
        <select
          value={formData.type}
          onChange={(e) => handleInputChange('type', e.target.value as DbType)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="sqlite">SQLite (محلي)</option>
          <option value="postgresql-local">PostgreSQL (محلي)</option>
          <option value="postgresql-cloud">PostgreSQL (سحابي)</option>
        </select>
      </div>

      {/* PostgreSQL Local Configuration */}
      {formData.type === 'postgresql-local' && (
        <div className="mb-6 p-4 bg-gray-50 rounded-md">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            إعدادات PostgreSQL المحلي
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Host
              </label>
              <input
                type="text"
                value={formData.pg.host}
                onChange={(e) => handlePgChange('host', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Port
              </label>
              <input
                type="text"
                value={formData.pg.port}
                onChange={(e) => handlePgChange('port', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={formData.pg.user}
                onChange={(e) => handlePgChange('user', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={formData.pg.password}
                onChange={(e) => handlePgChange('password', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Database Name
              </label>
              <input
                type="text"
                value={formData.pg.database}
                onChange={(e) => handlePgChange('database', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* PostgreSQL Cloud Configuration */}
      {formData.type === 'postgresql-cloud' && (
        <div className="mb-6 p-4 bg-gray-50 rounded-md">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            إعدادات PostgreSQL السحابي
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Database URL
            </label>
            <input
              type="text"
              value={formData.cloudUrl}
              onChange={(e) => handleInputChange('cloudUrl', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="postgresql://username:password@host:port/database?sslmode=require"
            />
          </div>
        </div>
      )}

      {/* Seed Option */}
      <div className="mb-6">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.seed}
            onChange={(e) => handleInputChange('seed', e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm font-medium text-gray-700">
            زرع بيانات تجريبية (اختياري)
          </span>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={() => handleSubmit('init')}
          disabled={loading || !formData.adminKey}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'جاري التحميل...' : 'تهيئة قاعدة جديدة'}
        </button>
        
        <button
          onClick={() => handleSubmit('switch')}
          disabled={loading || !formData.adminKey}
          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'جاري التحميل...' : 'التبديل للقاعدة'}
        </button>
        
        <button
          onClick={() => handleSubmit('wipe')}
          disabled={loading || !formData.adminKey}
          className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'جاري التحميل...' : 'مسح القاعدة'}
        </button>
      </div>

      {/* Response */}
      {response && (
        <div className={`p-4 rounded-md ${
          response.ok ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center mb-2">
            <span className={`text-sm font-medium ${
              response.ok ? 'text-green-800' : 'text-red-800'
            }`}>
              {response.ok ? '✅ نجح' : '❌ فشل'}
            </span>
            {response.redeployTriggered && (
              <span className="ml-2 text-sm text-blue-600">
                🚀 تم تشغيل إعادة النشر
              </span>
            )}
          </div>
          <p className={`text-sm ${
            response.ok ? 'text-green-700' : 'text-red-700'
          }`}>
            {response.message}
          </p>
          
          {response.logs && response.logs.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setShowLogs(!showLogs)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showLogs ? 'إخفاء' : 'عرض'} سجل العمليات
              </button>
              
              {showLogs && (
                <div className="mt-2 p-3 bg-gray-100 rounded-md">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                    {response.logs.join('\n')}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}