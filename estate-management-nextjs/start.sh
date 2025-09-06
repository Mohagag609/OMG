#!/bin/bash

# Estate Management Next.js - Startup Script
echo "🏛️ بدء تشغيل مدير الاستثمار العقاري..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js غير مثبت. يرجى تثبيت Node.js 18+ أولاً."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm غير مثبت. يرجى تثبيت npm أولاً."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 تثبيت التبعيات..."
    npm install
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚙️ إنشاء ملف البيئة..."
    cp .env.local.example .env.local
    echo "✅ تم إنشاء ملف .env.local. يرجى تحديث القيم حسب الحاجة."
fi

# Generate Prisma client
echo "🗄️ إعداد قاعدة البيانات..."
npx prisma generate

# Push database schema
echo "📊 إنشاء جداول قاعدة البيانات..."
npx prisma db push

# Create backups directory
mkdir -p backups

# Start the development server
echo "🚀 بدء تشغيل الخادم..."
echo "📱 يمكنك الوصول للتطبيق على: http://localhost:3000"
echo "🔑 بيانات الدخول الافتراضية:"
echo "   اسم المستخدم: admin"
echo "   كلمة المرور: admin123"
echo ""
echo "⏹️ لإيقاف الخادم، اضغط Ctrl+C"

npm run dev