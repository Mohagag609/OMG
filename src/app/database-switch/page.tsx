import SimpleDbSwitch from '@/components/admin/SimpleDbSwitch'

export default function DatabaseSwitchPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            تبديل قاعدة البيانات - النسخة المبسطة
          </h1>
          <p className="mt-2 text-gray-600">
            نظام مبسط وموثوق لتبديل قاعدة البيانات
          </p>
        </div>

        <SimpleDbSwitch />

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-4">
            تعليمات الاستخدام
          </h3>
          <div className="space-y-3 text-sm text-blue-800">
            <div>
              <strong>1. مفتاح الأدمن:</strong> استخدم "admin-setup-key-change-me"
            </div>
            <div>
              <strong>2. SQLite:</strong> استخدم "file:./prisma/dev.db"
            </div>
            <div>
              <strong>3. PostgreSQL محلي:</strong> استخدم "postgresql://postgres:password@localhost:5432/estate_management"
            </div>
            <div>
              <strong>4. PostgreSQL سحابي:</strong> استخدم الرابط الكامل من مزود الخدمة
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}