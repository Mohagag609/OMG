import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Test database connection
    await prisma.$connect()
    
    // Test basic queries
    const customerCount = await prisma.customer.count()
    const unitCount = await prisma.unit.count()
    const partnerCount = await prisma.partner.count()
    const contractCount = await prisma.contract.count()
    
    return NextResponse.json({
      success: true,
      message: 'قاعدة البيانات تعمل بشكل صحيح',
      data: {
        customers: customerCount,
        units: unitCount,
        partners: partnerCount,
        contracts: contractCount
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'خطأ في الاتصال بقاعدة البيانات',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}