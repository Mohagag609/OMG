// Database configuration management
import fs from 'fs'
import path from 'path'

const CONFIG_FILE = path.join(process.cwd(), 'database-config.json')

export interface DatabaseConfig {
  type: 'sqlite' | 'postgresql'
  connectionString: string
  isConnected: boolean
  lastTested: string
}

// Default configuration
const DEFAULT_CONFIG: DatabaseConfig = {
  type: 'postgresql',
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_ZBrYxkMEL91f@ep-mute-violet-ad0dmo9y-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  isConnected: false,
  lastTested: new Date().toISOString()
}

// Load database configuration
export function loadDatabaseConfig(): DatabaseConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const configData = fs.readFileSync(CONFIG_FILE, 'utf8')
      const config = JSON.parse(configData)
      console.log('📋 تم تحميل إعدادات قاعدة البيانات من الملف')
      return config
    }
  } catch (error) {
    console.error('❌ خطأ في تحميل إعدادات قاعدة البيانات:', error)
  }
  
  console.log('📋 استخدام الإعدادات الافتراضية')
  return DEFAULT_CONFIG
}

// Save database configuration
export function saveDatabaseConfig(config: DatabaseConfig): boolean {
  try {
    // Ensure directory exists
    const configDir = path.dirname(CONFIG_FILE)
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true })
    }
    
    // Write config file
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
    console.log('💾 تم حفظ إعدادات قاعدة البيانات في الملف')
    
    // Update environment variable
    process.env.DATABASE_URL = config.connectionString
    console.log('🔧 تم تحديث متغير البيئة DATABASE_URL')
    
    return true
  } catch (error) {
    console.error('❌ خطأ في حفظ إعدادات قاعدة البيانات:', error)
    return false
  }
}

// Update connection status
export function updateConnectionStatus(isConnected: boolean, details?: any): void {
  try {
    const config = loadDatabaseConfig()
    config.isConnected = isConnected
    config.lastTested = new Date().toISOString()
    
    if (details) {
      config.details = details
    }
    
    saveDatabaseConfig(config)
  } catch (error) {
    console.error('❌ خطأ في تحديث حالة الاتصال:', error)
  }
}

// Get current database URL
export function getCurrentDatabaseUrl(): string {
  const config = loadDatabaseConfig()
  return config.connectionString
}

// Check if database type changed
export function hasDatabaseTypeChanged(newType: string): boolean {
  const config = loadDatabaseConfig()
  return config.type !== newType
}