#!/bin/bash

# Estate Management Next.js - Docker Startup Script
echo "🏛️ بدء تشغيل مدير الاستثمار العقاري باستخدام Docker..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker غير مثبت. يرجى تثبيت Docker أولاً."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose غير مثبت. يرجى تثبيت Docker Compose أولاً."
    exit 1
fi

# Create necessary directories
mkdir -p data backups ssl

# Build and start the application
echo "🔨 بناء وتشغيل التطبيق..."
docker-compose up --build -d

# Wait for the application to start
echo "⏳ انتظار بدء التطبيق..."
sleep 10

# Check if the application is running
if curl -f http://localhost:3000/api/monitoring/health > /dev/null 2>&1; then
    echo "✅ التطبيق يعمل بنجاح!"
    echo "📱 يمكنك الوصول للتطبيق على: http://localhost:3000"
    echo "🔑 بيانات الدخول الافتراضية:"
    echo "   اسم المستخدم: admin"
    echo "   كلمة المرور: admin123"
    echo ""
    echo "📊 لمراقبة السجلات: docker-compose logs -f"
    echo "⏹️ لإيقاف التطبيق: docker-compose down"
else
    echo "❌ فشل في بدء التطبيق. تحقق من السجلات:"
    echo "docker-compose logs"
fi