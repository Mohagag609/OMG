const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkUsers() {
  try {
    console.log('🔍 فحص المستخدمين في قاعدة البيانات...')
    
    const users = await prisma.user.findMany()
    
    console.log(`📊 عدد المستخدمين: ${users.length}`)
    
    users.forEach(user => {
      console.log(`👤 ${user.username} - ${user.fullName} - ${user.role}`)
    })
    
    if (users.length === 0) {
      console.log('❌ لا يوجد مستخدمين! دعني أنشئهم...')
      
      const bcrypt = require('bcryptjs')
      
      // إنشاء admin
      const adminPassword = await bcrypt.hash('admin123', 12)
      const admin = await prisma.user.create({
        data: {
          username: 'admin',
          password: adminPassword,
          email: 'admin@estate.com',
          fullName: 'مدير النظام',
          role: 'admin',
          isActive: true
        }
      })
      console.log('✅ تم إنشاء admin')
      
      // إنشاء user
      const userPassword = await bcrypt.hash('user123', 12)
      const user = await prisma.user.create({
        data: {
          username: 'user',
          password: userPassword,
          email: 'user@estate.com',
          fullName: 'مستخدم عادي',
          role: 'user',
          isActive: true
        }
      })
      console.log('✅ تم إنشاء user')
    }
    
  } catch (error) {
    console.error('❌ خطأ في فحص المستخدمين:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()