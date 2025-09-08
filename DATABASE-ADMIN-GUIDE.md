# دليل إدارة قاعدة البيانات

## نظرة عامة

نظام إدارة قاعدة البيانات يسمح بإدارة قواعد البيانات المختلفة (SQLite، PostgreSQL محلي، PostgreSQL سحابي) من خلال واجهة ويب آمنة.

## الميزات

- ✅ تهيئة قاعدة بيانات جديدة
- ✅ التبديل بين أنواع قواعد البيانات
- ✅ مسح/إعادة ضبط قاعدة البيانات
- ✅ زرع بيانات تجريبية اختياري
- ✅ دعم البيئة المحلية والإنتاجية
- ✅ تكامل مع Netlify للبيئة الإنتاجية
- ✅ حماية عبر مفتاح الأدمن

## أنواع قواعد البيانات المدعومة

### 1. SQLite (محلي)
- **الاستخدام**: التطوير والاختبار
- **المميزات**: سهل الإعداد، لا يتطلب خادم منفصل
- **الملف**: `./prisma/dev.db`

### 2. PostgreSQL (محلي)
- **الاستخدام**: التطوير مع قاعدة بيانات محلية
- **المتطلبات**: تثبيت PostgreSQL على الجهاز
- **الإعداد**: `postgresql://postgres:password@localhost:5432/estate_management`

### 3. PostgreSQL (سحابي)
- **الاستخدام**: الإنتاج
- **المزودون المدعومون**: Neon، Supabase، Railway، إلخ
- **الإعداد**: رابط قاعدة البيانات السحابية

## الإعداد والاستخدام

### 1. الإعداد المحلي

1. **تحديث متغيرات البيئة**:
   ```bash
   # في ملف .env.local
   DATABASE_TYPE="sqlite"
   DATABASE_URL="file:./prisma/dev.db"
   ADMIN_SETUP_KEY="your-secure-admin-key"
   ```

2. **تشغيل التطبيق**:
   ```bash
   npm run dev
   ```

3. **الوصول لصفحة الإعدادات**:
   ```
   http://localhost:3000/admin/settings
   ```

### 2. الإعداد للإنتاج (Netlify)

1. **إعداد متغيرات البيئة على Netlify**:
   ```
   DATABASE_TYPE=postgresql-cloud
   DATABASE_URL=postgresql://...
   ADMIN_SETUP_KEY=your-secure-admin-key
   NETLIFY_AUTH_TOKEN=your-netlify-token
   NETLIFY_SITE_ID=your-site-id
   BUILD_HOOK_URL=your-build-hook-url
   ```

2. **إنشاء Build Hook**:
   - اذهب إلى Site settings > Build & deploy > Build hooks
   - أنشئ Build Hook جديد
   - انسخ الرابط

3. **الحصول على Personal Access Token**:
   - اذهب إلى User settings > Applications > Personal access tokens
   - أنشئ token جديد مع صلاحية "Sites"

## استخدام النظام

### 1. تهيئة قاعدة بيانات جديدة

1. افتح صفحة الإعدادات
2. أدخل مفتاح الأدمن
3. اختر نوع قاعدة البيانات
4. أدخل الإعدادات المطلوبة
5. اضغط "تهيئة قاعدة بيانات جديدة"

### 2. التبديل بين قواعد البيانات

1. اختر "تبديل" من وضع العملية
2. اختر نوع قاعدة البيانات الجديدة
3. أدخل الإعدادات
4. اضغط "تبديل قاعدة البيانات"

### 3. مسح قاعدة البيانات

1. تأكد من أنك تريد مسح البيانات
2. اضغط "مسح قاعدة البيانات"
3. أكد العملية

## API Endpoints

### POST /api/db-admin/init
تهيئة قاعدة بيانات جديدة

**Headers**:
```
X-Admin-Key: your-admin-key
Content-Type: application/json
```

**Body**:
```json
{
  "type": "sqlite" | "postgresql-local" | "postgresql-cloud",
  "mode": "new",
  "seed": true,
  "postgres": {
    "host": "localhost",
    "port": 5432,
    "username": "postgres",
    "password": "password",
    "database": "estate_management",
    "ssl": false
  },
  "cloudUrl": "postgresql://..."
}
```

### POST /api/db-admin/switch
التبديل بين قواعد البيانات

**Headers**:
```
X-Admin-Key: your-admin-key
Content-Type: application/json
```

**Body**: نفس body التهيئة مع `mode: "switch"`

### POST /api/db-admin/wipe
مسح قاعدة البيانات

**Headers**:
```
X-Admin-Key: your-admin-key
Content-Type: application/json
```

**Body**:
```json
{
  "confirm": true
}
```

## الأمان

- جميع العمليات محمية بمفتاح الأدمن
- يتم التحقق من المفتاح في كل طلب
- في الإنتاج، يتم تحديث متغيرات البيئة عبر Netlify API

## استكشاف الأخطاء

### مشاكل شائعة

1. **فشل الاتصال بقاعدة البيانات**:
   - تأكد من صحة رابط قاعدة البيانات
   - تأكد من تشغيل خادم PostgreSQL (إذا كان محلي)
   - تحقق من إعدادات الشبكة

2. **فشل في الإنتاج**:
   - تأكد من صحة Netlify credentials
   - تحقق من صلاحيات Personal Access Token
   - تأكد من صحة Build Hook URL

3. **مشاكل في Prisma**:
   - شغل `npx prisma generate`
   - شغل `npx prisma migrate deploy`
   - تحقق من schema.prisma

### سجلات النظام

- يتم عرض جميع العمليات في سجل العمليات
- يمكن مراجعة السجلات في صفحة الإعدادات
- يتم حفظ سجلات الأخطاء في console

## التطوير

### إضافة نوع قاعدة بيانات جديد

1. أضف النوع الجديد في `lib/env.ts`
2. حدث `resolveUrlByType` function
3. أضف التحقق في `validateDatabaseUrl`
4. حدث UI في `DbSettingsForm`

### إضافة ميزات جديدة

1. أضف API endpoint جديد في `app/api/db-admin/`
2. حدث `lib/db-admin.ts` مع المنطق الجديد
3. حدث UI في `DbSettingsForm`
4. أضف الاختبارات

## الدعم

للمساعدة أو الإبلاغ عن مشاكل، يرجى مراجعة:
- سجلات النظام
- ملفات السجلات
- إعدادات متغيرات البيئة