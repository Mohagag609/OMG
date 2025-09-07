# دليل النشر - Estate Management System

## النشر على Netlify

### 1. الإعدادات المطلوبة

في لوحة تحكم Netlify، تأكد من تعيين المتغيرات التالية:

```bash
NODE_VERSION=18
NODE_ENV=production
DATABASE_URL=postgresql://neondb_owner:npg_ZBrYxkMEL91f@ep-mute-violet-ad0dmo9y-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=estate-management-production-secret-key-2024
```

### 2. إعدادات البناء

- **Build Command**: `npm install --legacy-peer-deps && npx prisma generate && npm run build`
- **Publish Directory**: `.next`
- **Node Version**: 18

### 3. إعدادات الدوال

- **Node Bundler**: esbuild
- **External Node Modules**: `@prisma/client`, `prisma`
- **Included Files**: `prisma/schema.prisma`

## النشر على Vercel

### 1. الإعدادات المطلوبة

في لوحة تحكم Vercel، أضف المتغيرات التالية:

```bash
DATABASE_URL=postgresql://neondb_owner:npg_ZBrYxkMEL91f@ep-mute-violet-ad0dmo9y-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=estate-management-production-secret-key-2024
```

### 2. إعدادات البناء

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

## النشر على Render

### 1. إعداد الخدمة

- **Environment**: Node
- **Build Command**: `npm install --legacy-peer-deps && npx prisma generate && npm run build`
- **Start Command**: `npm start`

### 2. المتغيرات المطلوبة

```bash
DATABASE_URL=postgresql://neondb_owner:npg_ZBrYxkMEL91f@ep-mute-violet-ad0dmo9y-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=estate-management-production-secret-key-2024
NODE_ENV=production
```

## إعداد قاعدة البيانات

### PostgreSQL (مستحسن للإنتاج)

1. إنشاء قاعدة بيانات PostgreSQL
2. تعيين `DATABASE_URL` في متغيرات البيئة
3. استخدام صفحة إعدادات قاعدة البيانات في التطبيق

### SQLite (للتطوير المحلي)

1. تعيين `DATABASE_URL` إلى `file:./prisma/dev.db`
2. استخدام صفحة إعدادات قاعدة البيانات في التطبيق

## استكشاف الأخطاء

### مشاكل شائعة

1. **فشل في تثبيت التبعيات**
   - تأكد من استخدام `--legacy-peer-deps`
   - تحقق من إصدار Node.js (18+)

2. **فشل في بناء Prisma**
   - تأكد من وجود `DATABASE_URL`
   - تحقق من صحة رابط قاعدة البيانات

3. **مشاكل في قاعدة البيانات**
   - استخدم صفحة إعدادات قاعدة البيانات
   - تحقق من اتصال قاعدة البيانات

### سجلات الأخطاء

- **Netlify**: تحقق من Build Logs
- **Vercel**: تحقق من Function Logs
- **Render**: تحقق من Service Logs

## الأمان

### متغيرات البيئة الحساسة

- `DATABASE_URL`: رابط قاعدة البيانات
- `JWT_SECRET`: مفتاح تشفير JWT

### نصائح الأمان

1. استخدم كلمات مرور قوية لقاعدة البيانات
2. غيّر `JWT_SECRET` في الإنتاج
3. فعّل HTTPS في الإنتاج
4. استخدم متغيرات البيئة للمعلومات الحساسة

## المراقبة

### الصحة العامة

- استخدم `/api/monitoring/health` للتحقق من صحة النظام
- راقب سجلات الأخطاء
- تحقق من أداء قاعدة البيانات

### النسخ الاحتياطية

- فعّل النسخ الاحتياطية التلقائية
- اختبر استعادة النسخ الاحتياطية
- احفظ النسخ الاحتياطية في مكان آمن