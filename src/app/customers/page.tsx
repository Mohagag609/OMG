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
  </TableRow>
)

export default function Customers() {
  const [customers, setCustomers] = useState(mockCustomers)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  })

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 1000)
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
        return <Badge variant="default">نشط</Badge>
      case "غير نشط":
        return <Badge variant="secondary">غير نشط</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-64 mt-2" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>

          {/* Search and Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-24" />
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>البريد الإلكتروني</TableHead>
                    <TableHead>الهاتف</TableHead>
                    <TableHead>العنوان</TableHead>
                    <TableHead>تاريخ الانضمام</TableHead>
                    <TableHead>العقود</TableHead>
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
            <h1 className="text-3xl font-bold tracking-tight">العملاء</h1>
            <p className="text-muted-foreground">
              إدارة قاعدة بيانات العملاء والمعلومات الشخصية
            </p>
          </div>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 ml-2 rtl:ml-0 rtl:mr-2" />
              تصدير
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 ml-2 rtl:ml-0 rtl:mr-2" />
              تحديث
            </Button>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 ml-2 rtl:ml-0 rtl:mr-2" />
                  إضافة عميل
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>إضافة عميل جديد</DialogTitle>
                  <DialogDescription>
                    أدخل معلومات العميل الجديد في الحقول أدناه
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">الاسم الكامل</Label>
                    <Input
                      id="name"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                      placeholder="أدخل الاسم الكامل"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                      placeholder="example@email.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">رقم الهاتف</Label>
                    <Input
                      id="phone"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                      placeholder="+966501234567"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="address">العنوان</Label>
                    <Input
                      id="address"
                      value={newCustomer.address}
                      onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                      placeholder="أدخل العنوان"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={handleAddCustomer}>
                    إضافة العميل
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث في العملاء..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                  dir="rtl"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">جميع الحالات</option>
                <option value="نشط">نشط</option>
                <option value="غير نشط">غير نشط</option>
              </select>
              <Button variant="outline">
                <Filter className="w-4 h-4 ml-2 rtl:ml-0 rtl:mr-2" />
                فلتر
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي العملاء</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customers.length}</div>
              <p className="text-xs text-muted-foreground">
                +12% من الشهر الماضي
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">العملاء النشطين</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {customers.filter(c => c.status === "نشط").length}
              </div>
              <p className="text-xs text-muted-foreground">
                {Math.round((customers.filter(c => c.status === "نشط").length / customers.length) * 100)}% من إجمالي العملاء
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي العقود</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {customers.reduce((sum, c) => sum + c.totalContracts, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                متوسط {Math.round(customers.reduce((sum, c) => sum + c.totalContracts, 0) / customers.length)} عقد لكل عميل
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي القيمة</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(customers.reduce((sum, c) => sum + c.totalAmount, 0) / 1000000).toFixed(1)}م ر.س
              </div>
              <p className="text-xs text-muted-foreground">
                متوسط {Math.round(customers.reduce((sum, c) => sum + c.totalAmount, 0) / customers.length).toLocaleString()} ر.س لكل عميل
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Customers Table */}
        <Card>
          <CardHeader>
            <CardTitle>قائمة العملاء</CardTitle>
            <CardDescription>
              عرض {filteredCustomers.length} من أصل {customers.length} عميل
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>الهاتف</TableHead>
                  <TableHead>العنوان</TableHead>
                  <TableHead>تاريخ الانضمام</TableHead>
                  <TableHead>العقود</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{customer.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{customer.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="max-w-32 truncate">{customer.address}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{customer.joinDate}</span>
                      </div>
                    </TableCell>
                    <TableCell>{customer.totalContracts}</TableCell>
                    <TableCell>{getStatusBadge(customer.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteCustomer(customer.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
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