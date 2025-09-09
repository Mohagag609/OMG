'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem('authToken', data.data.token)
        router.push('/')
      } else {
        setError(data.error || 'خطأ في تسجيل الدخول')
      }
    } catch (err) {
      setError('خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">مدير الاستثمار العقاري</h1>
        <form className="login-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="اسم المستخدم"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="login-input text-gray-900 font-bold placeholder:text-gray-500 placeholder:font-normal"
          />
          <input
            type="password"
            placeholder="كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input text-gray-900 font-bold placeholder:text-gray-500 placeholder:font-normal"
          />
          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
          {error && <div className="error-message">{error}</div>}
        </form>
        <div style={{ 
          marginTop: '24px', 
          textAlign: 'center', 
          fontSize: '14px', 
          color: 'rgb(100, 116, 139)',
          background: 'rgb(248, 250, 252)',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid rgba(226, 232, 240, 0.8)'
        }}>
          <p style={{ fontWeight: '600', marginBottom: '8px', color: 'rgb(15, 23, 42)' }}>بيانات الدخول الافتراضية:</p>
          <p style={{ margin: '4px 0', color: 'rgb(15, 23, 42)' }}>اسم المستخدم: <strong style={{ color: 'rgb(59, 130, 246)' }}>admin</strong></p>
          <p style={{ margin: '4px 0', color: 'rgb(15, 23, 42)' }}>كلمة المرور: <strong style={{ color: 'rgb(59, 130, 246)' }}>admin123</strong></p>
        </div>
        
        <div style={{ 
          marginTop: '16px', 
          textAlign: 'center'
        }}>
          <button
            onClick={() => router.push('/admin')}
            style={{
              background: 'linear-gradient(135deg, #dc2626, #ec4899)',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            👑 لوحة الإدارة
          </button>
        </div>
      </div>
    </div>
  )
}