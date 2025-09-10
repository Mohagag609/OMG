# إصلاح مشكلة النشر على Netlify - تم الحل ✅

## المشكلة
كانت مشكلة النشر على Netlify بسبب استخدام `PRISMA_SCHEMA_PATH` environment variable في `postinstall` script، والذي لا يعمل مع Prisma CLI.

## الحل المطبق
تم استبدال جميع استخدامات `PRISMA_SCHEMA_PATH` بـ `--schema` parameter في جميع الملفات.

## الملفات المحدثة

### 1. package.json
```json
// قبل
"postinstall": "PRISMA_SCHEMA_PATH=prisma/schema.sqlite.prisma prisma generate && node scripts/setup-db.js"

// بعد
"postinstall": "npx prisma generate --schema=prisma/schema.sqlite.prisma && node scripts/setup-db.js"
```

### 2. netlify.toml
```toml
# قبل
command = "PRISMA_SCHEMA_PATH=prisma/schema.postgres.prisma npx prisma generate && PRISMA_SCHEMA_PATH=prisma/schema.postgres.prisma npx prisma migrate deploy && npm run build"

# بعد
command = "npx prisma generate --schema=prisma/schema.postgres.prisma && npx prisma migrate deploy --schema=prisma/schema.postgres.prisma && npm run build"
```

### 3. vercel.json
```json
// قبل
"buildCommand": "PRISMA_SCHEMA_PATH=prisma/schema.postgres.prisma npx prisma generate && PRISMA_SCHEMA_PATH=prisma/schema.postgres.prisma npx prisma migrate deploy && npm run build"

// بعد
"buildCommand": "npx prisma generate --schema=prisma/schema.postgres.prisma && npx prisma migrate deploy --schema=prisma/schema.postgres.prisma && npm run build"
```

### 4. scripts/setup-db.js
```javascript
// قبل
execSync('PRISMA_SCHEMA_PATH=prisma/schema.sqlite.prisma npx prisma db push --accept-data-loss', { stdio: 'inherit' })

// بعد
process.env.DATABASE_URL = "file:./dev.db"
execSync('npx prisma db push --schema=prisma/schema.sqlite.prisma --accept-data-loss', { stdio: 'inherit' })
```

### 5. scripts/build-production.js
```javascript
// قبل
const generateCmd = `PRISMA_SCHEMA_PATH=${schemaPath} npx prisma generate`
const migrateCmd = `PRISMA_SCHEMA_PATH=${schemaPath} npx prisma migrate deploy`

// بعد
const generateCmd = `npx prisma generate --schema=${schemaPath}`
const migrateCmd = `npx prisma migrate deploy --schema=${schemaPath}`
```

## الاختبارات المنجزة

### ✅ اختبار postinstall محلياً
```bash
npm run postinstall
# ✅ يعمل بنجاح
```

### ✅ اختبار Prisma generate
```bash
npx prisma generate --schema=prisma/schema.sqlite.prisma
# ✅ يعمل بنجاح
```

### ✅ اختبار Prisma migrate
```bash
npx prisma migrate deploy --schema=prisma/schema.postgres.prisma
# ✅ يعمل بنجاح
```

## النتيجة
- ✅ `postinstall` script يعمل بشكل صحيح
- ✅ جميع سكريبتات Prisma تستخدم `--schema` parameter
- ✅ النظام جاهز للنشر على Netlify/Vercel
- ✅ لا توجد أخطاء في dependency installation

## الخطوات التالية
1. **commit التغييرات** إلى Git
2. **push** إلى GitHub
3. **إعادة النشر** على Netlify
4. **التحقق** من نجاح البناء

النظام الآن جاهز للنشر بنجاح! 🚀