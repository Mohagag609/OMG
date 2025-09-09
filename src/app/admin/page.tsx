'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useNotifications } from '../../components/NotificationSystem'

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
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isFirstTime, setIsFirstTime] = useState(false)
  const router = useRouter()
  const { addNotification, removeNotification } = useNotifications()

  useEffect(() => {
    // Check if this is first time access (no users in database)
    checkFirstTimeAccess()
  }, [router])

  const checkFirstTimeAccess = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        const users = data.users || []
        
        if (users.length === 0) {
          // First time access - no authentication required
          setIsFirstTime(true)
          setIsAuthenticated(true)
          fetchUsers()
        } else {
          // Users exist - require authentication
          const adminAuth = localStorage.getItem('adminAuth')
          if (adminAuth === 'true') {
            setIsAuthenticated(true)
            fetchUsers()
          } else {
            router.push('/admin-auth')
          }
        }
      } else {
        // Error fetching users - allow access for first time setup
        setIsAuthenticated(true)
        fetchUsers()
      }
    } catch (error) {
      console.error('Error checking users:', error)
      // Error - allow access for first time setup
      setIsAuthenticated(true)
      fetchUsers()
    }
  }

  // Show loading while checking authentication
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">👑</span>
          </div>
          <p className="text-gray-600">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    )
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
          message: 'تم إنشاء المستخدم بنجاح'
        })
        setShowCreateForm(false)
        setNewUser({ username: '', password: '', email: '', role: 'admin', adminKey: '' })
        fetchUsers()
      } else {
        throw new Error(result.error || 'فشل في إنشاء المستخدم')
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
        throw new Error(result.error || 'فشل في حذف المستخدم')
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
          message: `تم تنظيف النظام وحذف جميع المستخدمين. تم حذف ${result.deletedCustomers} عميل`
        })
        fetchUsers()
      } else {
        throw new Error(result.error || 'فشل في تنظيف النظام')
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="w-12 h-12 bg-gradient-to-r from-red-600 to-pink-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">👑</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">لوحة الإدارة</h1>
                <p className="text-gray-600">إدارة المستخدمين والنظام</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 space-x-reverse">
              {!isFirstTime && (
                <ModernButton
                  onClick={handleCleanup}
                  variant="danger"
                  disabled={isLoading}
                >
                  {isLoading ? 'جاري التنظيف...' : '🧹 تنظيف النظام'}
                </ModernButton>
              )}
              {!isFirstTime && (
                <ModernButton
                  onClick={() => {
                    localStorage.removeItem('adminAuth')
                    router.push('/login')
                  }}
                  variant="secondary"
                >
                  تسجيل الخروج
                </ModernButton>
              )}
              {isFirstTime && (
                <ModernButton
                  onClick={() => router.push('/login')}
                  variant="secondary"
                >
                  العودة لتسجيل الدخول
                </ModernButton>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* First Time Welcome Message */}
        {isFirstTime && (
          <ModernCard className="mb-8 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">🎉</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">مرحباً بك في النظام!</h2>
                <p className="text-gray-600">هذا هو الوصول الأول للنظام. يمكنك الآن إنشاء المستخدمين وإدارة النظام.</p>
              </div>
            </div>
          </ModernCard>
        )}

        {/* Users Management */}
        <ModernCard className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">إدارة المستخدمين</h2>
            <ModernButton
              onClick={() => setShowCreateForm(!showCreateForm)}
              variant="success"
            >
              {showCreateForm ? 'إلغاء' : '+ إضافة مستخدم جديد'}
            </ModernButton>
          </div>

          {/* Create User Form */}
          {showCreateForm && (
            <form onSubmit={handleCreateUser} className="mb-6 p-4 bg-gray-50 rounded-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">إنشاء مستخدم جديد</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اسم المستخدم
                  </label>
                  <input
                    type="text"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    كلمة المرور
                  </label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الدور
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="admin">مدير</option>
                    <option value="user">مستخدم</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    المفتاح السري للإدارة
                  </label>
                  <input
                    type="password"
                    value={newUser.adminKey}
                    onChange={(e) => setNewUser({ ...newUser, adminKey: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="أدخل المفتاح السري لإنشاء المستخدم"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    المفتاح السري مطلوب لإنشاء مستخدمين جدد
                  </p>
                </div>
              </div>
              <div className="mt-4 flex space-x-3 space-x-reverse">
                <ModernButton
                  type="submit"
                  disabled={isLoading}
                  variant="success"
                >
                  {isLoading ? 'جاري الإنشاء...' : 'إنشاء المستخدم'}
                </ModernButton>
                <ModernButton
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  variant="secondary"
                >
                  إلغاء
                </ModernButton>
              </div>
            </form>
          )}

          {/* Users List */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    اسم المستخدم
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    البريد الإلكتروني
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الدور
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    تاريخ الإنشاء
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role === 'admin' ? 'مدير' : 'مستخدم'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-900"
                        disabled={isLoading}
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ModernCard>

        {/* System Info */}
        <ModernCard>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">معلومات النظام</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">إجمالي المستخدمين</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">حالة النظام</p>
              <p className="text-2xl font-bold text-green-600">نشط</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">المفتاح السري</p>
              <p className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                ********
              </p>
            </div>
          </div>
        </ModernCard>
      </div>
    </div>
  )
}