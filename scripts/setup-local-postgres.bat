@echo off
REM إعداد PostgreSQL محلي للعمل في المكتب (Windows)
REM Setup Local PostgreSQL for Office Work (Windows)

echo 🚀 بدء إعداد PostgreSQL المحلي...

REM التحقق من وجود Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker غير مثبت. يرجى تثبيت Docker Desktop أولاً
    pause
    exit /b 1
)

REM التحقق من وجود Docker Compose
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose غير مثبت. يرجى تثبيت Docker Compose أولاً
    pause
    exit /b 1
)

REM إنشاء مجلد النسخ الاحتياطية
if not exist "backups" mkdir backups

REM إيقاف الحاويات الموجودة
echo 🛑 إيقاف الحاويات الموجودة...
docker-compose down

REM حذف البيانات القديمة (اختياري)
set /p delete_data="هل تريد حذف البيانات القديمة؟ (y/N): "
if /i "%delete_data%"=="y" (
    echo 🗑️ حذف البيانات القديمة...
    docker volume rm estate-management-nextjs_postgres_data 2>nul
)

REM تشغيل قاعدة البيانات المحلية
echo 🐘 تشغيل PostgreSQL المحلي...
docker-compose up -d postgres

REM انتظار تشغيل قاعدة البيانات
echo ⏳ انتظار تشغيل قاعدة البيانات...
timeout /t 10 /nobreak >nul

REM اختبار الاتصال
echo 🔍 اختبار الاتصال بقاعدة البيانات...
docker exec estate-management-db psql -U postgres -d estate_pro_db -c "SELECT 'PostgreSQL يعمل بشكل صحيح' as status;"

if %errorlevel% equ 0 (
    echo ✅ تم إعداد PostgreSQL المحلي بنجاح!
    echo 📊 معلومات الاتصال:
    echo    Host: localhost
    echo    Port: 5432
    echo    Database: estate_pro_db
    echo    Username: postgres
    echo    Password: password
    echo.
    echo 🔗 رابط الاتصال:
    echo postgresql://postgres:password@localhost:5432/estate_pro_db?schema=public
    echo.
    echo 📝 لتشغيل التطبيق:
    echo npm run dev
) else (
    echo ❌ فشل في إعداد PostgreSQL المحلي
    pause
    exit /b 1
)

pause