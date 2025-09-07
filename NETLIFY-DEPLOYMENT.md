# دليل النشر على Netlify - مدير الاستثمار العقاري

## المشاكل التي تم حلها

### ✅ مشكلة قاعدة البيانات
- تم إضافة script لإعداد قاعدة البيانات تلقائياً
- تم إضافة `npx prisma db push` في build command

### ✅ مشكلة Static Generation
- تم إضافة `export const dynamic = 'force-dynamic'` لجميع API routes
- تم إضافة `export const runtime = 'nodejs'` لجميع API routes

### ✅ مشكلة Edge Runtime
- تم إضافة `serverComponentsExternalPackages` في next.config.js
- تم إضافة webpack config للتعامل مع bcryptjs و jsonwebtoken

## خطوات النشر على Netlify

### 1. إعداد المستودع
```bash
git add .
git commit -m "Fix Netlify deployment issues"
git push origin main
```

### 2. ربط مع Netlify
1. اذهب إلى [Netlify](https://netlify.com)
2. اضغط على "New site from Git"
3. اختر GitHub واربط المستودع
4. اختر الفرع الرئيسي (main)

### 3. إعدادات البناء
- **Build command:** `npm run build`
- **Publish directory:** `.next`
- **Node version:** 18

### 4. متغيرات البيئة
أضف المتغيرات التالية في Netlify:
```
DATABASE_URL=file:./dev.db
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=production
BACKUP_RETENTION_DAYS=30
BACKUP_SCHEDULE=0 */6 * * *
HEALTH_CHECK_INTERVAL=30000
METRICS_RETENTION_DAYS=7
NOTIFICATION_RETENTION_DAYS=30
```

### 5. إعدادات إضافية
- **Functions directory:** `netlify/functions` (اختياري)
- **Redirects:** تم إعدادها في `netlify.toml`

## التحقق من النشر

### 1. فحص البناء
- تأكد من أن البناء يتم بنجاح
- تحقق من عدم وجود أخطاء في logs

### 2. فحص التطبيق
- افتح الموقع المنشور
- جرب تسجيل الدخول
- تحقق من عمل API routes

### 3. فحص قاعدة البيانات
- تحقق من إنشاء الجداول
- جرب إضافة بيانات جديدة

## استكشاف الأخطاء

### مشاكل شائعة
1. **خطأ في قاعدة البيانات:** تأكد من إضافة `DATABASE_URL`
2. **خطأ في المصادقة:** تأكد من إضافة `JWT_SECRET`
3. **خطأ في البناء:** تحقق من logs البناء

### سجلات الأخطاء
- تحقق من سجلات Netlify
- استخدم `/api/monitoring/health` لفحص صحة النظام
- راجع سجل التدقيق في `/audit`

## الملفات المحدثة

### 1. next.config.js
```javascript
const nextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs', 'jsonwebtoken']
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('bcryptjs', 'jsonwebtoken')
    }
    return config
  }
}
```

### 2. netlify.toml
```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"
  NODE_ENV = "production"
```

### 3. package.json
```json
{
  "scripts": {
    "build": "npx prisma db push && next build"
  }
}
```

## نصائح إضافية

### الأداء
- استخدم CDN للصور والملفات الثابتة
- فعّل ضغط Gzip
- راقب استخدام الذاكرة

### الأمان
- غيّر كلمة المرور الافتراضية فوراً
- استخدم JWT_SECRET قوي
- فعّل HTTPS

### النسخ الاحتياطية
- قم بإعداد نسخ احتياطية منتظمة
- احفظ نسخ من قاعدة البيانات
- اختبر استرجاع البيانات

## الدعم
للحصول على الدعم أو الإبلاغ عن مشاكل، يرجى فتح issue في المستودع.