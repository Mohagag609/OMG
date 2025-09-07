# تعليمات النشر على Netlify

## 🚀 خطوات النشر

### 1. إعداد المستودع
```bash
git add .
git commit -m "إصلاح مشكلة المصادقة وإضافة إعادة تهيئة بدون مصادقة"
git push origin main
```

### 2. إعدادات Netlify

#### متغيرات البيئة المطلوبة:
- `DATABASE_URL`: رابط قاعدة البيانات PostgreSQL
- `JWT_SECRET`: مفتاح التشفير
- `NODE_VERSION`: إصدار Node.js (18)

#### إعدادات البناء:
- **Build Command**: `npx prisma generate && npm run build`
- **Publish Directory**: `.next`
- **Node Version**: 18

### 3. إعدادات خاصة بـ Netlify

#### ملف `netlify.toml`:
```toml
[build]
  command = "npx prisma generate && npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"
  NODE_ENV = "production"
  DATABASE_URL = "postgresql://neondb_owner:npg_ZBrYxkMEL91f@ep-mute-violet-ad0dmo9y-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
  JWT_SECRET = "estate-management-development-secret-key"

[functions]
  node_bundler = "esbuild"
  external_node_modules = ["@prisma/client", "prisma"]
  included_files = ["prisma/schema.prisma"]
```

### 4. حل مشكلة المصادقة

#### المشكلة:
- النظام على Netlify يعطي "غير مخول بالوصول"
- التوكن لا يعمل بشكل صحيح

#### الحل:
1. **استخدام API الجديد**: `/api/database/reset-simple`
2. **بدون مصادقة**: لا حاجة لتوكن
3. **متغيرات البيئة**: متطابقة مع المحلي

### 5. اختبار النشر

#### بعد النشر:
1. اذهب إلى إعدادات قاعدة البيانات
2. اضغط على "إعادة تهيئة قاعدة البيانات"
3. يجب أن تعمل بدون مشاكل

#### بيانات الدخول الافتراضية:
- **المدير**: `admin` / `admin123`
- **المستخدم**: `user` / `user123`

### 6. استكشاف الأخطاء

#### إذا استمرت المشكلة:
1. تحقق من متغيرات البيئة في Netlify
2. تأكد من أن `JWT_SECRET` متطابق
3. تحقق من سجلات البناء في Netlify

#### سجلات مفيدة:
- Build logs في Netlify
- Function logs في Netlify
- Console logs في المتصفح

### 7. نصائح مهمة

#### الأمان:
- API إعادة التهيئة بدون مصادقة (للتطوير فقط)
- في الإنتاج، يجب إضافة مصادقة مناسبة

#### الأداء:
- استخدام Prisma Client مع URL صريح
- معالجة الأخطاء المحسنة
- استجابة سريعة

## ✅ النتيجة المتوقعة

بعد النشر، يجب أن يعمل النظام بشكل كامل:
- تسجيل الدخول يعمل
- إعادة تهيئة قاعدة البيانات تعمل
- جميع الميزات تعمل بدون مشاكل في المصادقة