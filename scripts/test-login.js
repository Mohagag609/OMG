const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function testLogin() {
  try {
    console.log('🧪 اختبار تسجيل الدخول...')
    
    const username = 'admin'
    const password = 'admin123'
    
    console.log(`🔍 البحث عن المستخدم: ${username}`)
    
    const user = await prisma.user.findUnique({
      where: { username }
    })
    
    if (!user) {
      console.log('❌ المستخدم غير موجود')
      return
    }
    
    console.log('✅ المستخدم موجود:', user.username, user.fullName)
    
    console.log('🔐 التحقق من كلمة المرور...')
    const isValidPassword = await bcrypt.compare(password, user.password)
    
    if (isValidPassword) {
      console.log('✅ كلمة المرور صحيحة')
      console.log('🎉 تسجيل الدخول نجح!')
    } else {
      console.log('❌ كلمة المرور غير صحيحة')
      
      // إعادة إنشاء كلمة المرور
      console.log('🔄 إعادة إنشاء كلمة المرور...')
      const newPassword = await bcrypt.hash('admin123', 12)
      
      await prisma.user.update({
        where: { id: user.id },
        data: { password: newPassword }
      })
      
      console.log('✅ تم تحديث كلمة المرور')
    }
    
  } catch (error) {
    console.error('❌ خطأ في اختبار تسجيل الدخول:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testLogin()