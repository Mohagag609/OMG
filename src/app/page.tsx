'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardKPIs } from '@/types'
import { formatCurrency } from '@/utils/formatting'
import { NotificationSystem, useNotifications } from '@/components/NotificationSystem'
import ModernLayout from '@/components/modern-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Building2, 
  FileText, 
  Calendar,
  Receipt,
  Handshake,
  BarChart3,
  Database,
  RefreshCw,
  Plus,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts'

// Sample data for charts
const salesData = [
  { month: 'يناير', sales: 4000, contracts: 12 },
  { month: 'فبراير', sales: 3000, contracts: 8 },
  { month: 'مارس', sales: 5000, contracts: 15 },
  { month: 'أبريل', sales: 4500, contracts: 10 },
  { month: 'مايو', sales: 6000, contracts: 18 },
  { month: 'يونيو', sales: 5500, contracts: 14 },
]

const unitStatusData = [
  { name: 'متاحة', value: 45, color: '#22c55e' },
  { name: 'محجوزة', value: 30, color: '#f59e0b' },
  { name: 'مباعة', value: 25, color: '#3b82f6' },
]

const KPICard = ({ title, value, icon: Icon, trend, trendValue, onClick, loading }: any) => (
  <Card 
    className={`cursor-pointer hover:shadow-lg transition-all duration-200 ${onClick ? 'hover:scale-105' : ''}`}
    onClick={onClick}
  >
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          {loading ? (
            <Skeleton className="h-8 w-24 mb-2" />
          ) : (
            <p className="text-2xl font-bold text-card-foreground mb-1">{value}</p>
          )}
          {trend && !loading && (
            <div className="flex items-center space-x-1 space-x-reverse">
              {trend === 'up' ? (
                <ArrowUpRight className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm font-medium ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                {trendValue}
              </span>
            </div>
          )}
        </div>
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary" />
        </div>
      </div>
    </CardContent>
  </Card>
)

const QuickActionCard = ({ title, icon: Icon, onClick, loading }: any) => (
  <Card 
    className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
    onClick={onClick}
  >
    <CardContent className="p-6">
      <div className="text-center">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-sm font-semibold text-card-foreground">{title}</h3>
      </div>
    </CardContent>
  </Card>
)

export default function Dashboard() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
    { title: 'عميل جديد', icon: Users, onClick: () => router.push('/customers') },
    { title: 'وحدة جديدة', icon: Building2, onClick: () => router.push('/units') },
    { title: 'عقد جديد', icon: FileText, onClick: () => router.push('/contracts') },
    { title: 'سمسار', icon: Handshake, onClick: () => router.push('/brokers') },
    { title: 'شريك', icon: Users, onClick: () => router.push('/partners') },
    { title: 'خزينة', icon: DollarSign, onClick: () => router.push('/treasury') },
    { title: 'تقرير', icon: BarChart3, onClick: () => router.push('/reports') },
    { title: 'نسخ احتياطي', icon: Database, onClick: () => router.push('/backup-system') }
  ]

  if (loading) {
    return (
      <ModernLayout title="لوحة التحكم" subtitle="نظام إدارة العقارات المتطور" icon={<Building2 className="w-6 h-6 text-white" />}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-card-foreground">جاري التحميل...</h2>
          </div>
        </div>
      </ModernLayout>
    )
  }

  return (
    <ModernLayout title="لوحة التحكم" subtitle="نظام إدارة العقارات المتطور" icon={<Building2 className="w-6 h-6 text-white" />}>
      <div className="flex items-center justify-between mb-8">
        <div className="text-sm text-muted-foreground">
          آخر تحديث: {new Date().toLocaleString('en-GB')}
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchKPIs()}>
          <RefreshCw className="w-4 h-4 ml-2" />
          تحديث
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="mb-6 border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-destructive/10 rounded-full flex items-center justify-center ml-3">
                <span className="text-destructive text-lg">⚠️</span>
              </div>
              <div>
                <h3 className="text-destructive font-semibold text-sm">خطأ في تحميل البيانات</h3>
                <p className="text-destructive/80 text-xs">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-card-foreground mb-6">المؤشرات الرئيسية</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="إجمالي المبيعات"
            value={kpis ? formatCurrency(kpis.totalSales) : '0'}
            icon={DollarSign}
            trend="up"
            trendValue="+12%"
            onClick={() => router.push('/contracts')}
            loading={loading}
          />
          <KPICard
            title="إجمالي المقبوضات"
            value={kpis ? formatCurrency(kpis.totalReceipts) : '0'}
            icon={TrendingUp}
            trend="up"
            trendValue="+8%"
            onClick={() => router.push('/vouchers')}
            loading={loading}
          />
          <KPICard
            title="إجمالي المصروفات"
            value={kpis ? formatCurrency(kpis.totalExpenses) : '0'}
            icon={TrendingDown}
            trend="down"
            trendValue="-5%"
            onClick={() => router.push('/vouchers')}
            loading={loading}
          />
          <KPICard
            title="صافي الربح"
            value={kpis ? formatCurrency(kpis.netProfit) : '0'}
            icon={BarChart3}
            trend="up"
            trendValue="+15%"
            onClick={() => router.push('/reports')}
            loading={loading}
          />
        </div>
      </div>

      {/* Additional KPIs */}
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="نسبة التحصيل"
            value={kpis ? `${kpis.collectionPercentage}%` : '0%'}
            icon={BarChart3}
            trend="up"
            trendValue="ممتاز"
            onClick={() => router.push('/installments')}
            loading={loading}
          />
          <KPICard
            title="إجمالي الديون"
            value={kpis ? formatCurrency(kpis.totalDebt) : '0'}
            icon={TrendingDown}
            trend="down"
            trendValue="يحتاج متابعة"
            onClick={() => router.push('/installments')}
            loading={loading}
          />
          <KPICard
            title="عدد الوحدات"
            value={kpis ? `${kpis.unitCounts.total}` : '0'}
            icon={Building2}
            trend="up"
            trendValue={`متاحة: ${kpis?.unitCounts.available || 0}`}
            onClick={() => router.push('/units')}
            loading={loading}
          />
          <KPICard
            title="عدد المستثمرين"
            value={kpis ? `${kpis.investorCount}` : '0'}
            icon={Users}
            trend="up"
            trendValue="نشط"
            onClick={() => router.push('/partners')}
            loading={loading}
          />
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle>تطور المبيعات</CardTitle>
            <CardDescription>مقارنة المبيعات والعقود خلال الأشهر الماضية</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="sales" 
                    stackId="1" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="contracts" 
                    stackId="2" 
                    stroke="#10b981" 
                    fill="#10b981" 
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Unit Status Chart */}
        <Card>
          <CardHeader>
            <CardTitle>حالة الوحدات</CardTitle>
            <CardDescription>توزيع الوحدات حسب الحالة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={unitStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {unitStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-card-foreground mb-6">الإجراءات السريعة</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {quickActions.map((action, index) => (
            <QuickActionCard
              key={index}
              title={action.title}
              icon={action.icon}
              onClick={action.onClick}
              loading={loading}
            />
          ))}
        </div>
      </div>
      
      <NotificationSystem 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </ModernLayout>
  )
}