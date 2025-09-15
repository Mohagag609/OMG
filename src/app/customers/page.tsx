"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AppLayout } from "@/components/layout/app-layout"
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Download,
  RefreshCw,
  FileText,
  TrendingUp,
  MoreHorizontal,
  Star,
  CheckCircle,
  XCircle,
  Clock,
  Printer,
} from "lucide-react"

// Mock data - replace with real API calls
const mockCustomers = [
  {
    id: "1",
    name: "أحمد محمد علي",
    email: "ahmed@example.com",
    phone: "+966501234567",
    address: "الرياض، المملكة العربية السعودية",
    joinDate: "2024-01-15",
    totalContracts: 3,
    totalAmount: 750000,
    status: "نشط",
    avatar: "أ",
    lastActivity: "منذ ساعتين",
  },
  {
    id: "2",
    name: "فاطمة حسن السعيد",
    email: "fatima@example.com",
    phone: "+966502345678",
    address: "جدة، المملكة العربية السعودية",
    joinDate: "2024-02-20",
    totalContracts: 1,
    totalAmount: 320000,
    status: "نشط",
    avatar: "ف",
    lastActivity: "منذ 5 ساعات",
  },
  {
    id: "3",
    name: "محمد عبدالله القحطاني",
    email: "mohammed@example.com",
    phone: "+966503456789",
    address: "الدمام، المملكة العربية السعودية",
    joinDate: "2024-03-10",
    totalContracts: 2,
    totalAmount: 450000,
    status: "غير نشط",
    avatar: "م",
    lastActivity: "منذ 3 أيام",
  },
  {
    id: "4",
    name: "نور الدين أحمد",
    email: "nour@example.com",
    phone: "+966504567890",
    address: "الرياض، المملكة العربية السعودية",
    joinDate: "2024-01-25",
    totalContracts: 4,
    totalAmount: 980000,
    status: "نشط",
    avatar: "ن",
    lastActivity: "منذ ساعة",
  },
]

const CustomerRowSkeleton = () => (
  <TableRow>
    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
    <TableCell><Skeleton className="h-8 w-20" /></TableCell>
    <TableCell><Skeleton className="h-8 w-24" /></TableCell>
  </TableRow>
)

