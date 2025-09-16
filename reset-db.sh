#!/bin/bash

echo "🔄 إعادة تهيئة قاعدة البيانات..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ خطأ: يجب تشغيل السكريبت من مجلد المشروع"
    exit 1
fi

# Set environment variables
export DATABASE_URL="postgresql://neondb_owner:npg_x5qvmpzF3hjX@ep-dawn-cell-adylfb98-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

echo "📦 تثبيت التبعيات..."
npm install

echo "🗑️ حذف جميع البيانات..."
npx prisma db push --force-reset

echo "🌱 تشغيل سكريبت البذور..."
npm run db:seed

echo "✅ تمت إعادة تهيئة قاعدة البيانات بنجاح!"
echo ""
echo "👤 بيانات تسجيل الدخول:"
echo "   - اسم المستخدم: admin"
echo "   - كلمة المرور: admin123"
echo ""
echo "🚀 يمكنك الآن تشغيل التطبيق بـ: npm run dev"