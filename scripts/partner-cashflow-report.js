const { PrismaClient } = require('@prisma/client')

async function generatePartnerCashflowReport() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://neondb_owner:npg_x5qvmpzF3hjX@ep-dawn-cell-adylfb98-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
      }
    }
  })

  try {
    console.log('📊 تقرير التدفقات النقدية للشركاء من الأقساط')
    console.log('=' .repeat(60))
    console.log('')

    // جلب جميع الشركاء مع وحداتهم ونسب المشاركة
    const partners = await prisma.partner.findMany({
      where: {
        deletedAt: null
      },
      include: {
        unitPartners: {
          include: {
            unit: {
              include: {
                contracts: {
                  where: {
                    deletedAt: null
                  }
                },
                installments: {
                  where: {
                    deletedAt: null
                  }
                }
              }
            }
          }
        }
      }
    })

    console.log(`🔍 تم العثور على ${partners.length} شريك`)
    console.log('')

    // حساب التدفقات النقدية لكل شريك
    const partnerCashflows = []

    for (const partner of partners) {
      console.log(`👤 الشريك: ${partner.name}`)
      console.log(`📞 الهاتف: ${partner.phone || 'غير محدد'}`)
      console.log(`📝 الملاحظات: ${partner.notes || 'لا توجد'}`)
      console.log('')

      let totalMonthlyCashflow = 0
      let totalAnnualCashflow = 0
      const unitDetails = []

      for (const unitPartner of partner.unitPartners) {
        const unit = unitPartner.unit
        const percentage = unitPartner.percentage

        console.log(`  🏠 الوحدة: ${unit.code} - ${unit.name || 'بدون اسم'}`)
        console.log(`  📐 المساحة: ${unit.area || 'غير محدد'}`)
        console.log(`  🏢 المبنى: ${unit.building || 'غير محدد'}`)
        console.log(`  🏗️ الطابق: ${unit.floor || 'غير محدد'}`)
        console.log(`  💰 السعر الإجمالي: ${unit.totalPrice.toLocaleString()} جنيه`)
        console.log(`  📊 نسبة المشاركة: ${percentage}%`)
        console.log('')

        // حساب الأقساط الشهرية
        let monthlyInstallment = 0
        let annualInstallment = 0

        for (const contract of unit.contracts) {
          if (contract.installmentType === 'شهري' && contract.installmentCount > 0) {
            // حساب القسط الشهري
            const remainingAmount = contract.totalPrice - contract.discountAmount - contract.downPayment
            monthlyInstallment = remainingAmount / contract.installmentCount
            
            // حساب القسط السنوي الإضافي
            if (contract.extraAnnual > 0) {
              annualInstallment = contract.annualPaymentValue || 0
            }
          }
        }

        // حساب حصة الشريك من الأقساط
        const partnerMonthlyShare = (monthlyInstallment * percentage) / 100
        const partnerAnnualShare = (annualInstallment * percentage) / 100

        totalMonthlyCashflow += partnerMonthlyShare
        totalAnnualCashflow += partnerAnnualShare

        unitDetails.push({
          unitCode: unit.code,
          unitName: unit.name,
          area: unit.area,
          building: unit.building,
          floor: unit.floor,
          totalPrice: unit.totalPrice,
          percentage: percentage,
          monthlyInstallment: monthlyInstallment,
          annualInstallment: annualInstallment,
          partnerMonthlyShare: partnerMonthlyShare,
          partnerAnnualShare: partnerAnnualShare
        })

        console.log(`    💵 القسط الشهري للوحدة: ${monthlyInstallment.toLocaleString()} جنيه`)
        console.log(`    💵 القسط السنوي للوحدة: ${annualInstallment.toLocaleString()} جنيه`)
        console.log(`    💰 حصة الشريك الشهرية: ${partnerMonthlyShare.toLocaleString()} جنيه`)
        console.log(`    💰 حصة الشريك السنوية: ${partnerAnnualShare.toLocaleString()} جنيه`)
        console.log('')
      }

      partnerCashflows.push({
        partnerId: partner.id,
        partnerName: partner.name,
        phone: partner.phone,
        notes: partner.notes,
        totalMonthlyCashflow: totalMonthlyCashflow,
        totalAnnualCashflow: totalAnnualCashflow,
        unitDetails: unitDetails
      })

      console.log(`💰 إجمالي التدفق الشهري للشريك: ${totalMonthlyCashflow.toLocaleString()} جنيه`)
      console.log(`💰 إجمالي التدفق السنوي للشريك: ${totalAnnualCashflow.toLocaleString()} جنيه`)
      console.log('=' .repeat(60))
      console.log('')
    }

    // ملخص عام
    const totalMonthlyAllPartners = partnerCashflows.reduce((sum, p) => sum + p.totalMonthlyCashflow, 0)
    const totalAnnualAllPartners = partnerCashflows.reduce((sum, p) => sum + p.totalAnnualCashflow, 0)

    console.log('📈 ملخص التدفقات النقدية للشركاء')
    console.log('=' .repeat(60))
    console.log(`💰 إجمالي التدفق الشهري لجميع الشركاء: ${totalMonthlyAllPartners.toLocaleString()} جنيه`)
    console.log(`💰 إجمالي التدفق السنوي لجميع الشركاء: ${totalAnnualAllPartners.toLocaleString()} جنيه`)
    console.log(`📊 متوسط التدفق الشهري لكل شريك: ${(totalMonthlyAllPartners / partners.length).toLocaleString()} جنيه`)
    console.log('')

    // تفصيل شهري للعام الحالي
    console.log('📅 تفصيل التدفقات الشهرية للعام الحالي')
    console.log('=' .repeat(60))
    
    const currentYear = new Date().getFullYear()
    const months = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ]

    months.forEach((month, index) => {
      const monthNumber = index + 1
      console.log(`${monthNumber.toString().padStart(2, '0')}. ${month}: ${totalMonthlyAllPartners.toLocaleString()} جنيه`)
    })

    console.log('')
    console.log('🎯 تدفقات شهر نوفمبر (11)')
    console.log('=' .repeat(30))
    console.log(`💰 إجمالي التدفق: ${totalMonthlyAllPartners.toLocaleString()} جنيه`)
    console.log('')

    // تفصيل الشركاء لشهر نوفمبر
    console.log('👥 تفصيل الشركاء لشهر نوفمبر:')
    partnerCashflows.forEach((partner, index) => {
      console.log(`${index + 1}. ${partner.partnerName}: ${partner.totalMonthlyCashflow.toLocaleString()} جنيه`)
    })

    return {
      partners: partnerCashflows,
      totalMonthly: totalMonthlyAllPartners,
      totalAnnual: totalAnnualAllPartners,
      averageMonthly: totalMonthlyAllPartners / partners.length
    }

  } catch (error) {
    console.error('❌ خطأ في توليد التقرير:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// تشغيل التقرير
generatePartnerCashflowReport()
  .then((result) => {
    console.log('✅ تم توليد التقرير بنجاح!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 فشل في توليد التقرير:', error)
    process.exit(1)
  })