export default function Customers() {
  const [customers, setCustomers] = useState(mockCustomers)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  })

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 1200)
    return () => clearTimeout(timer)
  }, [])

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.phone.includes(searchQuery)
    const matchesStatus = statusFilter === "all" || customer.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleAddCustomer = () => {
    if (newCustomer.name && newCustomer.email && newCustomer.phone) {
      const customer = {
        id: Date.now().toString(),
        ...newCustomer,
        joinDate: new Date().toISOString().split('T')[0],
        totalContracts: 0,
        totalAmount: 0,
        status: "نشط",
        avatar: newCustomer.name.charAt(0),
        lastActivity: "الآن",
      }
      setCustomers([customer, ...customers])
      setNewCustomer({ name: "", email: "", phone: "", address: "" })
      setShowAddDialog(false)
    }
  }

  const handleDeleteCustomer = (id: string) => {
    setCustomers(customers.filter(customer => customer.id !== id))
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "نشط":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
            <CheckCircle className="w-3 h-3 ml-1 rtl:ml-0 rtl:mr-1" />
            نشط
          </Badge>
        )
      case "غير نشط":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200">
            <XCircle className="w-3 h-3 ml-1 rtl:ml-0 rtl:mr-1" />
            غير نشط
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
            <Clock className="w-3 h-3 ml-1 rtl:ml-0 rtl:mr-1" />
            {status}
          </Badge>
        )
    }
  }

  const exportToCSV = () => {
    const headers = ['الاسم', 'البريد الإلكتروني', 'الهاتف', 'العنوان', 'تاريخ الانضمام', 'عدد العقود', 'إجمالي المبلغ', 'الحالة']
    const csvContent = [
      headers.join(','),
      ...customers.map(customer => [
        customer.name,
        customer.email,
        customer.phone,
        customer.address,
        customer.joinDate,
        customer.totalContracts,
        customer.totalAmount,
        customer.status
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `customers_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const printCustomers = () => {
    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <title>تقرير العملاء</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
            th { background-color: #f2f2f2; }
            .header { text-align: center; margin-bottom: 30px; }
            .date { text-align: left; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>تقرير العملاء</h1>
            <p class="date">تاريخ الطباعة: ${new Date().toLocaleString('en-GB')}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>الاسم</th>
                <th>البريد الإلكتروني</th>
                <th>الهاتف</th>
                <th>العنوان</th>
                <th>تاريخ الانضمام</th>
                <th>عدد العقود</th>
                <th>إجمالي المبلغ</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              ${customers.map(customer => `
                <tr>
                  <td>${customer.name}</td>
                  <td>${customer.email}</td>
                  <td>${customer.phone}</td>
                  <td>${customer.address}</td>
                  <td>${customer.joinDate}</td>
                  <td>${customer.totalContracts}</td>
                  <td>${customer.totalAmount.toLocaleString()} ر.س</td>
                  <td>${customer.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `
    
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex space-x-2 rtl:space-x-reverse">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>

          {/* Search Skeleton */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-24" />
              </div>
            </CardContent>
          </Card>

          {/* Stats Skeleton */}
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-20 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Table Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>العميل</TableHead>
                    <TableHead>معلومات الاتصال</TableHead>
                    <TableHead>العنوان</TableHead>
                    <TableHead>تاريخ الانضمام</TableHead>
                    <TableHead>العقود</TableHead>
                    <TableHead>القيمة</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <CustomerRowSkeleton key={i} />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              إدارة العملاء
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              إدارة قاعدة بيانات العملاء والمعلومات الشخصية
            </p>
          </div>
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <Button variant="outline" size="sm" className="h-10" onClick={printCustomers}>
              <Printer className="w-4 h-4 ml-2 rtl:ml-0 rtl:mr-2" />
              طباعة PDF
            </Button>
            <Button variant="outline" size="sm" className="h-10" onClick={exportToCSV}>
              <Download className="w-4 h-4 ml-2 rtl:ml-0 rtl:mr-2" />
              تصدير CSV
            </Button>
            <Button variant="outline" size="sm" className="h-10">
              <RefreshCw className="w-4 h-4 ml-2 rtl:ml-0 rtl:mr-2" />
              تحديث
            </Button>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="h-10 bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 ml-2 rtl:ml-0 rtl:mr-2" />
                  إضافة عميل
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">إضافة عميل جديد</DialogTitle>
                  <DialogDescription>
                    أدخل معلومات العميل الجديد في الحقول أدناه
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name" className="text-sm font-medium">الاسم الكامل</Label>
                    <Input
                      id="name"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                      placeholder="أدخل الاسم الكامل"
                      className="h-10"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-sm font-medium">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                      placeholder="example@email.com"
                      className="h-10"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone" className="text-sm font-medium">رقم الهاتف</Label>
                    <Input
                      id="phone"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                      placeholder="+966501234567"
                      className="h-10"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="address" className="text-sm font-medium">العنوان</Label>
                    <Input
                      id="address"
                      value={newCustomer.address}
                      onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                      placeholder="أدخل العنوان"
                      className="h-10"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={handleAddCustomer} className="bg-blue-600 hover:bg-blue-700">
                    إضافة العميل
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="البحث في العملاء..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 h-10 rounded-lg border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                  dir="rtl"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg text-sm h-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">جميع الحالات</option>
                <option value="نشط">نشط</option>
                <option value="غير نشط">غير نشط</option>
              </select>
              <Button variant="outline" className="h-10">
                <Filter className="w-4 h-4 ml-2 rtl:ml-0 rtl:mr-2" />
                فلتر
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">إجمالي العملاء</CardTitle>
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{customers.length}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                +12% من الشهر الماضي
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">العملاء النشطين</CardTitle>
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {customers.filter(c => c.status === "نشط").length}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {Math.round((customers.filter(c => c.status === "نشط").length / customers.length) * 100)}% من إجمالي العملاء
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">إجمالي العقود</CardTitle>
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {customers.reduce((sum, c) => sum + c.totalContracts, 0)}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                متوسط {Math.round(customers.reduce((sum, c) => sum + c.totalContracts, 0) / customers.length)} عقد لكل عميل
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">إجمالي القيمة</CardTitle>
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {(customers.reduce((sum, c) => sum + c.totalAmount, 0) / 1000000).toFixed(1)}م ر.س
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                متوسط {Math.round(customers.reduce((sum, c) => sum + c.totalAmount, 0) / customers.length).toLocaleString()} ر.س لكل عميل
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Customers Table */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">قائمة العملاء</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              عرض {filteredCustomers.length} من أصل {customers.length} عميل
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200 dark:border-gray-700">
                  <TableHead className="font-semibold text-gray-900 dark:text-white">العميل</TableHead>
                  <TableHead className="font-semibold text-gray-900 dark:text-white">معلومات الاتصال</TableHead>
                  <TableHead className="font-semibold text-gray-900 dark:text-white">العنوان</TableHead>
                  <TableHead className="font-semibold text-gray-900 dark:text-white">تاريخ الانضمام</TableHead>
                  <TableHead className="font-semibold text-gray-900 dark:text-white">العقود</TableHead>
                  <TableHead className="font-semibold text-gray-900 dark:text-white">القيمة</TableHead>
                  <TableHead className="font-semibold text-gray-900 dark:text-white">الحالة</TableHead>
                  <TableHead className="font-semibold text-gray-900 dark:text-white">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <TableCell>
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {customer.avatar}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{customer.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{customer.lastActivity}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{customer.email}</span>
                        </div>
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{customer.phone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm max-w-32 truncate">{customer.address}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{customer.joinDate}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 rtl:space-x-reverse">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{customer.totalContracts}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {customer.totalAmount.toLocaleString()} ر.س
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(customer.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 rtl:space-x-reverse">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => handleDeleteCustomer(customer.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}