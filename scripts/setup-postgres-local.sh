#!/bin/bash

# إعداد PostgreSQL محلي بدون Docker
# Setup Local PostgreSQL without Docker

echo "🚀 بدء إعداد PostgreSQL المحلي..."

# التحقق من وجود PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL غير مثبت. يرجى تثبيت PostgreSQL أولاً"
    echo "📝 لتثبيت PostgreSQL على Ubuntu/Debian:"
    echo "   sudo apt-get update"
    echo "   sudo apt-get install postgresql postgresql-contrib"
    echo ""
    echo "📝 لتثبيت PostgreSQL على Windows:"
    echo "   تحميل من: https://www.postgresql.org/download/windows/"
    echo ""
    echo "📝 لتثبيت PostgreSQL على Mac:"
    echo "   brew install postgresql"
    exit 1
fi

# التحقق من تشغيل خدمة PostgreSQL
if ! systemctl is-active --quiet postgresql; then
    echo "🔄 تشغيل خدمة PostgreSQL..."
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi

# إنشاء قاعدة البيانات
echo "🗄️ إنشاء قاعدة البيانات..."
sudo -u postgres psql -c "CREATE DATABASE estate_pro_db;" 2>/dev/null || echo "قاعدة البيانات موجودة بالفعل"

# إنشاء المستخدم
echo "👤 إنشاء المستخدم..."
sudo -u postgres psql -c "CREATE USER postgres WITH PASSWORD 'password';" 2>/dev/null || echo "المستخدم موجود بالفعل"

# منح الصلاحيات
echo "🔐 منح الصلاحيات..."
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE estate_pro_db TO postgres;"
sudo -u postgres psql -c "ALTER USER postgres CREATEDB;"

# اختبار الاتصال
echo "🔍 اختبار الاتصال..."
psql postgresql://postgres:password@localhost:5432/estate_pro_db -c "SELECT 'PostgreSQL المحلي يعمل بشكل صحيح' as status;"

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
    echo "npm run dev:local"
else
    echo "❌ فشل في إعداد PostgreSQL المحلي"
    exit 1
fi