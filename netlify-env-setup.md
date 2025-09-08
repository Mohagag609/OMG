# إعداد متغيرات البيئة في Netlify - Netlify Environment Variables Setup

## نظرة عامة - Overview

هذا الدليل يوضح كيفية إعداد متغيرات البيئة في Netlify للعمل مع قاعدة البيانات السحابية (Neon).

## متغيرات البيئة المطلوبة - Required Environment Variables

### 1. متغيرات قاعدة البيانات - Database Variables

```
DATABASE_URL=postgresql://neondb_owner:npg_x5qvmpzF3hjX@ep-dawn-cell-adylfb98-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

NEON_DATABASE_URL=postgresql://neondb_owner:npg_x5qvmpzF3hjX@ep-dawn-cell-adylfb98-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### 2. متغيرات التطبيق - Application Variables

```
NODE_ENV=production
JWT_SECRET=your-super-strong-production-jwt-secret-here
API_BASE_URL=https://your-netlify-app.netlify.app/api
NEXT_PUBLIC_API_URL=https://your-netlify-app.netlify.app/api
```

### 3. متغيرات إضافية - Additional Variables

```
DB_MODE=cloud
LOG_LEVEL=info
ENABLE_QUERY_LOGGING=false
ENABLE_AUDIT_LOGS=true
ENABLE_NOTIFICATIONS=true
ENABLE_BACKUP_AUTOMATION=false
```

## خطوات الإعداد - Setup Steps

### الطريقة 1: من خلال لوحة تحكم Netlify

1. **تسجيل الدخول إلى Netlify**
   - اذهب إلى https://app.netlify.com
   - سجل الدخول بحسابك

2. **اختيار المشروع**
   - اختر مشروعك من قائمة المواقع
   - انقر على "Site settings"

3. **إضافة متغيرات البيئة**
   - انقر على "Environment variables" في القائمة الجانبية
   - انقر على "Add variable"
   - أضف كل متغير من المتغيرات المذكورة أعلاه

### الطريقة 2: من خلال ملف netlify.toml

تم إنشاء ملف `netlify.toml` مع المتغيرات المطلوبة:

```toml
[context.production.environment]
  DATABASE_URL = "postgresql://neondb_owner:npg_x5qvmpzF3hjX@ep-dawn-cell-adylfb98-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
  NEON_DATABASE_URL = "postgresql://neondb_owner:npg_x5qvmpzF3hjX@ep-dawn-cell-adylfb98-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
  NODE_ENV = "production"
  JWT_SECRET = "your-super-strong-production-jwt-secret-here"
  API_BASE_URL = "https://your-netlify-app.netlify.app/api"
  NEXT_PUBLIC_API_URL = "https://your-netlify-app.netlify.app/api"
```

### الطريقة 3: من خلال سطر الأوامر

```bash
# تثبيت Netlify CLI
npm install -g netlify-cli

# تسجيل الدخول
netlify login

# إضافة متغيرات البيئة
netlify env:set DATABASE_URL "postgresql://neondb_owner:npg_x5qvmpzF3hjX@ep-dawn-cell-adylfb98-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

netlify env:set NEON_DATABASE_URL "postgresql://neondb_owner:npg_x5qvmpzF3hjX@ep-dawn-cell-adylfb98-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

netlify env:set NODE_ENV "production"

netlify env:set JWT_SECRET "your-super-strong-production-jwt-secret-here"

netlify env:set API_BASE_URL "https://your-netlify-app.netlify.app/api"

netlify env:set NEXT_PUBLIC_API_URL "https://your-netlify-app.netlify.app/api"

netlify env:set DB_MODE "cloud"
```

## اختبار الإعداد - Testing Setup

### 1. اختبار الاتصال بقاعدة البيانات

```bash
# اختبار من سطر الأوامر
psql 'postgresql://neondb_owner:npg_x5qvmpzF3hjX@ep-dawn-cell-adylfb98-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require' -c "SELECT 'Neon Database Connected' as status;"
```

### 2. اختبار التطبيق محلياً

```bash
# تشغيل مع قاعدة البيانات السحابية
npm run dev:cloud

# اختبار API endpoints
curl http://localhost:3000/api/database/status
```

### 3. اختبار النشر على Netlify

```bash
# بناء المشروع
npm run build:cloud

# نشر على Netlify
npm run deploy:netlify
```

## استكشاف الأخطاء - Troubleshooting

### مشاكل شائعة

#### 1. خطأ في الاتصال بقاعدة البيانات
```
Error: connect ECONNREFUSED
```

**الحل:**
- تحقق من صحة `DATABASE_URL`
- تأكد من تفعيل SSL
- تحقق من إعدادات Firewall في Neon

#### 2. خطأ في متغيرات البيئة
```
Error: Environment variable not found
```

**الحل:**
- تأكد من إضافة جميع المتغيرات المطلوبة
- تحقق من أسماء المتغيرات (case-sensitive)
- أعد نشر المشروع بعد إضافة المتغيرات

#### 3. خطأ في Prisma
```
Error: P1001: Can't reach database server
```

**الحل:**
- تحقق من `DATABASE_URL` في متغيرات البيئة
- تأكد من صحة معلومات الاتصال
- جرب إعادة بناء المشروع

## نصائح الأمان - Security Tips

### 1. كلمات المرور
- استخدم كلمات مرور قوية ومعقدة
- لا تشارك كلمات المرور
- غيّر كلمات المرور بانتظام

### 2. متغيرات البيئة
- لا تضع متغيرات البيئة في الكود
- استخدم متغيرات البيئة في Netlify
- احتفظ بنسخ احتياطية آمنة

### 3. قاعدة البيانات
- فعّل SSL لجميع الاتصالات
- استخدم اتصالات آمنة فقط
- راقب نشاط قاعدة البيانات

## المراقبة والصيانة - Monitoring and Maintenance

### 1. مراقبة الأداء
- راقب استهلاك قاعدة البيانات
- تحقق من سرعة الاستجابة
- راقب الأخطاء في السجلات

### 2. النسخ الاحتياطية
- أنشئ نسخ احتياطية منتظمة
- اختبر استعادة النسخ الاحتياطية
- احتفظ بنسخ احتياطية متعددة

### 3. التحديثات
- حدث التبعيات بانتظام
- راقب إشعارات الأمان
- اختبر التحديثات في بيئة التطوير

## الدعم - Support

إذا واجهت أي مشاكل:
1. تحقق من سجلات Netlify
2. راجع إعدادات متغيرات البيئة
3. اختبر الاتصال بقاعدة البيانات
4. راجع وثائق Neon و Netlify