'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminAuth() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (data.success) {
        // Store admin session
        localStorage.setItem('adminAuth', 'true')
        router.push('/admin')
      } else {
        setError(data.error || 'كلمة المرور غير صحيحة')
      }
    } catch (err) {
      setError('خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">👑</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">لوحة الإدارة</h1>
          <p className="text-gray-600 mt-2">أدخل كلمة المرور للوصول</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              كلمة المرور
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 font-semibold"
              placeholder="أدخل كلمة مرور الإدارة"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-red-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'جاري التحقق...' : 'دخول'}
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/login')}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            العودة لتسجيل الدخول
          </button>
        </div>
      </div>
    </div>
  )
}