-- سكريبت إنشاء جدول التحكم في قاعدة البيانات
-- قم بتشغيل هذا السكريبت مرة واحدة على قاعدة التحكم (CONTROL_DB_URL)

CREATE TABLE IF NOT EXISTS app_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- إدراج URL افتراضي (استبدل بالقيمة الفعلية)
INSERT INTO app_config (key, value)
VALUES ('current_db_url', 'postgres://neondb_owner:npg_ZBrYxkMEL91f@ep-mute-violet-ad0dmo9y-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- إدراج إعدادات إضافية
INSERT INTO app_config (key, value)
VALUES ('db_type', 'postgresql')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

INSERT INTO app_config (key, value)
VALUES ('last_updated_by', 'system')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- إنشاء فهرس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_app_config_key ON app_config(key);
CREATE INDEX IF NOT EXISTS idx_app_config_updated_at ON app_config(updated_at);

-- عرض البيانات المدرجة
SELECT * FROM app_config;