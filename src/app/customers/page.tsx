'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Customer } from '@/types'
import { formatDate } from '@/utils/formatting'
import { NotificationSystem, useNotifications } from '@/components/NotificationSystem'
import ModernLayout from '@/components/modern-layout'
import { checkDuplicateName, checkDuplicatePhone, checkDuplicateNationalId } from '@/utils/duplicateCheck'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Download, 
  Printer, 
  Users,
  Phone,
  MapPin,
  Calendar,
  UserCheck,
  UserX
} from 'lucide-react'

// Loading skeleton for table rows
const CustomerRowSkeleton = () => (
  <TableRow>
    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
    <TableCell><Skeleton className="h-8 w-24" /></TableCell>
  </TableRow>
)

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [deletingCustomers, setDeletingCustomers] = useState<Set<string>>(new Set())
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    nationalId: '',
    address: '',
    status: 'نشط',
    notes: ''
  })
  
  const router = useRouter()
  const { notifications, addNotification, removeNotification } = useNotifications()

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'b':
            e.preventDefault()
            setSidebarOpen(!sidebarOpen)
            break
          case 'n':
            e.preventDefault()
            setShowAddModal(true)
            break
          case 'f':
            e.preventDefault()
            document.getElementById('search-input')?.focus()
            break
          case 'Escape':
            e.preventDefault()
            setShowAddModal(false)
            setEditingCustomer(null)
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [sidebarOpen])

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      router.push('/login')
      return
    }
    
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/customers', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      const data = await response.json()
      if (data.success) {
        setCustomers(data.data)
      } else {
        setError(data.error || 'خطأ في تحميل العملاء')
      }
    } catch (err) {
      console.error('Error fetching customers:', err)
      setError('خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // التحقق من الاسم فقط (مطلوب)
    if (!newCustomer.name.trim()) {
      addNotification({
        type: 'error',
        title: 'خطأ في البيانات',
        message: 'الرجاء إدخال اسم العميل'
      })
      return
    }

    // فحص تكرار الاسم
    if (checkDuplicateName(newCustomer.name.trim(), customers)) {
      addNotification({
        type: 'error',
        title: 'خطأ في البيانات',
        message: 'اسم العميل موجود بالفعل'
      })
      return
    }

    // فحص تكرار رقم الهاتف (إذا تم إدخاله)
    if (newCustomer.phone && newCustomer.phone.trim() && checkDuplicatePhone(newCustomer.phone.trim(), customers)) {
      addNotification({
        type: 'error',
        title: 'خطأ في البيانات',
        message: 'رقم الهاتف موجود بالفعل'
      })
      return
    }

    // فحص تكرار الرقم القومي (إذا تم إدخاله)
    if (newCustomer.nationalId && newCustomer.nationalId.trim() && checkDuplicateNationalId(newCustomer.nationalId.trim(), customers)) {
      addNotification({
        type: 'error',
        title: 'خطأ في البيانات',
        message: 'الرقم القومي موجود بالفعل'
      })
      return
    }

    // إغلاق النافذة فوراً وإظهار النجاح
    setShowAddModal(false)
    setSuccess('تم إضافة العميل بنجاح!')
    setError(null)
    
    // إضافة العميل للقائمة فوراً مع ID مؤقت
    const tempCustomer = {
      ...newCustomer,
      id: `temp-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setCustomers(prev => [tempCustomer, ...prev])

    // إعادة تعيين النموذج
    setNewCustomer({
      name: '',
      phone: '',
      nationalId: '',
      address: '',
      status: 'نشط',
      notes: ''
    })

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newCustomer)
      })

      const data = await response.json()
      if (data.success) {
        // استبدال العميل المؤقت بالعميل الحقيقي
        setCustomers(prev => prev.map(customer => 
          customer.id === tempCustomer.id ? data.data : customer
        ))
        addNotification({
          type: 'success',
          title: 'تم الحفظ بنجاح',
          message: 'تم إضافة العميل بنجاح'
        })
      } else {
        // في حالة فشل الحفظ، نزيل العميل المؤقت ونعيد النافذة
        setCustomers(prev => prev.filter(customer => customer.id !== tempCustomer.id))
        setShowAddModal(true)
        setError(data.error || 'خطأ في إضافة العميل')
        setSuccess(null)
        addNotification({
          type: 'error',
          title: 'خطأ في الحفظ',
          message: data.error || 'فشل في إضافة العميل'
        })
      }
    } catch (err) {
      console.error('Add customer error:', err)
      // في حالة فشل الحفظ، نزيل العميل المؤقت ونعيد النافذة
      setCustomers(prev => prev.filter(customer => customer.id !== tempCustomer.id))
      setShowAddModal(true)
      setError('خطأ في إضافة العميل')
      setSuccess(null)
      addNotification({
        type: 'error',
        title: 'خطأ في الحفظ',
        message: 'فشل في إضافة العميل'
      })
    }
  }

  const handleEditCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingCustomer) return

    // التحقق من الاسم فقط (مطلوب)
    if (!newCustomer.name.trim()) {
      addNotification({
        type: 'error',
        title: 'خطأ في البيانات',
        message: 'الرجاء إدخال اسم العميل'
      })
      return
    }

    // فحص تكرار الاسم (باستثناء العميل الحالي)
    if (checkDuplicateName(newCustomer.name.trim(), customers, editingCustomer.id)) {
      addNotification({
        type: 'error',
        title: 'خطأ في البيانات',
        message: 'اسم العميل موجود بالفعل'
      })
      return
    }

    // فحص تكرار رقم الهاتف (إذا تم إدخاله)
    if (newCustomer.phone && newCustomer.phone.trim() && checkDuplicatePhone(newCustomer.phone.trim(), customers, editingCustomer.id)) {
      addNotification({
        type: 'error',
        title: 'خطأ في البيانات',
        message: 'رقم الهاتف موجود بالفعل'
      })
      return
    }

    // فحص تكرار الرقم القومي (إذا تم إدخاله)
    if (newCustomer.nationalId && newCustomer.nationalId.trim() && checkDuplicateNationalId(newCustomer.nationalId.trim(), customers, editingCustomer.id)) {
      addNotification({
        type: 'error',
        title: 'خطأ في البيانات',
        message: 'الرقم القومي موجود بالفعل'
      })
      return
    }

    // إغلاق النافذة فوراً وإظهار النجاح
    setShowAddModal(false)
    setEditingCustomer(null)
    setSuccess('تم تحديث العميل بنجاح!')
    setError(null)

    // تحديث العميل في القائمة فوراً
    const updatedCustomer = {
      ...editingCustomer,
      ...newCustomer,
      updatedAt: new Date().toISOString()
    }
    setCustomers(prev => prev.map(customer => 
      customer.id === editingCustomer.id ? updatedCustomer : customer
    ))

    // إعادة تعيين النموذج
    setNewCustomer({
      name: '',
      phone: '',
      nationalId: '',
      address: '',
      status: 'نشط',
      notes: ''
    })

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/customers/${editingCustomer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newCustomer)
      })

      const data = await response.json()
      if (data.success) {
        // استبدال العميل المحدث بالبيانات الحقيقية من الخادم
        setCustomers(prev => prev.map(customer => 
          customer.id === editingCustomer.id ? data.data : customer
        ))
        addNotification({
          type: 'success',
          title: 'تم التحديث بنجاح',
          message: 'تم تحديث العميل بنجاح'
        })
      } else {
        // في حالة فشل التحديث، نعيد البيانات الأصلية
        fetchCustomers()
        setError(data.error || 'خطأ في تحديث العميل')
        setSuccess(null)
        addNotification({
          type: 'error',
          title: 'خطأ في التحديث',
          message: data.error || 'فشل في تحديث العميل'
        })
      }
    } catch (err) {
      console.error('Update customer error:', err)
      // في حالة فشل التحديث، نعيد البيانات الأصلية
      fetchCustomers()
      setError('خطأ في تحديث العميل')
      setSuccess(null)
      addNotification({
        type: 'error',
        title: 'خطأ في التحديث',
        message: 'فشل في تحديث العميل'
      })
    }
  }

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العميل؟')) return

    // إضافة العميل لقائمة الحذف وإظهار الحركة فوراً
    setDeletingCustomers(prev => {
      const newSet = new Set(prev)
      newSet.add(customerId)
      return newSet
    })
    
    // إزالة العميل من القائمة فوراً مع الحركة
    setCustomers(prev => prev.filter(customer => customer.id !== customerId))

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()
      if (data.success) {
        setSuccess('تم حذف العميل بنجاح!')
        setError(null)
        addNotification({
          type: 'success',
          title: 'تم الحذف بنجاح',
          message: 'تم حذف العميل بنجاح'
        })
      } else {
        // في حالة فشل الحذف، نعيد العميل للقائمة
        fetchCustomers()
        setError(data.error || 'خطأ في حذف العميل')
        setSuccess(null)
        addNotification({
          type: 'error',
          title: 'خطأ في الحذف',
          message: data.error || 'فشل في حذف العميل'
        })
      }
    } catch (err) {
      console.error('Delete customer error:', err)
      // في حالة فشل الحذف، نعيد العميل للقائمة
      fetchCustomers()
      setError('خطأ في حذف العميل')
      setSuccess(null)
      addNotification({
        type: 'error',
        title: 'خطأ في الحذف',
        message: 'فشل في حذف العميل'
      })
    } finally {
      // إزالة العميل من قائمة الحذف
      setDeletingCustomers(prev => {
        const newSet = new Set(prev)
        newSet.delete(customerId)
        return newSet
      })
    }
  }

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer)
    setNewCustomer({
      name: customer.name,
      phone: customer.phone || '',
      nationalId: customer.nationalId || '',
      address: customer.address || '',
      status: customer.status,
      notes: customer.notes || ''
    })
    setShowAddModal(true)
  }

  if (loading) {
    return (
      <ModernLayout title="إدارة العملاء" subtitle="نظام متطور لإدارة العملاء" icon={<Users className="w-6 h-6 text-white" />}>
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
    <ModernLayout title="إدارة العملاء" subtitle="نظام متطور لإدارة العملاء" icon={<Users className="w-6 h-6 text-white" />}>
      <div className="flex items-center justify-between mb-8">
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 ml-2" />
          إضافة عميل جديد
          <span className="mr-2 text-xs opacity-70">Ctrl+N</span>
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="search-input"
                  type="text"
                  placeholder="ابحث في العملاء... (Ctrl+F)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-80 pr-10"
                />
              </div>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 ml-2" />
                تصدير CSV
              </Button>
              <Button variant="outline" size="sm">
                <Printer className="w-4 h-4 ml-2" />
                طباعة PDF
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              {customers.length} عميل
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customers List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>قائمة العملاء</CardTitle>
              <CardDescription>إدارة جميع العملاء في النظام</CardDescription>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="text-sm text-muted-foreground">آخر تحديث:</span>
              <span className="text-sm font-medium text-card-foreground">{new Date().toLocaleString('en-GB')}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-6 p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
              <div className="flex items-center">
                <span className="text-destructive mr-2">⚠️</span>
                <span className="text-destructive">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✅</span>
                <span className="text-green-700">{success}</span>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">رقم الهاتف</TableHead>
                  <TableHead className="text-right">الرقم القومي</TableHead>
                  <TableHead className="text-right">العنوان</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">تاريخ الإضافة</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <CustomerRowSkeleton key={index} />
                  ))
                ) : (
                  customers.filter(customer => 
                    search === '' || 
                    customer.name.toLowerCase().includes(search.toLowerCase()) ||
                    (customer.phone && customer.phone.toLowerCase().includes(search.toLowerCase())) ||
                    (customer.nationalId && customer.nationalId.toLowerCase().includes(search.toLowerCase()))
                  ).map((customer) => (
                    <TableRow 
                      key={customer.id} 
                      className={`
                        transition-all duration-300
                        ${deletingCustomers.has(customer.id) 
                          ? 'transform translate-x-full opacity-0 scale-95' 
                          : 'transform translate-x-0 opacity-100 scale-100'
                        }
                      `}
                    >
                      <TableCell>
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <Users className="w-4 h-4 text-primary" />
                          </div>
                          <div className="font-medium text-card-foreground">{customer.name}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{customer.phone || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">{customer.nationalId || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2 space-x-reverse max-w-xs">
                          <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-muted-foreground truncate">{customer.address || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={customer.status === 'نشط' ? 'default' : 'secondary'}>
                          {customer.status === 'نشط' ? (
                            <UserCheck className="w-3 h-3 ml-1" />
                          ) : (
                            <UserX className="w-3 h-3 ml-1" />
                          )}
                          {customer.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{formatDate(customer.createdAt || new Date())}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Button size="sm" variant="outline" onClick={() => openEditModal(customer)}>
                            <Edit className="w-4 h-4 ml-1" />
                            تعديل
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => handleDeleteCustomer(customer.id)}
                            disabled={deletingCustomers.has(customer.id)}
                          >
                            <Trash2 className="w-4 h-4 ml-1" />
                            حذف
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Customer Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? 'تعديل العميل' : 'إضافة عميل جديد'}
            </DialogTitle>
            <DialogDescription>
              {editingCustomer ? 'قم بتحديث معلومات العميل' : 'أدخل معلومات العميل الجديد'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={editingCustomer ? handleEditCustomer : handleAddCustomer} className="space-y-6">
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center">
                <span className="text-primary mr-2">ℹ️</span>
                <span className="text-primary text-sm font-medium">
                  الاسم فقط مطلوب، باقي الحقول اختيارية
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">الاسم * (مطلوب)</Label>
                <Input
                  id="name"
                  type="text"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                  placeholder="اسم العميل"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف (اختياري)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                  placeholder="رقم الهاتف"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nationalId">الرقم القومي (اختياري)</Label>
                <Input
                  id="nationalId"
                  type="text"
                  value={newCustomer.nationalId}
                  onChange={(e) => setNewCustomer({...newCustomer, nationalId: e.target.value})}
                  placeholder="الرقم القومي"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">الحالة</Label>
                <select
                  id="status"
                  value={newCustomer.status}
                  onChange={(e) => setNewCustomer({...newCustomer, status: e.target.value})}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="نشط">نشط</option>
                  <option value="غير نشط">غير نشط</option>
                </select>
              </div>
              
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="address">العنوان</Label>
                <Input
                  id="address"
                  type="text"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                  placeholder="عنوان العميل"
                />
              </div>
              
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="notes">ملاحظات</Label>
                <textarea
                  id="notes"
                  value={newCustomer.notes}
                  onChange={(e) => setNewCustomer({...newCustomer, notes: e.target.value})}
                  placeholder="ملاحظات إضافية"
                  rows={3}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowAddModal(false)
                  setEditingCustomer(null)
                  setNewCustomer({
                    name: '',
                    phone: '',
                    nationalId: '',
                    address: '',
                    status: 'نشط',
                    notes: ''
                  })
                }}
              >
                إلغاء
              </Button>
              <Button type="submit">
                <span className="mr-2">💾</span>
                {editingCustomer ? 'تحديث العميل' : 'إضافة العميل'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <NotificationSystem 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </ModernLayout>
  )
}