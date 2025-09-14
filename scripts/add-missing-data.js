const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('➕ إضافة البيانات المفقودة...')

  try {
    // إضافة الشركاء
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

    // إضافة مستخدم إداري
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

    console.log('✅ تم إضافة البيانات بنجاح!')
    console.log(`- ${partners.count} شريك`)
    console.log(`- 1 مستخدم إداري`)

  } catch (error) {
    console.error('❌ خطأ في إضافة البيانات:', error.message)
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect()
  })