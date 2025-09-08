# دليل إدارة قاعدة البيانات

## نظرة عامة

تم إنشاء نظام إدارة قاعدة البيانات لإدارة أنواع قواعد البيانات المختلفة في التطبيق. يدعم النظام:

- **SQLite** (محلي)
- **PostgreSQL** (محلي)
- **PostgreSQL** (سحابي - مثل Neon)

## الملفات المضافة/المحدثة

### المكتبات الأساسية
- `src/lib/env.ts` - إدارة متغيرات البيئة
- `src/lib/prisma.ts` - PrismaClient مع override للـ URL
- `src/lib/db-admin.ts` - منطق إدارة قاعدة البيانات

### API Routes
- `src/app/api/db-admin/init/route.ts` - تهيئة قاعدة جديدة
- `src/app/api/db-admin/switch/route.ts` - التبديل بين قواعد البيانات
- `src/app/api/db-admin/wipe/route.ts` - مسح قاعدة البيانات

### واجهة المستخدم
- `src/components/admin/DbSettingsForm.tsx` - نموذج إدارة قاعدة البيانات
- `src/app/admin/settings/page.tsx` - صفحة الإعدادات

### ملفات أخرى
- `prisma/seed.ts` - بيانات تجريبية محدثة
- `.env.example` - مثال على متغيرات البيئة
- `package.json` - سكريبتات مساعدة محدثة

## الإعداد

### 1. متغيرات البيئة

أنشئ ملف `.env.local` بناءً على `.env.example`:

```bash
# Database Configuration
DATABASE_TYPE="sqlite"
DATABASE_URL="file:./prisma/dev.db"

# Database URLs for different types
SQLITE_DATABASE_URL="file:./prisma/dev.db"
POSTGRESQL_LOCAL_DATABASE_URL="postgresql://postgres:password@localhost:5432/estate_management"
POSTGRESQL_CLOUD_DATABASE_URL="postgresql://username:password@host:5432/database?sslmode=require"

# Admin Security
ADMIN_SETUP_KEY="set-a-strong-admin-key-change-me"

# JWT Secret
JWT_SECRET="estate-management-development-secret-key"

# Netlify Configuration (للإنتاج)
NETLIFY_AUTH_TOKEN="your-netlify-personal-access-token"
NETLIFY_SITE_ID="your-netlify-site-id"
BUILD_HOOK_URL="https://api.netlify.com/build_hooks/your-build-hook-id"

# Environment
NODE_ENV="development"
```

### 2. تشغيل التطبيق

```bash
# تثبيت التبعيات
npm install

# تشغيل في وضع التطوير
npm run dev

# أو تشغيل مع نوع قاعدة بيانات محدد
npm run dev:sqlite
npm run dev:pg
npm run dev:cloud
```

## الاستخدام

### 1. الوصول لصفحة الإعدادات

انتقل إلى `/admin/settings` في المتصفح.

### 2. إدخال مفتاح الأدمن

أدخل مفتاح الأدمن المطابق لـ `ADMIN_SETUP_KEY` في ملف البيئة.

### 3. اختيار نوع قاعدة البيانات

#### SQLite (محلي)
- اختر "SQLite (محلي)"
- اضغط "تهيئة قاعدة جديدة" أو "التبديل للقاعدة"

#### PostgreSQL (محلي)
- اختر "PostgreSQL (محلي)"
- أدخل إعدادات الاتصال:
  - Host: localhost
  - Port: 5432
  - Username: postgres
  - Password: كلمة المرور
  - Database Name: اسم قاعدة البيانات
- اضغط "تهيئة قاعدة جديدة" أو "التبديل للقاعدة"

#### PostgreSQL (سحابي)
- اختر "PostgreSQL (سحابي)"
- أدخل Database URL الكامل
- اضغط "تهيئة قاعدة جديدة" أو "التبديل للقاعدة"

### 4. زرع البيانات التجريبية

- حدد "زرع بيانات تجريبية (اختياري)" قبل تنفيذ العملية
- سيتم إنشاء بيانات تجريبية بعد تطبيق المهاجرات

### 5. مسح قاعدة البيانات

- اضغط "مسح القاعدة" لحذف جميع البيانات
- سيتم إعادة إنشاء الجداول بعد المسح

## في بيئة الإنتاج (Netlify)

### 1. إعداد Netlify

1. أنشئ Personal Access Token من Netlify
2. احصل على Site ID من إعدادات الموقع
3. أنشئ Build Hook من Build hooks
4. أضف هذه القيم إلى متغيرات البيئة على Netlify

### 2. تشغيل العمليات

عند تنفيذ أي عملية في الإنتاج:
1. يتم تحديث متغيرات البيئة على Netlify
2. يتم تشغيل Build Hook لإعادة النشر
3. أثناء البناء، يتم تطبيق المهاجرات باستخدام DATABASE_URL الجديد

## الأمان

- جميع العمليات تتطلب مفتاح أدمن صحيح
- يتم التحقق من المفتاح عبر رأس HTTP `X-Admin-Key`
- في المستقبل، يمكن دمج NextAuth للتحقق المتقدم

## استكشاف الأخطاء

### مشاكل شائعة

1. **فشل الاتصال بقاعدة البيانات**
   - تأكد من صحة إعدادات الاتصال
   - تأكد من تشغيل خادم PostgreSQL (للمحلي)

2. **فشل في تطبيق المهاجرات**
   - تأكد من وجود ملفات المهاجرات
   - شغل `npm run db:generate` يدوياً

3. **فشل في تحديث Netlify**
   - تأكد من صحة NETLIFY_AUTH_TOKEN
   - تأكد من صحة NETLIFY_SITE_ID

### سجلات العمليات

جميع العمليات تسجل تفاصيل التنفيذ. يمكن عرض السجلات من واجهة الإدارة.

## سكريبتات مساعدة

```bash
# تشغيل مع نوع قاعدة بيانات محدد
npm run dev:sqlite
npm run dev:pg
npm run dev:cloud

# إدارة قاعدة البيانات
npm run db:generate
npm run db:migrate
npm run db:deploy
npm run db:seed
```

## الدعم

للمساعدة أو الإبلاغ عن مشاكل، يرجى مراجعة سجلات العمليات أو الاتصال بفريق التطوير.