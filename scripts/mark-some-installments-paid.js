const { PrismaClient } = require('@prisma/client')

async function markSomeInstallmentsPaid() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://neondb_owner:npg_x5qvmpzF3hjX@ep-dawn-cell-adylfb98-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
      }
    }
  })

  try {
    console.log('💰 تمييز بعض الأقساط كمدفوعة...')
    console.log('=' .repeat(60))

    // جلب الأقساط غير المدفوعة للوحدة A-5-5
    const installments = await prisma.installment.findMany({
      where: {
        unit: {
          code: 'A-5-5'
        },
        status: 'غير مدفوع',
        deletedAt: null
      },
      orderBy: {
        dueDate: 'asc'
      }
    })

    console.log(`📋 تم العثور على ${installments.length} قسط غير مدفوع للوحدة A-5-5`)
    console.log('')

    // تمييز أول 3 أقساط كمدفوعة
    const installmentsToMark = installments.slice(0, 3)
    
    for (const installment of installmentsToMark) {
      await prisma.installment.update({
        where: { id: installment.id },
        data: { 
          status: 'مدفوع'
        }
      })
      console.log(`✅ تم تمييز القسط ${installment.amount.toLocaleString()} جنيه كمدفوع`)
    }

    console.log('')
    console.log(`🎉 تم تمييز ${installmentsToMark.length} قسط كمدفوعة!`)

    // حساب التدفقات النقدية الجديدة
    const paidInstallments = await prisma.installment.findMany({
      where: {
        unit: {
          code: 'A-5-5'
        },
        status: 'مدفوع',
        deletedAt: null
      },
      include: {
        unit: {
          include: {
            unitPartners: {
              include: {
                partner: true
              }
            }
          }
        }
      }
    })

    console.log('')
    console.log('💰 التدفقات النقدية من الأقساط المدفوعة:')
    const totalPaidAmount = paidInstallments.reduce((sum, i) => sum + i.amount, 0)
    console.log(`   إجمالي المبلغ المدفوع: ${totalPaidAmount.toLocaleString()} جنيه`)
    
    if (paidInstallments.length > 0) {
      const unitPartners = paidInstallments[0].unit.unitPartners
      console.log('   حصة الشركاء:')
      unitPartners.forEach(up => {
        const partnerShare = (totalPaidAmount * up.percentage) / 100
        console.log(`     ${up.partner.name}: ${up.percentage}% = ${partnerShare.toLocaleString()} جنيه`)
      })
    }

  } catch (error) {
    console.error('❌ خطأ في تمييز الأقساط:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// تشغيل السكريبت
markSomeInstallmentsPaid()
  .then(() => {
    console.log('✅ تم إنجاز المهمة بنجاح!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 فشل في إنجاز المهمة:', error)
    process.exit(1)
  })