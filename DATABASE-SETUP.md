# إعداد قاعدة البيانات - Database Setup

## نظرة عامة - Overview

هذا المشروع يدعم العمل مع قواعد بيانات متعددة:
- **PostgreSQL محلي** - للعمل في المكتب
- **Neon Cloud** - للعمل السحابي والإنتاج

## الإعداد السريع - Quick Setup

### 1. إعداد البيئة المحلية (للمكتب)

#### على Linux/Mac:
```bash
# إعداد البيئة المحلية
npm run env:local

# تشغيل PostgreSQL محلي
npm run db:setup:local

# تشغيل التطبيق مع قاعدة البيانات المحلية
npm run dev:local
```

#### على Windows:
```cmd
REM إعداد البيئة المحلية
npm run env:local

REM تشغيل PostgreSQL محلي
npm run db:setup:windows

REM تشغيل التطبيق مع قاعدة البيانات المحلية
npm run dev:local
```

### 2. إعداد البيئة السحابية (للإنتاج)

```bash
# إعداد بيئة الإنتاج
npm run env:production

# تشغيل التطبيق مع قاعدة البيانات السحابية
npm run dev:cloud
```

### 3. إعداد Netlify

```bash
# إعداد بيئة Netlify
npm run env:netlify

# بناء المشروع للإنتاج
npm run build:cloud

# نشر على Netlify
npm run deploy:netlify
```

## الأوامر المتاحة - Available Commands

### إدارة البيئة - Environment Management
- `npm run env:setup` - إعداد جميع البيئات
- `npm run env:local` - إعداد البيئة المحلية
- `npm run env:production` - إعداد بيئة الإنتاج
- `npm run env:netlify` - إعداد بيئة Netlify

### إدارة قاعدة البيانات - Database Management
- `npm run db:setup:local` - إعداد PostgreSQL محلي (Linux/Mac)
- `npm run db:setup:windows` - إعداد PostgreSQL محلي (Windows)
- `npm run db:push:local` - تطبيق Schema على قاعدة البيانات المحلية
- `npm run db:push:cloud` - تطبيق Schema على قاعدة البيانات السحابية
- `npm run db:studio:local` - فتح Prisma Studio للقاعدة المحلية
- `npm run db:studio:cloud` - فتح Prisma Studio للقاعدة السحابية

### تشغيل التطبيق - Running the Application
- `npm run dev:local` - تشغيل مع قاعدة البيانات المحلية
- `npm run dev:cloud` - تشغيل مع قاعدة البيانات السحابية
- `npm run build:local` - بناء مع قاعدة البيانات المحلية
- `npm run build:cloud` - بناء مع قاعدة البيانات السحابية

### النسخ الاحتياطية - Backups
- `npm run backup:create:local` - إنشاء نسخة احتياطية من القاعدة المحلية
- `npm run backup:create:cloud` - إنشاء نسخة احتياطية من القاعدة السحابية
- `npm run backup:restore` - استعادة نسخة احتياطية

## إعدادات قاعدة البيانات - Database Settings

### قاعدة البيانات المحلية - Local Database
```
Host: localhost
Port: 5432
Database: estate_pro_db
Username: postgres
Password: password
URL: postgresql://postgres:password@localhost:5432/estate_pro_db?schema=public
```

### قاعدة البيانات السحابية (Neon) - Cloud Database (Neon)
```
URL: postgresql://neondb_owner:npg_x5qvmpzF3hjX@ep-dawn-cell-adylfb98-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

## استكشاف الأخطاء - Troubleshooting

### مشاكل شائعة - Common Issues

1. **خطأ في الاتصال بقاعدة البيانات المحلية**
   ```bash
   # تأكد من تشغيل Docker
   docker ps
   
   # إعادة تشغيل قاعدة البيانات
   docker-compose down
   docker-compose up -d postgres
   ```

2. **خطأ في الاتصال بـ Neon**
   - تأكد من صحة معلومات الاتصال
   - تأكد من تفعيل SSL
   - تحقق من إعدادات Firewall

3. **مشاكل في Prisma**
   ```bash
   # إعادة توليد Prisma Client
   npm run db:generate
   
   # إعادة تطبيق Schema
   npm run db:push:local
   ```

### اختبار الاتصالات - Testing Connections

```bash
# اختبار قاعدة البيانات المحلية
psql postgresql://postgres:password@localhost:5432/estate_pro_db

# اختبار قاعدة البيانات السحابية
psql 'postgresql://neondb_owner:npg_x5qvmpzF3hjX@ep-dawn-cell-adylfb98-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
```

## المزامنة بين قواعد البيانات - Database Sync

يمكنك مزامنة البيانات بين القاعدة المحلية والسحابية:

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

## الأمان - Security

- استخدم كلمات مرور قوية في الإنتاج
- لا تشارك ملفات `.env` في Git
- استخدم متغيرات البيئة في Netlify
- فعّل SSL لجميع الاتصالات

## الدعم - Support

إذا واجهت أي مشاكل، تحقق من:
1. ملفات السجلات (logs)
2. حالة Docker
3. إعدادات الشبكة
4. متغيرات البيئة