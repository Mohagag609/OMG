const { PrismaClient } = require('@prisma/client')

async function fixInstallmentCalculation() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://neondb_owner:npg_x5qvmpzF3hjX@ep-dawn-cell-adylfb98-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
      }
    }
  })

  try {
    console.log('🔧 إصلاح حساب الأقساط...')
    console.log('=' .repeat(60))

    // جلب جميع العقود
    const contracts = await prisma.contract.findMany({
      where: {
        deletedAt: null,
        paymentType: 'installment'
      },
      include: {
        unit: true
      }
    })

    console.log(`📋 تم العثور على ${contracts.length} عقد بالتقسيط`)
    console.log('')

    for (const contract of contracts) {
      console.log(`📄 العقد: ${contract.id}`)
      console.log(`🏠 الوحدة: ${contract.unit.code}`)
      console.log(`💰 السعر الإجمالي: ${contract.totalPrice.toLocaleString()} جنيه`)
      console.log(`💸 الخصم: ${contract.discountAmount.toLocaleString()} جنيه`)
      console.log(`💳 الدفعة المقدمة: ${contract.downPayment.toLocaleString()} جنيه`)
      console.log(`🔢 عدد الأقساط: ${contract.installmentCount}`)
      console.log('')

      // حساب القسط الصحيح
      const remainingAmount = contract.totalPrice - contract.discountAmount - contract.downPayment
      const correctInstallmentAmount = remainingAmount / contract.installmentCount

      console.log(`🧮 الحساب الصحيح:`)
      console.log(`   المبلغ المتبقي: ${remainingAmount.toLocaleString()} جنيه`)
      console.log(`   ÷ عدد الأقساط: ${contract.installmentCount}`)
      console.log(`   = القسط الصحيح: ${correctInstallmentAmount.toLocaleString()} جنيه`)
      console.log('')

      // جلب الأقساط الحالية
      const currentInstallments = await prisma.installment.findMany({
        where: {
          unitId: contract.unitId,
          deletedAt: null
        },
        orderBy: {
          dueDate: 'asc'
        }
      })

      console.log(`📅 الأقساط الحالية:`)
      currentInstallments.forEach((installment, index) => {
        console.log(`   قسط ${index + 1}: ${installment.amount.toLocaleString()} جنيه`)
      })
      console.log('')

      // حذف الأقساط الحالية
      console.log(`🗑️ حذف الأقساط الحالية...`)
      await prisma.installment.deleteMany({
        where: {
          unitId: contract.unitId,
          deletedAt: null
        }
      })

      // إنشاء الأقساط الجديدة بالحساب الصحيح
      console.log(`➕ إنشاء الأقساط الجديدة...`)
      const startDate = new Date(contract.start)
      
      for (let i = 0; i < contract.installmentCount; i++) {
        const dueDate = new Date(startDate)
        dueDate.setMonth(dueDate.getMonth() + i)
        
        await prisma.installment.create({
          data: {
            unitId: contract.unitId,
            amount: correctInstallmentAmount,
            dueDate: dueDate,
            status: 'غير مدفوع',
            notes: `شهري - قسط ${i + 1}`
          }
        })
      }

      console.log(`✅ تم إصلاح الأقساط للوحدة ${contract.unit.code}`)
      console.log(`   القسط الجديد: ${correctInstallmentAmount.toLocaleString()} جنيه`)
      console.log('')

      // حساب حصة الشركاء
      const unitPartners = await prisma.unitPartner.findMany({
        where: {
          unitId: contract.unitId,
          deletedAt: null
        },
        include: {
          partner: true
        }
      })

      console.log(`👥 حصة الشركاء الجديدة:`)
      for (const unitPartner of unitPartners) {
        const partnerShare = (correctInstallmentAmount * unitPartner.percentage) / 100
        console.log(`   ${unitPartner.partner.name}: ${unitPartner.percentage}% = ${partnerShare.toLocaleString()} جنيه`)
      }

      console.log('=' .repeat(60))
      console.log('')
    }

    console.log('🎉 تم إصلاح جميع الأقساط بنجاح!')

  } catch (error) {
    console.error('❌ خطأ في إصلاح الأقساط:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// تشغيل السكريبت
fixInstallmentCalculation()
  .then(() => {
    console.log('✅ تم إنجاز المهمة بنجاح!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 فشل في إنجاز المهمة:', error)
    process.exit(1)
  })