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
  Plus,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  RefreshCw,
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
} from "recharts"

// Mock data - replace with real API calls
const mockStats = {
  totalCustomers: 1247,
  totalContracts: 892,
  totalUnits: 156,
  totalRevenue: 24500000,
  monthlyGrowth: 12.5,
  contractCompletion: 78.3,
}

const salesData = [
  { month: "يناير", sales: 4000, contracts: 2400 },
  { month: "فبراير", sales: 3000, contracts: 1398 },
  { month: "مارس", sales: 2000, contracts: 9800 },
  { month: "أبريل", sales: 2780, contracts: 3908 },
  { month: "مايو", sales: 1890, contracts: 4800 },
  { month: "يونيو", sales: 2390, contracts: 3800 },
]

const unitStatusData = [
  { name: "مباع", value: 78, color: "#10b981" },
  { name: "متاح", value: 22, color: "#3b82f6" },
]

const recentContracts = [
  { id: "1", customer: "أحمد محمد", unit: "شقة 101", amount: 250000, status: "مكتمل" },
  { id: "2", customer: "فاطمة علي", unit: "شقة 205", amount: 180000, status: "قيد التنفيذ" },
  { id: "3", customer: "محمد حسن", unit: "شقة 302", amount: 320000, status: "مكتمل" },
  { id: "4", customer: "نور الدين", unit: "شقة 108", amount: 195000, status: "قيد التنفيذ" },
]

const StatCard = ({ title, value, change, icon: Icon, color = "blue" }: any) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
      <Icon className={`h-4 w-4 text-${color}-500`} />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">
        <span className="text-green-600">+{change}%</span> من الشهر الماضي
      </p>
    </CardContent>
  </Card>
)

const QuickActionCard = ({ title, description, icon: Icon, onClick, color = "blue" }: any) => (
  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
    <CardHeader className="pb-3">
      <div className="flex items-center space-x-2 rtl:space-x-reverse">
        <div className={`p-2 rounded-lg bg-${color}-100 dark:bg-${color}-900/20`}>
          <Icon className={`h-5 w-5 text-${color}-600 dark:text-${color}-400`} />
        </div>
        <CardTitle className="text-base">{title}</CardTitle>
      </div>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
)

const ContractRow = ({ contract }: any) => (
  <div className="flex items-center justify-between p-3 border-b border-border last:border-b-0">
    <div className="flex items-center space-x-3 rtl:space-x-reverse">
      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
        <FileText className="w-4 h-4 text-primary" />
      </div>
      <div>
        <p className="font-medium">{contract.customer}</p>
        <p className="text-sm text-muted-foreground">{contract.unit}</p>
      </div>
    </div>
    <div className="flex items-center space-x-3 rtl:space-x-reverse">
      <span className="font-medium">{contract.amount.toLocaleString()} ر.س</span>
      <Badge variant={contract.status === "مكتمل" ? "default" : "secondary"}>
        {contract.status}
      </Badge>
    </div>
  </div>
)

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64 mt-2" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-3 w-32 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-80 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">لوحة التحكم</h1>
            <p className="text-muted-foreground">
              نظرة عامة على أداء النظام والإحصائيات المهمة
            </p>
          </div>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 ml-2 rtl:ml-0 rtl:mr-2" />
              تحديث
            </Button>
            <Button size="sm">
              <Download className="w-4 h-4 ml-2 rtl:ml-0 rtl:mr-2" />
              تصدير
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="إجمالي العملاء"
            value={mockStats.totalCustomers.toLocaleString()}
            change={12.5}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="إجمالي العقود"
            value={mockStats.totalContracts.toLocaleString()}
            change={8.2}
            icon={FileText}
            color="green"
          />
          <StatCard
            title="إجمالي الوحدات"
            value={mockStats.totalUnits.toLocaleString()}
            change={15.3}
            icon={Building2}
            color="purple"
          />
          <StatCard
            title="إجمالي الإيرادات"
            value={`${(mockStats.totalRevenue / 1000000).toFixed(1)}م ر.س`}
            change={22.1}
            icon={TrendingUp}
            color="orange"
          />
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>مقارنة المبيعات والعقود</CardTitle>
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
                      stackId="1" 
                      stroke="#10b981" 
                      fill="#10b981" 
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

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
                      label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
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
        <Card>
          <CardHeader>
            <CardTitle>الإجراءات السريعة</CardTitle>
            <CardDescription>الوصول السريع للوظائف المهمة</CardDescription>
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

        {/* Recent Contracts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>العقود الأخيرة</CardTitle>
                <CardDescription>آخر العقود المضافة إلى النظام</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                عرض الكل
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {recentContracts.map((contract) => (
                <ContractRow key={contract.id} contract={contract} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}