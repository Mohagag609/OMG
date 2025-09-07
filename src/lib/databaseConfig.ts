// Database configuration management - Enhanced reliability and persistence
import fs from 'fs'
import path from 'path'

const CONFIG_FILE = path.join(process.cwd(), 'database-config.json')

export interface DatabaseConfig {
  type: 'sqlite' | 'postgresql'
  connectionString: string
  isConnected: boolean
  lastTested?: string
  details?: any
  savedAt?: string
  version?: string
  persistent?: boolean // New field to ensure persistence
}

// Default configuration - SQLite for development
const DEFAULT_CONFIG: DatabaseConfig = {
  type: 'sqlite',
  connectionString: 'file:./prisma/dev.db',
  isConnected: false,
  lastTested: new Date().toISOString(),
  savedAt: new Date().toISOString(),
  version: '2.0',
  persistent: true
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

// Load database configuration with enhanced error handling and persistence
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
        
        // Validate config structure and ensure persistence
        if (config.type && config.connectionString) {
          // Ensure the config has persistence flag
          const persistentConfig = {
            ...config,
            persistent: true,
            version: config.version || '2.0'
          }
          
          console.log('✅ تم تحميل إعدادات قاعدة البيانات من الملف:', config.type)
          console.log('🔗 رابط الاتصال:', config.connectionString.substring(0, 50) + '...')
          console.log('📅 وقت الحفظ:', config.savedAt || 'غير محدد')
          console.log('💾 الإعدادات محفوظة:', config.persistent ? 'نعم' : 'لا')
          
          // Update environment variable immediately
          process.env.DATABASE_URL = config.connectionString
          console.log('🔧 تم تحديث متغير البيئة DATABASE_URL')
          
          // If config doesn't have persistence flag, save it with the flag
          if (!config.persistent) {
            console.log('💾 إضافة علامة الاستمرارية للإعدادات...')
            saveDatabaseConfig(persistentConfig)
          }
          
          return persistentConfig
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

// Save database configuration with enhanced reliability and persistence
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
    
    // Add metadata to config with persistence flag
    const configWithMetadata = {
      ...config,
      savedAt: new Date().toISOString(),
      version: '2.0',
      lastModified: new Date().toISOString(),
      persistent: true // Ensure persistence
    }
    
    // Write config file with proper formatting
    const configData = JSON.stringify(configWithMetadata, null, 2)
    fs.writeFileSync(CONFIG_FILE, configData, 'utf8')
    
    // Verify the file was written correctly
    if (fs.existsSync(CONFIG_FILE)) {
      const savedData = fs.readFileSync(CONFIG_FILE, 'utf8')
      const savedConfig = JSON.parse(savedData)
      
      if (savedConfig.type === config.type && savedConfig.connectionString === config.connectionString) {
        console.log('✅ تم حفظ إعدادات قاعدة البيانات بنجاح:', savedConfig.type)
        console.log('📅 وقت الحفظ:', savedConfig.savedAt)
        console.log('💾 الإعدادات محفوظة:', savedConfig.persistent ? 'نعم' : 'لا')
        
        // Update environment variable immediately
        process.env.DATABASE_URL = config.connectionString
        console.log('🔧 تم تحديث متغير البيئة DATABASE_URL')
        
        return true
      } else {
        console.log('❌ فشل في التحقق من صحة البيانات المحفوظة')
        console.log('📄 البيانات المتوقعة:', { 
          type: config.type, 
          connectionString: config.connectionString?.substring(0, 50) + '...',
          connectionStringLength: config.connectionString?.length
        })
        console.log('📄 البيانات المحفوظة:', { 
          type: savedConfig.type, 
          connectionString: savedConfig.connectionString?.substring(0, 50) + '...',
          connectionStringLength: savedConfig.connectionString?.length
        })
        
        // Try to fix the issue by rewriting the file
        try {
          console.log('🔧 محاولة إعادة كتابة الملف...')
          fs.writeFileSync(CONFIG_FILE, configData, 'utf8')
          
          // Verify again
          const retryData = fs.readFileSync(CONFIG_FILE, 'utf8')
          const retryConfig = JSON.parse(retryData)
          
          if (retryConfig.type === config.type && retryConfig.connectionString === config.connectionString) {
            console.log('✅ تم إصلاح المشكلة وإعادة الحفظ بنجاح')
            process.env.DATABASE_URL = config.connectionString
            return true
          }
        } catch (retryError) {
          console.error('❌ فشل في إعادة المحاولة:', retryError)
        }
        
        return false
      }
    } else {
      console.log('❌ فشل في إنشاء الملف')
      return false
    }
  } catch (error: any) {
    console.error('❌ خطأ في حفظ إعدادات قاعدة البيانات:', error?.message)
    console.error('📁 مسار الملف:', CONFIG_FILE)
    console.error('📄 تفاصيل الخطأ:', error)
    return false
  }
}

