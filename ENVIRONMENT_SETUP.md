# إعداد متغيرات البيئة - Environment Setup

## المشكلة التي تم حلها
كانت هناك مشكلة في الاتصال بقاعدة البيانات بسبب عدم تحديد متغيرات البيئة بشكل صحيح.

## الحل
1. إنشاء ملف `.env` من `.env.example`
2. تحديد متغيرات البيئة المطلوبة

## خطوات الإعداد

### 1. إنشاء ملف البيئة
```bash
cp .env.example .env
```

### 2. تحديث متغيرات قاعدة البيانات
في ملف `.env`، قم بتحديث:
```env
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require&channel_binding=require"
NEON_DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require&channel_binding=require"
```

### 3. اختبار الاتصال
```bash
npm run test:connections
```

## متغيرات البيئة المطلوبة

### قاعدة البيانات
- `DATABASE_URL`: رابط قاعدة البيانات الرئيسية
- `NEON_DATABASE_URL`: رابط قاعدة البيانات السحابية (Neon)

### المصادقة
- `NEXTAUTH_SECRET`: مفتاح سري للمصادقة
- `JWT_SECRET`: مفتاح JWT

### إعدادات التطبيق
- `NODE_ENV`: بيئة التشغيل (development/production)
- `PORT`: منفذ التطبيق
- `TZ`: المنطقة الزمنية

## استكشاف الأخطاء

### خطأ: "Invalid value undefined for datasource"
هذا يعني أن `DATABASE_URL` غير محدد. تأكد من:
1. وجود ملف `.env`
2. تحديد `DATABASE_URL` في الملف
3. إعادة تشغيل التطبيق

### خطأ: "Can't reach database server"
هذا يعني مشكلة في الاتصال. تأكد من:
1. صحة رابط قاعدة البيانات
2. إعدادات SSL
3. إعدادات Firewall