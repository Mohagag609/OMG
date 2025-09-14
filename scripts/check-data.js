const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 فحص البيانات الموجودة...')

  try {
    // فحص العملاء
    const customers = await prisma.customer.findMany()
    console.log(`📊 العملاء: ${customers.length}`)
    customers.forEach(customer => {
      console.log(`  - ${customer.name} (${customer.phone})`)
    })

    // فحص الوحدات
    const units = await prisma.unit.findMany()
    console.log(`🏠 الوحدات: ${units.length}`)
    units.forEach(unit => {
      console.log(`  - ${unit.name} (${unit.code}) - ${unit.status}`)
    })

    // فحص الشركاء
    const partners = await prisma.partner.findMany()
    console.log(`🤝 الشركاء: ${partners.length}`)
    partners.forEach(partner => {
      console.log(`  - ${partner.name} (${partner.phone})`)
    })

    // فحص المستخدمين
    const users = await prisma.user.findMany()
    console.log(`👤 المستخدمين: ${users.length}`)
    users.forEach(user => {
      console.log(`  - ${user.username} (${user.role})`)
    })

    // فحص العقود
    const contracts = await prisma.contract.findMany()
    console.log(`📄 العقود: ${contracts.length}`)

    // فحص الأقساط
    const installments = await prisma.installment.findMany()
    console.log(`💰 الأقساط: ${installments.length}`)

  } catch (error) {
    console.error('❌ خطأ في فحص البيانات:', error.message)
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect()
  })