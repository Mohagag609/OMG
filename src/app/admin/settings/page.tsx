import DbSettingsForm from '@/components/admin/DbSettingsForm'

export default function AdminSettingsPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            إعدادات النظام
          </h1>
          <p className="mt-2 text-gray-600">
            إدارة قاعدة البيانات وإعدادات النظام
          </p>
        </div>

        <DbSettingsForm />

        {/* Information Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-4">
            معلومات مهمة
          </h3>
          <div className="space-y-3 text-sm text-blue-800">
            <div>
              <strong>تهيئة قاعدة جديدة:</strong> ينشئ قاعدة بيانات جديدة ويطبق المهاجرات
            </div>
            <div>
              <strong>التبديل للقاعدة:</strong> يغير إعدادات قاعدة البيانات الحالية
            </div>
            <div>
              <strong>مسح القاعدة:</strong> يمسح جميع البيانات ويعيد إنشاء الجداول
            </div>
            <div>
              <strong>في الإنتاج:</strong> سيتم تحديث متغيرات البيئة على Netlify وإعادة النشر
            </div>
            <div>
              <strong>في التطوير:</strong> سيتم تحديث ملف .env.local وتشغيل أوامر Prisma
            </div>
          </div>
        </div>

        {/* Environment Info */}
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            معلومات البيئة الحالية
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">البيئة:</span>
              <span className="ml-2 text-gray-600">
                {process.env.NODE_ENV === 'production' ? 'إنتاج' : 'تطوير'}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">نوع القاعدة:</span>
              <span className="ml-2 text-gray-600">
                {process.env.DATABASE_TYPE || 'غير محدد'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}