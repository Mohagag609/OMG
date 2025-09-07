// اختبار API تسجيل الدخول مباشرة
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const prisma = new PrismaClient()
const JWT_SECRET = 'estate-management-development-secret-key'

async function testLoginAPI() {
  try {
    console.log('🧪 اختبار API تسجيل الدخول...')
    
    // البحث عن المستخدم admin
    const user = await prisma.user.findUnique({
      where: { username: 'admin' }
    })
    
    if (!user) {
      console.log('❌ لم يتم العثور على مستخدم admin')
      return
    }
    
    console.log('✅ تم العثور على المستخدم:', user.username)
    console.log('📊 كلمة المرور المشفرة:', user.password.substring(0, 20) + '...')
    
    // اختبار كلمة المرور
    const isValidPassword = await bcrypt.compare('admin123', user.password)
    console.log('🔐 صحة كلمة المرور:', isValidPassword)
    
    if (isValidPassword) {
      // إنشاء التوكن
      const token = jwt.sign(
        { 
          id: user.id.toString(), 
          username: user.username, 
          role: user.role 
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      )
      
      console.log('🎫 التوكن:', token.substring(0, 50) + '...')
      
      // اختبار فك تشفير التوكن
      const decoded = jwt.verify(token, JWT_SECRET)
      console.log('🔓 التوكن المفكوك:', decoded)
      
      console.log('✅ كل شيء يعمل بشكل صحيح!')
    } else {
      console.log('❌ كلمة المرور غير صحيحة')
    }
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testLoginAPI()