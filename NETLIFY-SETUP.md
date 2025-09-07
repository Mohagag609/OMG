# 🚀 إعداد Netlify للنشر

## ✅ الإعدادات الجديدة والنظيفة

### 📁 الملفات المطلوبة:

#### 1. `netlify.toml`
```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"
  NODE_ENV = "production"

[dev]
  command = "npm run dev"
  port = 3000
  publish = ".next"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

#### 2. `.netlifyignore`
```gitignore
# Ignore cache files
.next/cache

# Ignore large server files
.next/server/chunks
.next/server/pages
.next/server/app
.next/server/middleware
.next/server/static
.next/server/trace
.next/server/webpack-runtime.js
.next/server/app-paths-manifest.json
.next/server/build-manifest.json
.next/server/next-server.js.nft.json
.next/server/required-server-files.json
.next/server/routes-manifest.json
.next/server/prerender-manifest.json
.next/server/font-manifest.json
.next/server/next-server.js
.next/server/pages-manifest.json
.next/server/app-manifest.json

# Keep only static files
!.next/static
```

## 🎯 خطوات النشر:

### 1. ربط المستودع
```bash
git add .
git commit -m "Clean Netlify setup"
git push origin main
```

### 2. إعداد Netlify
1. اذهب إلى [Netlify](https://netlify.com)
2. اضغط "New site from Git"
3. اختر GitHub واربط المستودع
4. اختر الفرع الرئيسي (main)

### 3. إعدادات البناء
- **Build command:** `npm run build`
- **Publish directory:** `.next`
- **Node version:** 18

### 4. متغيرات البيئة
```
DATABASE_URL=file:./dev.db
JWT_SECRET=estate-management-super-secret-key-2024
NODE_ENV=production
```

### 5. النشر
- اضغط "Deploy site"
- انتظر حتى يكتمل البناء
- تحقق من عمل الموقع

## ✅ النتيجة المتوقعة:
- **البناء:** نجح بدون أخطاء
- **حجم الملفات:** 4.6MB فقط
- **الموقع:** يعمل بشكل صحيح

---

**🚀 جاهز للنشر!**