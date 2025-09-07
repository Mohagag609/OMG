# نظام إدارة قاعدة البيانات الجديد

## نظرة عامة
تم استبدال صفحة الإعدادات القديمة بنظام إدارة قاعدة البيانات الجديد الذي يسمح بتغيير قاعدة البيانات الحالية بدون إعادة نشر (redeploy).

## المميزات
- ✅ تغيير قاعدة البيانات بدون إعادة نشر
- ✅ دعم PostgreSQL و SQLite
- ✅ واجهة إدارة بسيطة
- ✅ اختبار الاتصال التلقائي
- ✅ كاش لمدة 10 ثواني لتحسين الأداء

## الإعداد المطلوب

### 1. متغيرات البيئة
```bash
CONTROL_DB_URL=postgres://user:pass@host:port/control_db?sslmode=require
```

### 2. إنشاء جدول التحكم
قم بتشغيل السكريبت التالي على قاعدة التحكم:
```bash
psql $CONTROL_DB_URL -f scripts/init-control-db.sql
```

## المسارات الجديدة

### API Routes
- `POST /api/admin/set-db-url` - تعيين URL قاعدة البيانات الجديد
- `GET /api/admin/get-db-url` - قراءة URL قاعدة البيانات الحالي

### الصفحات
- `/admin/db-settings` - صفحة إدارة قاعدة البيانات الجديدة
- `/database-settings` - صفحة الإعدادات القديمة (معطلة)

## الاستخدام

### 1. الوصول إلى صفحة الإدارة
```
http://localhost:3000/admin/db-settings
```

### 2. تغيير قاعدة البيانات
1. أدخل URL قاعدة البيانات الجديد
2. اضغط "حفظ التغيير"
3. سيتم اختبار الاتصال تلقائياً

### 3. أمثلة URL صحيحة
```
postgres://user:pass@localhost:5432/mydb
postgresql://user:pass@neon-host/db?sslmode=require
sqlite://./local.db
```

## التطوير

### الملفات الجديدة
- `src/lib/config.ts` - طبقة الضبط المشتركة
- `src/lib/db.ts` - محول اتصال موحد
- `src/app/admin/db-settings/page.tsx` - صفحة الإدارة
- `src/app/api/admin/set-db-url/route.ts` - API تعيين URL
- `src/app/api/admin/get-db-url/route.ts` - API قراءة URL
- `scripts/init-control-db.sql` - سكريبت إنشاء جدول التحكم

### الملفات المعدلة
- `src/app/api/customers/route.ts` - تحديث لاستخدام النظام الجديد
- `src/app/database-settings/page.tsx` - تعطيل الصفحة القديمة

## الأمان
- النظام قابل لإضافة كلمة مرور في المستقبل
- يمكن إضافة `ADMIN_SECRET` للتحقق من الهوية