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

  const handleAdminKeySubmit = () => {
    const correctAdminKey = process.env.NEXT_PUBLIC_ADMIN_KEY || 'admin123'
    if (adminKey === correctAdminKey) {
      localStorage.setItem('adminAuth', 'true')
      setIsAdminAuthenticated(true)
      fetchUsers()
    } else {
      addNotification({
        type: 'error',
        title: 'خطأ في المفتاح السري',
        message: 'المفتاح السري غير صحيح'
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
                <p className="text-gray-600">إدارة المستخدمين وإعدادات النظام</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 space-x-reverse">
              <ModernButton
                onClick={() => router.push('/')}
                variant="secondary"
                size="sm"
              >
                العودة للوحة التحكم
              </ModernButton>
              <ModernButton
                onClick={() => {
                  localStorage.removeItem('adminAuth')
                  router.push('/login')
                }}
                variant="danger"
                size="sm"
              >
                تسجيل الخروج
              </ModernButton>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* First Time Setup Message */}
        {isFirstTime && (
          <ModernCard className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">🚀</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">مرحباً بك في النظام</h2>
              <p className="text-gray-600 mb-4">هذه هي المرة الأولى لتشغيل النظام. يرجى إنشاء المستخدم الأول</p>
            </div>
          </ModernCard>
        )}

        {/* Admin Key Input */}
        {!isFirstTime && users.length > 0 && !isAdminAuthenticated && (
          <ModernCard className="mb-8 bg-gradient-to-r from-red-50 to-pink-50 border-red-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">🔐</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">الوصول للوحة الإدارة</h2>
              <p className="text-gray-600 mb-4">أدخل المفتاح السري للوصول للوحة الإدارة</p>
              <div className="max-w-md mx-auto">
                <input
                  type="password"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
                  placeholder="أدخل المفتاح السري"
                />
                <ModernButton
                  onClick={handleAdminKeySubmit}
                  variant="danger"
                  className="w-full"
                >
                  الوصول للوحة الإدارة
                </ModernButton>
              </div>
            </div>
          </ModernCard>
        )}

        {/* User Creation Form */}
        {showCreateForm && (
          <ModernCard className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">إنشاء مستخدم جديد</h2>
            <form onSubmit={handleCreateUser} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اسم المستخدم *
                  </label>
                  <input
                    type="text"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    كلمة المرور *
                  </label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الدور
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="admin">مدير</option>
                    <option value="user">مستخدم</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 space-x-reverse">
                <ModernButton
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  variant="secondary"
                >
                  إلغاء
                </ModernButton>
                <ModernButton
                  type="submit"
                  disabled={isLoading}
                  variant="primary"
                >
                  {isLoading ? 'جاري الإنشاء...' : 'إنشاء المستخدم'}
                </ModernButton>
              </div>
            </form>
          </ModernCard>
        )}

        {/* Users Management */}
        {isAdminAuthenticated && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">إدارة المستخدمين</h2>
              <div className="flex space-x-3 space-x-reverse">
                <ModernButton
                  onClick={() => setShowCreateForm(true)}
                  variant="primary"
                >
                  إضافة مستخدم جديد
                </ModernButton>
                <ModernButton
                  onClick={handleCleanup}
                  variant="danger"
                  disabled={isLoading}
                >
                  {isLoading ? 'جاري التنظيف...' : 'تنظيف النظام'}
                </ModernButton>
              </div>
            </div>

            <ModernCard>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">اسم المستخدم</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">البريد الإلكتروني</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">الدور</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">تاريخ الإنشاء</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-900">{user.username}</td>
                        <td className="py-3 px-4 text-gray-600">{user.email || '-'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === 'admin' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role === 'admin' ? 'مدير' : 'مستخدم'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(user.createdAt).toLocaleDateString('ar-EG')}
                        </td>
                        <td className="py-3 px-4">
                          <ModernButton
                            onClick={() => handleDeleteUser(user.id)}
                            variant="danger"
                            size="sm"
                            disabled={isLoading}
                          >
                            حذف
                          </ModernButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    لا يوجد مستخدمين في النظام
                  </div>
                )}
              </div>
            </ModernCard>

            {/* System Info */}
            <ModernCard className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">معلومات النظام</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{users.length}</div>
                  <div className="text-sm text-gray-600">إجمالي المستخدمين</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {users.filter(u => u.isActive).length}
                  </div>
                  <div className="text-sm text-gray-600">المستخدمين النشطين</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {users.filter(u => u.role === 'admin').length}
                  </div>
                  <div className="text-sm text-gray-600">المديرين</div>
                </div>
              </div>
            </ModernCard>
          </>
        )}
      </div>
    </div>
  )
}