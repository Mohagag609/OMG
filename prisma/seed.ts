import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 بدء إدراج البيانات التجريبية...')

  // Create default users
  console.log('👤 إنشاء المستخدمين...')
  
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: await hashPassword('admin123'),
      email: 'admin@example.com',
      fullName: 'مدير النظام',
      role: 'admin'
    }
  })

  const regularUser = await prisma.user.upsert({
    where: { username: 'user' },
    update: {},
    create: {
      username: 'user',
      password: await hashPassword('user123'),
      email: 'user@example.com',
      fullName: 'مستخدم عادي',
      role: 'user'
    }
  })

  console.log('✅ تم إنشاء المستخدمين:', { adminUser: adminUser.username, regularUser: regularUser.username })

  // Create sample customers
  console.log('👥 إنشاء العملاء...')
  
  const customer1 = await prisma.customer.upsert({
    where: { phone: '01234567890' },
    update: {},
    create: {
      name: 'أحمد محمد',
      phone: '01234567890',
      nationalId: '12345678901234',
      address: 'القاهرة، مصر',
      status: 'نشط'
    }
  })

  const customer2 = await prisma.customer.upsert({
    where: { phone: '01234567891' },
    update: {},
    create: {
      name: 'فاطمة علي',
      phone: '01234567891',
      nationalId: '12345678901235',
      address: 'الإسكندرية، مصر',
      status: 'نشط'
    }
  })

  console.log('✅ تم إنشاء العملاء:', { customer1: customer1.name, customer2: customer2.name })

  // Create sample units
  console.log('🏢 إنشاء الوحدات...')
  
  const unit1 = await prisma.unit.upsert({
    where: { code: 'A101' },
    update: {},
    create: {
      code: 'A101',
      name: 'شقة 101 - الطابق الأول',
      unitType: 'سكني',
      area: '120 متر مربع',
      floor: '1',
      building: 'المبنى أ',
      totalPrice: 500000,
      status: 'متاحة'
    }
  })

  const unit2 = await prisma.unit.upsert({
    where: { code: 'A102' },
    update: {},
    create: {
      code: 'A102',
      name: 'شقة 102 - الطابق الأول',
      unitType: 'سكني',
      area: '100 متر مربع',
      floor: '1',
      building: 'المبنى أ',
      totalPrice: 450000,
      status: 'متاحة'
    }
  })

  console.log('✅ تم إنشاء الوحدات:', { unit1: unit1.code, unit2: unit2.code })

  // Create sample safes
  console.log('💰 إنشاء الخزائن...')
  
  const safe1 = await prisma.safe.upsert({
    where: { name: 'الخزينة الرئيسية' },
    update: {},
    create: {
      name: 'الخزينة الرئيسية',
      balance: 100000
    }
  })

  const safe2 = await prisma.safe.upsert({
    where: { name: 'خزينة الطوارئ' },
    update: {},
    create: {
      name: 'خزينة الطوارئ',
      balance: 50000
    }
  })

  console.log('✅ تم إنشاء الخزائن:', { safe1: safe1.name, safe2: safe2.name })

  // Create sample brokers
  console.log('🤝 إنشاء الوسطاء...')
  
  const broker1 = await prisma.broker.upsert({
    where: { name: 'محمد الوكيل' },
    update: {},
    create: {
      name: 'محمد الوكيل',
      phone: '01234567892',
      notes: 'وسيط موثوق'
    }
  })

  const broker2 = await prisma.broker.upsert({
    where: { name: 'سارة الوسيط' },
    update: {},
    create: {
      name: 'سارة الوسيط',
      phone: '01234567893',
      notes: 'خبرة 10 سنوات'
    }
  })

  console.log('✅ تم إنشاء الوسطاء:', { broker1: broker1.name, broker2: broker2.name })

  // Create sample partners
  console.log('🤝 إنشاء الشركاء...')
  
  const partner1 = await prisma.partner.create({
    data: {
      name: 'شركة الاستثمار الأولى',
      phone: '01234567894',
      notes: 'شريك رئيسي'
    }
  })

  const partner2 = await prisma.partner.create({
    data: {
      name: 'مجموعة التطوير العقاري',
      phone: '01234567895',
      notes: 'شريك ثانوي'
    }
  })

  console.log('✅ تم إنشاء الشركاء:', { partner1: partner1.name, partner2: partner2.name })

  console.log('🎉 تم الانتهاء من إدراج البيانات التجريبية بنجاح!')
}

main()
  .catch((e) => {
    console.error('❌ خطأ في إدراج البيانات:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })