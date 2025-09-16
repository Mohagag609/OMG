const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 بدء تشغيل سكريبت البذور...')

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: 'admin123',
      fullName: 'مدير النظام',
      role: 'admin',
      isActive: true
    }
  })
  console.log('✅ تم إنشاء مستخدم المدير')

  // Create sample customers
  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { phone: '0501234567' },
      update: {},
      create: {
        name: 'أحمد محمد العلي',
        phone: '0501234567',
        nationalId: '1234567890',
        address: 'الرياض، حي النخيل',
        status: 'نشط',
        notes: 'عميل VIP'
      }
    }),
    prisma.customer.upsert({
      where: { phone: '0502345678' },
      update: {},
      create: {
        name: 'فاطمة عبدالله السعد',
        phone: '0502345678',
        nationalId: '2345678901',
        address: 'جدة، حي الزهراء',
        status: 'نشط',
        notes: 'عميلة مميزة'
      }
    }),
    prisma.customer.upsert({
      where: { phone: '0503456789' },
      update: {},
      create: {
        name: 'محمد سالم القحطاني',
        phone: '0503456789',
        nationalId: '3456789012',
        address: 'الدمام، حي الفيصلية',
        status: 'نشط',
        notes: 'مستثمر'
      }
    })
  ])
  console.log(`✅ تم إنشاء ${customers.length} عميل`)

  // Create sample units
  const units = await Promise.all([
    prisma.unit.upsert({
      where: { code: 'UNIT-001' },
      update: {},
      create: {
        code: 'UNIT-001',
        name: 'شقة 101',
        unitType: 'سكني',
        area: '120',
        floor: '1',
        building: 'مبنى أ',
        totalPrice: 500000,
        status: 'متاحة',
        notes: 'شقة مفروشة'
      }
    }),
    prisma.unit.upsert({
      where: { code: 'UNIT-002' },
      update: {},
      create: {
        code: 'UNIT-002',
        name: 'شقة 201',
        unitType: 'سكني',
        area: '150',
        floor: '2',
        building: 'مبنى أ',
        totalPrice: 600000,
        status: 'متاحة',
        notes: 'شقة دوبلكس'
      }
    }),
    prisma.unit.upsert({
      where: { code: 'UNIT-003' },
      update: {},
      create: {
        code: 'UNIT-003',
        name: 'شقة 301',
        unitType: 'سكني',
        area: '200',
        floor: '3',
        building: 'مبنى ب',
        totalPrice: 800000,
        status: 'مباعة',
        notes: 'شقة بانتير'
      }
    })
  ])
  console.log(`✅ تم إنشاء ${units.length} وحدة`)

  // Create sample brokers
  const brokers = await Promise.all([
    prisma.broker.upsert({
      where: { name: 'خالد أحمد المطيري' },
      update: {},
      create: {
        name: 'خالد أحمد المطيري',
        phone: '0504567890',
        notes: 'وسيط محترف'
      }
    }),
    prisma.broker.upsert({
      where: { name: 'نورا محمد الشمري' },
      update: {},
      create: {
        name: 'نورا محمد الشمري',
        phone: '0505678901',
        notes: 'وسيطة مميزة'
      }
    })
  ])
  console.log(`✅ تم إنشاء ${brokers.length} وسيط`)

  // Create sample partners
  const partners = await Promise.all([
    prisma.partner.upsert({
      where: { name: 'شركة الاستثمار العقاري' },
      update: {},
      create: {
        name: 'شركة الاستثمار العقاري',
        phone: '0112345678',
        notes: 'شريك استراتيجي'
      }
    }),
    prisma.partner.upsert({
      where: { name: 'مجموعة التطوير العقاري' },
      update: {},
      create: {
        name: 'مجموعة التطوير العقاري',
        phone: '0113456789',
        notes: 'شريك تطوير'
      }
    })
  ])
  console.log(`✅ تم إنشاء ${partners.length} شريك`)

  // Create sample safes
  const safes = await Promise.all([
    prisma.safe.upsert({
      where: { name: 'الخزينة الرئيسية' },
      update: {},
      create: {
        name: 'الخزينة الرئيسية',
        balance: 1000000
      }
    }),
    prisma.safe.upsert({
      where: { name: 'خزينة العمولات' },
      update: {},
      create: {
        name: 'خزينة العمولات',
        balance: 500000
      }
    }),
    prisma.safe.upsert({
      where: { name: 'خزينة الطوارئ' },
      update: {},
      create: {
        name: 'خزينة الطوارئ',
        balance: 200000
      }
    })
  ])
  console.log(`✅ تم إنشاء ${safes.length} خزينة`)

  // Create sample contract
  const contract = await prisma.contract.create({
    data: {
      unitId: units[0].id,
      customerId: customers[0].id,
      start: new Date(),
      totalPrice: 500000,
      downPayment: 100000,
      discountAmount: 0,
      brokerName: brokers[0].name,
      brokerPercent: 5,
      brokerAmount: 25000,
      commissionSafeId: safes[0].id,
      downPaymentSafeId: safes[0].id,
      maintenanceDeposit: 10000,
      installmentType: 'شهري',
      installmentCount: 60,
      extraAnnual: 0,
      annualPaymentValue: 0,
      paymentType: 'installment'
    }
  })
  console.log('✅ تم إنشاء عقد تجريبي')

  // Create sample installments
  const installments = []
  for (let i = 1; i <= 12; i++) {
    const dueDate = new Date()
    dueDate.setMonth(dueDate.getMonth() + i)
    
    installments.push({
      unitId: units[0].id,
      amount: 5000,
      dueDate: dueDate,
      status: i <= 3 ? 'مدفوع' : 'معلق',
      notes: `قسط رقم ${i}`
    })
  }
  
  await prisma.installment.createMany({ data: installments })
  console.log(`✅ تم إنشاء ${installments.length} قسط`)

  // Create sample vouchers
  const vouchers = [
    {
      safeId: safes[0].id,
      type: 'receipt',
      amount: 100000,
      description: 'دفعة مقدمة من العميل',
      reference: 'VOUCHER-001'
    },
    {
      safeId: safes[0].id,
      type: 'payment',
      amount: 50000,
      description: 'مصاريف إدارية',
      reference: 'VOUCHER-002'
    }
  ]
  
  await prisma.voucher.createMany({ data: vouchers })
  console.log(`✅ تم إنشاء ${vouchers.length} سند`)

  console.log('🎉 تمت إعادة تهيئة قاعدة البيانات بنجاح!')
  console.log('')
  console.log('👤 بيانات تسجيل الدخول:')
  console.log('   - اسم المستخدم: admin')
  console.log('   - كلمة المرور: admin123')
  console.log('')
  console.log('📊 البيانات المُنشأة:')
  console.log(`   - العملاء: ${customers.length}`)
  console.log(`   - الوحدات: ${units.length}`)
  console.log(`   - الوسطاء: ${brokers.length}`)
  console.log(`   - الشركاء: ${partners.length}`)
  console.log(`   - الخزائن: ${safes.length}`)
  console.log(`   - العقود: 1`)
  console.log(`   - الأقساط: ${installments.length}`)
  console.log(`   - السندات: ${vouchers.length}`)

} catch (error) {
  console.error('❌ خطأ في سكريبت البذور:', error)
  throw error
} finally {
  await prisma.$disconnect()
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

module.exports = { main }