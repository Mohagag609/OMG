const { PrismaClient } = require('@prisma/client')

async function checkInstallmentStatus() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://neondb_owner:npg_x5qvmpzF3hjX@ep-dawn-cell-adylfb98-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
      }
    }
  })

  try {
    console.log('🔍 فحص حالة الأقساط...')
    console.log('=' .repeat(60))

    // جلب جميع الأقساط
    const installments = await prisma.installment.findMany({
      where: {
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
      },
      orderBy: {
        dueDate: 'asc'
      }
    })

    console.log(`📋 تم العثور على ${installments.length} قسط`)
    console.log('')

    // تجميع الأقساط حسب الحالة
    const statusCounts = installments.reduce((acc, installment) => {
      acc[installment.status] = (acc[installment.status] || 0) + 1
      return acc
    }, {})

    console.log('📊 إحصائيات الأقساط:')
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} قسط`)
    })
    console.log('')

    // عرض تفاصيل الأقساط
    console.log('📅 تفاصيل الأقساط:')
    installments.forEach((installment, index) => {
      console.log(`   قسط ${index + 1}: ${installment.amount.toLocaleString()} جنيه - ${installment.status} - ${installment.dueDate.toLocaleDateString('ar-EG')}`)
    })
    console.log('')

    // حساب التدفقات النقدية للأقساط المدفوعة فقط
    const paidInstallments = installments.filter(i => i.status === 'مدفوع')
    console.log(`💰 الأقساط المدفوعة: ${paidInstallments.length} قسط`)
    
    if (paidInstallments.length > 0) {
      const totalPaidAmount = paidInstallments.reduce((sum, i) => sum + i.amount, 0)
      console.log(`   إجمالي المبلغ المدفوع: ${totalPaidAmount.toLocaleString()} جنيه`)
      
      // حساب حصة الشركاء من الأقساط المدفوعة
      const unitPartners = paidInstallments[0].unit.unitPartners
      console.log('   حصة الشركاء من الأقساط المدفوعة:')
      unitPartners.forEach(up => {
        const partnerShare = (totalPaidAmount * up.percentage) / 100
        console.log(`     ${up.partner.name}: ${up.percentage}% = ${partnerShare.toLocaleString()} جنيه`)
      })
    }

  } catch (error) {
    console.error('❌ خطأ في فحص الأقساط:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// تشغيل السكريبت
checkInstallmentStatus()
  .then(() => {
    console.log('✅ تم فحص الأقساط بنجاح!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 فشل في فحص الأقساط:', error)
    process.exit(1)
  })