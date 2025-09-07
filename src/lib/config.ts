// طبقة الضبط المشتركة لإدارة قاعدة البيانات الحالية
import { Client } from 'pg'

// Cache لمدة 10 ثواني لتقليل ضغط القراءة
let cache: { url: string; timestamp: number } | null = null
const CACHE_DURATION = 10 * 1000 // 10 ثواني

// واجهة قاعدة البيانات
export interface DatabaseInterface {
  query(sql: string, params?: any[]): Promise<any[]>
  close(): Promise<void> | void
}

// الحصول على URL قاعدة البيانات الحالية
export async function getCurrentDbUrl(): Promise<string> {
  // التحقق من الكاش أولاً
  if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
    console.log('📋 استخدام URL من الكاش:', cache.url.substring(0, 50) + '...')
    return cache.url
  }

  try {
    console.log('🔍 جاري قراءة URL قاعدة البيانات من قاعدة التحكم...')
    
    // الاتصال بقاعدة التحكم
    const controlClient = new Client({
      connectionString: process.env.CONTROL_DB_URL,
      ssl: process.env.CONTROL_DB_URL?.includes('sslmode=require') ? { rejectUnauthorized: false } : false
    })

    await controlClient.connect()
    console.log('✅ تم الاتصال بقاعدة التحكم')

    // قراءة URL الحالي
    const result = await controlClient.query(
      'SELECT value FROM app_config WHERE key = $1',
      ['current_db_url']
    )

    await controlClient.end()

    if (result.rows.length === 0) {
      throw new Error('لم يتم العثور على current_db_url في قاعدة التحكم')
    }

    const url = result.rows[0].value
    console.log('📋 تم قراءة URL:', url.substring(0, 50) + '...')

    // تحديث الكاش
    cache = {
      url,
      timestamp: Date.now()
    }

    return url
  } catch (error: any) {
    console.error('❌ خطأ في قراءة URL قاعدة البيانات:', error?.message || error)
    
    // استخدام URL افتراضي في حالة الخطأ
    const fallbackUrl = process.env.DATABASE_URL || 'postgresql://localhost:5432/estate_management'
    console.log('🔄 استخدام URL افتراضي:', fallbackUrl.substring(0, 50) + '...')
    
    cache = {
      url: fallbackUrl,
      timestamp: Date.now()
    }
    
    return fallbackUrl
  }
}

// تعيين URL قاعدة البيانات الجديد
export async function setCurrentDbUrl(newUrl: string): Promise<boolean> {
  try {
    console.log('💾 جاري حفظ URL قاعدة البيانات الجديد...')
    console.log('🔗 URL الجديد:', newUrl.substring(0, 50) + '...')

    // التحقق من صحة URL
    if (!isValidDbUrl(newUrl)) {
      throw new Error('URL قاعدة البيانات غير صحيح')
    }

    // الاتصال بقاعدة التحكم
    const controlClient = new Client({
      connectionString: process.env.CONTROL_DB_URL,
      ssl: process.env.CONTROL_DB_URL?.includes('sslmode=require') ? { rejectUnauthorized: false } : false
    })

    await controlClient.connect()
    console.log('✅ تم الاتصال بقاعدة التحكم')

    // تحديث URL
    await controlClient.query(
      'INSERT INTO app_config (key, value, updated_at) VALUES ($1, $2, now()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()',
      ['current_db_url', newUrl]
    )

    // تحديث نوع قاعدة البيانات
    const dbType = getDbTypeFromUrl(newUrl)
    await controlClient.query(
      'INSERT INTO app_config (key, value, updated_at) VALUES ($1, $2, now()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()',
      ['db_type', dbType]
    )

    await controlClient.end()
    console.log('✅ تم حفظ URL قاعدة البيانات بنجاح')

    // مسح الكاش لضمان القراءة الجديدة
    cache = null

    return true
  } catch (error: any) {
    console.error('❌ خطأ في حفظ URL قاعدة البيانات:', error?.message || error)
    return false
  }
}

// التحقق من صحة URL قاعدة البيانات
function isValidDbUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    
    // التحقق من البروتوكولات المدعومة
    const supportedProtocols = ['postgres:', 'postgresql:', 'sqlite:']
    if (!supportedProtocols.includes(urlObj.protocol)) {
      console.log('❌ بروتوكول غير مدعوم:', urlObj.protocol)
      return false
    }

    // التحقق من SQLite
    if (urlObj.protocol === 'sqlite:') {
      // SQLite يجب أن يكون مسار ملف محلي
      return urlObj.pathname.length > 0
    }

    // التحقق من PostgreSQL
    if (urlObj.protocol === 'postgres:' || urlObj.protocol === 'postgresql:') {
      // يجب أن يحتوي على hostname
      return urlObj.hostname.length > 0
    }

    return true
  } catch (error) {
    console.log('❌ URL غير صحيح:', error)
    return false
  }
}

// تحديد نوع قاعدة البيانات من URL
function getDbTypeFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    
    if (urlObj.protocol === 'sqlite:') {
      return 'sqlite'
    }
    
    if (urlObj.protocol === 'postgres:' || urlObj.protocol === 'postgresql:') {
      return 'postgresql'
    }
    
    return 'unknown'
  } catch (error) {
    return 'unknown'
  }
}

// الحصول على نوع قاعدة البيانات الحالي
export async function getCurrentDbType(): Promise<string> {
  try {
    const controlClient = new Client({
      connectionString: process.env.CONTROL_DB_URL,
      ssl: process.env.CONTROL_DB_URL?.includes('sslmode=require') ? { rejectUnauthorized: false } : false
    })

    await controlClient.connect()
    
    const result = await controlClient.query(
      'SELECT value FROM app_config WHERE key = $1',
      ['db_type']
    )

    await controlClient.end()

    if (result.rows.length === 0) {
      return 'postgresql' // افتراضي
    }

    return result.rows[0].value
  } catch (error: any) {
    console.error('❌ خطأ في قراءة نوع قاعدة البيانات:', error?.message || error)
    return 'postgresql' // افتراضي
  }
}

// مسح الكاش (للاستخدام في الاختبارات)
export function clearCache(): void {
  cache = null
  console.log('🗑️ تم مسح كاش قاعدة البيانات')
}