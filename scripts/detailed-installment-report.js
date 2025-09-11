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
    console.log('اسم الوحدة - الدور - المبنى'.padEnd(35) + 
                'نوع الوحدة'.padEnd(15) + 
                'اسم العميل'.padEnd(20) + 
                'اسم الشريك'.padEnd(20) + 
                'مجموعة الشركاء'.padEnd(20) + 
                'تاريخ القسط'.padEnd(15) + 
                'قيمة القسط'.padEnd(15) + 
                'المدفوع'.padEnd(15) + 
                'المتبقي'.padEnd(15))
    console.log('-'.repeat(150))

    // تجميع البيانات حسب الوحدة والشريك
    const reportData = []

    for (const installment of installments) {
      const unit = installment.unit
      const unitPartners = unit.unitPartners
      const contract = unit.contracts[0] || {}
      // جلب بيانات العميل من customerId
      const customer = contract.customerId ? 
        await prisma.customer.findUnique({ where: { id: contract.customerId } }) : 
        null

      // دمج اسم الوحدة ورقم الدور ورقم المبنى في عمود واحد
      const unitFullName = `${unit.name || unit.code} - الدور ${unit.floor || 'غير محدد'} - المبنى ${unit.building || 'غير محدد'}`

      // حساب المبلغ المدفوع والمتبقي
      const installmentAmount = installment.amount
      const isPaid = installment.status === 'مدفوع'
      const paidAmount = isPaid ? installmentAmount : 0
      const remainingAmount = isPaid ? 0 : installmentAmount

      // إذا لم تكن هناك شركاء، أضف سطر بدون شريك
      if (unitPartners.length === 0) {
        reportData.push({
          unitFullName: unitFullName,
          unitType: unit.building || 'غير محدد',
          customerName: customer?.name || 'لا يوجد عميل',
          partnerName: 'لا يوجد شريك',
          partnerGroupName: 'لا يوجد مجموعة',
          installmentDate: installment.dueDate,
          installmentAmount: installmentAmount,
          paidAmount: paidAmount,
          remainingAmount: remainingAmount,
          isPaid: isPaid
        })
      } else {
        // إضافة سطر لكل شريك
        for (const unitPartner of unitPartners) {
          // جلب مجموعة الشركاء
          const partnerGroup = unitPartner.partner.partnerGroup || null
          
          reportData.push({
            unitFullName: unitFullName,
            unitType: unit.building || 'غير محدد',
            customerName: customer?.name || 'لا يوجد عميل',
            partnerName: unitPartner.partner.name,
            partnerGroupName: partnerGroup?.name || 'لا يوجد مجموعة',
            installmentDate: installment.dueDate,
            installmentAmount: installmentAmount,
            paidAmount: paidAmount,
            remainingAmount: remainingAmount,
            isPaid: isPaid
          })
        }
      }
    }

    // طباعة البيانات
    reportData.forEach(row => {
      const unitFullName = (row.unitFullName || '').substring(0, 34).padEnd(35)
      const unitType = (row.unitType || '').substring(0, 14).padEnd(15)
      const customerName = (row.customerName || '').substring(0, 19).padEnd(20)
      const partnerName = (row.partnerName || '').substring(0, 19).padEnd(20)
      const partnerGroupName = (row.partnerGroupName || '').substring(0, 19).padEnd(20)
      const installmentDate = row.installmentDate.toLocaleDateString('ar-EG').padEnd(15)
      const installmentAmount = `${row.installmentAmount.toLocaleString()} ج.م`.padEnd(15)
      const paidAmount = `${row.paidAmount.toLocaleString()} ج.م`.padEnd(15)
      const remainingAmount = `${row.remainingAmount.toLocaleString()} ج.م`.padEnd(15)

      console.log(unitFullName + unitType + customerName + partnerName + partnerGroupName + 
                  installmentDate + installmentAmount + paidAmount + remainingAmount)
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