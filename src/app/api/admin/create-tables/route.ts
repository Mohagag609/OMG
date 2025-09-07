import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

// POST /api/admin/create-tables - إنشاء الجداول في قاعدة البيانات الحالية
export async function POST(request: NextRequest) {
  let db: any = null
  
  try {
    console.log('🔧 جاري إنشاء الجداول...')
    
    // الحصول على اتصال قاعدة البيانات
    db = await getDb()
    
    // فحص نوع قاعدة البيانات
    const dbType = await getCurrentDbType()
    
    if (dbType === 'postgresql') {
      // PostgreSQL
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
        )`,
        
        // جدول الشركاء
        `CREATE TABLE IF NOT EXISTS partners (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          phone VARCHAR(20),
          email VARCHAR(255),
          address TEXT,
          partnership_type VARCHAR(50),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )`,
        
        // جدول مجموعات الشركاء
        `CREATE TABLE IF NOT EXISTS partner_groups (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )`,
        
        // جدول شركاء الوحدات
        `CREATE TABLE IF NOT EXISTS unit_partners (
          id SERIAL PRIMARY KEY,
          unit_id INTEGER,
          partner_id INTEGER REFERENCES partners(id) ON DELETE CASCADE,
          partnership_percentage DECIMAL(5,2),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )`,
        
        // جدول المستحقات
        `CREATE TABLE IF NOT EXISTS broker_dues (
          id SERIAL PRIMARY KEY,
          broker_id INTEGER REFERENCES brokers(id) ON DELETE CASCADE,
          amount DECIMAL(15,2) NOT NULL,
          due_date DATE,
          status VARCHAR(50) DEFAULT 'pending',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )`,
        
        // جدول الخزائن
        `CREATE TABLE IF NOT EXISTS safes (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          balance DECIMAL(15,2) DEFAULT 0,
          safe_type VARCHAR(50),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )`,
        
        // جدول الأقساط
        `CREATE TABLE IF NOT EXISTS installments (
          id SERIAL PRIMARY KEY,
          contract_id INTEGER REFERENCES contracts(id) ON DELETE CASCADE,
          amount DECIMAL(15,2) NOT NULL,
          due_date DATE NOT NULL,
          status VARCHAR(50) DEFAULT 'pending',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )`,
        
        // جدول المدفوعات
        `CREATE TABLE IF NOT EXISTS payments (
          id SERIAL PRIMARY KEY,
          installment_id INTEGER REFERENCES installments(id) ON DELETE CASCADE,
          amount DECIMAL(15,2) NOT NULL,
          payment_date DATE NOT NULL,
          payment_method VARCHAR(50),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )`,
        
        // جدول سجل التدقيق
        `CREATE TABLE IF NOT EXISTS audit_logs (
          id SERIAL PRIMARY KEY,
          table_name VARCHAR(255) NOT NULL,
          record_id INTEGER NOT NULL,
          action VARCHAR(50) NOT NULL,
          old_values JSONB,
          new_values JSONB,
          user_id INTEGER,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )`,
        
        // جدول الإشعارات
        `CREATE TABLE IF NOT EXISTS notifications (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          type VARCHAR(50),
          is_read BOOLEAN DEFAULT false,
          user_id INTEGER,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )`,
        
        // جدول النسخ الاحتياطية
        `CREATE TABLE IF NOT EXISTS backups (
          id SERIAL PRIMARY KEY,
          filename VARCHAR(255) NOT NULL,
          file_path TEXT NOT NULL,
          file_size BIGINT,
          backup_type VARCHAR(50),
          created_at TIMESTAMPTZ DEFAULT NOW()
        )`,
        
        // جدول البيانات المحذوفة
        `CREATE TABLE IF NOT EXISTS trash_items (
          id SERIAL PRIMARY KEY,
          table_name VARCHAR(255) NOT NULL,
          record_id INTEGER NOT NULL,
          data JSONB NOT NULL,
          deleted_at TIMESTAMPTZ DEFAULT NOW(),
          deleted_by INTEGER
        )`,
        
        // جدول الإعدادات
        `CREATE TABLE IF NOT EXISTS settings (
          id SERIAL PRIMARY KEY,
          key VARCHAR(255) UNIQUE NOT NULL,
          value TEXT,
          description TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )`
      ]
      
      // إنشاء الجداول
      for (const table of tables) {
        await db.query(table)
      }
      
    } else if (dbType === 'sqlite') {
      // SQLite
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
      
      // إنشاء الجداول
      for (const table of tables) {
        db.query(table)
      }
    }
    
    console.log('✅ تم إنشاء الجداول بنجاح')
    
    return NextResponse.json({
      success: true,
      message: 'تم إنشاء الجداول بنجاح',
      dbType: dbType
    })
    
  } catch (error: any) {
    console.error('❌ خطأ في إنشاء الجداول:', error?.message || error)
    return NextResponse.json({
      success: false,
      error: error?.message || 'فشل في إنشاء الجداول'
    }, { status: 500 })
  } finally {
    if (db) {
      await db.close()
    }
  }
}

// استيراد getCurrentDbType
import { getCurrentDbType } from '@/lib/config'