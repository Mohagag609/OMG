const { PrismaClient } = require('@prisma/client')

async function generateDetailedInstallmentReport() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://neondb_owner:npg_x5qvmpzF3hjX@ep-dawn-cell-adylfb98-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
      }
    }
  })

  try {
    console.log('📊 تقرير مفصل للأقساط والشركاء')
    console.log('=' .repeat(120))

    // جلب جميع الأقساط مع تفاصيل الوحدة والشريك
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
            },
            contracts: {
              where: {
                deletedAt: null
              }
            }
          }
        }
      },
      orderBy: [
        { unit: { code: 'asc' } },
        { dueDate: 'asc' }
      ]
    })

    console.log(`📋 تم العثور على ${installments.length} قسط`)
    console.log('')

    // رؤوس الأعمدة
    console.log('اسم الوحدة'.padEnd(15) + 
                'اسم الشريك'.padEnd(20) + 
                'النسبة'.padEnd(8) + 
                'نوع الوحدة'.padEnd(12) + 
                'نوع الدفعة'.padEnd(12) + 
                'تاريخ القسط'.padEnd(12) + 
                'قيمة القسط'.padEnd(12) + 
                'المدفوع'.padEnd(8) + 
                'مستحق الدفع'.padEnd(12) + 
                'عدد الأقساط'.padEnd(12))
    console.log('-'.repeat(120))

    // تجميع البيانات حسب الوحدة والشريك
    const reportData = []

    for (const installment of installments) {
      const unit = installment.unit
      const unitPartners = unit.unitPartners

      // إذا لم تكن هناك شركاء، أضف سطر بدون شريك
      if (unitPartners.length === 0) {
        const contract = unit.contracts[0] || {}
        reportData.push({
          unitName: unit.name || unit.code,
          partnerName: 'لا يوجد شريك',
          percentage: 0,
          unitType: unit.building || 'غير محدد',
          paymentType: contract.installmentType || 'غير محدد',
          installmentDate: installment.dueDate,
          installmentAmount: installment.amount,
          isPaid: installment.status === 'مدفوع',
          dueDate: installment.dueDate,
          totalInstallments: contract.installmentCount || 0
        })
      } else {
        // إضافة سطر لكل شريك
        for (const unitPartner of unitPartners) {
          const contract = unit.contracts[0] || {}
          reportData.push({
            unitName: unit.name || unit.code,
            partnerName: unitPartner.partner.name,
            percentage: unitPartner.percentage,
            unitType: unit.building || 'غير محدد',
            paymentType: contract.installmentType || 'غير محدد',
            installmentDate: installment.dueDate,
            installmentAmount: installment.amount,
            isPaid: installment.status === 'مدفوع',
            dueDate: installment.dueDate,
            totalInstallments: contract.installmentCount || 0
          })
        }
      }
    }

    // طباعة البيانات
    reportData.forEach(row => {
      const unitName = (row.unitName || '').substring(0, 14).padEnd(15)
      const partnerName = (row.partnerName || '').substring(0, 19).padEnd(20)
      const percentage = `${row.percentage}%`.padEnd(8)
      const unitType = (row.unitType || '').substring(0, 11).padEnd(12)
      const paymentType = (row.paymentType || '').substring(0, 11).padEnd(12)
      const installmentDate = row.installmentDate.toLocaleDateString('ar-EG').padEnd(12)
      const installmentAmount = `${row.installmentAmount.toLocaleString()} ج.م`.padEnd(12)
      const isPaid = row.isPaid ? 'نعم' : 'لا'
      const dueDate = row.dueDate.toLocaleDateString('ar-EG').padEnd(12)
      const totalInstallments = row.totalInstallments.toString().padEnd(12)

      console.log(unitName + partnerName + percentage + unitType + paymentType + 
                  installmentDate + installmentAmount + isPaid.padEnd(8) + 
                  dueDate + totalInstallments)
    })

    console.log('')
    console.log('=' .repeat(120))

    // إحصائيات
    const totalInstallments = installments.length
    const paidInstallments = installments.filter(i => i.status === 'مدفوع').length
    const unpaidInstallments = totalInstallments - paidInstallments
    const totalAmount = installments.reduce((sum, i) => sum + i.amount, 0)
    const paidAmount = installments.filter(i => i.status === 'مدفوع').reduce((sum, i) => sum + i.amount, 0)

    console.log('📈 إحصائيات التقرير:')
    console.log(`   إجمالي الأقساط: ${totalInstallments}`)
    console.log(`   الأقساط المدفوعة: ${paidInstallments}`)
    console.log(`   الأقساط غير المدفوعة: ${unpaidInstallments}`)
    console.log(`   إجمالي قيمة الأقساط: ${totalAmount.toLocaleString()} جنيه`)
    console.log(`   إجمالي المبلغ المدفوع: ${paidAmount.toLocaleString()} جنيه`)
    console.log(`   المبلغ المتبقي: ${(totalAmount - paidAmount).toLocaleString()} جنيه`)

    // تجميع حسب الشريك
    const partnerStats = {}
    reportData.forEach(row => {
      if (row.partnerName !== 'لا يوجد شريك') {
        if (!partnerStats[row.partnerName]) {
          partnerStats[row.partnerName] = {
            totalAmount: 0,
            paidAmount: 0,
            installments: 0
          }
        }
        partnerStats[row.partnerName].totalAmount += row.installmentAmount
        if (row.isPaid) {
          partnerStats[row.partnerName].paidAmount += row.installmentAmount
        }
        partnerStats[row.partnerName].installments += 1
      }
    })

    console.log('')
    console.log('👥 إحصائيات الشركاء:')
    Object.entries(partnerStats).forEach(([partnerName, stats]) => {
      console.log(`   ${partnerName}:`)
      console.log(`     إجمالي الأقساط: ${stats.installments}`)
      console.log(`     إجمالي المبلغ: ${stats.totalAmount.toLocaleString()} جنيه`)
      console.log(`     المبلغ المدفوع: ${stats.paidAmount.toLocaleString()} جنيه`)
      console.log(`     المبلغ المتبقي: ${(stats.totalAmount - stats.paidAmount).toLocaleString()} جنيه`)
    })

  } catch (error) {
    console.error('❌ خطأ في توليد التقرير:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// تشغيل السكريبت
generateDetailedInstallmentReport()
  .then(() => {
    console.log('✅ تم توليد التقرير بنجاح!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 فشل في توليد التقرير:', error)
    process.exit(1)
  })