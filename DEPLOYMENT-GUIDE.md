# 🚀 دليل النشر - مدير الاستثمار العقاري

## 🌐 النشر على Netlify (مُعد بالكامل)

### 1. إعداد المستودع
```bash
# إنشاء مستودع جديد على GitHub
git init
git add .
git commit -m "Initial commit - Estate Management System"
git branch -M main
git remote add origin https://github.com/username/estate-management.git
git push -u origin main
```

### 2. ربط Netlify
1. اذهب إلى [Netlify](https://netlify.com)
2. اضغط "New site from Git"
3. اختر GitHub وحدد المستودع
4. الإعدادات ستكون تلقائية من `netlify.toml`

### 3. متغيرات البيئة
في Netlify Dashboard → Site settings → Environment variables:
```
DATABASE_URL=postgresql://neondb_owner:npg_ZBrYxkMEL91f@ep-mute-violet-ad0dmo9y-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=estate-management-super-secret-key-2024-production
NODE_ENV=production
```

### 4. النشر
- Netlify سيبني المشروع تلقائياً
- سيتم النشر على رابط مثل: `https://your-site.netlify.app`

---

## 🌐 النشر على Vercel

### 1. تثبيت Vercel CLI
```bash
npm i -g vercel
```

### 2. النشر
```bash
vercel
```

### 3. متغيرات البيئة
```bash
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add NODE_ENV
```

---

## 🌐 النشر على Render

### 1. إنشاء خدمة جديدة
1. اذهب إلى [Render](https://render.com)
2. اضغط "New +" → "Web Service"
3. اربط مستودع GitHub

### 2. إعدادات البناء
```
Build Command: npm run build
Start Command: npm start
```

### 3. متغيرات البيئة
```
DATABASE_URL=your-postgresql-url
JWT_SECRET=your-jwt-secret
NODE_ENV=production
```

---

## 🌐 النشر على Railway

### 1. ربط المستودع
1. اذهب إلى [Railway](https://railway.app)
2. اضغط "New Project" → "Deploy from GitHub repo"

### 2. إعدادات تلقائية
- Railway سيكتشف Next.js تلقائياً
- سيقوم ببناء وتشغيل المشروع

### 3. متغيرات البيئة
```
DATABASE_URL=your-postgresql-url
JWT_SECRET=your-jwt-secret
NODE_ENV=production
```

---

## 🌐 النشر على DigitalOcean

### 1. إنشاء Droplet
1. اذهب إلى [DigitalOcean](https://digitalocean.com)
2. أنشئ Droplet جديد (Ubuntu 22.04)
3. اختر حجم مناسب (2GB RAM على الأقل)

### 2. إعداد الخادم
```bash
# تحديث النظام
sudo apt update && sudo apt upgrade -y

# تثبيت Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# تثبيت PM2
sudo npm install -g pm2

# تثبيت Nginx
sudo apt install nginx -y
```

### 3. نشر المشروع
```bash
# استنساخ المستودع
git clone https://github.com/username/estate-management.git
cd estate-management

# تثبيت التبعيات
npm install

# بناء المشروع
npm run build

# تشغيل مع PM2
pm2 start npm --name "estate-management" -- start
pm2 startup
pm2 save
```

### 4. إعداد Nginx
```bash
sudo nano /etc/nginx/sites-available/estate-management
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/estate-management /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔧 إعداد قاعدة البيانات الإنتاجية

### PostgreSQL على Neon
1. اذهب إلى [Neon](https://neon.tech)
2. أنشئ مشروع جديد
3. انسخ رابط الاتصال
4. أضف الرابط في متغيرات البيئة

### PostgreSQL على Supabase
1. اذهب إلى [Supabase](https://supabase.com)
2. أنشئ مشروع جديد
3. اذهب إلى Settings → Database
4. انسخ رابط الاتصال

### PostgreSQL على Railway
1. في Railway Dashboard
2. اضغط "New" → "Database" → "PostgreSQL"
3. انسخ رابط الاتصال

---

## 🔐 إعدادات الأمان

### 1. تحديث JWT Secret
```bash
# إنشاء مفتاح قوي
openssl rand -base64 32
```

### 2. تحديث كلمات المرور الافتراضية
```bash
# تشغيل سكريبت تحديث كلمات المرور
node scripts/update-passwords.js
```

### 3. إعداد HTTPS
- Netlify: تلقائي
- Vercel: تلقائي
- Render: تلقائي
- Railway: تلقائي
- DigitalOcean: استخدم Let's Encrypt

---

## 📊 مراقبة الإنتاج

### 1. Health Check
```
GET /api/monitoring/health
```

### 2. Metrics
```
GET /api/monitoring/metrics
```

### 3. Logs
- Netlify: Functions logs
- Vercel: Function logs
- Render: Service logs
- Railway: Deploy logs
- DigitalOcean: PM2 logs

---

## 🚨 استكشاف الأخطاء

### مشاكل شائعة:

#### 1. خطأ في قاعدة البيانات
```bash
# تحقق من متغير DATABASE_URL
echo $DATABASE_URL

# اختبار الاتصال
npx prisma db push
```

#### 2. خطأ في البناء
```bash
# تنظيف cache
rm -rf .next
npm run build
```

#### 3. خطأ في المصادقة
```bash
# تحقق من JWT_SECRET
echo $JWT_SECRET
```

#### 4. خطأ في الذاكرة
```bash
# زيادة حد الذاكرة
export NODE_OPTIONS="--max-old-space-size=4096"
```

---

## 📈 تحسين الأداء

### 1. تحسين الصور
```javascript
// في next.config.js
module.exports = {
  images: {
    domains: ['your-domain.com'],
    formats: ['image/webp', 'image/avif'],
  },
}
```

### 2. تحسين CSS
```bash
# تحسين Tailwind
npm run build
```

### 3. تحسين قاعدة البيانات
```sql
-- إضافة فهارس إضافية
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_units_code ON units(code);
CREATE INDEX idx_contracts_start ON contracts(start);
```

---

## 🔄 النسخ الاحتياطية

### 1. نسخ احتياطية تلقائية
- النظام يقوم بإنشاء نسخ احتياطية تلقائياً
- كل 6 ساعات محلياً
- يومياً خارجياً

### 2. نسخ احتياطية يدوية
```bash
# إنشاء نسخة احتياطية
node scripts/create-backup.js

# استرجاع نسخة احتياطية
node scripts/restore-backup.js backup-file.json
```

---

## 📞 الدعم الفني

### في حالة المشاكل:
1. راجع logs الخادم
2. تحقق من متغيرات البيئة
3. اختبر الاتصال بقاعدة البيانات
4. راجع ملف `FINAL-REPORT.md`

### معلومات مفيدة:
- **المنفذ الافتراضي:** 3000
- **قاعدة البيانات:** PostgreSQL
- **إطار العمل:** Next.js 14
- **اللغة:** TypeScript

---

**🎉 تهانينا! نظامك جاهز للإنتاج!**