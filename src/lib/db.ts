// محول اتصال موحد لدعم PostgreSQL و SQLite
import { Client } from 'pg'
import { getCurrentDbUrl, getCurrentDbType, DatabaseInterface } from './config'

// استيراد مشروط لـ better-sqlite3
let Database: any = null
if (typeof window === 'undefined') {
  try {
    Database = require('better-sqlite3')
  } catch (error) {
    console.warn('better-sqlite3 غير متوفر - سيتم استخدام PostgreSQL فقط')
  }
}

// تصدير prisma للتوافق مع الكود الموجود
export { prisma } from './prisma-compat'

// واجهة موحدة لقاعدة البيانات
class UnifiedDatabase implements DatabaseInterface {
  private client: Client | any | null = null
  private dbType: string = 'postgresql'

  constructor(client: Client | any, dbType: string) {
    this.client = client
    this.dbType = dbType
  }

  async query(sql: string, params: any[] = []): Promise<any[]> {
    if (!this.client) {
      throw new Error('قاعدة البيانات غير متصلة')
    }

    try {
      if (this.dbType === 'sqlite') {
        // SQLite
        const db = this.client as any
        const stmt = db.prepare(sql)
        
        // تحويل PostgreSQL parameters ($1, $2) إلى SQLite parameters (?, ?)
        const sqliteSql = sql.replace(/\$(\d+)/g, '?')
        const sqliteStmt = db.prepare(sqliteSql)
        
        if (sql.toLowerCase().includes('select') || sql.toLowerCase().includes('with')) {
          // استعلام قراءة
          const rows = sqliteStmt.all(...params)
          return rows
        } else {
          // استعلام كتابة
          const result = sqliteStmt.run(...params)
          return [{ changes: result.changes, lastInsertRowid: result.lastInsertRowid }]
        }
      } else {
        // PostgreSQL
        const client = this.client as Client
        const result = await client.query(sql, params)
        return result.rows
      }
    } catch (error: any) {
      console.error('❌ خطأ في تنفيذ الاستعلام:', error?.message || error)
      console.error('📝 SQL:', sql)
      console.error('📋 Parameters:', params)
      throw error
    }
  }

  async close(): Promise<void> {
    if (!this.client) return

    try {
      if (this.dbType === 'sqlite') {
        const db = this.client as any
        db.close()
        console.log('🔌 تم إغلاق اتصال SQLite')
      } else {
        const client = this.client as Client
        await client.end()
        console.log('🔌 تم إغلاق اتصال PostgreSQL')
      }
    } catch (error: any) {
      console.error('❌ خطأ في إغلاق الاتصال:', error?.message || error)
    } finally {
      this.client = null
    }
  }
}

// إنشاء اتصال قاعدة البيانات
export async function getDb(): Promise<DatabaseInterface> {
  try {
    console.log('🔗 جاري إنشاء اتصال قاعدة البيانات...')
    
    // الحصول على URL ونوع قاعدة البيانات
    const [dbUrl, dbType] = await Promise.all([
      getCurrentDbUrl(),
      getCurrentDbType()
    ])

    console.log('📋 نوع قاعدة البيانات:', dbType)
    console.log('🔗 URL:', dbUrl.substring(0, 50) + '...')

    if (dbType === 'sqlite') {
      // SQLite
      if (!Database) {
        throw new Error('better-sqlite3 غير متوفر - يرجى تثبيته للتطوير المحلي')
      }
      
      const url = new URL(dbUrl)
      const dbPath = url.pathname.startsWith('./') ? url.pathname : `./${url.pathname}`
      
      console.log('📁 مسار قاعدة البيانات SQLite:', dbPath)
      
      const db = new Database(dbPath)
      
      // تمكين المفاتيح الخارجية
      db.pragma('foreign_keys = ON')
      
      console.log('✅ تم الاتصال بـ SQLite بنجاح')
      
      // إنشاء الجداول إذا لم تكن موجودة
      await createTablesIfNotExist(db, 'sqlite')
      
      return new UnifiedDatabase(db, 'sqlite')
      
    } else {
      // PostgreSQL
      const client = new Client({
        connectionString: dbUrl,
        ssl: dbUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : false
      })

      await client.connect()
      console.log('✅ تم الاتصال بـ PostgreSQL بنجاح')
      
      // إنشاء الجداول إذا لم تكن موجودة
      await createTablesIfNotExist(client, 'postgresql')
      
      return new UnifiedDatabase(client, 'postgresql')
    }
  } catch (error: any) {
    console.error('❌ خطأ في إنشاء اتصال قاعدة البيانات:', error?.message || error)
    throw new Error(`فشل في الاتصال بقاعدة البيانات: ${error?.message || error}`)
  }
}

