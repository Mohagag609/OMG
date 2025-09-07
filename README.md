# Estate Management System

نظام إدارة الاستثمارات العقارية الشامل مع قاعدة بيانات محسنة ونظام إدارة متقدم.

## المميزات

- 🏢 إدارة العقارات والوحدات
- 👥 إدارة العملاء والشركاء
- 📋 إدارة العقود والدفعات
- 💰 إدارة الخزائن والسندات
- 📊 تقارير شاملة ومتقدمة
- 🔐 نظام أمان متقدم
- 💾 نسخ احتياطية تلقائية
- 🗄️ دعم قواعد بيانات متعددة (SQLite & PostgreSQL)

## التقنيات المستخدمة

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Next.js API Routes
- **Database**: Prisma ORM مع دعم SQLite و PostgreSQL
- **Styling**: Tailwind CSS
- **Authentication**: JWT
- **Deployment**: Netlify, Vercel, Render

## التثبيت والتشغيل

### 1. تثبيت التبعيات

```bash
npm install --legacy-peer-deps
```

### 2. إعداد قاعدة البيانات

```bash
# إنشاء ملف الإعدادات
cp database-config.json.example database-config.json

# تعديل إعدادات قاعدة البيانات
# أو استخدام صفحة إعدادات قاعدة البيانات في التطبيق
```

### 3. تشغيل التطبيق

```bash
# التطوير
npm run dev

# الإنتاج
npm run build
npm start
```

## إعدادات قاعدة البيانات

النظام يدعم نوعين من قواعد البيانات:

### SQLite (للتطوير المحلي)
```json
{
  "type": "sqlite",
  "connectionString": "file:./prisma/dev.db",
  "isConnected": false,
  "persistent": true
}
```

### PostgreSQL (للإنتاج)
```json
{
  "type": "postgresql",
  "connectionString": "postgresql://username:password@host:port/database",
  "isConnected": false,
  "persistent": true
}
```

## النشر

### Netlify
```bash
npm run deploy:netlify
```

### Vercel
```bash
npm run deploy:vercel
```

### Render
```bash
npm run deploy:render
```

## إدارة قاعدة البيانات

### إنشاء الجداول
```bash
npm run db:push
```

### إعادة تعيين قاعدة البيانات
```bash
npm run db:reset
```

### إضافة بيانات تجريبية
```bash
npm run db:seed
```

## النسخ الاحتياطية

### إنشاء نسخة احتياطية
```bash
npm run backup:create
```

### استعادة نسخة احتياطية
```bash
npm run backup:restore
```

## الأمان

- تشفير كلمات المرور باستخدام bcrypt
- مصادقة JWT
- حماية من SQL Injection
- حماية من XSS
- حماية من CSRF

## الدعم

للمساعدة والدعم، يرجى فتح issue في المستودع.

## الترخيص

هذا المشروع مرخص تحت رخصة MIT.