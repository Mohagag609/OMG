const { PrismaClient } = require('@prisma/client')

async function checkInstallmentCalculation() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://neondb_owner:npg_x5qvmpzF3hjX@ep-dawn-cell-adylfb98-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
      }
    }
  })

  try {
    console.log('🔍 فحص حساب الأقساط...')
    console.log('=' .repeat(60))

    // جلب جميع العقود مع تفاصيلها
    const contracts = await prisma.contract.findMany({
      where: {
        deletedAt: null
      },
      include: {
        unit: true,
        customer: true
      }
    })

    console.log(`📋 تم العثور على ${contracts.length} عقد`)
    console.log('')

    for (const contract of contracts) {
      console.log(`📄 العقد: ${contract.id}`)
      console.log(`🏠 الوحدة: ${contract.unit.code} - ${contract.unit.name}`)
      console.log(`👤 العميل: ${contract.customer.name}`)
      console.log(`💰 السعر الإجمالي: ${contract.totalPrice.toLocaleString()} جنيه`)
      console.log(`💸 مبلغ الخصم: ${contract.discountAmount.toLocaleString()} جنيه`)
      console.log(`💳 الدفعة المقدمة: ${contract.downPayment.toLocaleString()} جنيه`)
      console.log(`📅 نوع الأقساط: ${contract.installmentType}`)
      console.log(`🔢 عدد الأقساط: ${contract.installmentCount}`)
      console.log(`📅 تاريخ البداية: ${contract.start.toLocaleDateString('ar-EG')}`)
      console.log('')

      // حساب القسط الشهري
      const remainingAmount = contract.totalPrice - contract.discountAmount - contract.downPayment
      const monthlyInstallment = contract.installmentCount > 0 ? remainingAmount / contract.installmentCount : 0

      console.log(`🧮 حساب القسط الشهري:`)
      console.log(`   السعر الإجمالي: ${contract.totalPrice.toLocaleString()} جنيه`)
      console.log(`   - الخصم: ${contract.discountAmount.toLocaleString()} جنيه`)
      console.log(`   - الدفعة المقدمة: ${contract.downPayment.toLocaleString()} جنيه`)
      console.log(`   = المبلغ المتبقي: ${remainingAmount.toLocaleString()} جنيه`)
      console.log(`   ÷ عدد الأقساط: ${contract.installmentCount}`)
      console.log(`   = القسط الشهري: ${monthlyInstallment.toLocaleString()} جنيه`)
      console.log('')

      // جلب الشركاء لهذه الوحدة
      const unitPartners = await prisma.unitPartner.findMany({
        where: {
          unitId: contract.unitId,
          deletedAt: null
        },
        include: {
          partner: true
        }
      })

      console.log(`👥 الشركاء في هذه الوحدة:`)
      for (const unitPartner of unitPartners) {
        const partnerShare = (monthlyInstallment * unitPartner.percentage) / 100
        console.log(`   ${unitPartner.partner.name}: ${unitPartner.percentage}% = ${partnerShare.toLocaleString()} جنيه`)
      }
      console.log('')

      // جلب الأقساط المحفوظة في قاعدة البيانات
      const installments = await prisma.installment.findMany({
        where: {
          unitId: contract.unitId,
          deletedAt: null
        },
        orderBy: {
          dueDate: 'asc'
        }
      })

      if (installments.length > 0) {
        console.log(`📅 الأقساط المحفوظة في قاعدة البيانات:`)
        console.log(`   عدد الأقساط: ${installments.length}`)
        console.log(`   القسط الأول: ${installments[0].amount.toLocaleString()} جنيه`)
        console.log(`   القسط الأخير: ${installments[installments.length - 1].amount.toLocaleString()} جنيه`)
        
        // مقارنة مع الحساب
        const dbInstallment = installments[0].amount
        const calculatedInstallment = monthlyInstallment
        const difference = Math.abs(dbInstallment - calculatedInstallment)
        
        console.log(`   مقارنة:`)
        console.log(`   - المحفوظ في DB: ${dbInstallment.toLocaleString()} جنيه`)
        console.log(`   - المحسوب: ${calculatedInstallment.toLocaleString()} جنيه`)
        console.log(`   - الفرق: ${difference.toLocaleString()} جنيه`)
        
        if (difference > 0.01) {
          console.log(`   ⚠️ هناك اختلاف في الحساب!`)
        } else {
          console.log(`   ✅ الحساب صحيح`)
        }
      } else {
        console.log(`📅 لا توجد أقساط محفوظة في قاعدة البيانات`)
      }

      console.log('=' .repeat(60))
      console.log('')
    }

  } catch (error) {
    console.error('❌ خطأ في فحص الأقساط:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// تشغيل السكريبت
checkInstallmentCalculation()
  .then(() => {
    console.log('✅ تم فحص الأقساط بنجاح!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 فشل في فحص الأقساط:', error)
    process.exit(1)
  })