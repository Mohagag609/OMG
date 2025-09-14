const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 بدء إضافة البيانات التجريبية...')

  // إنشاء عملاء تجريبيين
  const customers = await prisma.customer.createMany({
    data: [
      {
        name: 'أحمد محمد',
        phone: '0501234567',
        nationalId: '1234567890',
        address: 'الرياض، حي النرجس',
        status: 'نشط',
        notes: 'عميل مميز'
      },
      {
        name: 'فاطمة علي',
        phone: '0507654321',
        nationalId: '0987654321',
        address: 'جدة، حي الزهراء',
        status: 'نشط',
        notes: 'مهتمة بوحدة سكنية'
      },
      {
        name: 'محمد عبدالله',
        phone: '0509876543',
        nationalId: '1122334455',
        address: 'الدمام، حي الفيصلية',
        status: 'نشط',
        notes: 'يبحث عن استثمار'
      }
    ]
  })

  // إنشاء وحدات تجريبية
  const units = await prisma.unit.createMany({
    data: [
      {
        code: 'V001',
        name: 'فيلا رقم 1',
        unitType: 'سكني',
        area: '300 متر مربع',
        floor: 'أرضي',
        building: 'مبنى أ',
        totalPrice: 1500000,
        status: 'متاحة',
        notes: 'فيلا فاخرة مع حديقة'
      },
      {
        code: 'A101',
        name: 'شقة رقم 101',
        unitType: 'سكني',
        area: '120 متر مربع',
        floor: 'الأول',
        building: 'مبنى ب',
        totalPrice: 800000,
        status: 'متاحة',
        notes: 'شقة حديثة مع إطلالة جميلة'
      },
      {
        code: 'S201',
        name: 'مكتب رقم 201',
        unitType: 'تجاري',
        area: '80 متر مربع',
        floor: 'الثاني',
        building: 'مبنى ج',
        totalPrice: 500000,
        status: 'متاحة',
        notes: 'مكتب مناسب للشركات الصغيرة'
      }
    ]
  })

  // إنشاء شركاء تجريبيين
  const partners = await prisma.partner.createMany({
    data: [
      {
        name: 'شركة الاستثمار العقاري',
        phone: '0112345678',
        notes: 'شريك استراتيجي'
      },
      {
        name: 'مجموعة البناء المتقدم',
        phone: '0118765432',
        notes: 'متخصصة في البناء السكني'
      }
    ]
  })

  // إنشاء مستخدم إداري
  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@estate.com',
      password: '$2a$10$rQZ8kF9XvQZ8kF9XvQZ8kOeQZ8kF9XvQZ8kF9XvQZ8kF9XvQZ8kF9X', // password: admin123
      role: 'admin',
      fullName: 'مدير النظام',
      isActive: true
    }
  })

  console.log('✅ تم إنشاء البيانات التجريبية بنجاح!')
  console.log(`- ${customers.count} عميل`)
  console.log(`- ${units.count} وحدة`)
  console.log(`- ${partners.count} شريك`)
  console.log(`- 1 مستخدم إداري`)
}

main()
  .catch((e) => {
    console.error('❌ خطأ في إضافة البيانات:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })