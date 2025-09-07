// ملف التوافق مع Prisma Client الموجود
import { getDb } from './db'

// إنشاء دالة عامة لإنشاء عمليات CRUD لأي جدول
function createTableOperations(tableName: string) {
  return {
    findUnique: async (args: any) => {
      const db = await getDb()
      try {
        const where = args.where
        const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ')
        const whereValues = Object.values(where)
        
        const query = `SELECT * FROM ${tableName} WHERE ${whereClause} AND deletedAt IS NULL`
        const result = await db.query(query, whereValues)
        return result[0] || null
      } finally {
        await db.close()
      }
    },
    findFirst: async (args: any) => {
      const db = await getDb()
      try {
        let query = `SELECT * FROM ${tableName} WHERE deletedAt IS NULL`
        const params: any[] = []
        
        if (args.where) {
          Object.keys(args.where).forEach((key, index) => {
            if (key === 'OR') {
              const orConditions = args.where[key].map((condition: any) => {
                const field = Object.keys(condition)[0]
                const value = condition[field]
                params.push(`%${value}%`)
                return `${field} LIKE ?`
              }).join(' OR ')
              query += ` AND (${orConditions})`
            } else {
              query += ` AND ${key} = ?`
              params.push(args.where[key])
            }
          })
        }
        
        if (args.orderBy) {
          const orderKey = Object.keys(args.orderBy)[0]
          const orderDir = args.orderBy[orderKey]
          query += ` ORDER BY ${orderKey} ${orderDir}`
        }
        
        if (args.take) {
          query += ` LIMIT ${args.take}`
        }
        
        const result = await db.query(query, params)
        return result[0] || null
      } finally {
        await db.close()
      }
    },
    findMany: async (args: any) => {
      const db = await getDb()
      try {
        let query = `SELECT * FROM ${tableName} WHERE deletedAt IS NULL`
        const params: any[] = []
        
        if (args.where) {
          Object.keys(args.where).forEach((key, index) => {
            if (key === 'OR') {
              const orConditions = args.where[key].map((condition: any) => {
                const field = Object.keys(condition)[0]
                const value = condition[field]
                params.push(`%${value}%`)
                return `${field} LIKE ?`
              }).join(' OR ')
              query += ` AND (${orConditions})`
            } else {
              query += ` AND ${key} = ?`
              params.push(args.where[key])
            }
          })
        }
        
        if (args.orderBy) {
          const orderKey = Object.keys(args.orderBy)[0]
          const orderDir = args.orderBy[orderKey]
          query += ` ORDER BY ${orderKey} ${orderDir}`
        }
        
        if (args.take) {
          query += ` LIMIT ${args.take}`
        }
        
        if (args.skip) {
          query += ` OFFSET ${args.skip}`
        }
        
        const result = await db.query(query, params)
        return result
      } finally {
        await db.close()
      }
    },
    create: async (args: any) => {
      const db = await getDb()
      try {
        const data = args.data
        const fields = Object.keys(data)
        const values = Object.values(data)
        const placeholders = fields.map(() => '?').join(', ')
        
        const query = `INSERT INTO ${tableName} (${fields.join(', ')}) VALUES (${placeholders})`
        await db.query(query, values)
        
        const result = await db.query(`SELECT * FROM ${tableName} WHERE id = last_insert_rowid()`)
        return result[0]
      } finally {
        await db.close()
      }
    },
    update: async (args: any) => {
      const db = await getDb()
      try {
        const data = args.data
        const where = args.where
        const fields = Object.keys(data)
        const values = Object.values(data)
        
        const setClause = fields.map(field => `${field} = ?`).join(', ')
        const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ')
        const whereValues = Object.values(where)
        
        const query = `UPDATE ${tableName} SET ${setClause} WHERE ${whereClause}`
        await db.query(query, [...values, ...whereValues])
        
        const result = await db.query(`SELECT * FROM ${tableName} WHERE ${whereClause}`, whereValues)
        return result[0]
      } finally {
        await db.close()
      }
    },
    delete: async (args: any) => {
      const db = await getDb()
      try {
        const where = args.where
        const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ')
        const whereValues = Object.values(where)
        
        const query = `UPDATE ${tableName} SET deletedAt = datetime('now') WHERE ${whereClause}`
        await db.query(query, whereValues)
        
        return { count: 1 }
      } finally {
        await db.close()
      }
    },
    count: async (args: any) => {
      const db = await getDb()
      try {
        let query = `SELECT COUNT(*) as count FROM ${tableName} WHERE deletedAt IS NULL`
        const params: any[] = []
        
        if (args.where) {
          Object.keys(args.where).forEach((key, index) => {
            if (key === 'OR') {
              const orConditions = args.where[key].map((condition: any) => {
                const field = Object.keys(condition)[0]
                const value = condition[field]
                params.push(`%${value}%`)
                return `${field} LIKE ?`
              }).join(' OR ')
              query += ` AND (${orConditions})`
            } else {
              query += ` AND ${key} = ?`
              params.push(args.where[key])
            }
          })
        }
        
        const result = await db.query(query, params)
        return result[0]?.count || 0
      } finally {
        await db.close()
      }
    },
    aggregate: async (args: any) => {
      const db = await getDb()
      try {
        let query = `SELECT `
        const params: any[] = []
        
        if (args._sum) {
          const sumFields = Object.keys(args._sum)
          query += sumFields.map(field => `SUM(${field}) as ${field}`).join(', ')
        } else if (args._avg) {
          const avgFields = Object.keys(args._avg)
          query += avgFields.map(field => `AVG(${field}) as ${field}`).join(', ')
        } else if (args._min) {
          const minFields = Object.keys(args._min)
          query += minFields.map(field => `MIN(${field}) as ${field}`).join(', ')
        } else if (args._max) {
          const maxFields = Object.keys(args._max)
          query += maxFields.map(field => `MAX(${field}) as ${field}`).join(', ')
        } else {
          query += `COUNT(*) as count`
        }
        
        query += ` FROM ${tableName} WHERE deletedAt IS NULL`
        
        if (args.where) {
          Object.keys(args.where).forEach((key, index) => {
            if (key === 'OR') {
              const orConditions = args.where[key].map((condition: any) => {
                const field = Object.keys(condition)[0]
                const value = condition[field]
                params.push(`%${value}%`)
                return `${field} LIKE ?`
              }).join(' OR ')
              query += ` AND (${orConditions})`
            } else {
              query += ` AND ${key} = ?`
              params.push(args.where[key])
            }
          })
        }
        
        const result = await db.query(query, params)
        return result[0] || {}
      } finally {
        await db.close()
      }
    },
    groupBy: async (args: any) => {
      const db = await getDb()
      try {
        let query = `SELECT `
        const params: any[] = []
        
        // إضافة الحقول المطلوبة
        if (args.by) {
          query += args.by.join(', ')
        }
        
        // إضافة الدوال المجمعة
        if (args._count) {
          const countFields = Object.keys(args._count)
          if (countFields.length > 0) {
            query += `, ${countFields.map(field => `COUNT(${field}) as ${field}`).join(', ')}`
          }
        }
        
        if (args._sum) {
          const sumFields = Object.keys(args._sum)
          query += `, ${sumFields.map(field => `SUM(${field}) as ${field}`).join(', ')}`
        }
        
        if (args._avg) {
          const avgFields = Object.keys(args._avg)
          query += `, ${avgFields.map(field => `AVG(${field}) as ${field}`).join(', ')}`
        }
        
        query += ` FROM ${tableName} WHERE deletedAt IS NULL`
        
        if (args.where) {
          Object.keys(args.where).forEach((key, index) => {
            if (key === 'OR') {
              const orConditions = args.where[key].map((condition: any) => {
                const field = Object.keys(condition)[0]
                const value = condition[field]
                params.push(`%${value}%`)
                return `${field} LIKE ?`
              }).join(' OR ')
              query += ` AND (${orConditions})`
            } else {
              query += ` AND ${key} = ?`
              params.push(args.where[key])
            }
          })
        }
        
        query += ` GROUP BY ${args.by.join(', ')}`
        
        if (args.orderBy) {
          const orderKey = Object.keys(args.orderBy)[0]
          const orderDir = args.orderBy[orderKey]
          query += ` ORDER BY ${orderKey} ${orderDir}`
        }
        
        const result = await db.query(query, params)
        return result
      } finally {
        await db.close()
      }
    },
    upsert: async (args: any) => {
      const db = await getDb()
      try {
        const { where, update, create } = args
        
        // البحث عن السجل الموجود
        const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ')
        const whereValues = Object.values(where)
        
        const existingQuery = `SELECT * FROM ${tableName} WHERE ${whereClause}`
        const existing = await db.query(existingQuery, whereValues)
        
        if (existing.length > 0) {
          // تحديث السجل الموجود
          const updateFields = Object.keys(update)
          const updateValues = Object.values(update)
          const setClause = updateFields.map(field => `${field} = ?`).join(', ')
          
          const updateQuery = `UPDATE ${tableName} SET ${setClause} WHERE ${whereClause}`
          await db.query(updateQuery, [...updateValues, ...whereValues])
          
          // إرجاع السجل المحدث
          const result = await db.query(existingQuery, whereValues)
          return result[0]
        } else {
          // إنشاء سجل جديد
          const createFields = Object.keys(create)
          const createValues = Object.values(create)
          const placeholders = createFields.map(() => '?').join(', ')
          
          const createQuery = `INSERT INTO ${tableName} (${createFields.join(', ')}) VALUES (${placeholders})`
          await db.query(createQuery, createValues)
          
          // إرجاع السجل الجديد
          const result = await db.query(existingQuery, whereValues)
          return result[0]
        }
      } finally {
        await db.close()
      }
    },
    deleteMany: async (args: any) => {
      const db = await getDb()
      try {
        let query = `DELETE FROM ${tableName} WHERE 1=1`
        const params: any[] = []
        
        if (args.where) {
          Object.keys(args.where).forEach((key, index) => {
            if (key === 'OR') {
              const orConditions = args.where[key].map((condition: any) => {
                const field = Object.keys(condition)[0]
                const value = condition[field]
                params.push(`%${value}%`)
                return `${field} LIKE ?`
              }).join(' OR ')
              query += ` AND (${orConditions})`
            } else {
              query += ` AND ${key} = ?`
              params.push(args.where[key])
            }
          })
        }
        
        const result = await db.query(query, params)
        return { count: (result as any).changes || 0 }
      } finally {
        await db.close()
      }
    }
  }
}

