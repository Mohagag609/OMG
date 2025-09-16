#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

// Database configuration
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_x5qvmpzF3hjX@ep-dawn-cell-adylfb98-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    }
  }
})

// Sample data for reset
const sampleData = {
  customers: [
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
    },
    {
      name: "محمد سالم القحطاني",
      phone: "0503456789",
      nationalId: "3456789012",
      address: "الدمام، حي الفيصلية",
      status: "نشط",
      notes: "مستثمر"
    }
  ],
  units: [
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
    },
    {
      code: "UNIT-003",
      name: "شقة 301",
      unitType: "سكني",
      area: "200",
      floor: "3",
      building: "مبنى ب",
      totalPrice: 800000,
      status: "مباعة",
      notes: "شقة بانتير"
    }
  ],
  brokers: [
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
  ],
  partners: [
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
  ],
  safes: [
    {
      name: "الخزينة الرئيسية",
      balance: 1000000
    },
    {
      name: "خزينة العمولات",
      balance: 500000
    },
    {
      name: "خزينة الطوارئ",
      balance: 200000
    }
  ],
  contracts: [
    {
      unitId: "", // Will be filled dynamically
      customerId: "", // Will be filled dynamically
      start: new Date(),
      totalPrice: 500000,
      downPayment: 100000,
      discountAmount: 0,
      brokerName: "خالد أحمد المطيري",
      brokerPercent: 5,
      brokerAmount: 25000,
      commissionSafeId: "", // Will be filled dynamically
      downPaymentSafeId: "", // Will be filled dynamically
      maintenanceDeposit: 10000,
      installmentType: "شهري",
      installmentCount: 60,
      extraAnnual: 0,
      annualPaymentValue: 0,
      paymentType: "installment"
    }
  ]
}

