#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_x5qvmpzF3hjX@ep-dawn-cell-adylfb98-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    }
  }
})

async function quickReset() {
  console.log('🔄 إعادة تهيئة سريعة لقاعدة البيانات...')
  
  try {
    await prisma.$connect()
    console.log('✅ تم الاتصال بقاعدة البيانات')

    // Delete all data
    console.log('🗑️ حذف البيانات...')
    
    await prisma.$executeRaw`TRUNCATE TABLE "contracts" CASCADE`
    await prisma.$executeRaw`TRUNCATE TABLE "installments" CASCADE`
    await prisma.$executeRaw`TRUNCATE TABLE "vouchers" CASCADE`
    await prisma.$executeRaw`TRUNCATE TABLE "transfers" CASCADE`
    await prisma.$executeRaw`TRUNCATE TABLE "unit_partners" CASCADE`
    await prisma.$executeRaw`TRUNCATE TABLE "partner_debts" CASCADE`
    await prisma.$executeRaw`TRUNCATE TABLE "partner_group_partners" CASCADE`
    await prisma.$executeRaw`TRUNCATE TABLE "broker_dues" CASCADE`
    await prisma.$executeRaw`TRUNCATE TABLE "audit_logs" CASCADE`
    await prisma.$executeRaw`TRUNCATE TABLE "users" CASCADE`
    await prisma.$executeRaw`TRUNCATE TABLE "partner_groups" CASCADE`
    await prisma.$executeRaw`TRUNCATE TABLE "partners" CASCADE`
    await prisma.$executeRaw`TRUNCATE TABLE "brokers" CASCADE`
    await prisma.$executeRaw`TRUNCATE TABLE "safes" CASCADE`
    await prisma.$executeRaw`TRUNCATE TABLE "units" CASCADE`
    await prisma.$executeRaw`TRUNCATE TABLE "customers" CASCADE`

    console.log('✅ تم حذف جميع البيانات')

    // Insert basic data
    console.log('📝 إدراج البيانات الأساسية...')

    // Create admin user
    await prisma.user.create({
      data: {
        username: "admin",
        password: "admin123",
        fullName: "مدير النظام",
        role: "admin",
        isActive: true
      }
    })

    // Create sample customers
    await prisma.customer.createMany({
      data: [
        {
          name: "أحمد محمد العلي",
          phone: "0501234567",
          nationalId: "1234567890",
          address: "الرياض، حي النخيل",
          status: "نشط",
          notes: "عميل VIP"
        },
        {
          name: "فاطمة عبدالله السعد",
          phone: "0502345678",
          nationalId: "2345678901",
          address: "جدة، حي الزهراء",
          status: "نشط",
          notes: "عميلة مميزة"
        }
      ]
    })

    // Create sample units
    await prisma.unit.createMany({
      data: [
        {
          code: "UNIT-001",
          name: "شقة 101",
          unitType: "سكني",
          area: "120",
          floor: "1",
          building: "مبنى أ",
          totalPrice: 500000,
          status: "متاحة",
          notes: "شقة مفروشة"
        },
        {
          code: "UNIT-002",
          name: "شقة 201",
          unitType: "سكني",
          area: "150",
          floor: "2",
          building: "مبنى أ",
          totalPrice: 600000,
          status: "متاحة",
          notes: "شقة دوبلكس"
        }
      ]
    })

    // Create sample brokers
    await prisma.broker.createMany({
      data: [
        {
          name: "خالد أحمد المطيري",
          phone: "0504567890",
          notes: "وسيط محترف"
        },
        {
          name: "نورا محمد الشمري",
          phone: "0505678901",
          notes: "وسيطة مميزة"
        }
      ]
    })

    // Create sample partners
    await prisma.partner.createMany({
      data: [
        {
          name: "شركة الاستثمار العقاري",
          phone: "0112345678",
          notes: "شريك استراتيجي"
        },
        {
          name: "مجموعة التطوير العقاري",
          phone: "0113456789",
          notes: "شريك تطوير"
        }
      ]
    })

    // Create sample safes
    await prisma.safe.createMany({
      data: [
        {
          name: "الخزينة الرئيسية",
          balance: 1000000
        },
        {
          name: "خزينة العمولات",
          balance: 500000
        }
      ]
    })

    console.log('✅ تم إعادة تهيئة قاعدة البيانات بنجاح!')
    console.log('')
    console.log('👤 بيانات تسجيل الدخول:')
    console.log('   - اسم المستخدم: admin')
    console.log('   - كلمة المرور: admin123')

  } catch (error) {
    console.error('❌ خطأ في إعادة تهيئة قاعدة البيانات:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  quickReset()
    .then(() => {
      console.log('🎉 تمت إعادة تهيئة قاعدة البيانات بنجاح!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 فشل في إعادة تهيئة قاعدة البيانات:', error)
      process.exit(1)
    })
}

module.exports = { quickReset }