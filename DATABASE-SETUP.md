# 🗄️ إعداد قاعدة البيانات

## ✅ تم ربط قاعدة البيانات بـ Neon PostgreSQL

### 🔗 رابط قاعدة البيانات:
```
postgresql://neondb_owner:npg_ZBrYxkMEL91f@ep-mute-violet-ad0dmo9y-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### 📋 التغييرات المطلوبة:

#### 1. `prisma/schema.prisma`
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

#### 2. `package.json`
```json
{
  "dependencies": {
    "pg": "^8.11.0"
  }
}
```

#### 3. `.env.local`
```env
DATABASE_URL="postgresql://neondb_owner:npg_ZBrYxkMEL91f@ep-mute-violet-ad0dmo9y-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
JWT_SECRET="estate-management-super-secret-key-2024"
NODE_ENV="development"
```

#### 4. `netlify.toml`
```toml
[build.environment]
  DATABASE_URL = "postgresql://neondb_owner:npg_ZBrYxkMEL91f@ep-mute-violet-ad0dmo9y-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
  JWT_SECRET = "estate-management-super-secret-key-2024"
```

## 🌱 البيانات التجريبية المضافة:

### 👥 العملاء:
- أحمد محمد (01234567890)
- فاطمة علي (01234567891)

### 🏠 الوحدات:
- شقة 101 (A101) - 500,000 جنيه
- شقة 102 (A102) - 450,000 جنيه

### 💰 الخزائن:
- الخزينة الرئيسية - 100,000 جنيه
- خزينة الطوارئ - 50,000 جنيه

### 📄 العقود:
- عقد شقة 101 مع أحمد محمد

### 💳 الأقساط:
- قسط أول - 50,000 جنيه
- قسط ثاني - 50,000 جنيه

### 📋 السندات:
- سند إيصال - 100,000 جنيه

## 🚀 خطوات التشغيل:

### 1. تشغيل محلياً:
```bash
export DATABASE_URL="postgresql://neondb_owner:npg_ZBrYxkMEL91f@ep-mute-violet-ad0dmo9y-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
npm run dev
```

### 2. النشر على Netlify:
- تم إضافة متغيرات البيئة في `netlify.toml`
- سيتم ربط قاعدة البيانات تلقائياً

## ✅ النتيجة:
- ✅ قاعدة البيانات متصلة
- ✅ البيانات التجريبية موجودة
- ✅ التطبيق يعمل مع بيانات حقيقية
- ✅ جاهز للنشر على Netlify

---

**🎉 الآن يمكنك تسجيل الدخول ورؤية البيانات الحقيقية!**