// اختبار إعادة تهيئة قاعدة البيانات
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const JWT_SECRET = 'estate-management-development-secret-key'

async function testDatabaseReset() {
  try {
    console.log('🧪 اختبار إعادة تهيئة قاعدة البيانات...')
    
    // البحث عن المستخدم admin
    const user = await prisma.user.findFirst({
      where: { username: 'admin' }
    })
    
    if (!user) {
      console.log('❌ لم يتم العثور على مستخدم admin')
      return
    }
    
    console.log('✅ تم العثور على المستخدم:', user.username)
    
    // إنشاء token صحيح
    const token = jwt.sign(
      { id: user.id.toString(), username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    )
    
    console.log('🔑 Token:', token.substring(0, 50) + '...')
    
    // اختبار API إعادة التهيئة
    console.log('\n🔄 اختبار API إعادة التهيئة...')
    const resetResponse = await fetch('http://localhost:3000/api/database/reset', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    console.log('📊 حالة الاستجابة:', resetResponse.status)
    
    if (resetResponse.status === 200) {
      const data = await resetResponse.json()
      console.log('✅ تم إعادة التهيئة بنجاح!')
      console.log('📊 الرسالة:', data.message)
    } else {
      const data = await resetResponse.json()
      console.log('❌ فشل في إعادة التهيئة:', data.error)
    }
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabaseReset()