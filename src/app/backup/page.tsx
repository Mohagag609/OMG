'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatDate } from '@/utils/formatting'

export default function Backup() {
  const [statistics, setStatistics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creatingBackup, setCreatingBackup] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('authToken')
    if (!token) {
      router.push('/login')
      return
    }
    
    fetchStatistics()
  }, [])

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/backup/list', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('authToken')
          router.push('/login')
          return
        }
        throw new Error('فشل في تحميل الإحصائيات')
      }

      const data = await response.json()
      if (data.success) {
        setStatistics(data.data)
      } else {
        setError(data.error || 'خطأ في تحميل الإحصائيات')
      }
    } catch (err) {
      console.error('Statistics error:', err)
      setError('خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBackup = async () => {
    if (!confirm('هل أنت متأكد من إنشاء نسخة احتياطية؟')) {
      return
    }

    setCreatingBackup(true)
    
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/backup/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        alert('تم إنشاء النسخة الاحتياطية بنجاح!')
        fetchStatistics()
      } else {
        setError(data.error || 'خطأ في إنشاء النسخة الاحتياطية')
      }
    } catch (err) {
      setError('خطأ في الاتصال')
    } finally {
      setCreatingBackup(false)
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="panel">
          <h2>جاري التحميل...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="header">
        <div className="brand">
          <div className="logo">💾</div>
          <h1>إدارة النسخ الاحتياطية</h1>
        </div>
        <div className="tools">
          <button 
            className="btn primary" 
            onClick={handleCreateBackup}
            disabled={creatingBackup}
          >
            {creatingBackup ? 'جاري الإنشاء...' : 'إنشاء نسخة احتياطية'}
          </button>
          <button className="btn secondary" onClick={() => router.push('/')}>
            العودة للرئيسية
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
            <h2>إحصائيات النسخ الاحتياطية</h2>
            
            {error && <div className="error-message">{error}</div>}
            
            {statistics && (
              <div className="kpis">
                <div className="card">
                  <h3>إجمالي السجلات</h3>
                  <div className="big">{statistics.totalRecords}</div>
                </div>
                <div className="card">
                  <h3>العملاء</h3>
                  <div className="big">{statistics.tableCounts.customers}</div>
                </div>
                <div className="card">
                  <h3>الوحدات</h3>
                  <div className="big">{statistics.tableCounts.units}</div>
                </div>
                <div className="card">
                  <h3>العقود</h3>
                  <div className="big">{statistics.tableCounts.contracts}</div>
                </div>
                <div className="card">
                  <h3>السندات</h3>
                  <div className="big">{statistics.tableCounts.vouchers}</div>
                </div>
                <div className="card">
                  <h3>الخزائن</h3>
                  <div className="big">{statistics.tableCounts.safes}</div>
                </div>
                <div className="card">
                  <h3>الشركاء</h3>
                  <div className="big">{statistics.tableCounts.partners}</div>
                </div>
                <div className="card">
                  <h3>السماسرة</h3>
                  <div className="big">{statistics.tableCounts.brokers}</div>
                </div>
                <div className="card">
                  <h3>الأقساط</h3>
                  <div className="big">{statistics.tableCounts.installments}</div>
                </div>
                <div className="card">
                  <h3>الديون</h3>
                  <div className="big">{statistics.tableCounts.partnerDebts}</div>
                </div>
                <div className="card">
                  <h3>المستحقات</h3>
                  <div className="big">{statistics.tableCounts.brokerDues}</div>
                </div>
                <div className="card">
                  <h3>التحويلات</h3>
                  <div className="big">{statistics.tableCounts.transfers}</div>
                </div>
              </div>
            )}

            <div className="panel" style={{ marginTop: '20px' }}>
              <h3>معلومات النسخة الاحتياطية</h3>
              <p>النسخة الاحتياطية تحتوي على جميع البيانات المهمة في النظام.</p>
              <p>يتم إنشاء النسخة الاحتياطية في الوقت الفعلي عند الضغط على زر "إنشاء نسخة احتياطية".</p>
              <p>النسخة الاحتياطية تشمل:</p>
              <ul>
                <li>جميع العملاء</li>
                <li>جميع الوحدات</li>
                <li>جميع العقود</li>
                <li>جميع السندات</li>
                <li>جميع الخزائن</li>
                <li>جميع الشركاء والسماسرة</li>
                <li>جميع الأقساط والديون</li>
                <li>جميع التحويلات</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}