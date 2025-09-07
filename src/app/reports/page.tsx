'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardKPIs } from '@/types'
import { formatCurrency, formatPercentage } from '@/utils/formatting'

export default function Reports() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('authToken')
    if (!token) {
      router.push('/login')
      return
    }
    
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/dashboard', {
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
        throw new Error('فشل في تحميل التقارير')
      }

      const data = await response.json()
      if (data.success) {
        setKpis(data.data)
      } else {
        setError(data.error || 'خطأ في تحميل التقارير')
      }
    } catch (err) {
      console.error('Reports error:', err)
      setError('خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = async (type: string) => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/export/csv?type=${type}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('فشل في تصدير البيانات')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError('خطأ في تصدير البيانات')
    }
  }

  const handleExportExcel = async (type: string) => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/export/excel?type=${type}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('فشل في تصدير البيانات')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError('خطأ في تصدير البيانات')
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
          <div className="logo">📊</div>
          <h1>التقارير والإحصائيات</h1>
        </div>
        <div className="tools">
          <button className="btn primary" onClick={() => handleExportCSV('customers')}>
            تصدير العملاء CSV
          </button>
          <button className="btn primary" onClick={() => handleExportExcel('customers')}>
            تصدير العملاء Excel
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
          <button className="tab active">التقارير</button>
          <button className="tab" onClick={() => router.push('/backup')}>نسخة احتياطية</button>
        </div>

        <div className="content">
          <div className="panel">
            <h2>التقارير والإحصائيات</h2>
            
            {error && <div className="error-message">{error}</div>}
            
            {kpis && (
              <div className="kpis">
                <div className="card">
                  <h3>إجمالي المبيعات</h3>
                  <div className="big">{formatCurrency(kpis.totalSales)}</div>
                </div>
                <div className="card">
                  <h3>إجمالي المقبوضات</h3>
                  <div className="big">{formatCurrency(kpis.totalReceipts)}</div>
                </div>
                <div className="card">
                  <h3>إجمالي الديون</h3>
                  <div className="big">{formatCurrency(kpis.totalDebt)}</div>
                </div>
                <div className="card">
                  <h3>نسبة التحصيل</h3>
                  <div className="big">{formatPercentage(kpis.collectionPercentage)}</div>
                </div>
                <div className="card">
                  <h3>إجمالي المصروفات</h3>
                  <div className="big">{formatCurrency(kpis.totalExpenses)}</div>
                </div>
                <div className="card">
                  <h3>صافي الربح</h3>
                  <div className="big">{formatCurrency(kpis.netProfit)}</div>
                </div>
                <div className="card">
                  <h3>إجمالي الوحدات</h3>
                  <div className="big">{kpis.unitCounts.total}</div>
                </div>
                <div className="card">
                  <h3>الوحدات المتاحة</h3>
                  <div className="big">{kpis.unitCounts.available}</div>
                </div>
                <div className="card">
                  <h3>الوحدات المباعة</h3>
                  <div className="big">{kpis.unitCounts.sold}</div>
                </div>
                <div className="card">
                  <h3>الوحدات المحجوزة</h3>
                  <div className="big">{kpis.unitCounts.reserved}</div>
                </div>
                <div className="card">
                  <h3>عدد المستثمرين</h3>
                  <div className="big">{kpis.investorCount}</div>
                </div>
              </div>
            )}

            <div className="panel" style={{ marginTop: '20px' }}>
              <h3>تصدير البيانات</h3>
              <p>يمكنك تصدير البيانات في صيغ مختلفة:</p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                <button className="btn secondary" onClick={() => handleExportCSV('customers')}>
                  تصدير العملاء CSV
                </button>
                <button className="btn secondary" onClick={() => handleExportExcel('customers')}>
                  تصدير العملاء Excel
                </button>
                <button className="btn secondary" onClick={() => handleExportCSV('units')}>
                  تصدير الوحدات CSV
                </button>
                <button className="btn secondary" onClick={() => handleExportExcel('units')}>
                  تصدير الوحدات Excel
                </button>
                <button className="btn secondary" onClick={() => handleExportCSV('contracts')}>
                  تصدير العقود CSV
                </button>
                <button className="btn secondary" onClick={() => handleExportExcel('contracts')}>
                  تصدير العقود Excel
                </button>
                <button className="btn secondary" onClick={() => handleExportCSV('vouchers')}>
                  تصدير السندات CSV
                </button>
                <button className="btn secondary" onClick={() => handleExportExcel('vouchers')}>
                  تصدير السندات Excel
                </button>
                <button className="btn secondary" onClick={() => handleExportCSV('safes')}>
                  تصدير الخزائن CSV
                </button>
                <button className="btn secondary" onClick={() => handleExportExcel('safes')}>
                  تصدير الخزائن Excel
                </button>
                <button className="btn secondary" onClick={() => handleExportCSV('partners')}>
                  تصدير الشركاء CSV
                </button>
                <button className="btn secondary" onClick={() => handleExportExcel('partners')}>
                  تصدير الشركاء Excel
                </button>
                <button className="btn secondary" onClick={() => handleExportCSV('brokers')}>
                  تصدير السماسرة CSV
                </button>
                <button className="btn secondary" onClick={() => handleExportExcel('brokers')}>
                  تصدير السماسرة Excel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}