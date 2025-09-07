// محول اتصال موحد لدعم PostgreSQL و SQLite
import { Client } from 'pg'
import Database from 'better-sqlite3'
import { getCurrentDbUrl, getCurrentDbType, DatabaseInterface } from './config'

// تصدير prisma للتوافق مع الكود الموجود
export { prisma } from './prisma-compat'

// واجهة موحدة لقاعدة البيانات
class UnifiedDatabase implements DatabaseInterface {
  private client: Client | Database.Database | null = null
  private dbType: string = 'postgresql'

  constructor(client: Client | Database.Database, dbType: string) {
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
        const db = this.client as Database.Database
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
        const db = this.client as Database.Database
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
      const url = new URL(dbUrl)
      const dbPath = url.pathname.startsWith('./') ? url.pathname : `./${url.pathname}`
      
      console.log('📁 مسار قاعدة البيانات SQLite:', dbPath)
      
      const db = new Database(dbPath)
      
      // تمكين المفاتيح الخارجية
      db.pragma('foreign_keys = ON')
      
      console.log('✅ تم الاتصال بـ SQLite بنجاح')
      return new UnifiedDatabase(db, 'sqlite')
      
    } else {
      // PostgreSQL
      const client = new Client({
        connectionString: dbUrl,
        ssl: dbUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : false
      })

      await client.connect()
      console.log('✅ تم الاتصال بـ PostgreSQL بنجاح')
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

// إنشاء جداول SQLite (للتطوير المحلي)
export async function createSqliteTables(): Promise<void> {
  let db: DatabaseInterface | null = null
  
  try {
    console.log('📋 إنشاء جداول SQLite...')
    
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