// اختبار الاتصال بقاعدة البيانات
export async function testConnection(): Promise<{ success: boolean; message: string; dbType: string }> {
  let db: DatabaseInterface | null = null
  
  try {
    console.log('🧪 اختبار الاتصال بقاعدة البيانات...')
    
    db = await getDb()
    const dbType = await getCurrentDbType()
    
    // اختبار بسيط
    const result = await db.query('SELECT 1 as test')
    
    if (result && result.length > 0) {
      console.log('✅ اختبار الاتصال نجح')
      return {
        success: true,
        message: 'تم الاتصال بقاعدة البيانات بنجاح',
        dbType
      }
    } else {
      throw new Error('فشل في اختبار الاتصال')
    }
  } catch (error: any) {
    console.error('❌ فشل في اختبار الاتصال:', error?.message || error)
    return {
      success: false,
      message: `فشل في الاتصال: ${error?.message || error}`,
      dbType: 'unknown'
    }
  } finally {
    if (db) {
      await db.close()
    }
  }
}

// إنشاء الجداول إذا لم تكن موجودة
async function createTablesIfNotExist(db: any, dbType: string): Promise<void> {
  try {
    console.log('🔧 فحص وإنشاء الجداول...')
    
    if (dbType === 'postgresql') {
      // PostgreSQL
      const client = db as Client
      
      // فحص وجود الجداول
      const tablesCheck = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'customers', 'brokers', 'contracts', 'units')
      `)
      
      if (tablesCheck.rows.length === 0) {
        console.log('📋 إنشاء جداول PostgreSQL...')
        await createPostgreSQLTables(client)
      } else {
        console.log('✅ الجداول موجودة بالفعل')
      }
      
    } else if (dbType === 'sqlite') {
      // SQLite
      const sqliteDb = db as any
      
      // فحص وجود الجداول
      const tablesCheck = sqliteDb.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' 
        AND name IN ('users', 'customers', 'brokers', 'contracts', 'units')
      `).all()
      
      if (tablesCheck.length === 0) {
        console.log('📋 إنشاء جداول SQLite...')
        await createSQLiteTables(sqliteDb)
      } else {
        console.log('✅ الجداول موجودة بالفعل')
      }
    }
  } catch (error: any) {
    console.error('❌ خطأ في إنشاء الجداول:', error?.message || error)
    // لا نرمي الخطأ هنا لأن الاتصال قد يكون ناجحاً
  }
}

