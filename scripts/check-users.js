const { PrismaClient } = require('@prisma/client')

async function checkUsers() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://neondb_owner:npg_x5qvmpzF3hjX@ep-dawn-cell-adylfb98-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
      }
    }
  })

  try {
    console.log('🔍 جلب قائمة المستخدمين...')
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`📊 إجمالي المستخدمين: ${users.length}`)
    console.log('')
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username}`)
      console.log(`   - ID: ${user.id}`)
      console.log(`   - Email: ${user.email || 'غير محدد'}`)
      console.log(`   - Full Name: ${user.fullName || 'غير محدد'}`)
      console.log(`   - Role: ${user.role}`)
      console.log(`   - Active: ${user.isActive ? 'نعم' : 'لا'}`)
      console.log(`   - Created: ${user.createdAt}`)
      console.log('')
    })

  } catch (error) {
    console.error('❌ خطأ في جلب المستخدمين:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// تشغيل السكريبت
checkUsers()
  .then(() => {
    console.log('✅ تم جلب المستخدمين بنجاح!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 فشل في جلب المستخدمين:', error)
    process.exit(1)
  })