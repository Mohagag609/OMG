# 🗄️ دليل قاعدة البيانات الموحدة

نظام موحد يدعم جميع أنواع قواعد البيانات من ملف `.env` واحد!

## 🎯 الأنواع المدعومة

### 📁 SQLite (محلي)
- **الاستخدام:** التطوير السريع والمحلي
- **المميزات:** سريع، لا يتطلب تثبيت، ملف واحد
- **المناسب:** مشاريع صغيرة ومتوسطة

### 🏠 PostgreSQL (محلي)
- **الاستخدام:** الاختبار والتطوير المتقدم
- **المميزات:** قوي، يدعم SQL متقدم، قابل للتوسع
- **المناسب:** مشاريع كبيرة، تطوير فريق

### ☁️ PostgreSQL (سحابي)
- **الاستخدام:** الإنتاج والنشر
- **المميزات:** متاح 24/7، نسخ احتياطية تلقائية، قابل للتوسع
- **المناسب:** الإنتاج، التطبيقات التجارية

## 🚀 الاستخدام السريع

### 1. التبديل بين قواعد البيانات

```bash
# SQLite (افتراضي)
npm run db:sqlite

# PostgreSQL محلي
npm run db:postgresql-local

# PostgreSQL سحابي (Neon)
npm run db:postgresql-cloud
```

### 2. إدارة قاعدة البيانات

```bash
# تطبيق المخطط
npm run db:push

# إدراج البيانات التجريبية
npm run db:seed

# اختبار الاتصال
npm run db:test

# فتح Prisma Studio
npm run db:studio
```

### 3. تشغيل المشروع

```bash
# تشغيل في وضع التطوير
npm run dev

# بناء للإنتاج
npm run build

# تشغيل في وضع الإنتاج
npm start
```

## ⚙️ التكوين

### ملف `.env` الموحد

```env
# نوع قاعدة البيانات الحالي
DATABASE_TYPE="sqlite"

# إعدادات SQLite
SQLITE_DATABASE_URL="file:./dev.db"

# إعدادات PostgreSQL محلي
POSTGRESQL_LOCAL_DATABASE_URL="postgresql://postgres:password@localhost:5432/estate_management"

# إعدادات PostgreSQL سحابي
POSTGRESQL_CLOUD_DATABASE_URL="postgresql://user:pass@host:port/database?sslmode=require"
```

### تغيير نوع قاعدة البيانات

#### الطريقة 1: من خلال الأوامر
```bash
npm run db:sqlite
npm run db:postgresql-local
npm run db:postgresql-cloud
```

#### الطريقة 2: من خلال الواجهة
1. افتح المشروع: `npm run dev`
2. اذهب إلى: `http://localhost:3000/database-settings`
3. اختر نوع قاعدة البيانات
4. اضغط "التبديل"

#### الطريقة 3: تعديل ملف `.env`
```env
# غيّر هذا السطر فقط
DATABASE_TYPE="postgresql-cloud"
```

## 🔧 الإعدادات المتقدمة

### إعداد PostgreSQL محلي

```bash
# 1. تثبيت PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# 2. تشغيل الخدمة
sudo systemctl start postgresql

# 3. إنشاء قاعدة البيانات
sudo -u postgres createdb estate_management

# 4. إنشاء مستخدم
sudo -u postgres psql
CREATE USER your_username WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE estate_management TO your_username;
```

### إعداد Neon (PostgreSQL سحابي)

