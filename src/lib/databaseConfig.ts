// Database configuration management - Complete rewrite
import fs from 'fs'
import path from 'path'

const CONFIG_FILE = path.join(process.cwd(), 'database-config.json')

export interface DatabaseConfig {
  type: 'sqlite' | 'postgresql'
  connectionString: string
  isConnected: boolean
  lastTested?: string
  details?: any
}

// Default configuration - Always PostgreSQL
const DEFAULT_CONFIG: DatabaseConfig = {
  type: 'postgresql',
  connectionString: 'postgresql://neondb_owner:npg_ZBrYxkMEL91f@ep-mute-violet-ad0dmo9y-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  isConnected: false,
  lastTested: new Date().toISOString()
}

// Load database configuration
export function loadDatabaseConfig(): DatabaseConfig {
  try {
    console.log('📋 بدء تحميل إعدادات قاعدة البيانات...')
    console.log('📁 مسار الملف:', CONFIG_FILE)
    
    if (fs.existsSync(CONFIG_FILE)) {
      console.log('📁 الملف موجود، جاري القراءة...')
      const configData = fs.readFileSync(CONFIG_FILE, 'utf8')
      console.log('📄 محتوى الملف:', configData.substring(0, 200) + '...')
      
      const config = JSON.parse(configData)
      console.log('✅ تم تحميل إعدادات قاعدة البيانات من الملف:', config.type)
      console.log('🔗 رابط الاتصال:', config.connectionString ? config.connectionString.substring(0, 50) + '...' : 'غير محدد')
      console.log('📅 وقت الحفظ:', config.savedAt || 'غير محدد')
      
      // Update environment variable
      if (config.connectionString) {
        process.env.DATABASE_URL = config.connectionString
        console.log('🔧 تم تحديث متغير البيئة DATABASE_URL')
      }
      
      return config
    } else {
      console.log('📁 الملف غير موجود، استخدام الإعدادات الافتراضية')
    }
  } catch (error: any) {
    console.error('❌ خطأ في تحميل إعدادات قاعدة البيانات:', error)
    console.error('📁 مسار الملف:', CONFIG_FILE)
    console.error('🔍 تفاصيل الخطأ:', error?.message || 'خطأ غير معروف')
  }
  
  console.log('📋 استخدام الإعدادات الافتراضية - PostgreSQL')
  return DEFAULT_CONFIG
}

// Save database configuration
export function saveDatabaseConfig(config: DatabaseConfig): boolean {
  try {
    console.log('💾 بدء حفظ إعدادات قاعدة البيانات...')
    console.log('📁 مسار الملف:', CONFIG_FILE)
    console.log('🔧 نوع قاعدة البيانات:', config.type)
    console.log('🔗 رابط الاتصال:', config.connectionString.substring(0, 50) + '...')
    
    // Ensure directory exists
    const configDir = path.dirname(CONFIG_FILE)
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true })
      console.log('📁 تم إنشاء المجلد:', configDir)
    }
    
    // Add timestamp to config
    const configWithTimestamp = {
      ...config,
      savedAt: new Date().toISOString(),
      version: '1.0'
    }
    
    // Write config file with proper formatting
    const configData = JSON.stringify(configWithTimestamp, null, 2)
    fs.writeFileSync(CONFIG_FILE, configData, 'utf8')
    
    // Verify the file was written
    if (fs.existsSync(CONFIG_FILE)) {
      const savedData = fs.readFileSync(CONFIG_FILE, 'utf8')
      const savedConfig = JSON.parse(savedData)
      console.log('✅ تم حفظ إعدادات قاعدة البيانات بنجاح:', savedConfig.type)
      console.log('📅 وقت الحفظ:', savedConfig.savedAt)
    } else {
      console.log('❌ فشل في إنشاء الملف')
      return false
    }
    
    // Update environment variable immediately
    process.env.DATABASE_URL = config.connectionString
    console.log('🔧 تم تحديث متغير البيئة DATABASE_URL')
    
    return true
  } catch (error: any) {
    console.error('❌ خطأ في حفظ إعدادات قاعدة البيانات:', error)
    console.error('📁 مسار الملف:', CONFIG_FILE)
    console.error('🔍 تفاصيل الخطأ:', error?.message || 'خطأ غير معروف')
    return false
  }
}

// Update connection status
export function updateConnectionStatus(isConnected: boolean, details?: any): boolean {
  try {
    const config = loadDatabaseConfig()
    config.isConnected = isConnected
    config.lastTested = new Date().toISOString()
    
    if (details) {
      config.details = details
    }
    
    return saveDatabaseConfig(config)
  } catch (error: any) {
    console.error('❌ خطأ في تحديث حالة الاتصال:', error)
    return false
  }
}

// Get current database URL
export function getCurrentDatabaseUrl(): string {
  const config = loadDatabaseConfig()
  return config.connectionString
}

// Force reset to default PostgreSQL
export function resetToDefaultConfig(): boolean {
  console.log('🔄 إعادة تعيين الإعدادات إلى PostgreSQL الافتراضي')
  return saveDatabaseConfig(DEFAULT_CONFIG)
}

// Check if database type changed
export function hasDatabaseTypeChanged(newType: string): boolean {
  const config = loadDatabaseConfig()
  return config.type !== newType
}