// إنشاء واجهة توافق مع Prisma Client
export const prisma = {
  user: createTableOperations('users'),
  customer: createTableOperations('customers'),
  broker: createTableOperations('brokers'),
  contract: createTableOperations('contracts'),
  unit: createTableOperations('units'),
  voucher: createTableOperations('vouchers'),
  partner: createTableOperations('partners'),
  partnerGroup: createTableOperations('partner_groups'),
  unitPartner: createTableOperations('unit_partners'),
  brokerDue: createTableOperations('broker_dues'),
  commissionSafe: createTableOperations('commission_safes'),
  downPaymentSafe: createTableOperations('down_payment_safes'),
  installment: createTableOperations('installments'),
  payment: createTableOperations('payments'),
  audit: createTableOperations('audit_logs'),
  auditLog: createTableOperations('audit_logs'),
  notification: createTableOperations('notifications'),
  backup: createTableOperations('backups'),
  monitoring: createTableOperations('monitoring_data'),
  trash: createTableOperations('trash_items'),
  safe: createTableOperations('safes'),
  partnerDebt: createTableOperations('partner_debts'),
  partnerGroupPartner: createTableOperations('partner_group_partners'),
  transfer: createTableOperations('transfers'),
  settings: createTableOperations('settings'),
  keyVal: createTableOperations('key_val'),
  $disconnect: async () => {
    // لا حاجة لإغلاق الاتصال هنا لأنه يتم إغلاقه في كل عملية
  },
  $transaction: async (callback: (tx: any) => Promise<any>) => {
    // تنفيذ المعاملة
    return await callback(prisma)
  },
  $queryRaw: async (query: any) => {
    const db = await getDb()
    try {
      const result = await db.query(query)
      return result
    } finally {
      await db.close()
    }
  }
}