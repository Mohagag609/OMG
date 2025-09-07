# دليل النشر على Netlify مع PostgreSQL

## المتطلبات

1. حساب Netlify
2. قاعدة بيانات PostgreSQL (Neon أو Supabase أو أي مزود آخر)
3. متغيرات البيئة المطلوبة

## خطوات النشر

### 1. إعداد قاعدة البيانات

```bash
# إنشاء قاعدة البيانات الجديدة
npx prisma db push

# إضافة البيانات التجريبية
npm run db:seed
```

### 2. إعداد متغيرات البيئة في Netlify

في لوحة تحكم Netlify، اذهب إلى:
- Site settings → Environment variables

أضف المتغيرات التالية:

```
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=production
```

### 3. ربط المستودع

1. اربط مستودع GitHub مع Netlify
2. تأكد من أن إعدادات البناء صحيحة في `netlify.toml`

### 4. النشر

```bash
# النشر التلقائي عند push إلى main branch
git add .
git commit -m "Deploy to Netlify"
git push origin main
```

## إعدادات مهمة

### netlify.toml
```toml
[build]
  command = "npx prisma generate && npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"
  NODE_ENV = "production"

[functions]
  node_bundler = "esbuild"
  external_node_modules = ["@prisma/client", "prisma"]
  included_files = ["prisma/schema.prisma"]
```

### next.config.js
```javascript
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs', 'jsonwebtoken', '@prisma/client']
  }
}
```

## استكشاف الأخطاء

### مشاكل شائعة:

1. **خطأ في Prisma Client**: تأكد من أن `npx prisma generate` يعمل في build command
2. **خطأ في قاعدة البيانات**: تأكد من صحة `DATABASE_URL`
3. **خطأ في المصادقة**: تأكد من وجود `JWT_SECRET`

### أوامر مفيدة:

```bash
# فحص حالة قاعدة البيانات
npx prisma db push

# عرض البيانات
npx prisma studio

# إعادة تعيين قاعدة البيانات
npx prisma db push --force-reset
```

## الميزات المدعومة

- ✅ إنشاء العملاء (مع أو بدون رقم هاتف)
- ✅ إدارة الوحدات
- ✅ إدارة العقود
- ✅ نظام المصادقة
- ✅ النسخ الاحتياطية
- ✅ التقارير والإحصائيات

## الدعم

إذا واجهت أي مشاكل، تأكد من:
1. صحة متغيرات البيئة
2. اتصال قاعدة البيانات
3. إعدادات Netlify صحيحة