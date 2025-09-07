// اختبار إنشاء عميل جديد
const testCustomer = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/customers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // في الواقع ستحتاج token صحيح
      },
      body: JSON.stringify({
        name: 'عميل تجريبي جديد',
        phone: '', // رقم هاتف فارغ - يجب أن يعمل الآن
        nationalId: '',
        address: 'عنوان تجريبي',
        status: 'نشط',
        notes: 'اختبار بعد الإصلاح'
      })
    })

    const data = await response.json()
    console.log('نتيجة الاختبار:', data)
    
    if (data.success) {
      console.log('✅ تم إنشاء العميل بنجاح!')
      console.log('اسم العميل:', data.data.name)
    } else {
      console.log('❌ فشل في إنشاء العميل:', data.error)
    }
  } catch (error) {
    console.error('خطأ في الاختبار:', error)
  }
}

// تشغيل الاختبار
testCustomer()