1. **إنشاء حساب:** [neon.tech](https://neon.tech)
2. **إنشاء مشروع جديد**
3. **نسخ رابط الاتصال**
4. **تحديث ملف `.env`:**

```env
POSTGRESQL_CLOUD_DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
```

## 📊 مقارنة الأداء

| الميزة | SQLite | PostgreSQL محلي | PostgreSQL سحابي |
|--------|--------|-----------------|------------------|
| **السرعة** | ⚡⚡⚡ | ⚡⚡ | ⚡ |
| **التثبيت** | ✅ مدمج | 🔧 يتطلب تثبيت | ❌ لا يتطلب |
| **البيانات** | 📁 ملف واحد | 🗄️ خادم محلي | ☁️ خادم سحابي |
| **المزامنة** | ❌ غير متاح | ⚠️ محدود | ✅ متاح |
| **النسخ الاحتياطية** | 📋 يدوي | 🔄 يدوي | ✅ تلقائي |
| **التكلفة** | 💰 مجاني | 💰 مجاني | 💰 مدفوع |
| **الإنتاج** | ⚠️ محدود | ✅ جيد | ✅ مثالي |

## 🎯 متى تستخدم كل نوع؟

### استخدم SQLite عندما:
- ✅ تطوير محلي سريع
- ✅ مشروع صغير أو متوسط
- ✅ لا تحتاج مزامنة بين أجهزة
- ✅ تريد سهولة في الإعداد
- ✅ تريد سرعة عالية

### استخدم PostgreSQL محلي عندما:
- ✅ تطوير فريق
- ✅ مشروع كبير
- ✅ تحتاج ميزات SQL متقدمة
- ✅ تريد اختبار محلي مع PostgreSQL
- ✅ لا تريد تكلفة سحابية

### استخدم PostgreSQL سحابي عندما:
- ✅ تطبيق للإنتاج
- ✅ تحتاج مزامنة بين أجهزة
- ✅ تريد نسخ احتياطية تلقائية
- ✅ تريد توفر عالي
- ✅ تريد قابلية التوسع

## 🔄 نقل البيانات

### من SQLite إلى PostgreSQL:

```bash
# 1. تصدير البيانات
npm run backup:create

# 2. التبديل إلى PostgreSQL
npm run db:postgresql-cloud

# 3. تطبيق المخطط
npm run db:push

# 4. استيراد البيانات
npm run backup:restore
```

### من PostgreSQL إلى SQLite:

```bash
# نفس الخطوات مع تبديل الترتيب
npm run backup:create
npm run db:sqlite
npm run db:push
npm run backup:restore
```

## 🛠️ استكشاف الأخطاء

### مشكلة: "Can't reach database server"
```bash
# للـ PostgreSQL محلي
sudo systemctl status postgresql
sudo systemctl start postgresql

# للـ PostgreSQL سحابي
# تحقق من رابط الاتصال في ملف .env
```

### مشكلة: "Database does not exist"
```bash
# للـ PostgreSQL محلي
createdb -U postgres estate_management

# للـ PostgreSQL سحابي
# أنشئ قاعدة بيانات جديدة في لوحة التحكم
```

### مشكلة: "Permission denied"
```bash
# للـ PostgreSQL محلي
sudo -u postgres psql
GRANT ALL PRIVILEGES ON DATABASE estate_management TO your_username;
```

## 📱 واجهة الإدارة

### صفحة إعدادات قاعدة البيانات
- **الرابط:** `http://localhost:3000/database-settings`
- **المميزات:**
  - عرض قاعدة البيانات الحالية
  - التبديل بين الأنواع
  - اختبار الاتصال
  - عرض معلومات قاعدة البيانات

### Prisma Studio
- **الأمر:** `npm run db:studio`
- **المميزات:**
  - عرض البيانات
  - تعديل البيانات
  - إدارة الجداول
  - تشغيل الاستعلامات

## 🚀 النشر

### Netlify
```bash
# 1. التبديل إلى PostgreSQL سحابي
npm run db:postgresql-cloud

# 2. دفع التغييرات
git add .
git commit -m "Switch to cloud database"
git push

# 3. Netlify سيبني المشروع تلقائياً
```

### Vercel
```bash
# نفس الخطوات مع إعداد متغيرات البيئة في Vercel
```

## 📞 الدعم

### الأوامر المفيدة
```bash
# اختبار الاتصال
npm run db:test

# عرض حالة قاعدة البيانات
npm run db:studio

# إعادة تعيين قاعدة البيانات
npm run db:reset

# إدراج البيانات التجريبية
npm run db:seed
```

### السجلات
```bash
# عرض سجلات قاعدة البيانات
npm run dev  # في Terminal

# عرض سجلات Prisma
# في Prisma Studio
```

---

## 🎉 خلاصة

الآن لديك نظام موحد يدعم جميع أنواع قواعد البيانات من ملف `.env` واحد!

**الأوامر الأساسية:**
- `npm run db:sqlite` - SQLite
- `npm run db:postgresql-local` - PostgreSQL محلي  
- `npm run db:postgresql-cloud` - PostgreSQL سحابي
- `npm run db:test` - اختبار الاتصال
- `npm run dev` - تشغيل المشروع

**🎯 اختر النوع المناسب لمشروعك واستمتع بالتطوير!**