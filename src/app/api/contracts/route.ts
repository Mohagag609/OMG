import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { validateContract } from '@/utils/validation'
import { ApiResponse, Contract, PaginatedResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/contracts - Get contracts with pagination
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'غير مخول للوصول' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const user = await getUserFromToken(token)
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مخول للوصول' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    let whereClause: any = { deletedAt: null }

    if (search) {
      whereClause.OR = [
        { unit: { code: { contains: search, mode: 'insensitive' } } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { brokerName: { contains: search, mode: 'insensitive' } }
      ]
    }

    const skip = (page - 1) * limit
    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where: whereClause,
        include: {
          unit: true,
          customer: true
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.contract.count({ where: whereClause })
    ])

    const totalPages = Math.ceil(total / limit)

    const response: PaginatedResponse<Contract> = {
      success: true,
      data: contracts,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error getting contracts:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}

// POST /api/contracts - Create new contract
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'غير مخول للوصول' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const user = await getUserFromToken(token)
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مخول للوصول' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      unitId, 
      customerId, 
      start, 
      totalPrice, 
      discountAmount, 
      brokerName, 
      brokerPercent,
      brokerAmount,
      commissionSafeId,
      downPaymentSafeId,
      // Installment options
      paymentType,
      installmentType,
      installmentCount,
      downPayment,
      extraAnnual,
      annualPaymentValue,
      maintenanceDeposit
    } = body

    // Validate contract data
    const validation = validateContract({ unitId, customerId, start, totalPrice, discountAmount, brokerName, commissionSafeId, brokerAmount })
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.errors.join(', ') },
        { status: 400 }
      )
    }

    // Check if unit exists and is available
    const unit = await prisma.unit.findUnique({
      where: { id: unitId }
    })

    if (!unit) {
      return NextResponse.json(
        { success: false, error: 'الوحدة غير موجودة' },
        { status: 400 }
      )
    }

    if (unit.status !== 'متاحة') {
      return NextResponse.json(
        { success: false, error: 'الوحدة غير متاحة للبيع' },
        { status: 400 }
      )
    }

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    })

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'العميل غير موجود' },
        { status: 400 }
      )
    }

    // Check if unit already has a contract
    const existingContract = await prisma.contract.findFirst({
      where: { unitId, deletedAt: null }
    })

    if (existingContract) {
      return NextResponse.json(
        { success: false, error: 'الوحدة مرتبطة بعقد قائم' },
        { status: 400 }
      )
    }

    // Check if unit has partners
    const unitPartners = await prisma.unitPartner.findMany({
      where: { unitId, deletedAt: null }
    })

    if (unitPartners.length === 0) {
      return NextResponse.json(
        { success: false, error: 'لا يمكن إنشاء عقد. يجب تحديد شركاء لهذه الوحدة أولاً.' },
        { status: 400 }
      )
    }

    // Check if total percentage is 100%
    const totalPercent = unitPartners.reduce((sum, p) => sum + p.percentage, 0)
    if (totalPercent !== 100) {
      return NextResponse.json(
        { success: false, error: `لا يمكن إنشاء عقد. مجموع نسب الشركاء هو ${totalPercent}% ويجب أن يكون 100% بالضبط.` },
        { status: 400 }
      )
    }

    // Create contract and generate installments in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Generate contract code
      const contractCount = await tx.contract.count()
      const code = `CTR-${String(contractCount + 1).padStart(5, '0')}`

      // Create contract
      const contract = await tx.contract.create({
        data: {
          unitId,
          customerId,
          start: new Date(start),
          totalPrice: totalPrice || 0,
          discountAmount: discountAmount || 0,
          brokerName,
          brokerPercent: brokerPercent || 0,
          brokerAmount: brokerAmount || 0,
          commissionSafeId,
          downPaymentSafeId,
          maintenanceDeposit: maintenanceDeposit || 0,
          installmentType: installmentType || 'شهري',
          installmentCount: installmentCount || 0,
          extraAnnual: extraAnnual || 0,
          annualPaymentValue: annualPaymentValue || 0,
          downPayment: downPayment || 0,
          paymentType: paymentType || 'installment'
        },
        include: {
          unit: true,
          customer: true
        }
      })

      // Update unit status to sold
      await tx.unit.update({
        where: { id: unitId },
        data: { status: 'مباعة' }
      })

      // Create down payment voucher if down payment > 0
      if (downPayment > 0 && downPaymentSafeId) {
        const customer = await tx.customer.findUnique({ where: { id: customerId } })
        const unit = await tx.unit.findUnique({ where: { id: unitId } })
        
        await tx.voucher.create({
          data: {
            type: 'receipt',
            date: new Date(start),
            amount: downPayment,
            safeId: downPaymentSafeId,
            description: `مقدم عقد للوحدة ${unit?.code}`,
            payer: customer?.name,
            linkedRef: contract.id
          }
        })

        // Update safe balance
        await tx.safe.update({
          where: { id: downPaymentSafeId },
          data: { balance: { increment: downPayment } }
        })
      }

      // Create broker commission voucher if broker amount > 0
      if (brokerAmount > 0 && commissionSafeId) {
        await tx.voucher.create({
          data: {
            type: 'payment',
            date: new Date(start),
            amount: brokerAmount,
            safeId: commissionSafeId,
            description: `عمولة سمسار ${brokerName} للوحدة ${contract.unit?.code}`,
            beneficiary: brokerName,
            linkedRef: contract.id
          }
        })

        // Update safe balance
        await tx.safe.update({
          where: { id: commissionSafeId },
          data: { balance: { decrement: brokerAmount } }
        })
      }

      // Generate installments if payment type is installment
      if (paymentType === 'installment' && installmentCount > 0) {
        const installmentBase = totalPrice - (maintenanceDeposit || 0)
        const totalAfterDown = installmentBase - (discountAmount || 0) - (downPayment || 0)
        const totalAnnualPayments = (extraAnnual || 0) * (annualPaymentValue || 0)
        const remainingAfterAnnual = totalAfterDown - totalAnnualPayments

        if (remainingAfterAnnual < 0) {
          throw new Error('المقدم والخصم والدفعات السنوية أكبر من قيمة العقد الخاضعة للتقسيط')
        }
        if (totalAnnualPayments > totalAfterDown) {
          throw new Error('مجموع الدفعات السنوية أكبر من المبلغ المتبقي للتقسيط')
        }

        const amountForRegularInstallments = remainingAfterAnnual
        const installmentTypeMap: { [key: string]: number } = { 
          'شهري': 1, 
          'ربع سنوي': 3, 
          'نصف سنوي': 6, 
          'سنوي': 12 
        }
        const months = installmentTypeMap[installmentType] || 1
        const count = parseInt(installmentCount || '0')

        // Generate regular installments
        if (count > 0) {
          const baseAmount = Math.floor((amountForRegularInstallments / count) * 100) / 100
          let accumulatedAmount = 0
          
          for (let i = 0; i < count; i++) {
            const dueDate = new Date(start)
            dueDate.setMonth(dueDate.getMonth() + months * (i + 1))
            
            const amount = (i === count - 1) 
              ? Math.round((amountForRegularInstallments - accumulatedAmount) * 100) / 100 
              : baseAmount
            
            accumulatedAmount += amount
            
            await tx.installment.create({
              data: {
                unitId,
                amount,
                dueDate,
                status: 'غير مدفوع',
                notes: `${installmentType} - قسط ${i + 1}`
              }
            })
          }
        }

        // Generate annual payments
        for (let j = 0; j < (extraAnnual || 0); j++) {
          const dueDate = new Date(start)
          dueDate.setMonth(dueDate.getMonth() + 12 * (j + 1))
          
          await tx.installment.create({
            data: {
              unitId,
              amount: annualPaymentValue || 0,
              dueDate,
              status: 'غير مدفوع',
              notes: 'دفعة سنوية إضافية'
            }
          })
        }

        // Generate maintenance deposit installment
        if (maintenanceDeposit > 0) {
          const allInstallments = await tx.installment.findMany({
            where: { unitId },
            orderBy: { dueDate: 'desc' }
          })
          
          const lastInstallment = allInstallments[0]
          const lastDate = lastInstallment ? new Date(lastInstallment.dueDate) : new Date(start)
          lastDate.setMonth(lastDate.getMonth() + months)
          
          await tx.installment.create({
            data: {
              unitId,
              amount: maintenanceDeposit,
              dueDate: lastDate,
              status: 'غير مدفوع',
              notes: 'وديعة الصيانة'
            }
          })
        }
      }

      return contract
    })

    const response: ApiResponse<Contract> = {
      success: true,
      data: result,
      message: paymentType === 'installment' ? 'تم إضافة العقد وتوليد الأقساط بنجاح' : 'تم إضافة العقد بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error creating contract:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}