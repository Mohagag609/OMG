const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🔐 بدء إنشاء المستخدمين...')

  // إنشاء مستخدم admin
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      email: 'admin@estate.com',
      fullName: 'مدير النظام',
      role: 'admin',
      isActive: true
    }
  })

  console.log('✅ تم إنشاء مستخدم admin')

  // إنشاء مستخدم عادي
  const userPassword = await bcrypt.hash('user123', 12)
  const user = await prisma.user.upsert({
    where: { username: 'user' },
    update: {},
    create: {
      username: 'user',
      password: userPassword,
      email: 'user@estate.com',
      fullName: 'مستخدم عادي',
      role: 'user',
      isActive: true
    }
  })

  console.log('✅ تم إنشاء مستخدم user')

  console.log('🎉 تم الانتهاء من إنشاء المستخدمين!')
  console.log('📋 بيانات الدخول:')
  console.log('👤 Admin: username=admin, password=admin123')
  console.log('👤 User: username=user, password=user123')
}

main()
  .catch((e) => {
    console.error('❌ خطأ في إنشاء المستخدمين:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })