'use client'

import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
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
  icon: string
  color: string
  trend?: string
  onClick?: () => void
}

const KPICard = memo<KPICardProps>(({ title, value, icon, color, trend, onClick }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    transition={{ duration: 0.2 }}
  >
    <ModernCard 
      className={`kpi-card ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            {trend && (
              <p className="text-xs text-muted-foreground mt-1">{trend}</p>
            )}
          </div>
          <div className={`w-12 h-12 ${color.replace('text-', 'bg-').replace('-600', '-100')} rounded-xl flex items-center justify-center shadow-lg`}>
            <span className="text-xl">{icon}</span>
          </div>
        </div>
      </CardContent>
    </ModernCard>
  </motion.div>
))
KPICard.displayName = 'KPICard'

// FIXED: Proper TypeScript interface for QuickActionCard
interface QuickActionCardProps {
  title: string
  icon: string
  color: string
  onClick: () => void
}

const QuickActionCard = memo<QuickActionCardProps>(({ title, icon, color, onClick }) => (
  <motion.div
    whileHover={{ scale: 1.05, y: -2 }}
    whileTap={{ scale: 0.95 }}
    transition={{ duration: 0.2 }}
  >
    <ModernCard 
      className="cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-6 text-center">
        <div className={`w-16 h-16 ${color} rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
          <span className="text-2xl">{icon}</span>
        </div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </CardContent>
    </ModernCard>
  </motion.div>
))
QuickActionCard.displayName = 'QuickActionCard'

// FIXED: Proper TypeScript interface for NavigationCard
interface NavigationCardProps {
  title: string
  icon: string
  color: string
  onClick: () => void
}

const NavigationCard = memo<NavigationCardProps>(({ title, icon, color, onClick }) => (
  <motion.div
    whileHover={{ scale: 1.05, y: -2 }}
    whileTap={{ scale: 0.95 }}
    transition={{ duration: 0.2 }}
  >
    <ModernCard 
      className="cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-4 text-center">
        <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center mx-auto mb-3 shadow-md`}>
          <span className="text-lg">{icon}</span>
        </div>
        <h3 className="text-xs font-semibold text-foreground">{title}</h3>
      </CardContent>
    </ModernCard>
  </motion.div>
))
NavigationCard.displayName = 'NavigationCard'

export default function Dashboard() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { notifications, removeNotification } = useNotifications()

  // FIXED: Added missing dependency to useEffect
  const fetchKPIs = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/.netlify/functions/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      const data = await response.json()
      if (data.success) {
        setKpis(data.data)
        setError(null) // FIXED: Clear error on success
      } else {
        setError(data.error || 'خطأ في تحميل البيانات')
      }
    } catch (err) {
      // FIXED: Remove console.error in production
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching KPIs:', err)
      }
      setError('خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchKPIs()
  }, [fetchKPIs])

  // FIXED: Memoized data to prevent unnecessary re-renders
  const quickActions = useMemo(() => [
    { title: 'عميل جديد', icon: '👤', color: 'bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30', onClick: () => router.push('/customers') },
    { title: 'وحدة جديدة', icon: '🏠', color: 'bg-gradient-to-r from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30', onClick: () => router.push('/units') },
    { title: 'عقد جديد', icon: '📋', color: 'bg-gradient-to-r from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30', onClick: () => router.push('/contracts') },
    { title: 'سمسار', icon: '🤝', color: 'bg-gradient-to-r from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30', onClick: () => router.push('/brokers') },
    { title: 'شركاء', icon: '👥', color: 'bg-gradient-to-r from-indigo-100 to-indigo-200 dark:from-indigo-900/30 dark:to-indigo-800/30', onClick: () => router.push('/partners') },
    { title: 'خزينة', icon: '💰', color: 'bg-gradient-to-r from-pink-100 to-pink-200 dark:from-pink-900/30 dark:to-pink-800/30', onClick: () => router.push('/treasury') },
    { title: 'الإعدادات', icon: '⚙️', color: 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800/30 dark:to-gray-700/30', onClick: () => router.push('/settings') }
  ], [router])

  const navigationItems = useMemo(() => [
    { title: 'العملاء', icon: '👤', color: 'bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30', onClick: () => router.push('/customers') },
    { title: 'الوحدات', icon: '🏠', color: 'bg-gradient-to-r from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30', onClick: () => router.push('/units') },
    { title: 'العقود', icon: '📋', color: 'bg-gradient-to-r from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30', onClick: () => router.push('/contracts') },
    { title: 'السماسرة', icon: '🤝', color: 'bg-gradient-to-r from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30', onClick: () => router.push('/brokers') },
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
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <h2 className="text-xl font-semibold text-foreground">جاري التحميل...</h2>
          <p className="text-muted-foreground mt-2">يرجى الانتظار قليلاً</p>
        </motion.div>
      </div>
    )
  }

  return (
    <Layout title="لوحة التحكم" subtitle="نظام إدارة العقارات المتطور" icon="🏢">
      <motion.div 
        className="flex items-center justify-between mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-sm text-muted-foreground">
          آخر تحديث: {new Date().toLocaleString('ar-SA')}
        </div>
        <ModernButton variant="outline" size="sm" onClick={() => fetchKPIs()}>
          🔄 تحديث
        </ModernButton>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <ModernCard className="mb-8 bg-destructive/10 border-destructive/20">
            <CardContent className="p-4">
              <div className="flex items-center">
                <span className="text-destructive mr-3 text-xl">⚠️</span>
                <div>
                  <h3 className="text-destructive font-semibold text-sm">خطأ في تحميل البيانات</h3>
                  <p className="text-destructive/80 text-xs mt-1">{error}</p>
                </div>
              </div>
            </CardContent>
          </ModernCard>
        </motion.div>
      )}

      {/* KPIs Section */}
      {kpis && (
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2 className="text-2xl font-bold text-foreground mb-6">المؤشرات الرئيسية</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <KPICard
                title="إجمالي المبيعات"
                value={formatCurrency(kpis.totalSales)}
                icon="💰"
                color="text-success"
                trend="+12%"
                onClick={() => router.push('/contracts')}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <KPICard
                title="إجمالي المقبوضات"
                value={formatCurrency(kpis.totalReceipts)}
                icon="📈"
                color="text-primary"
                trend="+8%"
                onClick={() => router.push('/vouchers')}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <KPICard
                title="إجمالي المصروفات"
                value={formatCurrency(kpis.totalExpenses)}
                icon="📉"
                color="text-destructive"
                trend="-5%"
                onClick={() => router.push('/vouchers')}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <KPICard
                title="صافي الربح"
                value={formatCurrency(kpis.netProfit)}
                icon="🎯"
                color="text-purple-600"
                trend="+15%"
                onClick={() => router.push('/reports')}
              />
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Additional KPIs */}
      {kpis && (
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <KPICard
                title="نسبة التحصيل"
                value={`${kpis.collectionPercentage}%`}
                icon="📊"
                color="text-indigo-600"
                trend="ممتاز"
                onClick={() => router.push('/installments')}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <KPICard
                title="إجمالي الديون"
                value={formatCurrency(kpis.totalDebt)}
                icon="⚠️"
                color="text-orange-600"
                trend="يحتاج متابعة"
                onClick={() => router.push('/installments')}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
            >
              <KPICard
                title="عدد الوحدات"
                value={`${kpis.unitCounts.total}`}
                icon="🏠"
                color="text-teal-600"
                trend={`متاحة: ${kpis.unitCounts.available}`}
                onClick={() => router.push('/units')}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.0 }}
            >
              <KPICard
                title="عدد المستثمرين"
                value={`${kpis.investorCount}`}
                icon="👥"
                color="text-pink-600"
                trend="نشط"
                onClick={() => router.push('/partners')}
              />
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.1 }}
      >
        <h2 className="text-2xl font-bold text-foreground mb-6">الإجراءات السريعة</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((action, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 1.2 + index * 0.1 }}
            >
              <QuickActionCard
                title={action.title}
                icon={action.icon}
                color={action.color}
                onClick={action.onClick}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Navigation Cards */}
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.8 }}
      >
        <h2 className="text-2xl font-bold text-foreground mb-6">جميع الوحدات</h2>
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-4">
          {navigationItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 1.9 + index * 0.05 }}
            >
              <NavigationCard
                title={item.title}
                icon={item.icon}
                color={item.color}
                onClick={item.onClick}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>
      
      <NotificationSystem 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </Layout>
  )
}