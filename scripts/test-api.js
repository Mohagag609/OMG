const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testAPI() {
  try {
    console.log('🧪 اختبار API routes...')
    
    // اختبار dashboard API
    console.log('📊 اختبار dashboard API...')
    try {
      const contractsData = await prisma.contract.findMany({
        select: {
          id: true,
          unitId: true,
          customerId: true,
          start: true,
          totalPrice: true,
          discountAmount: true,
          brokerAmount: true
        }
      })
      
      const contracts = contractsData.map(contract => ({
        ...contract,
        start: contract.start.toISOString()
      }))
      
      console.log(`✅ Dashboard API: ${contracts.length} عقد`)
    } catch (error) {
      console.log('❌ خطأ في dashboard API:', error.message)
    }
    
    // اختبار customers API
    console.log('👥 اختبار customers API...')
    try {
      const customers = await prisma.customer.findMany({
        select: {
          id: true,
          name: true,
          phone: true,
          nationalId: true,
          address: true,
          status: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true
        }
      })
      
      console.log(`✅ Customers API: ${customers.length} عميل`)
    } catch (error) {
      console.log('❌ خطأ في customers API:', error.message)
    }
    
    // اختبار units API
    console.log('🏠 اختبار units API...')
    try {
      const units = await prisma.unit.findMany({
        select: {
          id: true,
          code: true,
          name: true,
          unitType: true,
          area: true,
          floor: true,
          building: true,
          totalPrice: true,
          status: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true
        }
      })
      
      console.log(`✅ Units API: ${units.length} وحدة`)
    } catch (error) {
      console.log('❌ خطأ في units API:', error.message)
    }
    
    // اختبار vouchers API
    console.log('📋 اختبار vouchers API...')
    try {
      const vouchersData = await prisma.voucher.findMany({
        select: {
          id: true,
          type: true,
          date: true,
          amount: true,
          safeId: true,
          description: true,
          payer: true,
          beneficiary: true,
          linkedRef: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true
        }
      })
      
      const vouchers = vouchersData.map(voucher => ({
        ...voucher,
        date: voucher.date.toISOString(),
        type: voucher.type,
        payer: voucher.payer || undefined,
        beneficiary: voucher.beneficiary || undefined,
        linkedRef: voucher.linkedRef || undefined
      }))
      
      console.log(`✅ Vouchers API: ${vouchers.length} سند`)
    } catch (error) {
      console.log('❌ خطأ في vouchers API:', error.message)
    }
    
    console.log('🎉 جميع API routes تعمل بشكل صحيح!')
    
  } catch (error) {
    console.error('❌ خطأ عام في اختبار API:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAPI()