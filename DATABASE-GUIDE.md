# دليل قواعد البيانات - مدير الاستثمار العقاري

## نظرة عامة

يدعم التطبيق ثلاثة أنواع من قواعد البيانات:

1. **SQLite** - قاعدة بيانات محلية سريعة ومناسبة للتطوير
2. **PostgreSQL Local** - قاعدة بيانات محلية قوية للاختبار والتطوير
3. **PostgreSQL Cloud (Neon)** - قاعدة بيانات سحابية للإنتاج

## التبديل بين أنواع قواعد البيانات

### 1. SQLite (افتراضي)
```bash
npm run switch-db sqlite
npm run db:push
npm run db:seed
npm run dev
```

### 2. PostgreSQL Local
```bash
# أولاً: إعداد PostgreSQL محلياً
npm run setup-postgresql

# ثم: التبديل إلى PostgreSQL
npm run switch-db postgresql-local
npm run db:push
npm run db:seed
npm run dev
```

### 3. PostgreSQL Cloud (Neon)
```bash
npm run switch-db postgresql-cloud
npm run db:push
npm run db:seed
npm run dev
```

## إعدادات قاعدة البيانات

### ملف .env
```env
# قاعدة البيانات النشطة حالياً
DATABASE_TYPE="sqlite"
DATABASE_URL="file:./prisma/dev.db"

# إعدادات SQLite
SQLITE_DATABASE_URL="file:./prisma/dev.db"

# إعدادات PostgreSQL المحلي
POSTGRESQL_LOCAL_DATABASE_URL="postgresql://postgres:password@localhost:5432/estate_management"

# إعدادات PostgreSQL السحابي (Neon)
POSTGRESQL_CLOUD_DATABASE_URL="postgresql://neondb_owner:npg_iIXv7WPbcQj2@ep-square-sky-adjw0es3-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

## الأوامر المتاحة

### تبديل قاعدة البيانات
```bash
npm run switch-db sqlite              # التبديل إلى SQLite
npm run switch-db postgresql-local    # التبديل إلى PostgreSQL محلي
npm run switch-db postgresql-cloud    # التبديل إلى PostgreSQL سحابي
```

### إدارة قاعدة البيانات
```bash
npm run db:generate    # توليد Prisma Client
npm run db:push        # تطبيق المخطط على قاعدة البيانات
npm run db:reset       # إعادة تعيين قاعدة البيانات
npm run db:seed        # إدراج البيانات التجريبية
npm run db:test        # اختبار الاتصال بقاعدة البيانات
npm run db:studio      # فتح Prisma Studio
```

### إعداد PostgreSQL محلي
```bash
npm run setup-postgresql    # إعداد PostgreSQL محلياً
```

## متطلبات النظام

### SQLite
- لا يتطلب إعداد إضافي
- يعمل مباشرة مع Node.js

### PostgreSQL Local
- تثبيت PostgreSQL على النظام
- تشغيل خدمة PostgreSQL
- إنشاء قاعدة بيانات `estate_management`

### PostgreSQL Cloud (Neon)
- حساب على Neon
- URL اتصال صالح
- SSL مفعل

## استكشاف الأخطاء

### خطأ في الاتصال بقاعدة البيانات
1. تأكد من صحة `DATABASE_URL`
2. تحقق من تشغيل خدمة قاعدة البيانات
3. جرب `npm run db:test`

### خطأ في المخطط
1. تأكد من استخدام المخطط الصحيح
2. جرب `npm run db:push --force-reset`
3. أعد إنشاء المستخدمين: `npm run create-users`

### خطأ في البيانات
1. أعد إدراج البيانات: `npm run db:seed`
2. أنشئ المستخدمين: `npm run create-users`

## بيانات الدخول الافتراضية

- **المدير**: `admin` / `admin123`
- **المستخدم العادي**: `user` / `user123`

## النسخ الاحتياطي

### إنشاء نسخة احتياطية
```bash
npm run backup:create
```

### استعادة نسخة احتياطية
```bash
npm run backup:restore
```

## الأداء

### SQLite
- ✅ سريع للقراءة
- ✅ لا يتطلب إعداد
- ❌ محدود في الأداء مع البيانات الكبيرة
- ❌ لا يدعم الاتصالات المتزامنة

### PostgreSQL Local
- ✅ أداء عالي
- ✅ دعم كامل للـ SQL
- ✅ يدعم الاتصالات المتزامنة
- ❌ يتطلب إعداد

### PostgreSQL Cloud (Neon)
- ✅ أداء عالي
- ✅ متاح 24/7
- ✅ نسخ احتياطية تلقائية
- ❌ يتطلب اتصال إنترنت
- ❌ قد يكون أبطأ من المحلي

## التوصيات

### للتطوير
- استخدم **SQLite** للبداية السريعة
- استخدم **PostgreSQL Local** للاختبارات المتقدمة

### للإنتاج
- استخدم **PostgreSQL Cloud (Neon)** للاستقرار والموثوقية
- استخدم **PostgreSQL Local** إذا كان لديك خادم مخصص

## الدعم

إذا واجهت مشاكل:
1. تحقق من ملف `.env`
2. جرب `npm run db:test`
3. راجع سجلات الأخطاء
4. تأكد من إصدارات البرامج المطلوبة