import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 بدء إضافة البيانات التجريبية...')

  // إنشاء المستخدمين الافتراضيين
  const bcrypt = require('bcryptjs')
  
  // إنشاء مستخدم admin
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: { password: await bcrypt.hash('admin123', 12) },
    create: {
      username: 'admin',
      password: await bcrypt.hash('admin123', 12),
      email: 'admin@example.com',
      fullName: 'مدير النظام',
      role: 'admin'
    }
  })
  console.log('✅ تم إنشاء مستخدم admin')

  // إنشاء مستخدم عادي
  await prisma.user.upsert({
    where: { username: 'user' },
    update: { password: await bcrypt.hash('user123', 12) },
    create: {
      username: 'user',
      password: await bcrypt.hash('user123', 12),
      email: 'user@example.com',
      fullName: 'مستخدم عادي',
      role: 'user'
    }
  })
  console.log('✅ تم إنشاء مستخدم user')

  // إنشاء الخزن
  const safes = [
    { name: 'الخزنة الرئيسية', balance: 100000 },
    { name: 'خزنة العمولات', balance: 50000 },
    { name: 'خزنة الصيانة', balance: 25000 }
  ]

  for (const safeData of safes) {
    await prisma.safe.upsert({
      where: { name: safeData.name },
      update: { balance: safeData.balance },
      create: safeData
    })
  }
  console.log('✅ تم إنشاء الخزن')

  // إنشاء العملاء
  const customers = [
    {
      name: 'أحمد محمد علي',
      phone: '01012345678',
      nationalId: '12345678901234',
      address: 'القاهرة، مصر',
      status: 'نشط',
      notes: 'عميل VIP'
    },
    {
      name: 'فاطمة أحمد حسن',
      phone: '01023456789',
      nationalId: '23456789012345',
      address: 'الإسكندرية، مصر',
      status: 'نشط',
      notes: 'عميلة عادية'
    },
    {
      name: 'محمد علي إبراهيم',
      phone: '01034567890',
      nationalId: '34567890123456',
      address: 'الجيزة، مصر',
      status: 'معلق',
      notes: 'عميل معلق'
    }
  ]

  for (const customerData of customers) {
    await prisma.customer.upsert({
      where: { nationalId: customerData.nationalId },
      update: customerData,
      create: customerData
    })
  }
  console.log('✅ تم إنشاء العملاء')

  // إنشاء الوحدات
  const units = [
    {
      code: 'A-101',
      name: 'شقة 101',
      unitType: 'سكني',
      area: '120 متر مربع',
      floor: 'الطابق الأول',
      building: 'المبنى أ',
      totalPrice: 500000,
      status: 'متاحة',
      notes: 'شقة 3 غرف'
    },
    {
      code: 'A-102',
      name: 'شقة 102',
      unitType: 'سكني',
      area: '100 متر مربع',
      floor: 'الطابق الأول',
      building: 'المبنى أ',
      totalPrice: 400000,
      status: 'متاحة',
      notes: 'شقة غرفتين'
    },
    {
      code: 'B-201',
      name: 'مكتب 201',
      unitType: 'تجاري',
      area: '80 متر مربع',
      floor: 'الطابق الثاني',
      building: 'المبنى ب',
      totalPrice: 300000,
      status: 'مؤجر',
      notes: 'مكتب تجاري'
    }
  ]

  for (const unitData of units) {
    await prisma.unit.upsert({
      where: { code: unitData.code },
      update: unitData,
      create: unitData
    })
  }
  console.log('✅ تم إنشاء الوحدات')

  // إنشاء الشركاء
  const partners = [
    {
      name: 'محمد أحمد',
      phone: '01087654321',
      notes: 'شريك رئيسي'
    },
    {
      name: 'سارة محمد',
      phone: '01076543210',
      notes: 'شريكة ثانوية'
    },
    {
      name: 'علي حسن',
      phone: '01065432109',
      notes: 'شريك استثماري'
    }
  ]

  for (const partnerData of partners) {
    await prisma.partner.upsert({
      where: { name: partnerData.name },
      update: partnerData,
      create: partnerData
    })
  }
  console.log('✅ تم إنشاء الشركاء')

  // إنشاء الوسطاء
  const brokers = [
    {
      name: 'علي حسن',
      phone: '01011111111',
      notes: 'وسيط رئيسي'
    },
    {
      name: 'نور الدين',
      phone: '01022222222',
      notes: 'وسيط ثانوي'
    }
  ]

  for (const brokerData of brokers) {
    await prisma.broker.upsert({
      where: { name: brokerData.name },
      update: brokerData,
      create: brokerData
    })
  }
  console.log('✅ تم إنشاء الوسطاء')

  // إنشاء مجموعات الشركاء
  const partnerGroups = [
    {
      name: 'المجموعة الرئيسية',
      notes: 'مجموعة الشركاء الرئيسيين'
    },
    {
      name: 'المجموعة الاستثمارية',
      notes: 'مجموعة المستثمرين'
    }
  ]

  for (const groupData of partnerGroups) {
    await prisma.partnerGroup.upsert({
      where: { name: groupData.name },
      update: groupData,
      create: groupData
    })
  }
  console.log('✅ تم إنشاء مجموعات الشركاء')

  // إنشاء بعض السندات التجريبية
  const defaultSafe = await prisma.safe.findFirst()
  if (defaultSafe) {
    const vouchers = [
      {
        type: 'receipt',
        date: new Date(),
        amount: 50000,
        safeId: defaultSafe.id,
        description: 'دفعة مقدمة من عميل',
        payer: 'أحمد محمد علي',
        beneficiary: 'الشركة'
      },
      {
        type: 'payment',
        date: new Date(),
        amount: 10000,
        safeId: defaultSafe.id,
        description: 'مصاريف إدارية',
        payer: 'الشركة',
        beneficiary: 'المورد'
      }
    ]

    for (const voucherData of vouchers) {
      await prisma.voucher.create({
        data: voucherData
      })
    }
    console.log('✅ تم إنشاء السندات')
  }

  console.log('✅ تم إنشاء جميع البيانات التجريبية بنجاح!')
  console.log('📊 ملخص البيانات:')
  console.log(`- المستخدمين: 2`)
  console.log(`- الخزن: ${safes.length}`)
  console.log(`- العملاء: ${customers.length}`)
  console.log(`- الوحدات: ${units.length}`)
  console.log(`- الشركاء: ${partners.length}`)
  console.log(`- الوسطاء: ${brokers.length}`)
  console.log(`- مجموعات الشركاء: ${partnerGroups.length}`)
}

main()
  .catch((e) => {
    console.error('❌ خطأ في إضافة البيانات التجريبية:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })