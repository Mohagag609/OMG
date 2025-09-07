'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BackupPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleExport = async () => {
    setLoading(true)
    setMessage('')

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/export', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('فشل في تصدير البيانات')
      }

      const data = await response.json()
      if (data.success) {
        // Download the JSON file
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `estate-backup-${new Date().toISOString().split('T')[0]}.json`
        a.click()
        URL.revokeObjectURL(url)
        
        setMessage('تم تصدير البيانات بنجاح')
      } else {
        setMessage(data.error || 'خطأ في تصدير البيانات')
      }
    } catch (err) {
      setMessage('خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    setMessage('')

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()
      if (result.success) {
        setMessage('تم استيراد البيانات بنجاح')
        // Refresh the page to show new data
        window.location.reload()
      } else {
        setMessage(result.error || 'خطأ في استيراد البيانات')
      }
    } catch (err) {
      setMessage('خطأ في قراءة الملف')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="header">
        <div className="brand">
          <div className="logo">🏛️</div>
          <h1>مدير الاستثمار العقاري — النسخ الاحتياطية</h1>
        </div>
        <div className="tools">
          <button className="btn secondary" onClick={() => router.push('/')}>
            العودة للوحة التحكم
          </button>
        </div>
      </div>

      <div className="main-layout">
        <div className="sidebar">
          <button className="tab" onClick={() => router.push('/')}>لوحة التحكم</button>
          <button className="tab" onClick={() => router.push('/customers')}>العملاء</button>
          <button className="tab" onClick={() => router.push('/units')}>الوحدات</button>
          <button className="tab" onClick={() => router.push('/contracts')}>العقود</button>
          <button className="tab" onClick={() => router.push('/brokers')}>السماسرة</button>
          <button className="tab" onClick={() => router.push('/installments')}>الأقساط</button>
          <button className="tab" onClick={() => router.push('/vouchers')}>السندات</button>
          <button className="tab" onClick={() => router.push('/partners')}>الشركاء</button>
          <button className="tab" onClick={() => router.push('/treasury')}>الخزينة</button>
          <button className="tab" onClick={() => router.push('/reports')}>التقارير</button>
          <button className="tab active">نسخة احتياطية</button>
        </div>

        <div className="content">
          <div className="panel">
            <h2>النسخ الاحتياطية</h2>
            
            {message && (
              <div style={{ 
                color: message.includes('نجاح') ? 'var(--ok)' : 'var(--warn)', 
                marginBottom: '16px',
                padding: '8px',
                background: message.includes('نجاح') ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                borderRadius: '8px'
              }}>
                {message}
              </div>
            )}

            <div className="grid grid-2" style={{ gap: '20px' }}>
              <div className="card">
                <h3>تصدير البيانات</h3>
                <p>حفظ نسخة احتياطية من جميع البيانات في ملف JSON</p>
                <button 
                  className="btn" 
                  onClick={handleExport}
                  disabled={loading}
                >
                  {loading ? 'جاري التصدير...' : 'تصدير البيانات'}
                </button>
              </div>

              <div className="card">
                <h3>استيراد البيانات</h3>
                <p>استعادة البيانات من ملف JSON (سيتم استبدال البيانات الحالية)</p>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  disabled={loading}
                  style={{ marginBottom: '10px' }}
                />
                <p style={{ fontSize: '12px', color: 'var(--muted)' }}>
                  تحذير: سيتم استبدال جميع البيانات الحالية بالبيانات الموجودة في الملف
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}