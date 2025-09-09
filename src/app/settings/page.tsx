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

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    adminKey: ''
  })
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [adminKey, setAdminKey] = useState('')
  const router = useRouter()
  const { addNotification } = useNotifications()

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        // Get the first user as current user for demo
        if (data.users && data.users.length > 0) {
          setCurrentUser(data.users[0])
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      addNotification({
        type: 'error',
        title: 'خطأ في كلمة المرور',
        message: 'كلمة المرور الجديدة وتأكيدها غير متطابقتين'
      })
      return
    }

    if (passwordData.newPassword.length < 6) {
      addNotification({
        type: 'error',
        title: 'خطأ في كلمة المرور',
        message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: currentUser?.id,
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          adminKey: passwordData.adminKey
        })
      })

      const result = await response.json()

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'تم تغيير كلمة المرور',
          message: 'تم تغيير كلمة المرور بنجاح'
        })
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
          adminKey: ''
        })
        setShowPasswordForm(false)
      } else {
        throw new Error(result.error || 'فشل في تغيير كلمة المرور')
      }
    } catch (error) {
      console.error('Change password error:', error)
      addNotification({
        type: 'error',
        title: 'خطأ في تغيير كلمة المرور',
        message: error instanceof Error ? error.message : 'فشل في تغيير كلمة المرور'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdminAccess = () => {
    const correctAdminKey = process.env.NEXT_PUBLIC_ADMIN_KEY || 'admin123'
    if (adminKey === correctAdminKey) {
      localStorage.setItem('adminAuth', 'true')
      router.push('/admin')
    } else {
      addNotification({
        type: 'error',
        title: 'خطأ في المفتاح السري',
        message: 'المفتاح السري غير صحيح'
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">⚙️</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">الإعدادات</h1>
                <p className="text-gray-600">إدارة الحساب والإعدادات</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 space-x-reverse">
              <ModernButton
                onClick={() => router.push('/')}
                variant="secondary"
              >
                العودة للرئيسية
              </ModernButton>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* User Info */}
        <ModernCard className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">معلومات الحساب</h2>
          {currentUser && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">اسم المستخدم</p>
                <p className="text-lg font-semibold text-gray-900">{currentUser.username}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">البريد الإلكتروني</p>
                <p className="text-lg font-semibold text-gray-900">{currentUser.email || 'غير محدد'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">الدور</p>
                <p className="text-lg font-semibold text-gray-900">
                  {currentUser.role === 'admin' ? 'مدير' : 'مستخدم'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">تاريخ الإنشاء</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(currentUser.createdAt).toLocaleDateString('ar-EG')}
                </p>
              </div>
            </div>
          )}
        </ModernCard>

        {/* Password Change */}
        <ModernCard className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">تغيير كلمة المرور</h2>
            <ModernButton
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              variant="primary"
            >
              {showPasswordForm ? 'إلغاء' : 'تغيير كلمة المرور'}
            </ModernButton>
          </div>

          {showPasswordForm && (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    كلمة المرور الحالية
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    كلمة المرور الجديدة
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    تأكيد كلمة المرور
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    المفتاح السري للإدارة
                  </label>
                  <input
                    type="password"
                    value={passwordData.adminKey}
                    onChange={(e) => setPasswordData({ ...passwordData, adminKey: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    المفتاح السري مطلوب لتغيير كلمة المرور
                  </p>
                </div>
              </div>
              <div className="flex space-x-3 space-x-reverse">
                <ModernButton
                  type="submit"
                  disabled={isLoading}
                  variant="success"
                >
                  {isLoading ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
                </ModernButton>
                <ModernButton
                  type="button"
                  onClick={() => setShowPasswordForm(false)}
                  variant="secondary"
                >
                  إلغاء
                </ModernButton>
              </div>
            </form>
          )}
        </ModernCard>

        {/* Admin Panel Access */}
        <ModernCard className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">لوحة الإدارة</h2>
            <ModernButton
              onClick={() => setShowAdminPanel(!showAdminPanel)}
              variant="danger"
            >
              {showAdminPanel ? 'إلغاء' : 'الوصول للوحة الإدارة'}
            </ModernButton>
          </div>

          {showAdminPanel && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المفتاح السري للإدارة
                </label>
                <input
                  type="password"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="أدخل المفتاح السري للوصول للوحة الإدارة"
                />
                <p className="text-xs text-gray-500 mt-1">
                  المفتاح السري مطلوب للوصول للوحة الإدارة
                </p>
              </div>
              <div className="flex space-x-3 space-x-reverse">
                <ModernButton
                  onClick={handleAdminAccess}
                  variant="danger"
                >
                  الوصول للوحة الإدارة
                </ModernButton>
                <ModernButton
                  onClick={() => setShowAdminPanel(false)}
                  variant="secondary"
                >
                  إلغاء
                </ModernButton>
              </div>
            </div>
          )}
        </ModernCard>

        {/* Quick Actions */}
        <ModernCard>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">إجراءات سريعة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ModernButton
              onClick={() => router.push('/forgot-password')}
              variant="secondary"
              className="w-full"
            >
              نسيت كلمة المرور
            </ModernButton>
            <ModernButton
              onClick={() => {
                localStorage.removeItem('adminAuth')
                router.push('/login')
              }}
              variant="danger"
              className="w-full"
            >
              تسجيل الخروج
            </ModernButton>
          </div>
        </ModernCard>
      </div>
    </div>
  )
}