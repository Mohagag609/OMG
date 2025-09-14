'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useNotifications } from '../../components/NotificationSystem'

import Layout from '@/components/Layout'
// Modern Card Component
const ModernCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6 ${className}`}>
    {children}
  </div>
)

// Modern Button Component
const ModernButton = ({ 
  children, 
  onClick, 
  disabled = false, 
  variant = 'primary', 
  size = 'md',
  className = '',
  type = 'button'
}: { 
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  type?: 'button' | 'submit' | 'reset'
}) => {
  const baseClasses = 'font-semibold rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'

  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    danger: 'bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600',
    success: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
  }

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </button>
  )
}

export default function AdminPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    email: '',
    role: 'admin',
    adminKey: ''
  })
  const [adminKey, setAdminKey] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isFirstTime, setIsFirstTime] = useState(false)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false)
  const router = useRouter()
  const { addNotification, removeNotification } = useNotifications()

  useEffect(() => {
    // Check if this is first time access (no users in database)
    checkFirstTimeAccess()

    // Check admin authentication from localStorage
    const adminAuth = localStorage.getItem('adminAuth')
    setIsAdminAuthenticated(adminAuth === 'true')
  }, [router])

  const checkFirstTimeAccess = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        const users = data.users || []

        if (users.length === 0) {
          // No users - show setup form directly
          setIsFirstTime(true)
          setIsAuthenticated(true)
          setShowCreateForm(true)
        } else {
          // Users exist - check admin auth
          const adminAuth = localStorage.getItem('adminAuth')
          if (adminAuth === 'true') {
            setIsAuthenticated(true)
            setIsAdminAuthenticated(true)
            fetchUsers()
          } else {
            // Show admin key input instead of redirecting
            setIsAuthenticated(true)
            setShowCreateForm(false)
          }
        }
      } else {
        // Error - show setup form
        setIsAuthenticated(true)
        setShowCreateForm(true)
      }
    } catch (error) {
      console.error('Error checking users:', error)
      // Error - show setup form
      setIsAuthenticated(true)
      setShowCreateForm(true)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newUser)
      })

      const result = await response.json()

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'تم إنشاء المستخدم',
          message: `تم إنشاء المستخدم "${newUser.username}" بنجاح`
        })
        setShowCreateForm(false)
        setNewUser({ username: '', password: '', email: '', role: 'admin', adminKey: '' })
        fetchUsers()
      } else {
        // Handle specific error cases
        if (response.status === 400) {
          addNotification({
            type: 'error',
            title: 'بيانات غير صحيحة',
            message: result.error || 'يرجى التحقق من البيانات المدخلة'
          })
        } else if (response.status === 409) {
          addNotification({
            type: 'error',
            title: 'المستخدم موجود بالفعل',
            message: 'اسم المستخدم المدخل موجود بالفعل في النظام'
          })
        } else {
          throw new Error(result.error || 'فشل في إنشاء المستخدم')
        }
      }
    } catch (error) {
      console.error('Create user error:', error)
      addNotification({
        type: 'error',
        title: 'خطأ في إنشاء المستخدم',
        message: error instanceof Error ? error.message : 'فشل في إنشاء المستخدم'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'تم حذف المستخدم',
          message: 'تم حذف المستخدم بنجاح'
        })
        fetchUsers()
      } else {
        const result = await response.json()
        if (response.status === 404) {
          addNotification({
            type: 'error',
            title: 'المستخدم غير موجود',
            message: 'المستخدم المطلوب حذفه غير موجود في النظام'
          })
        } else if (response.status === 403) {
          addNotification({
            type: 'error',
            title: 'غير مسموح',
            message: 'لا يمكن حذف هذا المستخدم'
          })
        } else {
          throw new Error(result.error || 'فشل في حذف المستخدم')
        }
      }
    } catch (error) {
      console.error('Delete user error:', error)
      addNotification({
        type: 'error',
        title: 'خطأ في حذف المستخدم',
        message: error instanceof Error ? error.message : 'فشل في حذف المستخدم'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdminKeySubmit = () => {
    const correctAdminKey = process.env.NEXT_PUBLIC_ADMIN_KEY || 'ADMIN_SECRET_2024'
    if (adminKey === correctAdminKey) {
      addNotification({
        type: 'success',
        title: 'تم التحقق بنجاح',
        message: 'تم التحقق من المفتاح السري بنجاح. مرحباً بك في لوحة الإدارة'
      })
      localStorage.setItem('adminAuth', 'true')
      setIsAdminAuthenticated(true)
      fetchUsers()
    } else {
      addNotification({
        type: 'error',
        title: 'المفتاح السري غير صحيح',
        message: 'المفتاح السري المدخل غير صحيح. يرجى التحقق من المفتاح السري للإدارة'
      })
    }
  }

  const handleCleanup = async () => {
    if (!confirm('هل أنت متأكد من تنظيف النظام وحذف البيانات الافتراضية؟')) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/system/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'تم تنظيف النظام',
          message: `تم تنظيف النظام بنجاح. تم حذف ${result.deletedUsers || 0} مستخدم و ${result.deletedCustomers || 0} عميل`
        })
        fetchUsers()
      } else {
        if (response.status === 403) {
          addNotification({
            type: 'error',
            title: 'غير مسموح',
            message: 'ليس لديك صلاحية لتنظيف النظام'
          })
        } else {
          throw new Error(result.error || 'فشل في تنظيف النظام')
        }
      }
    } catch (error) {
      console.error('Cleanup error:', error)
      addNotification({
        type: 'error',
        title: 'خطأ في التنظيف',
        message: error instanceof Error ? error.message : 'فشل في تنظيف النظام'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading while checking authentication
  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">🔒</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">تحتاج إلى صلاحيات</h2>
            <p className="text-gray-600">يرجى تسجيل الدخول للوصول إلى هذه الصفحة</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-white text-xl">👑</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">لوحة الإدارة</h1>
            <p className="text-gray-600">إدارة النظام والمستخدمين</p>
          </div>
        </div>
      </div>

      {/* Users Management */}
      <ModernCard className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">إدارة المستخدمين</h2>
          <ModernButton onClick={() => setShowAddUserModal(true)}>
            <span className="mr-2">➕</span>
            إضافة مستخدم جديد
          </ModernButton>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-right py-4 px-6 font-bold text-gray-900 text-sm uppercase tracking-wide">الاسم</th>
                <th className="text-right py-4 px-6 font-bold text-gray-900 text-sm uppercase tracking-wide">البريد الإلكتروني</th>
                <th className="text-right py-4 px-6 font-bold text-gray-900 text-sm uppercase tracking-wide">الصلاحيات</th>
                <th className="text-right py-4 px-6 font-bold text-gray-900 text-sm uppercase tracking-wide">تاريخ الإنشاء</th>
                <th className="text-right py-4 px-6 font-bold text-gray-900 text-sm uppercase tracking-wide">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-all duration-300">
                  <td className="py-4 px-6">
                    <div className="text-gray-900 font-bold">{user.name}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-gray-800">{user.email}</div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.role === 'admin' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role === 'admin' ? 'مدير' : 'مستخدم'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-gray-800">{formatDate(user.createdAt)}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <ModernButton size="sm" variant="warning" onClick={() => handleEditUser(user)}>
                        ✏️ تعديل
                      </ModernButton>
                      <ModernButton size="sm" variant="danger" onClick={() => handleDeleteUser(user.id)}>
                        🗑️ حذف
                      </ModernButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ModernCard>

      {/* System Info */}
      <ModernCard className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">معلومات النظام</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{users.length}</div>
            <div className="text-sm text-blue-800">إجمالي المستخدمين</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">100%</div>
            <div className="text-sm text-green-800">حالة النظام</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">v1.0.0</div>
            <div className="text-sm text-purple-800">إصدار التطبيق</div>
          </div>
        </div>
      </ModernCard>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">إضافة مستخدم جديد</h2>
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors duration-200"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleAddUser} className="space-y-4">
                <ModernInput
                  label="الاسم"
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  placeholder="اسم المستخدم"
                  required
                />
                
                <ModernInput
                  label="البريد الإلكتروني"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="البريد الإلكتروني"
                  required
                />
                
                <ModernInput
                  label="كلمة المرور"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  placeholder="كلمة المرور"
                  required
                />
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">الصلاحيات</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                  >
                    <option value="user">مستخدم</option>
                    <option value="admin">مدير</option>
                  </select>
                </div>
                
                <div className="flex items-center justify-end space-x-3 space-x-reverse pt-4">
                  <ModernButton variant="secondary" onClick={() => setShowAddUserModal(false)}>
                    إلغاء
                  </ModernButton>
                  <ModernButton type="submit">
                    إضافة المستخدم
                  </ModernButton>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <NotificationSystem 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </Layout>
  )
}