// Update connection status - without saving to avoid conflicts
export function updateConnectionStatus(isConnected: boolean, details?: any): boolean {
  try {
    console.log(`🔧 تحديث حالة الاتصال: ${isConnected ? 'متصل' : 'غير متصل'}`)
    
    // Just update the environment variable, don't save to file
    // This prevents conflicts with manual saves
    if (details && details.connectionString) {
      process.env.DATABASE_URL = details.connectionString
      console.log('🔧 تم تحديث متغير البيئة DATABASE_URL')
    }
    
    return true
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

// Ensure database type persistence - prevents reverting to SQLite on refresh
export function ensureDatabaseTypePersistence(type: 'sqlite' | 'postgresql'): boolean {
  try {
    console.log(`🔒 ضمان استمرارية نوع قاعدة البيانات: ${type}`)
    
    const currentConfig = loadDatabaseConfig()
    
    // If the current type is different from the desired type, update it
    if (currentConfig.type !== type) {
      console.log(`🔄 تغيير نوع قاعدة البيانات من ${currentConfig.type} إلى ${type}`)
      
      const updatedConfig = {
        ...currentConfig,
        type,
        persistent: true,
        savedAt: new Date().toISOString(),
        version: '2.0'
      }
      
      return saveDatabaseConfig(updatedConfig)
    }
    
    // Ensure persistence flag is set
    if (!currentConfig.persistent) {
      console.log('💾 إضافة علامة الاستمرارية للإعدادات الحالية')
      const persistentConfig = {
        ...currentConfig,
        persistent: true,
        savedAt: new Date().toISOString(),
        version: '2.0'
      }
      
      return saveDatabaseConfig(persistentConfig)
    }
    
    console.log('✅ نوع قاعدة البيانات محفوظ بالفعل')
    return true
  } catch (error: any) {
    console.error('❌ خطأ في ضمان استمرارية نوع قاعدة البيانات:', error?.message)
    return false
  }
}

// Get persistent database type - always returns the saved type
export function getPersistentDatabaseType(): 'sqlite' | 'postgresql' {
  try {
    const config = loadDatabaseConfig()
    console.log(`📋 نوع قاعدة البيانات المحفوظ: ${config.type}`)
    return config.type
  } catch (error: any) {
    console.error('❌ خطأ في الحصول على نوع قاعدة البيانات المحفوظ:', error?.message)
    return 'sqlite' // Default fallback
  }
}

// Alternative save function with better error handling
export function saveDatabaseConfigAlternative(config: DatabaseConfig): boolean {
  try {
    console.log('💾 بدء حفظ إعدادات قاعدة البيانات (الطريقة البديلة)...')
    
    // Create a simple config object
    const simpleConfig = {
      type: config.type,
      connectionString: config.connectionString,
      isConnected: config.isConnected || false,
      savedAt: new Date().toISOString(),
      version: '2.0',
      persistent: true
    }
    
    // Write directly without complex verification
    const configData = JSON.stringify(simpleConfig, null, 2)
    fs.writeFileSync(CONFIG_FILE, configData, 'utf8')
    
    // Update environment variable
    process.env.DATABASE_URL = config.connectionString
    console.log('✅ تم حفظ الإعدادات بالطريقة البديلة')
    
    return true
  } catch (error: any) {
    console.error('❌ خطأ في الطريقة البديلة:', error?.message)
    return false
  }
}