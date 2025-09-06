# بدء سريع - مدير الاستثمار العقاري

## 🚀 التشغيل السريع

### الطريقة الأولى: التشغيل المباشر
```bash
# تشغيل سريع
./start.sh

# أو يدوياً
npm install
npx prisma generate
npx prisma db push
npm run dev
```

### الطريقة الثانية: Docker
```bash
# تشغيل بـ Docker
./docker-start.sh

# أو يدوياً
docker-compose up --build -d
```

## 🔑 بيانات الدخول
- **اسم المستخدم:** admin
- **كلمة المرور:** admin123

## 📱 الوصول للتطبيق
- **الرابط:** http://localhost:3000
- **API Health:** http://localhost:3000/api/monitoring/health

## 🛠️ الأوامر المفيدة

### إدارة قاعدة البيانات
```bash
# إعادة تعيين قاعدة البيانات
npm run db:reset

# فتح Prisma Studio
npm run db:studio

# إنشاء نسخة احتياطية
npm run backup:create
```

### إدارة Docker
```bash
# عرض السجلات
docker-compose logs -f

# إيقاف التطبيق
docker-compose down

# إعادة تشغيل
docker-compose restart
```

## 📊 المميزات الرئيسية

### ✅ تم تنفيذها
- [x] نظام إدارة العملاء
- [x] نظام إدارة الوحدات
- [x] نظام إدارة العقود
- [x] نظام إدارة الأقساط
- [x] نظام إدارة السندات
- [x] نظام إدارة الخزائن
- [x] نظام إدارة الشركاء
- [x] نظام إدارة السماسرة
- [x] نظام النسخ الاحتياطية
- [x] نظام الاستيراد والتصدير
- [x] نظام المراقبة والصحة
- [x] نظام الإشعارات
- [x] نظام التدقيق
- [x] نظام الحذف الآمن
- [x] نظام الاسترجاع

### 🔧 التقنيات المستخدمة
- **Frontend:** Next.js 14, React 18, TypeScript
- **Backend:** Next.js API Routes
- **Database:** SQLite + Prisma
- **Styling:** Tailwind CSS
- **Authentication:** JWT
- **Monitoring:** Custom Health Checks
- **Backup:** Automated Backup System

## 🚨 استكشاف الأخطاء

### مشاكل شائعة
1. **خطأ في قاعدة البيانات**
   ```bash
   npx prisma db push --force-reset
   ```

2. **خطأ في التبعيات**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **خطأ في Docker**
   ```bash
   docker-compose down
   docker system prune -f
   docker-compose up --build
   ```

### فحص الصحة
```bash
# فحص صحة النظام
curl http://localhost:3000/api/monitoring/health

# فحص مقاييس النظام
curl http://localhost:3000/api/monitoring/metrics
```

## 📞 الدعم
- **المستودع:** [GitHub Repository]
- **التوثيق:** README.md
- **المشاكل:** [Issues Page]

---
**ملاحظة:** هذا التطبيق مخصص للاستخدام المحلي والتطوير. للاستخدام في الإنتاج، يرجى مراجعة إعدادات الأمان والنسخ الاحتياطية.