const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createUsers() {
  console.log('🔐 بدء إنشاء المستخدمين...')
  
  try {
    // Create admin user
    const adminUser = await prisma.user.upsert({
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
    
    // Create regular user
    const regularUser = await prisma.user.upsert({
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
    
    console.log('🎉 تم الانتهاء من إنشاء المستخدمين!')
    console.log('📋 بيانات الدخول:')
    console.log('👤 Admin: username=admin, password=admin123')
    console.log('👤 User: username=user, password=user123')
    
  } catch (error) {
    console.error('❌ خطأ في إنشاء المستخدمين:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createUsers()