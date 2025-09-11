#!/bin/bash

# إعداد PostgreSQL محلي للعمل في المكتب
# Setup Local PostgreSQL for Office Work

echo "🚀 بدء إعداد PostgreSQL المحلي..."

# التحقق من وجود Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker غير مثبت. يرجى تثبيت Docker أولاً"
    exit 1
fi

# التحقق من وجود Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose غير مثبت. يرجى تثبيت Docker Compose أولاً"
    exit 1
fi

# إنشاء مجلد النسخ الاحتياطية
mkdir -p backups

# إيقاف الحاويات الموجودة
echo "🛑 إيقاف الحاويات الموجودة..."
docker-compose down

# حذف البيانات القديمة (اختياري)
read -p "هل تريد حذف البيانات القديمة؟ (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️ حذف البيانات القديمة..."
    docker volume rm estate-management-nextjs_postgres_data 2>/dev/null || true
fi

# تشغيل قاعدة البيانات المحلية
echo "🐘 تشغيل PostgreSQL المحلي..."
docker-compose up -d postgres

# انتظار تشغيل قاعدة البيانات
echo "⏳ انتظار تشغيل قاعدة البيانات..."
sleep 10

# اختبار الاتصال
echo "🔍 اختبار الاتصال بقاعدة البيانات..."
docker exec estate-management-db psql -U postgres -d estate_pro_db -c "SELECT 'PostgreSQL يعمل بشكل صحيح' as status;"

if [ $? -eq 0 ]; then
    echo "✅ تم إعداد PostgreSQL المحلي بنجاح!"
    echo "📊 معلومات الاتصال:"
    echo "   Host: localhost"
    echo "   Port: 5432"
    echo "   Database: estate_pro_db"
    echo "   Username: postgres"
    echo "   Password: password"
    echo ""
    echo "🔗 رابط الاتصال:"
    echo "postgresql://postgres:password@localhost:5432/estate_pro_db?schema=public"
    echo ""
    echo "📝 لتشغيل التطبيق:"
    echo "npm run dev"
else
    echo "❌ فشل في إعداد PostgreSQL المحلي"
    exit 1
fi