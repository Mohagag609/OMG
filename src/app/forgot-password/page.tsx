'use client'

import { useState } from 'react'
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

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'verify' | 'reset'>('verify')
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    adminKey: '',
    newPassword: '',
    confirmPassword: ''
  })
  const router = useRouter()
  const { addNotification } = useNotifications()

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/verify-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          adminKey: formData.adminKey
        })
      })

      const result = await response.json()

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'تم التحقق بنجاح',
          message: 'تم التحقق من البيانات بنجاح. يمكنك الآن إعادة تعيين كلمة المرور'
        })
        setStep('reset')
      } else {
        // Handle specific error cases
        if (response.status === 404) {
          addNotification({
            type: 'error',
            title: 'المستخدم غير موجود',
            message: 'اسم المستخدم المدخل غير موجود في النظام. يرجى التحقق من اسم المستخدم'
          })
        } else if (response.status === 401) {
          addNotification({
            type: 'error',
            title: 'المفتاح السري غير صحيح',
            message: 'المفتاح السري للإدارة غير صحيح. يرجى التحقق من المفتاح السري'
          })
        } else {
          throw new Error(result.error || 'فشل في التحقق')
        }
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'خطأ في التحقق',
        message: error instanceof Error ? error.message : 'فشل في التحقق من البيانات'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.newPassword !== formData.confirmPassword) {
      addNotification({
        type: 'error',
        title: 'خطأ في كلمة المرور',
        message: 'كلمة المرور الجديدة وتأكيدها غير متطابقتين'
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          adminKey: formData.adminKey,
          newPassword: formData.newPassword
        })
      })

      const result = await response.json()

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'تم إعادة تعيين كلمة المرور',
          message: 'تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول'
        })
        router.push('/login')
      } else {
        throw new Error(result.error || 'فشل في إعادة تعيين كلمة المرور')
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'خطأ في إعادة التعيين',
        message: error instanceof Error ? error.message : 'فشل في إعادة تعيين كلمة المرور'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <ModernCard>
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">🔐</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">نسيت كلمة المرور</h1>
            <p className="text-gray-600 mt-2">
              {step === 'verify' 
                ? 'أدخل اسم المستخدم والمفتاح السري للتحقق' 
                : 'أدخل كلمة المرور الجديدة'
              }
            </p>
          </div>

          {step === 'verify' ? (
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم المستخدم
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المفتاح السري للإدارة
                </label>
                <input
                  type="password"
                  value={formData.adminKey}
                  onChange={(e) => setFormData({ ...formData, adminKey: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  المفتاح السري مطلوب لإعادة تعيين كلمة المرور
                </p>
              </div>

              <div className="flex space-x-3 space-x-reverse">
                <ModernButton
                  type="submit"
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? 'جاري التحقق...' : 'تحقق'}
                </ModernButton>
                <ModernButton
                  type="button"
                  onClick={() => router.push('/login')}
                  variant="secondary"
                >
                  إلغاء
                </ModernButton>
              </div>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  كلمة المرور الجديدة
                </label>
                <input
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
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
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  minLength={6}
                />
              </div>

              <div className="flex space-x-3 space-x-reverse">
                <ModernButton
                  type="submit"
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
                </ModernButton>
                <ModernButton
                  type="button"
                  onClick={() => setStep('verify')}
                  variant="secondary"
                >
                  رجوع
                </ModernButton>
              </div>
            </form>
          )}
        </ModernCard>
      </div>
    </div>
  )
}