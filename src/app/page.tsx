'use client'

import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardKPIs } from '@/types'
import { formatCurrency } from '@/utils/formatting'
import { NotificationSystem, useNotifications } from '@/components/NotificationSystem'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Layout from '@/components/Layout'

// FIXED: Proper TypeScript interfaces for components
interface ModernCardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

interface ModernButtonProps {
  children: React.ReactNode
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  className?: string
  onClick?: () => void
}

// FIXED: Memoized components to prevent unnecessary re-renders
const ModernCard = memo<ModernCardProps>(({ children, className = '', ...props }) => (
  <Card className={`modern-card ${className}`} {...props}>
    {children}
  </Card>
))
ModernCard.displayName = 'ModernCard'

const ModernButton = memo<ModernButtonProps>(({ children, variant = 'default', size = 'default', className = '', ...props }) => (
  <Button 
    variant={variant}
    size={size}
    className={`modern-button ${className}`}
    {...props}
  >
    {children}
  </Button>
))
ModernButton.displayName = 'ModernButton'

// FIXED: Proper TypeScript interface for KPICard
interface KPICardProps {
  title: string
  value: string | number
  change?: number
  icon: string
  color: string
  loading?: boolean
}

const KPICard = memo<KPICardProps>(({ title, value, change, icon, color, loading = false }) => (
  <ModernCard className={`p-6 ${color} border-0 shadow-lg hover:shadow-xl transition-all duration-300`}>
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
          {title}
        </p>
        {loading ? (
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        ) : (
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
        )}
        {change !== undefined && !loading && (
          <p className={`text-sm mt-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? '+' : ''}{change}%
          </p>
        )}
      </div>
      <div className="text-3xl opacity-80">
        {icon}
      </div>
    </div>
  </ModernCard>
))
KPICard.displayName = 'KPICard'

export default function Dashboard() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { addNotification } = useNotifications()
  const router = useRouter()

  // FIXED: Memoized fetch function to prevent unnecessary re-renders
  const fetchKPIs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem('authToken')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('فشل في تحميل البيانات')
      }

      const data = await response.json()
      if (data.success) {
        setKpis(data.data)
      } else {
        throw new Error(data.message || 'حدث خطأ غير متوقع')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع'
      setError(errorMessage)
      addNotification({
        type: 'error',
        title: 'خطأ',
        message: errorMessage
      })
    } finally {
      setLoading(false)
    }
  }, [router, addNotification])

  // FIXED: Load data on component mount
  useEffect(() => {
    fetchKPIs()
  }, [fetchKPIs])

  // FIXED: Memoized navigation items to prevent unnecessary re-renders
  const navigationItems = useMemo(() => [
    { title: 'العقارات', icon: '🏠', color: 'bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30', onClick: () => router.push('/units') },
    { title: 'العملاء', icon: '👤', color: 'bg-gradient-to-r from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30', onClick: () => router.push('/customers') },
    { title: 'العقود', icon: '📋', color: 'bg-gradient-to-r from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30', onClick: () => router.push('/contracts') },
    { title: 'الوسطاء', icon: '🤝', color: 'bg-gradient-to-r from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30', onClick: () => router.push('/brokers') },
    { title: 'الأقساط', icon: '📅', color: 'bg-gradient-to-r from-indigo-100 to-indigo-200 dark:from-indigo-900/30 dark:to-indigo-800/30', onClick: () => router.push('/installments') },
    { title: 'السندات', icon: '📄', color: 'bg-gradient-to-r from-pink-100 to-pink-200 dark:from-pink-900/30 dark:to-pink-800/30', onClick: () => router.push('/vouchers') },
    { title: 'الشركاء', icon: '👥', color: 'bg-gradient-to-r from-teal-100 to-teal-200 dark:from-teal-900/30 dark:to-teal-800/30', onClick: () => router.push('/partners') },
    { title: 'الخزينة', icon: '💰', color: 'bg-gradient-to-r from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30', onClick: () => router.push('/treasury') },
    { title: 'التقارير', icon: '📊', color: 'bg-gradient-to-r from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30', onClick: () => router.push('/reports') },
    { title: 'النسخ', icon: '💾', color: 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800/30 dark:to-gray-700/30', onClick: () => router.push('/backup') }
  ], [router])

  if (loading) {
    return (
      <div className="dashboard-container flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground">جاري التحميل...</h2>
          <p className="text-muted-foreground mt-2">يرجى الانتظار قليلاً</p>
        </div>
      </div>
    )
  }

  return (
    <Layout title="لوحة التحكم" subtitle="نظام إدارة العقارات المتطور" icon="🏢">
      <div className="flex items-center justify-between mb-8">
        <div className="text-sm text-muted-foreground">
          آخر تحديث: {new Date().toLocaleString('ar-SA')}
        </div>
        <ModernButton variant="outline" size="sm" onClick={() => fetchKPIs()}>
          🔄 تحديث
        </ModernButton>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center">
            <div className="text-red-600 dark:text-red-400 mr-3">⚠️</div>
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                خطأ في تحميل البيانات
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="إجمالي المبيعات"
            value={formatCurrency(kpis.totalSales)}
            icon="💰"
            color="bg-gradient-to-r from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30"
          />
          <KPICard
            title="إجمالي المقبوضات"
            value={formatCurrency(kpis.totalReceipts)}
            icon="📈"
            color="bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30"
          />
          <KPICard
            title="إجمالي المصروفات"
            value={formatCurrency(kpis.totalExpenses)}
            icon="📉"
            color="bg-gradient-to-r from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30"
          />
          <KPICard
            title="صافي الربح"
            value={formatCurrency(kpis.netProfit)}
            icon="🎯"
            color="bg-gradient-to-r from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30"
          />
          <KPICard
            title="نسبة التحصيل"
            value={`${kpis.collectionPercentage}%`}
            icon="📊"
            color="bg-gradient-to-r from-indigo-100 to-indigo-200 dark:from-indigo-900/30 dark:to-indigo-800/30"
          />
          <KPICard
            title="إجمالي الديون"
            value={formatCurrency(kpis.totalDebt)}
            icon="⚠️"
            color="bg-gradient-to-r from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30"
          />
        </div>
      )}

      {/* Navigation Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {navigationItems.map((item, index) => (
          <ModernCard
            key={index}
            className={`p-6 ${item.color} border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group`}
            onClick={item.onClick}
          >
            <div className="text-center">
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                {item.icon}
              </div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary transition-colors duration-300">
                {item.title}
              </h3>
            </div>
          </ModernCard>
        ))}
      </div>
    </Layout>
  )
}