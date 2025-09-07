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

  // إنشاء خزنة افتراضية (إذا لم تكن موجودة)
  let defaultSafe = await prisma.safe.findFirst({
    where: { name: 'الخزنة الرئيسية' }
  })
  
  if (!defaultSafe) {
    defaultSafe = await prisma.safe.create({
      data: {
        name: 'الخزنة الرئيسية',
        balance: 0
      }
    })
  }

  // إنشاء عميل تجريبي (إذا لم يكن موجوداً)
  let testCustomer = await prisma.customer.findFirst({
    where: { nationalId: '12345678901234' }
  })
  
  if (!testCustomer) {
    testCustomer = await prisma.customer.create({
      data: {
        name: 'أحمد محمد علي',
        phone: '01012345678',
        nationalId: '12345678901234',
        address: 'القاهرة، مصر',
        status: 'نشط',
        notes: 'عميل تجريبي'
      }
    })
  }

  // إنشاء وحدة تجريبية (إذا لم تكن موجودة)
  let testUnit = await prisma.unit.findFirst({
    where: { code: 'A-101' }
  })
  
  if (!testUnit) {
    testUnit = await prisma.unit.create({
      data: {
        code: 'A-101',
        name: 'شقة 101',
        unitType: 'سكني',
        area: '120 متر مربع',
        floor: 'الطابق الأول',
        building: 'المبنى أ',
        totalPrice: 500000,
        status: 'متاحة',
        notes: 'وحدة تجريبية'
      }
    })
  }

  // إنشاء شريك تجريبي (إذا لم يكن موجوداً)
  let testPartner = await prisma.partner.findFirst({
    where: { name: 'محمد أحمد' }
  })
  
  if (!testPartner) {
    testPartner = await prisma.partner.create({
      data: {
        name: 'محمد أحمد',
        phone: '01087654321',
        notes: 'شريك تجريبي'
      }
    })
  }

  // إنشاء وسيط تجريبي (إذا لم يكن موجوداً)
  let testBroker = await prisma.broker.findFirst({
    where: { name: 'علي حسن' }
  })
  
  if (!testBroker) {
    testBroker = await prisma.broker.create({
      data: {
        name: 'علي حسن',
        phone: '01011111111',
        notes: 'وسيط تجريبي'
      }
    })
  }

  console.log('✅ تم إنشاء البيانات التجريبية بنجاح!')
  console.log(`- الخزنة: ${defaultSafe.name}`)
  console.log(`- العميل: ${testCustomer.name}`)
  console.log(`- الوحدة: ${testUnit.code}`)
  console.log(`- الشريك: ${testPartner.name}`)
  console.log(`- الوسيط: ${testBroker.name}`)
}

main()
  .catch((e) => {
    console.error('❌ خطأ في إضافة البيانات التجريبية:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })