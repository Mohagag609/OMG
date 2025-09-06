#!/bin/bash

# Estate Management Next.js - Production Startup Script
echo "🏛️ بدء تشغيل مدير الاستثمار العقاري (الإنتاج)..."

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

# Install dependencies
echo "📦 تثبيت التبعيات..."
npm ci --only=production

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ ملف .env.local غير موجود. يرجى إنشاؤه أولاً."
    exit 1
fi

# Generate Prisma client
echo "🗄️ إعداد قاعدة البيانات..."
npx prisma generate

# Push database schema
echo "📊 إنشاء جداول قاعدة البيانات..."
npx prisma db push

# Create backups directory
mkdir -p backups

# Build the application
echo "🔨 بناء التطبيق..."
npm run build

# Start the production server
echo "🚀 بدء تشغيل الخادم (الإنتاج)..."
echo "📱 يمكنك الوصول للتطبيق على: http://localhost:3000"
echo "⏹️ لإيقاف الخادم، اضغط Ctrl+C"

npm start