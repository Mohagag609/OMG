# دليل النشر - مدير الاستثمار العقاري

## النشر على Netlify

### 1. إعداد المستودع
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/username/estate-management.git
git push -u origin main
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
- **Functions directory:** `netlify/functions` (إذا كنت تستخدم Netlify Functions)
- **Redirects:** تم إعدادها في `netlify.toml`

## النشر على Render

### 1. إعداد المستودع
نفس الخطوات كما في Netlify

### 2. إنشاء خدمة جديدة
1. اذهب إلى [Render](https://render.com)
2. اضغط على "New +" واختر "Web Service"
3. اربط مستودع GitHub

### 3. إعدادات الخدمة
- **Name:** estate-management
- **Environment:** Node
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Plan:** Free (أو مدفوع حسب الحاجة)

### 4. متغيرات البيئة
أضف نفس المتغيرات كما في Netlify

### 5. إعدادات إضافية
- **Health Check Path:** `/api/monitoring/health`
- **Auto Deploy:** true

## النشر على Vercel

### 1. إعداد المستودع
نفس الخطوات كما في Netlify

### 2. ربط مع Vercel
1. اذهب إلى [Vercel](https://vercel.com)
2. اضغط على "New Project"
3. اربط مستودع GitHub

### 3. إعدادات البناء
- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next`

### 4. متغيرات البيئة
أضف نفس المتغيرات كما في Netlify

## النشر على Railway

### 1. إعداد المستودع
نفس الخطوات كما في Netlify

### 2. ربط مع Railway
1. اذهب إلى [Railway](https://railway.app)
2. اضغط على "New Project"
3. اختر "Deploy from GitHub repo"

### 3. إعدادات البناء
- **Build Command:** `npm run build`
- **Start Command:** `npm start`

### 4. متغيرات البيئة
أضف نفس المتغيرات كما في Netlify

## النشر على DigitalOcean App Platform

### 1. إعداد المستودع
نفس الخطوات كما في Netlify

### 2. ربط مع DigitalOcean
1. اذهب إلى [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. اضغط على "Create App"
3. اختر "GitHub" كمصدر

### 3. إعدادات البناء
- **Source Directory:** `/`
- **Build Command:** `npm run build`
- **Run Command:** `npm start`

### 4. متغيرات البيئة
أضف نفس المتغيرات كما في Netlify

## ملاحظات مهمة

### قاعدة البيانات
- المشروع يستخدم SQLite كقاعدة بيانات محلية
- للاستخدام في الإنتاج، يُنصح باستخدام PostgreSQL أو MySQL
- يمكن تغيير `DATABASE_URL` في متغيرات البيئة

### الأمان
- تأكد من تغيير `JWT_SECRET` في الإنتاج
- استخدم HTTPS دائماً
- قم بتحديث كلمات المرور الافتراضية

### الأداء
- استخدم CDN للصور والملفات الثابتة
- فعّل ضغط Gzip
- راقب استخدام الذاكرة والمعالج

### النسخ الاحتياطية
- قم بإعداد نسخ احتياطية منتظمة
- احفظ نسخ من قاعدة البيانات
- اختبر استرجاع البيانات

## استكشاف الأخطاء

### مشاكل شائعة
1. **خطأ في قاعدة البيانات:** تأكد من صحة `DATABASE_URL`
2. **خطأ في المصادقة:** تأكد من صحة `JWT_SECRET`
3. **خطأ في البناء:** تأكد من تثبيت جميع التبعيات

### سجلات الأخطاء
- تحقق من سجلات الخدمة
- استخدم `/api/monitoring/health` لفحص صحة النظام
- راجع سجل التدقيق في `/audit`

## الدعم
للحصول على الدعم أو الإبلاغ عن مشاكل، يرجى فتح issue في المستودع.