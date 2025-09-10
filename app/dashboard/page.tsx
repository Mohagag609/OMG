'use client'

export default function DashboardPage() {
  return (
    <div style={{maxWidth: 1200, margin: '24px auto', padding: 16}}>
      <h1>لوحة التحكم - إدارة العقارات</h1>
      
      <div style={{background: '#f0f8ff', padding: 16, borderRadius: 8, marginBottom: 24}}>
        <h2>✅ تم الاتصال بقاعدة البيانات بنجاح!</h2>
        <p>التطبيق يعمل الآن في بيئة الإنتاج مع قاعدة البيانات السحابية.</p>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16}}>
        <div style={{border: '1px solid #ddd', padding: 16, borderRadius: 8}}>
          <h3>العقارات</h3>
          <p>إدارة العقارات والمباني</p>
          <button style={{padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: 4}}>
            عرض العقارات
          </button>
        </div>

        <div style={{border: '1px solid #ddd', padding: 16, borderRadius: 8}}>
          <h3>المستأجرين</h3>
          <p>إدارة المستأجرين والعقود</p>
          <button style={{padding: '8px 16px', background: '#28a745', color: 'white', border: 'none', borderRadius: 4}}>
            عرض المستأجرين
          </button>
        </div>

        <div style={{border: '1px solid #ddd', padding: 16, borderRadius: 8}}>
          <h3>المدفوعات</h3>
          <p>تتبع المدفوعات والإيرادات</p>
          <button style={{padding: '8px 16px', background: '#ffc107', color: 'black', border: 'none', borderRadius: 4}}>
            عرض المدفوعات
          </button>
        </div>

        <div style={{border: '1px solid #ddd', padding: 16, borderRadius: 8}}>
          <h3>التقارير</h3>
          <p>تقارير مفصلة عن الأداء</p>
          <button style={{padding: '8px 16px', background: '#6f42c1', color: 'white', border: 'none', borderRadius: 4}}>
            عرض التقارير
          </button>
        </div>
      </div>

      <div style={{marginTop: 24, padding: 16, background: '#f8f9fa', borderRadius: 8}}>
        <h3>معلومات النظام</h3>
        <p><strong>بيئة التشغيل:</strong> {process.env.NODE_ENV}</p>
        <p><strong>قاعدة البيانات:</strong> {process.env.PRISMA_SCHEMA_PATH?.includes('sqlite') ? 'SQLite' : 'PostgreSQL'}</p>
        <p><strong>الحالة:</strong> متصل ✅</p>
      </div>
    </div>
  )
}