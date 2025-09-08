'use client'

// Admin settings page
import { useState } from 'react'
import DbSettingsForm from '@/components/admin/DbSettingsForm'

export default function AdminSettingsPage() {
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })

  const handleSuccess = (message: string) => {
    setNotification({ type: 'success', message })
    setTimeout(() => setNotification({ type: null, message: '' }), 5000)
  }

  const handleError = (message: string) => {
    setNotification({ type: 'error', message })
    setTimeout(() => setNotification({ type: null, message: '' }), 5000)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 text-center">
            إعدادات قاعدة البيانات
          </h1>
          <p className="text-gray-600 text-center mt-2">
            إدارة وإعداد قواعد البيانات للتطبيق
          </p>
        </div>

        {/* Notification */}
        {notification.type && (
          <div className={`mb-6 p-4 rounded-md ${
            notification.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            <div className="flex items-center">
              <span className="text-lg mr-2">
                {notification.type === 'success' ? '✅' : '❌'}
              </span>
              <span>{notification.message}</span>
            </div>
          </div>
        )}

        {/* Database Settings Form */}
        <DbSettingsForm 
          onSuccess={handleSuccess}
          onError={handleError}
        />

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            معلومات مهمة
          </h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>• <strong>SQLite:</strong> قاعدة بيانات محلية، مناسبة للتطوير والاختبار</p>
            <p>• <strong>PostgreSQL محلي:</strong> يتطلب تثبيت PostgreSQL على الجهاز</p>
            <p>• <strong>PostgreSQL سحابي:</strong> يتطلب رابط قاعدة بيانات من مزود خدمة سحابي</p>
            <p>• <strong>البيانات التجريبية:</strong> ستتم إضافة بيانات تجريبية للاختبار</p>
            <p>• <strong>في الإنتاج:</strong> سيتم تحديث متغيرات البيئة على Netlify وإعادة النشر</p>
          </div>
        </div>
      </div>
    </div>
  )
}