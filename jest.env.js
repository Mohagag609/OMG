// متغيرات البيئة للاختبارات

// إعدادات قاعدة البيانات للاختبار
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/estate_management_test'

// إعدادات JWT للاختبار
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only'

// إعدادات البيئة
process.env.NODE_ENV = 'test'
process.env.PORT = '3001'

// إعدادات الأمان
process.env.BCRYPT_ROUNDS = '4' // أقل للاختبارات السريعة
process.env.JWT_EXPIRES_IN = '1h'
process.env.JWT_REFRESH_EXPIRES_IN = '1d'

// إعدادات النسخ الاحتياطية
process.env.BACKUP_LOCAL_INTERVAL = '1h'
process.env.BACKUP_EXTERNAL_INTERVAL = '1h'
process.env.BACKUP_RETENTION_DAYS = '1'
process.env.BACKUP_RETENTION_WEEKS = '1'
process.env.BACKUP_RETENTION_MONTHS = '1'

// إعدادات المراقبة
process.env.HEALTH_CHECK_INTERVAL = '1m'
process.env.METRICS_RETENTION_DAYS = '1'
process.env.ALERT_THRESHOLD_RESPONSE_TIME = '1000'
process.env.ALERT_THRESHOLD_ERROR_RATE = '0.1'

// إعدادات الإشعارات
process.env.NOTIFICATION_RETENTION_DAYS = '1'
process.env.NOTIFICATION_GROUPING_WINDOW = '1m'
process.env.NOTIFICATION_ESCALATION_TIME = '1m'

// إعدادات التدقيق
process.env.AUDIT_RETENTION_DAYS = '1'
process.env.AUDIT_BATCH_SIZE = '10'
process.env.AUDIT_FLUSH_INTERVAL = '1s'

// إعدادات الحذف الناعم
process.env.SOFT_DELETE_RETENTION_DAYS = '1'
process.env.HARD_DELETE_REQUIRES_APPROVAL = 'false'

// إعدادات الاستيراد والتصدير
process.env.IMPORT_MAX_FILE_SIZE = '1MB'
process.env.EXPORT_MAX_RECORDS = '100'
process.env.EXPORT_BATCH_SIZE = '10'

// إعدادات واجهة المستخدم
process.env.DEFAULT_PAGE_SIZE = '5'
process.env.MAX_PAGE_SIZE = '10'
process.env.DEFAULT_THEME = 'light'
process.env.DEFAULT_LANGUAGE = 'ar'

// إعدادات الأداء
process.env.CACHE_TTL = '60'
process.env.RATE_LIMIT_WINDOW = '1m'
process.env.RATE_LIMIT_MAX_REQUESTS = '10'

// المنطقة الزمنية
process.env.TZ = 'Africa/Cairo'

// إعدادات إضافية للاختبارات
process.env.LOG_LEVEL = 'error' // تقليل السجلات في الاختبارات
process.env.ENABLE_METRICS = 'false'
process.env.ENABLE_HEALTH_CHECKS = 'false'
process.env.ENABLE_AUDIT_LOGS = 'false'
process.env.ENABLE_BACKUPS = 'false'
process.env.ENABLE_NOTIFICATIONS = 'false'

// إعدادات الأمان الإضافية
process.env.CORS_ORIGIN = 'http://localhost:3001'
process.env.SECURE_COOKIES = 'false'
process.env.TRUST_PROXY = 'false'

// إعدادات قاعدة البيانات الإضافية
process.env.DB_POOL_SIZE = '2'
process.env.DB_TIMEOUT = '5000'
process.env.DB_IDLE_TIMEOUT = '5000'

// إعدادات Redis (اختياري)
process.env.REDIS_URL = 'redis://localhost:6379'
process.env.REDIS_PASSWORD = ''

// إعدادات البريد الإلكتروني (اختياري)
process.env.SMTP_HOST = 'localhost'
process.env.SMTP_PORT = '1025'
process.env.SMTP_USER = 'test@example.com'
process.env.SMTP_PASS = 'test'
process.env.SMTP_FROM = 'noreply@test.com'

// إعدادات الملفات
process.env.UPLOAD_MAX_SIZE = '1MB'
process.env.UPLOAD_ALLOWED_TYPES = 'image/jpeg,image/png'

// إعدادات التشفير
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars'

// إعدادات المراقبة الخارجية
process.env.SENTRY_DSN = ''
process.env.NEW_RELIC_LICENSE_KEY = ''
process.env.DATADOG_API_KEY = ''

// إعدادات الشبكة
process.env.REQUEST_TIMEOUT = '5000'
process.env.KEEP_ALIVE_TIMEOUT = '1000'
process.env.HEADERS_TIMEOUT = '2000'

// إعدادات الذاكرة
process.env.MAX_MEMORY_USAGE = '128MB'
process.env.GC_THRESHOLD = '50MB'

// إعدادات التخزين المؤقت
process.env.CACHE_TYPE = 'memory'
process.env.CACHE_TTL_SECONDS = '60'
process.env.CACHE_MAX_SIZE = '100'

// إعدادات الجلسات
process.env.SESSION_SECRET = 'test-session-secret-key'
process.env.SESSION_MAX_AGE = '3600000'

// إعدادات الأمان المتقدمة
process.env.HELMET_ENABLED = 'false'
process.env.CSP_ENABLED = 'false'
process.env.HSTS_ENABLED = 'false'
process.env.XSS_PROTECTION = 'false'
process.env.NO_SNIFF = 'false'
process.env.FRAME_OPTIONS = 'SAMEORIGIN'