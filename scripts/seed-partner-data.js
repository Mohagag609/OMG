const { PrismaClient } = require('@prisma/client')

async function seedPartnerData() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://neondb_owner:npg_x5qvmpzF3hjX@ep-dawn-cell-adylfb98-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
      }
    }
  })

  try {
    console.log('🌱 إنشاء بيانات تجريبية للشركاء والوحدات...')

    // إنشاء شركاء
    const partner1 = await prisma.partner.create({
      data: {
        name: 'أحمد محمد',
        phone: '01234567890',
        notes: 'شريك رئيسي'
      }
    })

    const partner2 = await prisma.partner.create({
      data: {
        name: 'فاطمة علي',
        phone: '01234567891',
        notes: 'شريكة'
      }
    })

    const partner3 = await prisma.partner.create({
      data: {
        name: 'محمد حسن',
        phone: '01234567892',
        notes: 'شريك'
      }
    })

    console.log('✅ تم إنشاء 3 شركاء')

    // إنشاء وحدات
    const unit1 = await prisma.unit.create({
      data: {
        code: 'A101',
        name: 'شقة 101 - المبنى أ',
        unitType: 'سكني',
        area: '120 متر مربع',
        floor: 'الطابق الأول',
        building: 'المبنى أ',
        totalPrice: 500000,
        status: 'مباع'
      }
    })

    const unit2 = await prisma.unit.create({
      data: {
        code: 'A102',
        name: 'شقة 102 - المبنى أ',
        unitType: 'سكني',
        area: '100 متر مربع',
        floor: 'الطابق الأول',
        building: 'المبنى أ',
        totalPrice: 450000,
        status: 'مباع'
      }
    })

    const unit3 = await prisma.unit.create({
      data: {
        code: 'B201',
        name: 'شقة 201 - المبنى ب',
        unitType: 'سكني',
        area: '150 متر مربع',
        floor: 'الطابق الثاني',
        building: 'المبنى ب',
        totalPrice: 600000,
        status: 'مباع'
      }
    })

    console.log('✅ تم إنشاء 3 وحدات')

    // إنشاء عملاء
    const customer1 = await prisma.customer.create({
      data: {
        name: 'سارة أحمد',
        phone: '01234567893',
        nationalId: '12345678901234',
        address: 'القاهرة',
        status: 'نشط'
      }
    })

    const customer2 = await prisma.customer.create({
      data: {
        name: 'خالد محمود',
        phone: '01234567894',
        nationalId: '12345678901235',
        address: 'الجيزة',
        status: 'نشط'
      }
    })

    const customer3 = await prisma.customer.create({
      data: {
        name: 'نور الدين',
        phone: '01234567895',
        nationalId: '12345678901236',
        address: 'الإسكندرية',
        status: 'نشط'
      }
    })

    console.log('✅ تم إنشاء 3 عملاء')

    // إنشاء عقود
    const contract1 = await prisma.contract.create({
      data: {
        unitId: unit1.id,
        customerId: customer1.id,
        start: new Date('2024-01-01'),
        totalPrice: 500000,
        discountAmount: 25000,
        downPayment: 100000,
        installmentType: 'شهري',
        installmentCount: 60, // 5 سنوات
        paymentType: 'installment'
      }
    })

    const contract2 = await prisma.contract.create({
      data: {
        unitId: unit2.id,
        customerId: customer2.id,
        start: new Date('2024-02-01'),
        totalPrice: 450000,
        discountAmount: 20000,
        downPayment: 90000,
        installmentType: 'شهري',
        installmentCount: 48, // 4 سنوات
        paymentType: 'installment'
      }
    })

    const contract3 = await prisma.contract.create({
      data: {
        unitId: unit3.id,
        customerId: customer3.id,
        start: new Date('2024-03-01'),
        totalPrice: 600000,
        discountAmount: 30000,
        downPayment: 120000,
        installmentType: 'شهري',
        installmentCount: 72, // 6 سنوات
        paymentType: 'installment'
      }
    })

    console.log('✅ تم إنشاء 3 عقود')

    // إنشاء شراكات الوحدات
    // الوحدة الأولى - شريكين
    await prisma.unitPartner.create({
      data: {
        unitId: unit1.id,
        partnerId: partner1.id,
        percentage: 60
      }
    })

    await prisma.unitPartner.create({
      data: {
        unitId: unit1.id,
        partnerId: partner2.id,
        percentage: 40
      }
    })

    // الوحدة الثانية - شريك واحد
    await prisma.unitPartner.create({
      data: {
        unitId: unit2.id,
        partnerId: partner1.id,
        percentage: 100
      }
    })

    // الوحدة الثالثة - ثلاثة شركاء
    await prisma.unitPartner.create({
      data: {
        unitId: unit3.id,
        partnerId: partner1.id,
        percentage: 50
      }
    })

    await prisma.unitPartner.create({
      data: {
        unitId: unit3.id,
        partnerId: partner2.id,
        percentage: 30
      }
    })

    await prisma.unitPartner.create({
      data: {
        unitId: unit3.id,
        partnerId: partner3.id,
        percentage: 20
      }
    })

    console.log('✅ تم إنشاء شراكات الوحدات')

    // إنشاء أقساط شهرية للعام الحالي
    const currentYear = new Date().getFullYear()
    const months = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ]

    // حساب الأقساط الشهرية
    const installment1 = (500000 - 25000 - 100000) / 60 // 6250 جنيه
    const installment2 = (450000 - 20000 - 90000) / 48 // 7083 جنيه
    const installment3 = (600000 - 30000 - 120000) / 72 // 6250 جنيه

    for (let month = 0; month < 12; month++) {
      const dueDate = new Date(currentYear, month, 1)
      
      // أقساط الوحدة الأولى
      await prisma.installment.create({
        data: {
          unitId: unit1.id,
          amount: installment1,
          dueDate: dueDate,
          status: 'معلق'
        }
      })

      // أقساط الوحدة الثانية
      await prisma.installment.create({
        data: {
          unitId: unit2.id,
          amount: installment2,
          dueDate: dueDate,
          status: 'معلق'
        }
      })

      // أقساط الوحدة الثالثة
      await prisma.installment.create({
        data: {
          unitId: unit3.id,
          amount: installment3,
          dueDate: dueDate,
          status: 'معلق'
        }
      })
    }

    console.log('✅ تم إنشاء الأقساط الشهرية للعام الحالي')
    console.log('')
    console.log('📊 ملخص البيانات المُنشأة:')
    console.log(`👥 الشركاء: 3`)
    console.log(`🏠 الوحدات: 3`)
    console.log(`👤 العملاء: 3`)
    console.log(`📋 العقود: 3`)
    console.log(`💰 الأقساط: 36 (12 شهر × 3 وحدات)`)
    console.log('')
    console.log('💵 الأقساط الشهرية:')
    console.log(`   الوحدة A101: ${installment1.toLocaleString()} جنيه`)
    console.log(`   الوحدة A102: ${installment2.toLocaleString()} جنيه`)
    console.log(`   الوحدة B201: ${installment3.toLocaleString()} جنيه`)

  } catch (error) {
    console.error('❌ خطأ في إنشاء البيانات:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// تشغيل السكريبت
seedPartnerData()
  .then(() => {
    console.log('🎉 تم إنشاء البيانات التجريبية بنجاح!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 فشل في إنشاء البيانات:', error)
    process.exit(1)
  })