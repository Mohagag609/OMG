# مدير الاستثمار العقاري

تطبيق Next.js لإدارة الاستثمارات العقارية مع نظام شامل للمراقبة والنسخ الاحتياطية.

## المميزات

### 🏗️ البنية التقنية
- **Next.js 14** مع App Router
- **TypeScript** للكتابة الآمنة
- **Prisma** مع SQLite كقاعدة بيانات
- **Tailwind CSS** للتصميم
- **JWT** للمصادقة

### 📊 إدارة البيانات
- إدارة العملاء والوحدات والعقود
- نظام الأقساط والسندات
- إدارة الخزائن والشركاء
- تقارير شاملة ومؤشرات الأداء

### 🔐 الأمان والمراقبة
- نظام مصادقة آمن
- سجل تدقيق شامل
- مراقبة صحة النظام
- نظام إشعارات متقدم

### 💾 النسخ الاحتياطية
- نسخ احتياطية محلية وخارجية
- استرجاع تلقائي
- تنظيف تلقائي للنسخ القديمة
- التحقق من سلامة البيانات

## التثبيت والتشغيل

### المتطلبات
- Node.js 18+
- npm أو yarn

### خطوات التثبيت

1. **تثبيت التبعيات**
```bash
npm install
```

2. **إعداد قاعدة البيانات**
```bash
npx prisma generate
npx prisma db push
```

3. **إعداد متغيرات البيئة**
```bash
cp .env.example .env.local
```

4. **تشغيل التطبيق**
```bash
npm run dev
```

5. **فتح التطبيق**
افتح [http://localhost:3000](http://localhost:3000) في المتصفح

### بيانات الدخول الافتراضية
- **اسم المستخدم:** admin
- **كلمة المرور:** admin123

## النشر

### النشر على Netlify
```bash
npm run deploy:netlify
```

### النشر على Vercel
```bash
npm run deploy:vercel
```

### النشر على Render
```bash
npm run deploy:render
```

### النشر على Railway
```bash
npm run deploy:railway
```

### النشر على DigitalOcean
```bash
npm run deploy:digitalocean
```

## النشر باستخدام Docker

### الإنتاج
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### التطوير
```bash
docker-compose up -d
```

## البنية التقنية

### الملفات الرئيسية
```
src/
├── app/                    # صفحات Next.js
│   ├── api/               # API Routes
│   ├── customers/         # صفحة العملاء
│   ├── units/            # صفحة الوحدات
│   ├── contracts/        # صفحة العقود
│   ├── installments/     # صفحة الأقساط
│   ├── vouchers/         # صفحة السندات
│   ├── partners/         # صفحة الشركاء
│   ├── treasury/         # صفحة الخزينة
│   ├── reports/          # صفحة التقارير
│   ├── backup/           # صفحة النسخ الاحتياطية
│   └── audit/            # صفحة سجل التدقيق
├── components/           # مكونات React
├── lib/                 # مكتبات مساعدة
│   ├── db.ts            # إعداد قاعدة البيانات
│   ├── auth.ts          # نظام المصادقة
│   ├── audit.ts         # نظام التدقيق
│   ├── backup.ts        # نظام النسخ الاحتياطية
│   ├── monitoring.ts    # نظام المراقبة
│   └── notifications.ts # نظام الإشعارات
├── types/               # تعريفات TypeScript
└── utils/               # أدوات مساعدة
```

## API Endpoints

### العملاء
- `GET /api/customers` - جلب العملاء
- `POST /api/customers` - إضافة عميل
- `GET /api/customers/[id]` - جلب عميل
- `PUT /api/customers/[id]` - تحديث عميل
- `DELETE /api/customers/[id]` - حذف عميل

### الوحدات
- `GET /api/units` - جلب الوحدات
- `POST /api/units` - إضافة وحدة
- `GET /api/units/[id]` - جلب وحدة
- `PUT /api/units/[id]` - تحديث وحدة
- `DELETE /api/units/[id]` - حذف وحدة

### الأقساط
- `GET /api/installments` - جلب الأقساط
- `POST /api/installments` - إضافة قسط
- `GET /api/installments/[id]` - جلب قسط
- `PUT /api/installments/[id]` - تحديث قسط
- `DELETE /api/installments/[id]` - حذف قسط

### السندات
- `GET /api/vouchers` - جلب السندات
- `POST /api/vouchers` - إضافة سند
- `GET /api/vouchers/[id]` - جلب سند
- `PUT /api/vouchers/[id]` - تحديث سند
- `DELETE /api/vouchers/[id]` - حذف سند

### النسخ الاحتياطية
- `GET /api/export` - تصدير البيانات
- `POST /api/import` - استيراد البيانات
- `POST /api/backup/create` - إنشاء نسخة احتياطية
- `GET /api/backup/list` - قائمة النسخ الاحتياطية

### المراقبة
- `GET /api/monitoring/health` - فحص صحة النظام
- `GET /api/monitoring/metrics` - مقاييس النظام
- `GET /api/monitoring/dashboard` - لوحة المراقبة

## التطوير

### تشغيل في وضع التطوير
```bash
npm run dev
```

### بناء للإنتاج
```bash
npm run build
npm start
```

### فحص قاعدة البيانات
```bash
npx prisma studio
```

### إعادة تعيين قاعدة البيانات
```bash
npx prisma db push --force-reset
```

## الأمان

### متغيرات البيئة المطلوبة
```env
DATABASE_URL=file:./dev.db
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=production
```

### نصائح الأمان
- غيّر كلمة المرور الافتراضية فوراً
- استخدم JWT_SECRET قوي
- فعّل HTTPS في الإنتاج
- راقب سجل التدقيق بانتظام

## الدعم

للحصول على الدعم أو الإبلاغ عن مشاكل، يرجى فتح issue في المستودع.

## الترخيص

هذا المشروع مرخص تحت رخصة MIT.