const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

async function createAdminUser() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://neondb_owner:npg_x5qvmpzF3hjX@ep-dawn-cell-adylfb98-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
      }
    }
  })

  try {
    console.log('🔍 التحقق من وجود مستخدم admin...')
    
    // التحقق من وجود المستخدم
    const existingUser = await prisma.user.findUnique({
      where: { username: 'admin' }
    })

    if (existingUser) {
      console.log('⚠️ مستخدم admin موجود بالفعل')
      console.log('📋 معلومات المستخدم:')
      console.log(`   - ID: ${existingUser.id}`)
      console.log(`   - Username: ${existingUser.username}`)
      console.log(`   - Email: ${existingUser.email || 'غير محدد'}`)
      console.log(`   - Role: ${existingUser.role}`)
      console.log(`   - Active: ${existingUser.isActive ? 'نعم' : 'لا'}`)
      console.log(`   - Created: ${existingUser.createdAt}`)
      
      // تحديث كلمة المرور
      console.log('🔄 تحديث كلمة المرور...')
      const hashedPassword = await bcrypt.hash('Admin123', 12)
      
      const updatedUser = await prisma.user.update({
        where: { username: 'admin' },
        data: {
          password: hashedPassword,
          isActive: true,
          role: 'admin'
        }
      })
      
      console.log('✅ تم تحديث كلمة المرور بنجاح')
      return updatedUser
    }

    console.log('➕ إنشاء مستخدم admin جديد...')
    
    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash('Admin123', 12)
    
    // إنشاء المستخدم
    const newUser = await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        email: 'admin@example.com',
        fullName: 'مدير النظام',
        role: 'admin',
        isActive: true
      }
    })

    console.log('✅ تم إنشاء مستخدم admin بنجاح!')
    console.log('📋 معلومات المستخدم:')
    console.log(`   - ID: ${newUser.id}`)
    console.log(`   - Username: ${newUser.username}`)
    console.log(`   - Email: ${newUser.email}`)
    console.log(`   - Full Name: ${newUser.fullName}`)
    console.log(`   - Role: ${newUser.role}`)
    console.log(`   - Active: ${newUser.isActive ? 'نعم' : 'لا'}`)
    console.log(`   - Created: ${newUser.createdAt}`)
    
    return newUser

  } catch (error) {
    console.error('❌ خطأ في إنشاء المستخدم:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// تشغيل السكريبت
createAdminUser()
  .then(() => {
    console.log('🎉 تم إنجاز المهمة بنجاح!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 فشل في إنجاز المهمة:', error)
    process.exit(1)
  })