// إنشاء جداول PostgreSQL
async function createPostgreSQLTables(client: Client): Promise<void> {
  const tables = [
    // جدول المستخدمين
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'user',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    
    // جدول العملاء
    `CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      email VARCHAR(255),
      address TEXT,
      national_id VARCHAR(20),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    
    // جدول الوسطاء
    `CREATE TABLE IF NOT EXISTS brokers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      email VARCHAR(255),
      commission_rate DECIMAL(5,2) DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    
    // جدول العقود
    `CREATE TABLE IF NOT EXISTS contracts (
      id SERIAL PRIMARY KEY,
      customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
      broker_id INTEGER REFERENCES brokers(id) ON DELETE SET NULL,
      unit_id INTEGER,
      contract_type VARCHAR(50),
      total_amount DECIMAL(15,2),
      down_payment DECIMAL(15,2),
      monthly_payment DECIMAL(15,2),
      contract_date DATE,
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    
    // جدول الوحدات
    `CREATE TABLE IF NOT EXISTS units (
      id SERIAL PRIMARY KEY,
      unit_number VARCHAR(50) UNIQUE NOT NULL,
      building_name VARCHAR(255),
      floor_number INTEGER,
      area DECIMAL(10,2),
      price DECIMAL(15,2),
      status VARCHAR(50) DEFAULT 'available',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`
  ]
  
  for (const table of tables) {
    await client.query(table)
  }
  
  console.log('✅ تم إنشاء جداول PostgreSQL بنجاح')
}

// إنشاء جداول SQLite
async function createSQLiteTables(db: any): Promise<void> {
  const tables = [
    // جدول المستخدمين
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // جدول العملاء
    `CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      national_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // جدول الوسطاء
    `CREATE TABLE IF NOT EXISTS brokers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      commission_rate REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // جدول العقود
    `CREATE TABLE IF NOT EXISTS contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      broker_id INTEGER,
      unit_id INTEGER,
      contract_type TEXT,
      total_amount REAL,
      down_payment REAL,
      monthly_payment REAL,
      contract_date DATE,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      FOREIGN KEY (broker_id) REFERENCES brokers(id) ON DELETE SET NULL
    )`,
    
    // جدول الوحدات
    `CREATE TABLE IF NOT EXISTS units (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      unit_number TEXT UNIQUE NOT NULL,
      building_name TEXT,
      floor_number INTEGER,
      area REAL,
      price REAL,
      status TEXT DEFAULT 'available',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  ]
  
  for (const table of tables) {
    db.exec(table)
  }
  
  console.log('✅ تم إنشاء جداول SQLite بنجاح')
}

// إنشاء جداول SQLite (للتطوير المحلي)
export async function createSqliteTables(): Promise<void> {
  let db: DatabaseInterface | null = null
  
  try {
    console.log('📋 إنشاء جداول SQLite...')
    
    if (!Database) {
      throw new Error('better-sqlite3 غير متوفر - يرجى تثبيته للتطوير المحلي')
    }
    
    db = await getDb()
    const dbType = await getCurrentDbType()
    
    if (dbType !== 'sqlite') {
      console.log('⚠️ هذه الدالة مخصصة لـ SQLite فقط')
      return
    }

    // إنشاء جدول العملاء
    await db.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        nationalId TEXT,
        address TEXT,
        status TEXT DEFAULT 'نشط',
        notes TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        deletedAt DATETIME
      )
    `)

    // إنشاء جدول الوحدات
    await db.query(`
      CREATE TABLE IF NOT EXISTS units (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE,
        name TEXT,
        unitType TEXT DEFAULT 'سكني',
        area TEXT,
        floor TEXT,
        building TEXT,
        totalPrice REAL DEFAULT 0,
        status TEXT DEFAULT 'متاحة',
        notes TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        deletedAt DATETIME
      )
    `)

    // إنشاء جدول العقود
    await db.query(`
      CREATE TABLE IF NOT EXISTS contracts (
        id TEXT PRIMARY KEY,
        unitId TEXT,
        customerId TEXT,
        start DATETIME,
        totalPrice REAL,
        discountAmount REAL DEFAULT 0,
        brokerName TEXT,
        brokerPercent REAL DEFAULT 0,
        brokerAmount REAL DEFAULT 0,
        commissionSafeId TEXT,
        downPaymentSafeId TEXT,
        maintenanceDeposit REAL DEFAULT 0,
        installmentType TEXT DEFAULT 'شهري',
        installmentCount INTEGER DEFAULT 0,
        extraAnnual INTEGER DEFAULT 0,
        annualPaymentValue REAL DEFAULT 0,
        downPayment REAL DEFAULT 0,
        paymentType TEXT DEFAULT 'installment',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        deletedAt DATETIME
      )
    `)

    console.log('✅ تم إنشاء جداول SQLite بنجاح')
  } catch (error: any) {
    console.error('❌ خطأ في إنشاء جداول SQLite:', error?.message || error)
    throw error
  } finally {
    if (db) {
      await db.close()
    }
  }
}