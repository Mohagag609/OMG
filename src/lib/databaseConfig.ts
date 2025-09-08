// Database configuration management - Complete rewrite for reliability
import fs from 'fs'
import path from 'path'

const CONFIG_FILE = path.join(process.cwd(), 'database-config.json')

export interface DatabaseConfig {
  type: 'sqlite' | 'postgresql' | 'postgresql-local' | 'postgresql-cloud'
  connectionString: string
  isConnected: boolean
  lastTested?: string
  details?: any
  savedAt?: string
  version?: string
}

// Default configuration - Always SQLite
const DEFAULT_CONFIG: DatabaseConfig = {
  type: 'sqlite',
  connectionString: 'file:./prisma/dev.db',
  isConnected: false,
  lastTested: new Date().toISOString(),
  savedAt: new Date().toISOString(),
  version: '1.0'
}

// Force create config file with default values only if it doesn't exist
function ensureConfigFile(): void {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      console.log('📁 إنشاء ملف الإعدادات الافتراضي...')
      const configDir = path.dirname(CONFIG_FILE)
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true })
      }
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf8')
      console.log('✅ تم إنشاء ملف الإعدادات الافتراضي')
    }
  } catch (error: any) {
    console.error('❌ خطأ في إنشاء ملف الإعدادات:', error?.message)
  }
}

// Load database configuration with enhanced error handling
export function loadDatabaseConfig(): DatabaseConfig {
  try {
    console.log('📋 بدء تحميل إعدادات قاعدة البيانات...')
    console.log('📁 مسار الملف:', CONFIG_FILE)
    
    if (fs.existsSync(CONFIG_FILE)) {
      console.log('📁 الملف موجود، جاري القراءة...')
      const configData = fs.readFileSync(CONFIG_FILE, 'utf8')
      
      if (configData.trim()) {
        console.log('📄 محتوى الملف:', configData.substring(0, 200) + '...')
        
        const config = JSON.parse(configData)
        
        // Validate config structure
        if (config.type && config.connectionString) {
          console.log('✅ تم تحميل إعدادات قاعدة البيانات من الملف:', config.type)
          console.log('🔗 رابط الاتصال:', config.connectionString.substring(0, 50) + '...')
          console.log('📅 وقت الحفظ:', config.savedAt || 'غير محدد')
          
          // Update environment variable
          process.env.DATABASE_URL = config.connectionString
          console.log('🔧 تم تحديث متغير البيئة DATABASE_URL')
          
          return config
        } else {
          console.log('⚠️ ملف الإعدادات تالف، استخدام الإعدادات الافتراضية')
        }
      } else {
        console.log('⚠️ ملف الإعدادات فارغ، استخدام الإعدادات الافتراضية')
      }
    } else {
      console.log('📁 الملف غير موجود، إنشاء ملف الإعدادات الافتراضي...')
      // Only create default config file if it doesn't exist
      ensureConfigFile()
    }
  } catch (error: any) {
    console.error('❌ خطأ في تحميل إعدادات قاعدة البيانات:', error?.message)
    console.error('📁 مسار الملف:', CONFIG_FILE)
  }
  
  console.log('📋 استخدام الإعدادات الافتراضية - SQLite')
  // Update environment variable with default
  process.env.DATABASE_URL = DEFAULT_CONFIG.connectionString
  return DEFAULT_CONFIG
}

// Save database configuration with enhanced reliability
export function saveDatabaseConfig(config: DatabaseConfig): boolean {
  try {
    console.log('💾 بدء حفظ إعدادات قاعدة البيانات...')
    console.log('📁 مسار الملف:', CONFIG_FILE)
    console.log('🔧 نوع قاعدة البيانات:', config.type)
    console.log('🔗 رابط الاتصال:', config.connectionString.substring(0, 50) + '...')
    console.log('📊 البيانات الكاملة:', JSON.stringify(config, null, 2))
    
    // Ensure directory exists
    const configDir = path.dirname(CONFIG_FILE)
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true })
      console.log('📁 تم إنشاء المجلد:', configDir)
    }
    
    // Add metadata to config
    const configWithMetadata = {
      ...config,
      savedAt: new Date().toISOString(),
      version: '1.0',
      lastModified: new Date().toISOString()
    }
    
    // Write config file with proper formatting
    const configData = JSON.stringify(configWithMetadata, null, 2)
    fs.writeFileSync(CONFIG_FILE, configData, 'utf8')
    
    // Verify the file was written correctly
    if (fs.existsSync(CONFIG_FILE)) {
      console.log('✅ الملف تم إنشاؤه بنجاح')
      const savedData = fs.readFileSync(CONFIG_FILE, 'utf8')
      console.log('📄 محتوى الملف المحفوظ:', savedData.substring(0, 200) + '...')
      
      const savedConfig = JSON.parse(savedData)
      console.log('📊 البيانات المحفوظة:', JSON.stringify(savedConfig, null, 2))
      
      console.log('🔍 مقارنة البيانات:')
      console.log('  - النوع:', { original: config.type, saved: savedConfig.type, match: savedConfig.type === config.type })
      console.log('  - الرابط:', { 
        original: config.connectionString.substring(0, 50), 
        saved: savedConfig.connectionString.substring(0, 50), 
        match: savedConfig.connectionString === config.connectionString 
      })
      
      if (savedConfig.type === config.type && savedConfig.connectionString === config.connectionString) {
        console.log('✅ تم حفظ إعدادات قاعدة البيانات بنجاح:', savedConfig.type)
        console.log('📅 وقت الحفظ:', savedConfig.savedAt)
        
        // Update environment variable immediately
        process.env.DATABASE_URL = config.connectionString
        console.log('🔧 تم تحديث متغير البيئة DATABASE_URL')
        
        return true
      } else {
        console.log('❌ فشل في التحقق من صحة البيانات المحفوظة')
        console.log('❌ النوع المطابق:', savedConfig.type === config.type)
        console.log('❌ الرابط المطابق:', savedConfig.connectionString === config.connectionString)
        return false
      }
    } else {
      console.log('❌ فشل في إنشاء الملف')
      return false
    }
  } catch (error: any) {
    console.error('❌ خطأ في حفظ إعدادات قاعدة البيانات:', error?.message)
    console.error('📁 مسار الملف:', CONFIG_FILE)
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
    console.error('❌ خطأ في تحديث حالة الاتصال:', error?.message)
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

// Force reload configuration
export function forceReloadConfig(): DatabaseConfig {
  console.log('🔄 إعادة تحميل إعدادات قاعدة البيانات...')
  return loadDatabaseConfig()
}