async function resetDatabase() {
  console.log('🔄 بدء إعادة تهيئة قاعدة البيانات...')
  
  try {
    // Connect to database
    await prisma.$connect()
    console.log('✅ تم الاتصال بقاعدة البيانات')

    // Delete all data in correct order (respecting foreign keys)
    console.log('🗑️ حذف البيانات الموجودة...')
    
    await prisma.contract.deleteMany()
    console.log('   - تم حذف العقود')
    
    await prisma.installment.deleteMany()
    console.log('   - تم حذف الأقساط')
    
    await prisma.voucher.deleteMany()
    console.log('   - تم حذف السندات')
    
    await prisma.transfer.deleteMany()
    console.log('   - تم حذف التحويلات')
    
    await prisma.unitPartner.deleteMany()
    console.log('   - تم حذف شركاء الوحدات')
    
    await prisma.partnerDebt.deleteMany()
    console.log('   - تم حذف ديون الشركاء')
    
    await prisma.partnerGroupPartner.deleteMany()
    console.log('   - تم حذف شركاء المجموعات')
    
    await prisma.brokerDue.deleteMany()
    console.log('   - تم حذف ديون الوسطاء')
    
    await prisma.auditLog.deleteMany()
    console.log('   - تم حذف سجلات التدقيق')
    
    await prisma.user.deleteMany()
    console.log('   - تم حذف المستخدمين')
    
    await prisma.partnerGroup.deleteMany()
    console.log('   - تم حذف مجموعات الشركاء')
    
    await prisma.partner.deleteMany()
    console.log('   - تم حذف الشركاء')
    
    await prisma.broker.deleteMany()
    console.log('   - تم حذف الوسطاء')
    
    await prisma.safe.deleteMany()
    console.log('   - تم حذف الخزائن')
    
    await prisma.unit.deleteMany()
    console.log('   - تم حذف الوحدات')
    
    await prisma.customer.deleteMany()
    console.log('   - تم حذف العملاء')

    console.log('✅ تم حذف جميع البيانات بنجاح')

    // Insert sample data
    console.log('📝 إدراج البيانات التجريبية...')

    // Insert customers
    const customers = await Promise.all(
      sampleData.customers.map(customer => 
        prisma.customer.create({ data: customer })
      )
    )
    console.log(`   - تم إدراج ${customers.length} عميل`)

    // Insert units
    const units = await Promise.all(
      sampleData.units.map(unit => 
        prisma.unit.create({ data: unit })
      )
    )
    console.log(`   - تم إدراج ${units.length} وحدة`)

    // Insert brokers
    const brokers = await Promise.all(
      sampleData.brokers.map(broker => 
        prisma.broker.create({ data: broker })
      )
    )
    console.log(`   - تم إدراج ${brokers.length} وسيط`)

    // Insert partners
    const partners = await Promise.all(
      sampleData.partners.map(partner => 
        prisma.partner.create({ data: partner })
      )
    )
    console.log(`   - تم إدراج ${partners.length} شريك`)

    // Insert safes
    const safes = await Promise.all(
      sampleData.safes.map(safe => 
        prisma.safe.create({ data: safe })
      )
    )
    console.log(`   - تم إدراج ${safes.length} خزينة`)

    // Insert admin user
    const adminUser = await prisma.user.create({
      data: {
        username: "admin",
        password: "admin123",
        fullName: "مدير النظام",
        role: "admin",
        isActive: true
      }
    })
    console.log('   - تم إدراج مستخدم المدير')

    // Insert sample contract
    if (customers.length > 0 && units.length > 0 && safes.length > 0) {
      const contractData = {
        ...sampleData.contracts[0],
        unitId: units[0].id,
        customerId: customers[0].id,
        commissionSafeId: safes[0].id,
        downPaymentSafeId: safes[0].id
      }
      
      await prisma.contract.create({ data: contractData })
      console.log('   - تم إدراج عقد تجريبي')
    }

    // Create some installments
    if (units.length > 0) {
      const installments = []
      for (let i = 1; i <= 12; i++) {
        const dueDate = new Date()
        dueDate.setMonth(dueDate.getMonth() + i)
        
        installments.push({
          unitId: units[0].id,
          amount: 5000,
          dueDate: dueDate,
          status: i <= 3 ? "مدفوع" : "معلق",
          notes: `قسط رقم ${i}`
        })
      }
      
      await prisma.installment.createMany({ data: installments })
      console.log(`   - تم إدراج ${installments.length} قسط`)
    }

    // Create some vouchers
    if (safes.length > 0) {
      const vouchers = [
        {
          safeId: safes[0].id,
          type: "receipt",
          amount: 100000,
          description: "دفعة مقدمة من العميل",
          reference: "VOUCHER-001"
        },
        {
          safeId: safes[0].id,
          type: "payment",
          amount: 50000,
          description: "مصاريف إدارية",
          reference: "VOUCHER-002"
        }
      ]
      
      await prisma.voucher.createMany({ data: vouchers })
      console.log(`   - تم إدراج ${vouchers.length} سند`)
    }

    console.log('✅ تم إعادة تهيئة قاعدة البيانات بنجاح!')
    console.log('')
    console.log('📊 البيانات المُدرجة:')
    console.log(`   - العملاء: ${customers.length}`)
    console.log(`   - الوحدات: ${units.length}`)
    console.log(`   - الوسطاء: ${brokers.length}`)
    console.log(`   - الشركاء: ${partners.length}`)
    console.log(`   - الخزائن: ${safes.length}`)
    console.log(`   - العقود: 1`)
    console.log(`   - الأقساط: 12`)
    console.log(`   - السندات: 2`)
    console.log('')
    console.log('👤 بيانات تسجيل الدخول:')
    console.log('   - اسم المستخدم: admin')
    console.log('   - كلمة المرور: admin123')

  } catch (error) {
    console.error('❌ خطأ في إعادة تهيئة قاعدة البيانات:', error)
    throw error
  } finally {
    await prisma.$disconnect()
    console.log('🔌 تم قطع الاتصال بقاعدة البيانات')
  }
}

// Run the reset
if (require.main === module) {
  resetDatabase()
    .then(() => {
      console.log('🎉 تمت إعادة تهيئة قاعدة البيانات بنجاح!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 فشل في إعادة تهيئة قاعدة البيانات:', error)
      process.exit(1)
    })
}

module.exports = { resetDatabase }