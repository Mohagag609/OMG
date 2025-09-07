const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 بدء إضافة البيانات التجريبية...')

  // إنشاء عملاء
  const customer1 = await prisma.customer.create({
    data: {
      name: 'أحمد محمد',
      phone: '01234567890',
      nationalId: '12345678901234',
      address: 'القاهرة، مصر',
      status: 'نشط',
      notes: 'عميل VIP'
    }
  })

  const customer2 = await prisma.customer.create({
    data: {
      name: 'فاطمة علي',
      phone: '01234567891',
      nationalId: '12345678901235',
      address: 'الإسكندرية، مصر',
      status: 'نشط',
      notes: 'عميل جديد'
    }
  })

  console.log('✅ تم إنشاء العملاء')

  // إنشاء وحدات
  const unit1 = await prisma.unit.create({
    data: {
      code: 'A101',
      name: 'شقة 101',
      unitType: 'سكني',
      area: '120 متر',
      floor: 'الطابق الأول',
      building: 'المبنى أ',
      totalPrice: 500000,
      status: 'متاحة',
      notes: 'شقة مفروشة'
    }
  })

  const unit2 = await prisma.unit.create({
    data: {
      code: 'A102',
      name: 'شقة 102',
      unitType: 'سكني',
      area: '100 متر',
      floor: 'الطابق الأول',
      building: 'المبنى أ',
      totalPrice: 450000,
      status: 'متاحة',
      notes: 'شقة عادية'
    }
  })

  console.log('✅ تم إنشاء الوحدات')

  // إنشاء خزائن
  const safe1 = await prisma.safe.create({
    data: {
      name: 'الخزينة الرئيسية',
      balance: 100000,
    }
  })

  const safe2 = await prisma.safe.create({
    data: {
      name: 'خزينة الطوارئ',
      balance: 50000,
    }
  })

  console.log('✅ تم إنشاء الخزائن')

  // إنشاء عقود
  const contract1 = await prisma.contract.create({
    data: {
      unitId: unit1.id,
      customerId: customer1.id,
      start: new Date(),
      totalPrice: 500000,
      discountAmount: 10000,
      brokerName: 'محمد السمسار',
      brokerAmount: 25000,
    }
  })

  console.log('✅ تم إنشاء العقود')

  // إنشاء أقساط
  const installment1 = await prisma.installment.create({
    data: {
      unitId: unit1.id,
      amount: 50000,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // بعد شهر
      status: 'معلق',
      notes: 'القسط الأول'
    }
  })

  const installment2 = await prisma.installment.create({
    data: {
      unitId: unit1.id,
      amount: 50000,
      dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // بعد شهرين
      status: 'معلق',
      notes: 'القسط الثاني'
    }
  })

  console.log('✅ تم إنشاء الأقساط')

  // إنشاء سندات
  const voucher1 = await prisma.voucher.create({
    data: {
      type: 'receipt',
      date: new Date(),
      amount: 100000,
      safeId: safe1.id,
      description: 'دفعة مقدمة من العميل',
      payer: 'أحمد محمد',
      beneficiary: 'الشركة',
      linkedRef: unit1.id,
    }
  })

  console.log('✅ تم إنشاء السندات')

  // إنشاء إعدادات
  await prisma.settings.create({
    data: {
      key: 'company_name',
      value: 'شركة إدارة الاستثمارات العقارية'
    }
  })

  await prisma.settings.create({
    data: {
      key: 'default_currency',
      value: 'EGP'
    }
  })

  console.log('✅ تم إنشاء الإعدادات')

  console.log('🎉 تم الانتهاء من إضافة البيانات التجريبية!')
}

main()
  .catch((e) => {
    console.error('❌ خطأ في إضافة البيانات:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })