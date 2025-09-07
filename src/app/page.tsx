'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardKPIs } from '@/types'

export default function Home() {
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
    
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          // Unauthorized - redirect to login
          localStorage.removeItem('authToken')
          router.push('/login')
          return
        }
        throw new Error('فشل في تحميل البيانات')
      }

      const data = await response.json()
      if (data.success) {
        setKpis(data.data)
      } else {
        setError(data.error || 'خطأ في تحميل البيانات')
      }
    } catch (err) {
      console.error('Dashboard error:', err)
      setError('خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount) + ' ج.م'
  }

  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('ar-EG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value) + '%'
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

  if (error) {
    return (
      <div className="container">
        <div className="panel">
          <h2>خطأ</h2>
          <p>{error}</p>
          <button className="btn" onClick={fetchDashboardData}>
            إعادة المحاولة
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="header">
        <div className="brand">
          <div className="logo">🏛️</div>
          <h1>مدير الاستثمار العقاري — النسخة النهائية</h1>
        </div>
        <div className="tools">
          <button className="btn secondary" onClick={() => router.push('/customers')}>
            العملاء
          </button>
          <button className="btn secondary" onClick={() => router.push('/units')}>
            الوحدات
          </button>
          <button className="btn secondary" onClick={() => router.push('/contracts')}>
            العقود
          </button>
          <button className="btn secondary" onClick={() => router.push('/reports')}>
            التقارير
          </button>
          <button className="btn warn" onClick={() => {
            localStorage.removeItem('authToken')
            router.push('/login')
          }}>
            تسجيل الخروج
          </button>
        </div>
      </div>

      <div className="main-layout">
        <div className="sidebar">
          <button className="tab active">لوحة التحكم</button>
          <button className="tab" onClick={() => router.push('/customers')}>العملاء</button>
          <button className="tab" onClick={() => router.push('/units')}>الوحدات</button>
          <button className="tab" onClick={() => router.push('/contracts')}>العقود</button>
          <button className="tab" onClick={() => router.push('/brokers')}>السماسرة</button>
          <button className="tab" onClick={() => router.push('/installments')}>الأقساط</button>
          <button className="tab" onClick={() => router.push('/vouchers')}>السندات</button>
          <button className="tab" onClick={() => router.push('/partners')}>الشركاء</button>
          <button className="tab" onClick={() => router.push('/treasury')}>الخزينة</button>
          <button className="tab" onClick={() => router.push('/reports')}>التقارير</button>
          <button className="tab" onClick={() => router.push('/backup')}>نسخة احتياطية</button>
        </div>

        <div className="content">
          <div className="panel">
            <h2>لوحة التحكم</h2>
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
          </div>
        </div>
      </div>
    </div>
  )
}