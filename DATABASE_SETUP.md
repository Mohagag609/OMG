# إعداد قاعدة البيانات - Database Setup

## نظرة عامة

هذا المشروع يدعم قواعد بيانات متعددة:
- **SQLite** للتطوير المحلي
- **PostgreSQL** للإنتاج (محلي أو سحابي)

## الإعداد السريع

### 1. التطوير المحلي (SQLite)
```bash
npm install
npm run dev
```
سيتم توجيهك تلقائياً لصفحة إعدادات قاعدة البيانات.

### 2. الإنتاج (PostgreSQL)

#### Netlify
1. اذهب إلى لوحة Netlify
2. أضف متغيرات البيئة:
   ```
   DATABASE_URL=postgresql://user:pass@host:port/db
   PRISMA_SCHEMA_PATH=prisma/schema.postgres.prisma
   SETUP_COMPLETE=true
   ```
3. أعد النشر

#### Vercel
1. اذهب إلى لوحة Vercel
2. أضف متغيرات البيئة:
   ```
   DATABASE_URL=postgresql://user:pass@host:port/db
   PRISMA_SCHEMA_PATH=prisma/schema.postgres.prisma
   SETUP_COMPLETE=true
   ```
3. أعد النشر

## استخدام صفحة الإعدادات

1. افتح `/settings/database`
2. اختر نوع قاعدة البيانات
3. املأ البيانات المطلوبة
4. اضغط "حفظ الإعدادات"

### أنواع قواعد البيانات المدعومة

#### SQLite (ملف محلي)
- **الاستخدام**: التطوير المحلي
- **المتطلبات**: لا شيء
- **المثال**: `file:./dev.db`

#### PostgreSQL محلي
- **الاستخدام**: التطوير المتقدم
- **المتطلبات**: PostgreSQL مثبت محلياً
- **المثال**: `postgresql://postgres:password@localhost:5432/estate_db`

#### PostgreSQL سحابي
- **الاستخدام**: الإنتاج
- **المتطلبات**: حساب في خدمة سحابية (Neon, Supabase, إلخ)
- **المثال**: `postgresql://user:pass@host:port/db?sslmode=require`

## الأوامر المتاحة

```bash
# توليد Prisma Client
npm run prisma:generate:pg      # PostgreSQL
npm run prisma:generate:sqlite  # SQLite

# تطبيق Migrations
npm run prisma:migrate:pg       # PostgreSQL
npm run prisma:migrate:sqlite   # SQLite

# البناء للإنتاج
npm run build                   # يستخدم PRISMA_SCHEMA_PATH
```

## استكشاف الأخطاء

### خطأ: "Invalid datasource URL"
- تأكد من صحة `DATABASE_URL`
- تأكد من أن `PRISMA_SCHEMA_PATH` يشير للملف الصحيح

### خطأ: "Schema validation failed"
- تأكد من أن السكيما المختارة تتطابق مع نوع قاعدة البيانات
- استخدم `prisma/schema.postgres.prisma` لـ PostgreSQL
- استخدم `prisma/schema.sqlite.prisma` لـ SQLite

### خطأ: "Connection failed"
- تأكد من أن قاعدة البيانات تعمل
- تحقق من إعدادات الشبكة والجدار الناري
- تأكد من صحة بيانات الاعتماد

## الملفات المهمة

- `prisma/schema.postgres.prisma` - سكيما PostgreSQL
- `prisma/schema.sqlite.prisma` - سكيما SQLite
- `app/settings/database/page.tsx` - صفحة الإعدادات
- `app/api/settings/database/route.ts` - API للإعدادات
- `middleware.ts` - توجيه المستخدم للإعدادات
- `scripts/setup-db.js` - إعداد قاعدة البيانات

## الدعم

إذا واجهت مشاكل:
1. تحقق من متغيرات البيئة
2. تأكد من أن قاعدة البيانات تعمل
3. جرب إعادة تشغيل الخادم
4. استخدم صفحة إعدادات قاعدة البيانات