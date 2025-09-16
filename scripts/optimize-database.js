#!/usr/bin/env node

/**
 * Database Optimization Script
 * Adds indexes to improve query performance
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addIndexes() {
  console.log('🚀 Starting database optimization...')
  
  try {
    // Add indexes for frequently queried fields
    const indexes = [
      // Customer indexes
      'CREATE INDEX IF NOT EXISTS idx_customers_deleted_at ON "Customer"("deletedAt")',
      'CREATE INDEX IF NOT EXISTS idx_customers_name ON "Customer"("name")',
      'CREATE INDEX IF NOT EXISTS idx_customers_phone ON "Customer"("phone")',
      'CREATE INDEX IF NOT EXISTS idx_customers_national_id ON "Customer"("nationalId")',
      'CREATE INDEX IF NOT EXISTS idx_customers_status ON "Customer"("status")',
      'CREATE INDEX IF NOT EXISTS idx_customers_created_at ON "Customer"("createdAt")',
      
      // Unit indexes
      'CREATE INDEX IF NOT EXISTS idx_units_deleted_at ON "Unit"("deletedAt")',
      'CREATE INDEX IF NOT EXISTS idx_units_status ON "Unit"("status")',
      'CREATE INDEX IF NOT EXISTS idx_units_code ON "Unit"("code")',
      'CREATE INDEX IF NOT EXISTS idx_units_unit_type ON "Unit"("unitType")',
      
      // Contract indexes
      'CREATE INDEX IF NOT EXISTS idx_contracts_deleted_at ON "Contract"("deletedAt")',
      'CREATE INDEX IF NOT EXISTS idx_contracts_unit_id ON "Contract"("unitId")',
      'CREATE INDEX IF NOT EXISTS idx_contracts_customer_id ON "Contract"("customerId")',
      'CREATE INDEX IF NOT EXISTS idx_contracts_created_at ON "Contract"("createdAt")',
      
      // Voucher indexes
      'CREATE INDEX IF NOT EXISTS idx_vouchers_deleted_at ON "Voucher"("deletedAt")',
      'CREATE INDEX IF NOT EXISTS idx_vouchers_type ON "Voucher"("type")',
      'CREATE INDEX IF NOT EXISTS idx_vouchers_safe_id ON "Voucher"("safeId")',
      'CREATE INDEX IF NOT EXISTS idx_vouchers_date ON "Voucher"("date")',
      
      // Partner indexes
      'CREATE INDEX IF NOT EXISTS idx_partners_deleted_at ON "Partner"("deletedAt")',
      'CREATE INDEX IF NOT EXISTS idx_partners_name ON "Partner"("name")',
      
      // Broker indexes
      'CREATE INDEX IF NOT EXISTS idx_brokers_deleted_at ON "Broker"("deletedAt")',
      'CREATE INDEX IF NOT EXISTS idx_brokers_name ON "Broker"("name")',
      'CREATE INDEX IF NOT EXISTS idx_brokers_status ON "Broker"("status")',
      
      // Installment indexes
      'CREATE INDEX IF NOT EXISTS idx_installments_deleted_at ON "Installment"("deletedAt")',
      'CREATE INDEX IF NOT EXISTS idx_installments_unit_id ON "Installment"("unitId")',
      'CREATE INDEX IF NOT EXISTS idx_installments_due_date ON "Installment"("dueDate")',
      'CREATE INDEX IF NOT EXISTS idx_installments_status ON "Installment"("status")',
      
      // Partner Debt indexes
      'CREATE INDEX IF NOT EXISTS idx_partner_debts_deleted_at ON "PartnerDebt"("deletedAt")',
      'CREATE INDEX IF NOT EXISTS idx_partner_debts_partner_id ON "PartnerDebt"("partnerId")',
      'CREATE INDEX IF NOT EXISTS idx_partner_debts_due_date ON "PartnerDebt"("dueDate")',
      'CREATE INDEX IF NOT EXISTS idx_partner_debts_status ON "PartnerDebt"("status")',
      
      // Safe indexes
      'CREATE INDEX IF NOT EXISTS idx_safes_deleted_at ON "Safe"("deletedAt")',
      'CREATE INDEX IF NOT EXISTS idx_safes_name ON "Safe"("name")',
      
      // Transfer indexes
      'CREATE INDEX IF NOT EXISTS idx_transfers_deleted_at ON "Transfer"("deletedAt")',
      'CREATE INDEX IF NOT EXISTS idx_transfers_from_safe_id ON "Transfer"("fromSafeId")',
      'CREATE INDEX IF NOT EXISTS idx_transfers_to_safe_id ON "Transfer"("toSafeId")',
      'CREATE INDEX IF NOT EXISTS idx_transfers_created_at ON "Transfer"("createdAt")',
      
      // Unit Partner indexes
      'CREATE INDEX IF NOT EXISTS idx_unit_partners_deleted_at ON "UnitPartner"("deletedAt")',
      'CREATE INDEX IF NOT EXISTS idx_unit_partners_unit_id ON "UnitPartner"("unitId")',
      'CREATE INDEX IF NOT EXISTS idx_unit_partners_partner_id ON "UnitPartner"("partnerId")',
      
      // Broker Due indexes
      'CREATE INDEX IF NOT EXISTS idx_broker_dues_deleted_at ON "BrokerDue"("deletedAt")',
      'CREATE INDEX IF NOT EXISTS idx_broker_dues_broker_id ON "BrokerDue"("brokerId")',
      'CREATE INDEX IF NOT EXISTS idx_broker_dues_due_date ON "BrokerDue"("dueDate")',
      'CREATE INDEX IF NOT EXISTS idx_broker_dues_status ON "BrokerDue"("status")',
      
      // Partner Group indexes
      'CREATE INDEX IF NOT EXISTS idx_partner_groups_deleted_at ON "PartnerGroup"("deletedAt")',
      'CREATE INDEX IF NOT EXISTS idx_partner_groups_name ON "PartnerGroup"("name")',
      
      // Audit Log indexes
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON "AuditLog"("entityType")',
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON "AuditLog"("entityId")',
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON "AuditLog"("createdAt")',
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON "AuditLog"("userId")',
      
      // Settings indexes
      'CREATE INDEX IF NOT EXISTS idx_settings_key ON "Settings"("key")',
      
      // KeyVal indexes
      'CREATE INDEX IF NOT EXISTS idx_key_val_key ON "KeyVal"("key")'
    ]

    console.log(`📊 Adding ${indexes.length} indexes...`)
    
    for (const indexQuery of indexes) {
      try {
        await prisma.$executeRawUnsafe(indexQuery)
        console.log(`✅ Added index: ${indexQuery.split('idx_')[1]?.split(' ')[0] || 'unknown'}`)
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Index already exists: ${indexQuery.split('idx_')[1]?.split(' ')[0] || 'unknown'}`)
        } else {
          console.error(`❌ Failed to add index: ${error.message}`)
        }
      }
    }

    console.log('🎉 Database optimization completed successfully!')
    
    // Analyze tables for better query planning
    console.log('📈 Analyzing tables for better query planning...')
    const tables = [
      'Customer', 'Unit', 'Contract', 'Voucher', 'Partner', 'Broker',
      'Installment', 'PartnerDebt', 'Safe', 'Transfer', 'UnitPartner',
      'BrokerDue', 'PartnerGroup', 'AuditLog', 'Settings', 'KeyVal'
    ]
    
    for (const table of tables) {
      try {
        await prisma.$executeRawUnsafe(`ANALYZE "${table}"`)
        console.log(`✅ Analyzed table: ${table}`)
      } catch (error) {
        console.error(`❌ Failed to analyze table ${table}: ${error.message}`)
      }
    }

  } catch (error) {
    console.error('❌ Database optimization failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the optimization
addIndexes()