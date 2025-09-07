// DISABLED - تم استبدالها بصفحة إدارة قاعدة البيانات الجديدة
'use client'

import { useRouter } from 'next/navigation'

export default function DatabaseSettingsPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
        <div className="text-6xl mb-4">🔧</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          صفحة الإعدادات القديمة
        </h1>
        <p className="text-gray-600 mb-6">
          تم استبدال هذه الصفحة بنظام إدارة قاعدة البيانات الجديد
        </p>
        <button
          onClick={() => router.push('/admin/db-settings')}
          className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          الانتقال إلى الإعدادات الجديدة
        </button>
      </div>
    </div>
  )
}