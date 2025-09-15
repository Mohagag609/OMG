"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AppLayout } from "@/components/layout/app-layout"
import {
  Users,
  FileText,
  Building2,
  Calculator,
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Calendar,
  Clock,
  Star,
  Activity,
  Target,
  Zap,
} from "lucide-react"
import {
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
  Bar,
  LineChart,
  Line,
} from "recharts"

// Mock data - replace with real API calls
const mockStats = {
  totalCustomers: 1247,
  totalContracts: 892,
  totalUnits: 156,
  totalRevenue: 24500000,
  monthlyGrowth: 12.5,
  contractCompletion: 78.3,
  activeProjects: 23,
  pendingTasks: 8,
}

const salesData = [
  { month: "يناير", sales: 4000, contracts: 2400, revenue: 120000 },
  { month: "فبراير", sales: 3000, contracts: 1398, revenue: 98000 },
  { month: "مارس", sales: 2000, contracts: 9800, revenue: 156000 },
  { month: "أبريل", sales: 2780, contracts: 3908, revenue: 134000 },
  { month: "مايو", sales: 1890, contracts: 4800, revenue: 187000 },
  { month: "يونيو", sales: 2390, contracts: 3800, revenue: 145000 },
]

const unitStatusData = [
  { name: "مباع", value: 78, color: "#10b981", amount: 18750000 },
  { name: "متاح", value: 22, color: "#3b82f6", amount: 5750000 },
]

const recentActivities = [
  { id: "1", type: "contract", title: "تم إنشاء عقد جديد", description: "عقد شقة 101 - أحمد محمد", time: "منذ 5 دقائق", status: "success" },
  { id: "2", type: "payment", title: "تم استلام دفعة", description: "دفعة بقيمة 50,000 ر.س", time: "منذ 15 دقيقة", status: "success" },
  { id: "3", type: "customer", title: "عميل جديد", description: "تم تسجيل فاطمة علي", time: "منذ ساعة", status: "info" },
  { id: "4", type: "unit", title: "وحدة جديدة", description: "تم إضافة شقة 205", time: "منذ ساعتين", status: "info" },
]

const StatCard = ({ title, value, change, icon: Icon, color = "blue", trend = "up" }: any) => (
  <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
    <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
        {title}
      </CardTitle>
      <div className={`p-2 rounded-lg bg-${color}-100 dark:bg-${color}-900/20`}>
        <Icon className={`h-5 w-5 text-${color}-600 dark:text-${color}-400`} />
      </div>
    </CardHeader>
    <CardContent className="relative z-10">
      <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</div>
      <div className="flex items-center space-x-1 rtl:space-x-reverse">
        {trend === "up" ? (
          <ArrowUpRight className="h-4 w-4 text-green-600" />
        ) : (
          <ArrowDownRight className="h-4 w-4 text-red-600" />
        )}
        <span className={`text-sm font-medium ${trend === "up" ? "text-green-600" : "text-red-600"}`}>
          +{change}%
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">من الشهر الماضي</span>
      </div>
    </CardContent>
  </Card>
)

const QuickActionCard = ({ title, description, icon: Icon, onClick, color = "blue" }: any) => (
  <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 group border-0 shadow-md hover:shadow-xl" onClick={onClick}>
    <CardContent className="p-6">
      <div className="flex items-center space-x-4 rtl:space-x-reverse">
        <div className={`p-3 rounded-xl bg-${color}-100 dark:bg-${color}-900/20 group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`h-6 w-6 text-${color}-600 dark:text-${color}-400`} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
        <ArrowUpRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
      </div>
    </CardContent>
  </Card>
)

const ActivityItem = ({ activity }: any) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "success": return "text-green-600 bg-green-100 dark:bg-green-900/20"
      case "info": return "text-blue-600 bg-blue-100 dark:bg-blue-900/20"
      case "warning": return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20"
      default: return "text-gray-600 bg-gray-100 dark:bg-gray-900/20"
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "contract": return FileText
      case "payment": return DollarSign
      case "customer": return Users
      case "unit": return Building2
      default: return Activity
    }
  }

  const Icon = getIcon(activity.type)

  return (
    <div className="flex items-start space-x-3 rtl:space-x-reverse p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      <div className={`p-2 rounded-lg ${getStatusColor(activity.status)}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.title}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{activity.description}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{activity.time}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-8">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
            <div className="flex space-x-2 rtl:space-x-reverse">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>

          {/* Stats Grid Skeleton */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-20 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts Skeleton */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-80 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-80 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              مرحباً بك في لوحة التحكم
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              نظرة عامة على أداء النظام والإحصائيات المهمة
            </p>
          </div>
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <Button variant="outline" size="sm" className="h-10">
              <Download className="w-4 h-4 ml-2 rtl:ml-0 rtl:mr-2" />
              تصدير
            </Button>
            <Button size="sm" className="h-10 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 ml-2 rtl:ml-0 rtl:mr-2" />
              إضافة جديد
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="إجمالي العملاء"
            value={mockStats.totalCustomers.toLocaleString()}
            change={12.5}
            icon={Users}
            color="blue"
            trend="up"
          />
          <StatCard
            title="إجمالي العقود"
            value={mockStats.totalContracts.toLocaleString()}
            change={8.2}
            icon={FileText}
            color="green"
            trend="up"
          />
          <StatCard
            title="إجمالي الوحدات"
            value={mockStats.totalUnits.toLocaleString()}
            change={15.3}
            icon={Building2}
            color="purple"
            trend="up"
          />
          <StatCard
            title="إجمالي الإيرادات"
            value={`${(mockStats.totalRevenue / 1000000).toFixed(1)}م ر.س`}
            change={22.1}
            icon={TrendingUp}
            color="orange"
            trend="up"
          />
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                مقارنة المبيعات والعقود
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                مقارنة المبيعات والعقود خلال الأشهر الماضية
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesData}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorContracts" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" className="text-sm" />
                    <YAxis className="text-sm" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="sales" 
                      stackId="1" 
                      stroke="#3b82f6" 
                      fill="url(#colorSales)"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="contracts" 
                      stackId="1" 
                      stroke="#10b981" 
                      fill="url(#colorContracts)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                حالة الوحدات
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                توزيع الوحدات حسب الحالة
              </CardDescription>
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
                      label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {unitStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
              الإجراءات السريعة
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              الوصول السريع للوظائف المهمة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <QuickActionCard
                title="إضافة عميل جديد"
                description="تسجيل عميل جديد في النظام"
                icon={Users}
                color="blue"
                onClick={() => console.log("Add customer")}
              />
              <QuickActionCard
                title="إنشاء عقد جديد"
                description="بدء عملية إنشاء عقد جديد"
                icon={FileText}
                color="green"
                onClick={() => console.log("Add contract")}
              />
              <QuickActionCard
                title="إضافة وحدة جديدة"
                description="تسجيل وحدة عقارية جديدة"
                icon={Building2}
                color="purple"
                onClick={() => console.log("Add unit")}
              />
              <QuickActionCard
                title="تسجيل دفعة"
                description="تسجيل دفعة جديدة من عميل"
                icon={Calculator}
                color="orange"
                onClick={() => console.log("Add payment")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                الأنشطة الأخيرة
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                آخر العمليات المنجزة في النظام
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {recentActivities.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                إحصائيات سريعة
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                مؤشرات الأداء الرئيسية
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">المشاريع النشطة</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">23 مشروع</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                  نشط
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <Zap className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">معدل الإنجاز</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">78.3%</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
                  ممتاز
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                    <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">المهام المعلقة</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">8 مهام</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200">
                  قيد المراجعة
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}