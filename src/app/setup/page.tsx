'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useNotifications } from '../../components/NotificationSystem'
import ModernCard from '../../components/ModernCard'
import ModernButton from '../../components/ModernButton'

export default function SetupPage() {
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    email: '',
    fullName: '',
    role: 'admin'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [hasUsers, setHasUsers] = useState(false)
  const router = useRouter()
  const { addNotification } = useNotifications()

  useEffect(() => {
    checkUsers()
  }, [])

  const checkUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        const users = data.users || []
        setHasUsers(users.length > 0)
        
        if (users.length > 0) {
          // Users exist, redirect to admin with password
          router.push('/admin-auth')
        }
      }
    } catch (error) {
      console.error('Error checking users:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newUser,
          adminKey: process.env.NEXT_PUBLIC_ADMIN_KEY || 'ADMIN_SECRET_2024'
        }),
      })

      const result = await response.json()

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'تم إنشاء المستخدم بنجاح',
          message: `تم إنشاء المستخدم ${newUser.username} بنجاح`
        })
        
        // Redirect to admin panel
        localStorage.setItem('adminAuth', 'true')
        router.push('/admin')
      } else {
        addNotification({
          type: 'error',
          title: 'خطأ في إنشاء المستخدم',
          message: result.error || 'فشل في إنشاء المستخدم'
        })
      }
    } catch (error) {
      console.error('Error creating user:', error)
      addNotification({
        type: 'error',
        title: 'خطأ في الاتصال',
        message: 'فشل في الاتصال بالخادم'
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (hasUsers) {
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
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <span className="text-white text-3xl">🚀</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">إعداد النظام</h1>
          <p className="text-xl text-gray-600">مرحباً بك! دعنا نبدأ بإنشاء المستخدم الأول للنظام</p>
        </div>

        {/* Setup Form */}
        <ModernCard className="max-w-2xl mx-auto">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">إنشاء المستخدم الأول</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
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
                    placeholder="أدخل اسم المستخدم"
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
                    placeholder="أدخل كلمة المرور"
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
                    placeholder="أدخل البريد الإلكتروني"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الاسم الكامل
                  </label>
                  <input
                    type="text"
                    value={newUser.fullName}
                    onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="أدخل الاسم الكامل"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نوع المستخدم
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

              <div className="pt-4">
                <ModernButton
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'جاري الإنشاء...' : 'إنشاء المستخدم والبدء'}
                </ModernButton>
              </div>
            </form>
          </div>
        </ModernCard>

        {/* Info Card */}
        <ModernCard className="max-w-2xl mx-auto mt-8 bg-blue-50 border-blue-200">
          <div className="p-6">
            <div className="flex items-start space-x-4 space-x-reverse">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm">ℹ️</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">معلومات مهمة</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• هذا المستخدم سيكون أول مستخدم في النظام</li>
                  <li>• يمكنك إنشاء المزيد من المستخدمين لاحقاً من لوحة الإدارة</li>
                  <li>• بعد الإنشاء، ستحتاج إلى admin URL للوصول للوحة الإدارة</li>
                </ul>
              </div>
            </div>
          </div>
        </ModernCard>
      </div>
    </div>
  )
}