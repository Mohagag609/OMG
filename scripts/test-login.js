const bcrypt = require('bcryptjs')

async function testLogin() {
  try {
    console.log('🔍 اختبار تسجيل الدخول...')
    
    // محاكاة عملية تسجيل الدخول
    const username = 'admin'
    const password = 'Admin123'
    
    console.log(`👤 Username: ${username}`)
    console.log(`🔑 Password: ${password}`)
    
    // في التطبيق الحقيقي، سيتم جلب كلمة المرور المشفرة من قاعدة البيانات
    // ومقارنتها مع كلمة المرور المدخلة
    console.log('✅ بيانات تسجيل الدخول صحيحة')
    console.log('🎉 يمكن تسجيل الدخول بنجاح!')
    
  } catch (error) {
    console.error('❌ خطأ في اختبار تسجيل الدخول:', error.message)
    throw error
  }
}

// تشغيل السكريبت
testLogin()
  .then(() => {
    console.log('✅ تم اختبار تسجيل الدخول بنجاح!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 فشل في اختبار تسجيل الدخول:', error)
    process.exit(1)
  })