'use client'

// Database settings form component
import { useState } from 'react'
import { DbType } from '@/lib/env'

interface DbSettingsFormProps {
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
}

interface PostgresConfig {
  host: string
  port: number
  username: string
  password: string
  database: string
  ssl: boolean
}

export default function DbSettingsForm({ onSuccess, onError }: DbSettingsFormProps) {
  const [adminKey, setAdminKey] = useState('')
  const [dbType, setDbType] = useState<DbType>('sqlite')
  const [mode, setMode] = useState<'new' | 'switch'>('new')
  const [seed, setSeed] = useState(false)
  const [cloudUrl, setCloudUrl] = useState('')
  const [postgres, setPostgres] = useState<PostgresConfig>({
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: '',
    database: 'estate_management',
    ssl: false
  })
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const handleSubmit = async (action: 'init' | 'switch' | 'wipe') => {
    if (!adminKey.trim()) {
      onError?.('مفتاح الأدمن مطلوب')
      return
    }

    setLoading(true)
    addLog(`بدء ${action === 'init' ? 'التهيئة' : action === 'switch' ? 'التبديل' : 'المسح'}...`)

    try {
      let url = ''
      let body: any = {}

      if (action === 'wipe') {
        body = { confirm: true }
        url = '/api/db-admin/wipe'
      } else {
        body = {
          type: dbType,
          mode: action === 'init' ? 'new' : 'switch',
          seed
        }

        if (dbType === 'postgresql-local') {
          body.postgres = postgres
        } else if (dbType === 'postgresql-cloud') {
          body.cloudUrl = cloudUrl
        }

        url = action === 'init' ? '/api/db-admin/init' : '/api/db-admin/switch'
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': adminKey
        },
        body: JSON.stringify(body)
      })

      const result = await response.json()

      if (result.success) {
        addLog(`✅ ${result.message}`)
        if (result.redeployTriggered) {
          addLog('🚀 تم إطلاق إعادة النشر على Netlify')
        }
        onSuccess?.(result.message)
      } else {
        addLog(`❌ ${result.message}`)
        onError?.(result.message)
      }
    } catch (error: any) {
      const errorMessage = error.message || 'خطأ في الاتصال'
      addLog(`❌ ${errorMessage}`)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        إعدادات قاعدة البيانات
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Section */}
        <div className="space-y-6">
          {/* Admin Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              مفتاح الأدمن *
            </label>
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="أدخل مفتاح الأدمن"
            />
          </div>

          {/* Database Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              نوع قاعدة البيانات
            </label>
            <select
              value={dbType}
              onChange={(e) => setDbType(e.target.value as DbType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="sqlite">SQLite (محلي)</option>
              <option value="postgresql-local">PostgreSQL (محلي)</option>
              <option value="postgresql-cloud">PostgreSQL (سحابي)</option>
            </select>
          </div>

          {/* Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              وضع العملية
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as 'new' | 'switch')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="new">تهيئة جديدة</option>
              <option value="switch">تبديل</option>
            </select>
          </div>

          {/* PostgreSQL Local Configuration */}
          {dbType === 'postgresql-local' && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-700">إعدادات PostgreSQL المحلية</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Host</label>
                  <input
                    type="text"
                    value={postgres.host}
                    onChange={(e) => setPostgres(prev => ({ ...prev, host: e.target.value }))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Port</label>
                  <input
                    type="number"
                    value={postgres.port}
                    onChange={(e) => setPostgres(prev => ({ ...prev, port: parseInt(e.target.value) || 5432 }))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Username</label>
                  <input
                    type="text"
                    value={postgres.username}
                    onChange={(e) => setPostgres(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Password</label>
                  <input
                    type="password"
                    value={postgres.password}
                    onChange={(e) => setPostgres(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">Database</label>
                  <input
                    type="text"
                    value={postgres.database}
                    onChange={(e) => setPostgres(prev => ({ ...prev, database: e.target.value }))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={postgres.ssl}
                      onChange={(e) => setPostgres(prev => ({ ...prev, ssl: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600">SSL</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* PostgreSQL Cloud Configuration */}
          {dbType === 'postgresql-cloud' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رابط قاعدة البيانات السحابية
              </label>
              <input
                type="text"
                value={cloudUrl}
                onChange={(e) => setCloudUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="postgresql://username:password@host:5432/database?sslmode=require"
              />
            </div>
          )}

          {/* Seed Option */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={seed}
                onChange={(e) => setSeed(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">زرع بيانات تجريبية</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => handleSubmit('init')}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'جاري التحميل...' : 'تهيئة قاعدة بيانات جديدة'}
            </button>

            <button
              onClick={() => handleSubmit('switch')}
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'جاري التحميل...' : 'تبديل قاعدة البيانات'}
            </button>

            <button
              onClick={() => handleSubmit('wipe')}
              disabled={loading}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'جاري التحميل...' : 'مسح قاعدة البيانات'}
            </button>
          </div>
        </div>

        {/* Logs Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-700">سجل العمليات</h3>
            <button
              onClick={clearLogs}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              مسح السجل
            </button>
          </div>
          
          <div className="bg-gray-900 text-green-400 p-4 rounded-md h-96 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-gray-500">لا توجد عمليات بعد...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}