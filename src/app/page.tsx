'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardKPIs } from '@/types'
import { formatCurrency, formatPercentage } from '@/utils/formatting'
import { NotificationSystem, useNotifications } from '@/components/NotificationSystem'
import { BarChart, LineChart, DoughnutChart } from '@/components/Charts'
import { exportDashboardData } from '@/utils/export'

export default function Home() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' })
  const router = useRouter()
  const { notifications, addNotification, removeNotification } = useNotifications()

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
        addNotification({
          type: 'success',
          title: 'تم التحميل بنجاح',
          message: 'تم تحميل بيانات لوحة التحكم بنجاح'
        })
      } else {
        setError(data.error || 'خطأ في تحميل البيانات')
        addNotification({
          type: 'error',
          title: 'خطأ في التحميل',
          message: data.error || 'فشل في تحميل البيانات'
        })
      }
    } catch (err) {
      console.error('Dashboard error:', err)
      setError('خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (!kpis) return
    
    const installments: any[] = [] // TODO: Fetch installments data
    const transactions: any[] = [] // TODO: Fetch transactions data
    
    exportDashboardData(kpis, installments, transactions)
    addNotification({
      type: 'success',
      title: 'تم التصدير بنجاح',
      message: 'تم تصدير بيانات لوحة التحكم إلى ملف Excel'
    })
  }

  const handleDateFilterChange = () => {
    fetchDashboardData()
  }

  if (loading) {
    return (
      <div className="container">
        <div className="panel loading">
          <h2>جاري التحميل...</h2>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            marginTop: '20px',
            fontSize: '24px'
          }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              border: '4px solid rgba(59, 130, 246, 0.3)',
              borderTop: '4px solid rgb(59, 130, 246)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
          </div>
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
          <button className="btn primary" onClick={fetchDashboardData}>
            إعادة المحاولة
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container fade-in">
      <div className="header slide-in">
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
          <button className="btn ok" onClick={handleExport}>
            تصدير Excel
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
        <div className="sidebar slide-in">
          <button className="tab active">لوحة التحكم</button>
          <button className="tab" onClick={() => router.push('/customers')}>العملاء</button>
          <button className="tab" onClick={() => router.push('/units')}>الوحدات</button>
          <button className="tab" onClick={() => router.push('/contracts')}>العقود</button>
          <button className="tab" onClick={() => router.push('/brokers')}>السماسرة</button>
          <button className="tab" onClick={() => router.push('/installments')}>الأقساط</button>
          <button className="tab" onClick={() => router.push('/vouchers')}>السندات</button>
          <button className="tab" onClick={() => router.push('/partners')}>الشركاء</button>
          <button className="tab" onClick={() => router.push('/partner-groups')}>مجموعات الشركاء</button>
          <button className="tab" onClick={() => router.push('/partner-debts')}>ديون الشركاء</button>
          <button className="tab" onClick={() => router.push('/treasury')}>الخزينة</button>
          <button className="tab" onClick={() => router.push('/reports')}>التقارير</button>
          <button className="tab" onClick={() => router.push('/backup')}>نسخة احتياطية</button>
        </div>

        <div className="content slide-in">
          {/* Date Filters */}
          <div className="panel">
            <h2>فلاتر التاريخ</h2>
            <div className="grid-2" style={{ gap: '16px' }}>
              <div>
                <label className="form-label">من تاريخ</label>
                <input
                  type="date"
                  className="input"
                  value={dateFilter.from}
                  onChange={(e) => setDateFilter({...dateFilter, from: e.target.value})}
                />
              </div>
              <div>
                <label className="form-label">إلى تاريخ</label>
                <input
                  type="date"
                  className="input"
                  value={dateFilter.to}
                  onChange={(e) => setDateFilter({...dateFilter, to: e.target.value})}
                />
              </div>
            </div>
            <div className="tools">
              <button className="btn" onClick={handleDateFilterChange}>
                تطبيق الفلتر
              </button>
              <button className="btn secondary" onClick={() => setDateFilter({from: '', to: ''})}>
                مسح الفلتر
              </button>
            </div>
          </div>

          {/* KPIs */}
          <div className="panel">
            <h2>المؤشرات الرئيسية</h2>
            {kpis && (
              <div className="kpis">
                <div className="card slide-in">
                  <h3>إجمالي المبيعات</h3>
                  <div className="big">{formatCurrency(kpis.totalSales)}</div>
                </div>
                <div className="card slide-in">
                  <h3>إجمالي المقبوضات</h3>
                  <div className="big">{formatCurrency(kpis.totalReceipts)}</div>
                </div>
                <div className="card slide-in">
                  <h3>إجمالي الديون</h3>
                  <div className="big">{formatCurrency(kpis.totalDebt)}</div>
                </div>
                <div className="card slide-in">
                  <h3>نسبة التحصيل</h3>
                  <div className="big">{formatPercentage(kpis.collectionPercentage)}</div>
                </div>
                <div className="card slide-in">
                  <h3>إجمالي المصروفات</h3>
                  <div className="big">{formatCurrency(kpis.totalExpenses)}</div>
                </div>
                <div className="card slide-in">
                  <h3>صافي الربح</h3>
                  <div className="big">{formatCurrency(kpis.netProfit)}</div>
                </div>
                <div className="card slide-in">
                  <h3>إجمالي الوحدات</h3>
                  <div className="big">{kpis.unitCounts.total}</div>
                </div>
                <div className="card slide-in">
                  <h3>الوحدات المتاحة</h3>
                  <div className="big">{kpis.unitCounts.available}</div>
                </div>
                <div className="card slide-in">
                  <h3>الوحدات المباعة</h3>
                  <div className="big">{kpis.unitCounts.sold}</div>
                </div>
                <div className="card slide-in">
                  <h3>الوحدات المحجوزة</h3>
                  <div className="big">{kpis.unitCounts.reserved}</div>
                </div>
                <div className="card slide-in">
                  <h3>عدد المستثمرين</h3>
                  <div className="big">{kpis.investorCount}</div>
                </div>
              </div>
            )}
          </div>

          {/* Charts */}
          {kpis && (
            <div className="grid-2" style={{ gap: '16px' }}>
              <DoughnutChart
                data={{
                  labels: ['متاحة', 'مباعة', 'محجوزة'],
                  datasets: [{
                    label: 'توزيع الوحدات',
                    data: [kpis.unitCounts.available, kpis.unitCounts.sold, kpis.unitCounts.reserved],
                    backgroundColor: ['#22c55e', '#2563eb', '#f59e0b'],
                    borderColor: ['#16a34a', '#1d4ed8', '#d97706'],
                    borderWidth: 2
                  }]
                }}
                title="توزيع الوحدات"
                height={250}
              />
              
              <BarChart
                data={{
                  labels: ['المبيعات', 'المقبوضات', 'المصروفات', 'الربح'],
                  datasets: [{
                    label: 'المبالغ المالية',
                    data: [kpis.totalSales, kpis.totalReceipts, kpis.totalExpenses, kpis.netProfit],
                    backgroundColor: ['#2563eb', '#22c55e', '#ef4444', '#f59e0b'],
                    borderColor: ['#1d4ed8', '#16a34a', '#dc2626', '#d97706'],
                    borderWidth: 1
                  }]
                }}
                title="المؤشرات المالية"
                height={250}
              />
            </div>
          )}
        </div>
      </div>
      
      <NotificationSystem 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </div>
  )
}