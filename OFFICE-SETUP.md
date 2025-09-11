# دليل الإعداد للمكتب - Office Setup Guide

## نظرة عامة - Overview

هذا الدليل يوضح كيفية إعداد المشروع للعمل في المكتب مع قاعدة بيانات PostgreSQL محلية.

## المتطلبات - Requirements

### 1. تثبيت Node.js
- تحميل من: https://nodejs.org/
- الإصدار المطلوب: 18.x أو أحدث

### 2. تثبيت PostgreSQL

#### على Windows:
1. تحميل PostgreSQL من: https://www.postgresql.org/download/windows/
2. تثبيت PostgreSQL مع pgAdmin
3. تذكر كلمة المرور التي تضعها للمستخدم `postgres`

#### على Mac:
```bash
# باستخدام Homebrew
brew install postgresql
brew services start postgresql
```

#### على Ubuntu/Debian:
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## الإعداد السريع - Quick Setup

### 1. استنساخ المشروع
```bash
git clone <repository-url>
cd estate-management-nextjs
```

### 2. تثبيت التبعيات
```bash
npm install
```

### 3. إعداد البيئة المحلية
```bash
# إعداد ملفات البيئة
npm run env:local

# إعداد قاعدة البيانات المحلية
npm run db:setup:local
```

### 4. تطبيق Schema قاعدة البيانات
```bash
# تطبيق Schema على قاعدة البيانات المحلية
npm run db:push:local
```

### 5. تشغيل التطبيق
```bash
# تشغيل مع قاعدة البيانات المحلية
npm run dev:local
```

## الإعداد التفصيلي - Detailed Setup

### الخطوة 1: إعداد قاعدة البيانات المحلية

#### على Windows:
1. افتح pgAdmin
2. أنشئ قاعدة بيانات جديدة باسم `estate_pro_db`
3. أنشئ مستخدم جديد أو استخدم `postgres`
4. تأكد من الصلاحيات

#### على Mac/Linux:
```bash
# تشغيل السكريبت التلقائي
./scripts/setup-postgres-local.sh

# أو يدوياً:
sudo -u postgres psql
CREATE DATABASE estate_pro_db;
CREATE USER postgres WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE estate_pro_db TO postgres;
\q
```

### الخطوة 2: إعداد متغيرات البيئة

تأكد من وجود ملف `.env.local` مع المحتوى التالي:

```env
# Local PostgreSQL Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/estate_pro_db?schema=public"

# Neon Cloud Database (for backup/sync)
NEON_DATABASE_URL="postgresql://neondb_owner:npg_x5qvmpzF3hjX@ep-dawn-cell-adylfb98-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Development Settings
NODE_ENV="development"
PORT=3000

# JWT Configuration
JWT_SECRET="dev-jwt-secret-key"
JWT_EXPIRES_IN="7d"

# API Configuration
API_BASE_URL="http://localhost:3000/api"
NEXT_PUBLIC_API_URL="http://localhost:3000/api"

# Database Mode
DB_MODE="local"
```

### الخطوة 3: تطبيق Schema قاعدة البيانات

```bash
# توليد Prisma Client
npm run db:generate

# تطبيق Schema على قاعدة البيانات المحلية
npm run db:push:local

# أو استخدام Prisma Studio لمراجعة البيانات
npm run db:studio:local
```

### الخطوة 4: اختبار التطبيق

```bash
# تشغيل التطبيق
npm run dev:local

# فتح المتصفح على
# http://localhost:3000
```

## الأوامر المفيدة - Useful Commands

### إدارة قاعدة البيانات
```bash
# تطبيق Schema
npm run db:push:local

# إعادة تعيين قاعدة البيانات
npm run db:reset:local

# فتح Prisma Studio
npm run db:studio:local

# إنشاء نسخة احتياطية
npm run backup:create:local
```

### تشغيل التطبيق
```bash
# تشغيل مع قاعدة البيانات المحلية
npm run dev:local

# تشغيل مع قاعدة البيانات السحابية
npm run dev:cloud

# بناء المشروع
npm run build:local
```

### مزامنة البيانات
```bash
# مزامنة من المحلي إلى السحابي
curl -X POST http://localhost:3000/api/database/sync \
  -H "Content-Type: application/json" \
  -d '{"fromMode": "local", "toMode": "cloud"}'

# مزامنة من السحابي إلى المحلي
curl -X POST http://localhost:3000/api/database/sync \
  -H "Content-Type: application/json" \
  -d '{"fromMode": "cloud", "toMode": "local"}'
```

## استكشاف الأخطاء - Troubleshooting

### مشاكل شائعة

#### 1. خطأ في الاتصال بقاعدة البيانات
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**الحل:**
- تأكد من تشغيل PostgreSQL
- تحقق من رقم المنفذ (5432)
- تأكد من صحة معلومات الاتصال

#### 2. خطأ في الصلاحيات
```
Error: permission denied for database
```

**الحل:**
```sql
-- في psql
GRANT ALL PRIVILEGES ON DATABASE estate_pro_db TO postgres;
ALTER USER postgres CREATEDB;
```

#### 3. خطأ في Prisma
```
Error: P1001: Can't reach database server
```

**الحل:**
- تحقق من `DATABASE_URL` في `.env.local`
- تأكد من تشغيل قاعدة البيانات
- جرب إعادة توليد Prisma Client: `npm run db:generate`

### اختبار الاتصالات

```bash
# اختبار قاعدة البيانات المحلية
psql postgresql://postgres:password@localhost:5432/estate_pro_db

# اختبار قاعدة البيانات السحابية
psql 'postgresql://neondb_owner:npg_x5qvmpzF3hjX@ep-dawn-cell-adylfb98-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
```

## نصائح للعمل في المكتب - Office Work Tips

### 1. النسخ الاحتياطية
- قم بإنشاء نسخة احتياطية يومية
- استخدم `npm run backup:create:local` قبل إغلاق الكمبيوتر

### 2. المزامنة
- مزامن البيانات مع السحابة قبل المغادرة
- استخدم `npm run dev:cloud` للعمل مع البيانات السحابية

### 3. الأمان
- لا تشارك ملفات `.env` مع الآخرين
- استخدم كلمات مرور قوية
- احتفظ بنسخ احتياطية آمنة

## الدعم - Support

إذا واجهت أي مشاكل:
1. تحقق من ملفات السجلات
2. تأكد من إعدادات الشبكة
3. راجع متغيرات البيئة
4. جرب إعادة تشغيل الخدمات

## روابط مفيدة - Useful Links

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Neon Documentation](https://neon.tech/docs)