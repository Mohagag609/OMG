// سكريبت إنشاء جدول التحكم
const { Client } = require('pg')

async function setupControlDb() {
  const client = new Client({
    connectionString: process.env.CONTROL_DB_URL || 'postgresql://neondb_owner:npg_ZBrYxkMEL91f@ep-mute-violet-ad0dmo9y-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require'
  })

  try {
    console.log('🔗 الاتصال بقاعدة التحكم...')
    await client.connect()
    console.log('✅ تم الاتصال بنجاح')

    // إنشاء جدول التحكم
    console.log('📋 إنشاء جدول app_config...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_config (
        key text PRIMARY KEY,
        value text NOT NULL,
        updated_at timestamptz DEFAULT now()
      )
    `)

    // إدراج URL افتراضي
    console.log('💾 إدراج URL افتراضي...')
    await client.query(`
      INSERT INTO app_config (key, value)
      VALUES ('current_db_url', $1)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
    `, [process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_ZBrYxkMEL91f@ep-mute-violet-ad0dmo9y-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require'])

    // إدراج إعدادات إضافية
    await client.query(`
      INSERT INTO app_config (key, value)
      VALUES ('db_type', 'postgresql')
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
    `)

    await client.query(`
      INSERT INTO app_config (key, value)
      VALUES ('last_updated_by', 'system')
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
    `)

    // إنشاء فهارس
    console.log('🔍 إنشاء الفهارس...')
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_app_config_key ON app_config(key)
    `)
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_app_config_updated_at ON app_config(updated_at)
    `)

    // عرض البيانات المدرجة
    console.log('📊 عرض البيانات المدرجة...')
    const result = await client.query('SELECT * FROM app_config')
    console.table(result.rows)

    console.log('✅ تم إنشاء جدول التحكم بنجاح!')
  } catch (error) {
    console.error('❌ خطأ في إنشاء جدول التحكم:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

setupControlDb()