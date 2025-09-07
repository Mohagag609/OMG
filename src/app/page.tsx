'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardKPIs } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatting'
import { NotificationSystem, useNotifications } from '@/components/NotificationSystem'
import Layout from '@/components/Layout'

// Modern UI Components
const ModernCard = ({ children, className = '', ...props }: any) => (
  <div className={`bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-xl shadow-gray-900/5 p-6 ${className}`} {...props}>
    {children}
  </div>
)

const ModernButton = ({ children, variant = 'primary', size = 'md', className = '', ...props }: any) => {
  const variants: { [key: string]: string } = {
    primary: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/25',
    secondary: 'bg-white/80 hover:bg-white border border-gray-200 text-gray-700 shadow-lg shadow-gray-900/5',
    success: 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg shadow-green-500/25',
    danger: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-500/25',
    warning: 'bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white shadow-lg shadow-yellow-500/25',
    info: 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg shadow-purple-500/25'
  }
  
  const sizes: { [key: string]: string } = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm font-medium',
    lg: 'px-6 py-3 text-base font-medium'
  }
  
  return (
    <button 
      className={`${variants[variant]} ${sizes[size]} rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

const KPICard = ({ title, value, icon, color, trend, onClick }: any) => (
  <ModernCard 
    className={`cursor-pointer hover:scale-105 transition-all duration-200 ${onClick ? 'hover:shadow-2xl' : ''}`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        {trend && (
          <p className="text-xs text-gray-500 mt-1">{trend}</p>
        )}
      </div>
      <div className={`w-12 h-12 ${color.replace('text-', 'bg-').replace('-600', '-100')} rounded-xl flex items-center justify-center`}>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  </ModernCard>
)

const QuickActionCard = ({ title, description, icon, color, onClick }: any) => (
  <ModernCard 
    className="cursor-pointer hover:scale-105 transition-all duration-200 hover:shadow-2xl"
    onClick={onClick}
  >
    <div className="text-center">
      <div className={`w-16 h-16 ${color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
        <span className="text-3xl">{icon}</span>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  </ModernCard>
)

export default function Dashboard() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingItems, setDeletingItems] = useState<Set<string>>(new Set())
  const router = useRouter()
  const { notifications, addNotification, removeNotification } = useNotifications()

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      router.push('/login')
      return
    }
    
    fetchKPIs()
  }, [])

  const fetchKPIs = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      const data = await response.json()
      if (data.success) {
        setKpis(data.data)
      } else {
        setError(data.error || 'خطأ في تحميل البيانات')
      }
    } catch (err) {
      console.error('Error fetching KPIs:', err)
      setError('خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      title: 'إضافة عميل جديد',
      description: 'إضافة عميل جديد للنظام',
      icon: '👤',
      color: 'bg-gradient-to-r from-blue-100 to-blue-200',
      onClick: () => router.push('/customers')
    },
    {
      title: 'إضافة وحدة جديدة',
      description: 'إضافة وحدة عقارية جديدة',
      icon: '🏠',
      color: 'bg-gradient-to-r from-green-100 to-green-200',
      onClick: () => router.push('/units')
    },
    {
      title: 'إنشاء عقد جديد',
      description: 'إنشاء عقد بيع جديد',
      icon: '📋',
      color: 'bg-gradient-to-r from-purple-100 to-purple-200',
      onClick: () => router.push('/contracts')
    },
    {
      title: 'إضافة سمسار',
      description: 'إضافة سمسار جديد',
      icon: '🤝',
      color: 'bg-gradient-to-r from-yellow-100 to-yellow-200',
      onClick: () => router.push('/brokers')
    },
    {
      title: 'إدارة الشركاء',
      description: 'إدارة الشركاء والمجموعات',
      icon: '👥',
      color: 'bg-gradient-to-r from-indigo-100 to-indigo-200',
      onClick: () => router.push('/partners')
    },
    {
      title: 'إدارة الخزينة',
      description: 'إدارة الخزائن والمعاملات',
      icon: '💰',
      color: 'bg-gradient-to-r from-pink-100 to-pink-200',
      onClick: () => router.push('/treasury')
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">جاري التحميل...</h2>
        </div>
      </div>
    )
  }

  return (
    <Layout title="لوحة التحكم" subtitle="نظام إدارة العقارات المتطور" icon="🏢">
      <div className="flex items-center justify-between mb-8">
        <div className="text-sm text-gray-500">
          آخر تحديث: {new Date().toLocaleString('ar-SA')}
        </div>
        <ModernButton variant="secondary" onClick={() => fetchKPIs()}>
          🔄 تحديث
        </ModernButton>
      </div>
        {/* Error Message */}
        {error && (
          <ModernCard className="mb-8 bg-red-50 border-red-200">
            <div className="flex items-center">
              <span className="text-red-500 mr-3 text-xl">⚠️</span>
              <div>
                <h3 className="text-red-800 font-semibold">خطأ في تحميل البيانات</h3>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          </ModernCard>
        )}

        {/* KPIs Section */}
        {kpis && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">المؤشرات الرئيسية</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <KPICard
                title="إجمالي المبيعات"
                value={formatCurrency(kpis.totalSales)}
                icon="💰"
                color="text-green-600"
                trend="+12% من الشهر الماضي"
                onClick={() => router.push('/contracts')}
              />
              <KPICard
                title="إجمالي المقبوضات"
                value={formatCurrency(kpis.totalReceipts)}
                icon="📈"
                color="text-blue-600"
                trend="+8% من الشهر الماضي"
                onClick={() => router.push('/vouchers')}
              />
              <KPICard
                title="إجمالي المصروفات"
                value={formatCurrency(kpis.totalExpenses)}
                icon="📉"
                color="text-red-600"
                trend="-5% من الشهر الماضي"
                onClick={() => router.push('/vouchers')}
              />
              <KPICard
                title="صافي الربح"
                value={formatCurrency(kpis.netProfit)}
                icon="🎯"
                color="text-purple-600"
                trend="+15% من الشهر الماضي"
                onClick={() => router.push('/reports')}
              />
            </div>
          </div>
        )}

        {/* Additional KPIs */}
        {kpis && (
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <KPICard
                title="نسبة التحصيل"
                value={`${kpis.collectionPercentage}%`}
                icon="📊"
                color="text-indigo-600"
                trend="ممتاز"
                onClick={() => router.push('/installments')}
              />
              <KPICard
                title="إجمالي الديون"
                value={formatCurrency(kpis.totalDebt)}
                icon="⚠️"
                color="text-orange-600"
                trend="يحتاج متابعة"
                onClick={() => router.push('/installments')}
              />
              <KPICard
                title="عدد الوحدات"
                value={`${kpis.unitCounts.total}`}
                icon="🏠"
                color="text-teal-600"
                trend={`متاحة: ${kpis.unitCounts.available}`}
                onClick={() => router.push('/units')}
              />
              <KPICard
                title="عدد المستثمرين"
                value={`${kpis.investorCount}`}
                icon="👥"
                color="text-pink-600"
                trend="نشط"
                onClick={() => router.push('/partners')}
              />
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">الإجراءات السريعة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <QuickActionCard
                key={index}
                title={action.title}
                description={action.description}
                icon={action.icon}
                color={action.color}
                onClick={action.onClick}
              />
            ))}
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">جميع الوحدات</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ModernCard className="cursor-pointer hover:scale-105 transition-all duration-200 hover:shadow-2xl" onClick={() => router.push('/customers')}>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">👤</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">العملاء</h3>
                <p className="text-sm text-gray-600">إدارة العملاء</p>
              </div>
            </ModernCard>

            <ModernCard className="cursor-pointer hover:scale-105 transition-all duration-200 hover:shadow-2xl" onClick={() => router.push('/units')}>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🏠</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">الوحدات</h3>
                <p className="text-sm text-gray-600">إدارة الوحدات</p>
              </div>
            </ModernCard>

            <ModernCard className="cursor-pointer hover:scale-105 transition-all duration-200 hover:shadow-2xl" onClick={() => router.push('/contracts')}>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📋</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">العقود</h3>
                <p className="text-sm text-gray-600">إدارة العقود</p>
              </div>
            </ModernCard>

            <ModernCard className="cursor-pointer hover:scale-105 transition-all duration-200 hover:shadow-2xl" onClick={() => router.push('/brokers')}>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🤝</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">السماسرة</h3>
                <p className="text-sm text-gray-600">إدارة السماسرة</p>
              </div>
            </ModernCard>

            <ModernCard className="cursor-pointer hover:scale-105 transition-all duration-200 hover:shadow-2xl" onClick={() => router.push('/installments')}>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-100 to-indigo-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📅</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">الأقساط</h3>
                <p className="text-sm text-gray-600">إدارة الأقساط</p>
              </div>
            </ModernCard>

            <ModernCard className="cursor-pointer hover:scale-105 transition-all duration-200 hover:shadow-2xl" onClick={() => router.push('/vouchers')}>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-pink-100 to-pink-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📄</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">السندات</h3>
                <p className="text-sm text-gray-600">إدارة السندات</p>
              </div>
            </ModernCard>

            <ModernCard className="cursor-pointer hover:scale-105 transition-all duration-200 hover:shadow-2xl" onClick={() => router.push('/partners')}>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-teal-100 to-teal-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">👥</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">الشركاء</h3>
                <p className="text-sm text-gray-600">إدارة الشركاء</p>
              </div>
            </ModernCard>

            <ModernCard className="cursor-pointer hover:scale-105 transition-all duration-200 hover:shadow-2xl" onClick={() => router.push('/treasury')}>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">💰</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">الخزينة</h3>
                <p className="text-sm text-gray-600">إدارة الخزائن</p>
              </div>
            </ModernCard>

            <ModernCard className="cursor-pointer hover:scale-105 transition-all duration-200 hover:shadow-2xl" onClick={() => router.push('/reports')}>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-red-100 to-red-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📊</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">التقارير</h3>
                <p className="text-sm text-gray-600">التقارير والإحصائيات</p>
              </div>
            </ModernCard>

            <ModernCard className="cursor-pointer hover:scale-105 transition-all duration-200 hover:shadow-2xl" onClick={() => router.push('/backup')}>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">💾</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">النسخ الاحتياطية</h3>
                <p className="text-sm text-gray-600">إدارة النسخ الاحتياطية</p>
              </div>
            </ModernCard>
          </div>
        </div>
      
      <NotificationSystem 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </Layout>
  )
}