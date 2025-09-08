import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import JSZip from 'jszip'

export async function POST(request: NextRequest) {
  try {
    console.log('Starting system import...')
    
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      console.error('No file provided for import')
      return NextResponse.json(
        { error: 'لم يتم العثور على ملف للاستيراد' },
        { status: 400 }
      )
    }

    console.log('File received:', {
      name: file.name,
      size: file.size,
      type: file.type
    })

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      console.error('File too large:', file.size)
      return NextResponse.json(
        { error: 'الملف كبير جداً. الحد الأقصى 100 ميجابايت' },
        { status: 400 }
      )
    }

    // Detect database type
    const dbUrl = process.env.DATABASE_URL || ''
    const isSQLite = dbUrl.startsWith('file:') || dbUrl.includes('sqlite')
    const isPostgreSQL = dbUrl.includes('postgresql://')
    const isNeon = dbUrl.includes('neon.tech')

    console.log('Database type detected:', { isSQLite, isPostgreSQL, isNeon })

    // Read file content
    console.log('Reading file content...')
    const fileContent = await file.arrayBuffer()
    let jsonData

    try {
      // Check if it's a ZIP file
      if (file.name.endsWith('.zip')) {
        console.log('Processing ZIP file...')
        const zip = new JSZip()
        const zipContent = await zip.loadAsync(fileContent)

        // Look for data.json in the ZIP, or try other possible names
        let dataFile = zipContent.file('data.json')
        if (!dataFile) {
          dataFile = zipContent.file('tables_data.json')
        }
        if (!dataFile) {
          dataFile = zipContent.file('backup_data.json')
        }
        if (!dataFile) {
          console.error('ZIP file does not contain expected data file')
          console.log('Available files in ZIP:', Object.keys(zipContent.files))
          return NextResponse.json(
            { 
              error: 'ملف ZIP لا يحتوي على ملف البيانات المطلوب',
              details: 'الملفات المتاحة: ' + Object.keys(zipContent.files).join(', ')
            },
            { status: 400 }
          )
        }

        console.log('Extracting data.json from ZIP...')
        const jsonContent = await dataFile.async('text')
        jsonData = JSON.parse(jsonContent)
        console.log('ZIP file processed successfully')
      } else {
        // Handle direct JSON file
        console.log('Processing JSON file...')
        const textContent = new TextDecoder().decode(fileContent)
        jsonData = JSON.parse(textContent)
        console.log('JSON file processed successfully')
      }
    } catch (error) {
      console.error('File parsing error:', error)
      return NextResponse.json(
        { 
          error: 'ملف غير صالح. يجب أن يكون ملف JSON أو ZIP صحيح',
          details: error instanceof Error ? error.message : 'خطأ في معالجة الملف'
        },
        { status: 400 }
      )
    }

    // Check if it's a valid import file structure
    if (!jsonData.metadata || !jsonData.data) {
      // Try to handle direct data format (without metadata wrapper)
      if (Array.isArray(jsonData) || (typeof jsonData === 'object' && !jsonData.metadata)) {
        console.log('Detected direct data format, wrapping with metadata')
        jsonData = {
          metadata: {
            version: '1.0.0',
            exportDate: new Date().toISOString(),
            databaseType: isSQLite ? 'SQLite' : isPostgreSQL ? 'PostgreSQL' : 'Unknown'
          },
          data: jsonData
        }
      } else {
        console.error('Invalid import file structure:', {
          hasMetadata: !!jsonData.metadata,
          hasData: !!jsonData.data,
          keys: Object.keys(jsonData)
        })
        return NextResponse.json(
          { 
            error: 'ملف استيراد غير صالح. يجب أن يحتوي على metadata و data',
            details: `المفاتيح الموجودة: ${Object.keys(jsonData).join(', ')}`
          },
          { status: 400 }
        )
      }
    }

    console.log('Import file validated:', {
      version: jsonData.metadata.version,
      exportDate: jsonData.metadata.exportDate,
      databaseType: jsonData.metadata.databaseType
    })

    // Clear existing data in correct order (respecting foreign keys)
    console.log('Clearing existing data...')
    try {
      // Delete in reverse order of dependencies
      await prisma.auditLog.deleteMany()
      await prisma.partnerGroupPartner.deleteMany()
      await prisma.partnerGroup.deleteMany()
      await prisma.partnerDebt.deleteMany()
      await prisma.brokerDue.deleteMany()
      await prisma.unitPartner.deleteMany()
      await prisma.transfer.deleteMany()
      await prisma.voucher.deleteMany()
      await prisma.installment.deleteMany()
      await prisma.contract.deleteMany()
      await prisma.partner.deleteMany()
      await prisma.safe.deleteMany()
      await prisma.broker.deleteMany()
      await prisma.customer.deleteMany()
      await prisma.unit.deleteMany()
      await prisma.user.deleteMany()
      
      console.log('Data cleared successfully')
    } catch (error) {
      console.error('Error clearing data:', error)
      // Continue with import even if clearing fails
    }

    // Import data
    console.log('Importing data...')
    const { data } = jsonData

    // Import users
    if (data.users && data.users.length > 0) {
      console.log(`Importing ${data.users.length} users...`)
      let importedUsers = 0
      for (const user of data.users) {
        try {
          await prisma.user.create({
            data: {
              id: user.id,
              username: user.username,
              password: user.password,
              email: user.email,
              fullName: user.fullName,
              role: user.role,
              isActive: user.isActive,
              createdAt: new Date(user.createdAt),
              updatedAt: new Date(user.updatedAt)
            }
          })
          importedUsers++
          console.log(`User imported: ${user.username}`)
        } catch (error) {
          console.error('Error importing user:', user.username, error)
        }
      }
      console.log(`Successfully imported ${importedUsers}/${data.users.length} users`)
    }

    // Import units
    if (data.units && data.units.length > 0) {
      console.log(`Importing ${data.units.length} units...`)
      let importedUnits = 0
      for (const unit of data.units) {
        try {
          await prisma.unit.create({
            data: {
              id: unit.id,
              code: unit.code,
              name: unit.name,
              unitType: unit.unitType,
              area: unit.area,
              floor: unit.floor,
              building: unit.building,
              totalPrice: unit.totalPrice,
              status: unit.status,
              notes: unit.notes,
              createdAt: new Date(unit.createdAt),
              updatedAt: new Date(unit.updatedAt),
              deletedAt: unit.deletedAt ? new Date(unit.deletedAt) : null
            }
          })
          importedUnits++
          console.log(`Unit imported: ${unit.code}`)
        } catch (error) {
          console.error('Error importing unit:', unit.code, error)
        }
      }
      console.log(`Successfully imported ${importedUnits}/${data.units.length} units`)
    }

    // Import customers
    if (data.customers && data.customers.length > 0) {
      console.log(`Importing ${data.customers.length} customers...`)
      for (const customer of data.customers) {
        try {
          await prisma.customer.create({
            data: {
              id: customer.id,
              name: customer.name,
              phone: customer.phone,
              nationalId: customer.nationalId,
              address: customer.address,
              status: customer.status,
              notes: customer.notes,
              createdAt: new Date(customer.createdAt),
              updatedAt: new Date(customer.updatedAt),
              deletedAt: customer.deletedAt ? new Date(customer.deletedAt) : null
            }
          })
        } catch (error) {
          console.log('Error importing customer:', customer.name, error)
        }
      }
    }

    // Import brokers
    if (data.brokers && data.brokers.length > 0) {
      console.log(`Importing ${data.brokers.length} brokers...`)
      for (const broker of data.brokers) {
        try {
          await prisma.broker.create({
            data: {
              id: broker.id,
              name: broker.name,
              phone: broker.phone,
              notes: broker.notes,
              createdAt: new Date(broker.createdAt),
              updatedAt: new Date(broker.updatedAt),
              deletedAt: broker.deletedAt ? new Date(broker.deletedAt) : null
            }
          })
        } catch (error) {
          console.log('Error importing broker:', broker.name, error)
        }
      }
    }

    // Import safes
    if (data.safes && data.safes.length > 0) {
      console.log(`Importing ${data.safes.length} safes...`)
      for (const safe of data.safes) {
        try {
          await prisma.safe.create({
            data: {
              id: safe.id,
              name: safe.name,
              balance: safe.balance,
              createdAt: new Date(safe.createdAt),
              updatedAt: new Date(safe.updatedAt),
              deletedAt: safe.deletedAt ? new Date(safe.deletedAt) : null
            }
          })
        } catch (error) {
          console.log('Error importing safe:', safe.name, error)
        }
      }
    }

    // Import partners
    if (data.partners && data.partners.length > 0) {
      console.log(`Importing ${data.partners.length} partners...`)
      for (const partner of data.partners) {
        try {
          await prisma.partner.create({
            data: {
              id: partner.id,
              name: partner.name,
              phone: partner.phone,
              notes: partner.notes,
              createdAt: new Date(partner.createdAt),
              updatedAt: new Date(partner.updatedAt),
              deletedAt: partner.deletedAt ? new Date(partner.deletedAt) : null
            }
          })
        } catch (error) {
          console.log('Error importing partner:', partner.name, error)
        }
      }
    }

    // Import contracts
    if (data.contracts && data.contracts.length > 0) {
      console.log(`Importing ${data.contracts.length} contracts...`)
      for (const contract of data.contracts) {
        try {
          await prisma.contract.create({
            data: {
              id: contract.id,
              unitId: contract.unitId,
              customerId: contract.customerId,
              start: new Date(contract.start),
              totalPrice: contract.totalPrice,
              discountAmount: contract.discountAmount,
              brokerName: contract.brokerName,
              brokerPercent: contract.brokerPercent,
              brokerAmount: contract.brokerAmount,
              commissionSafeId: contract.commissionSafeId,
              downPaymentSafeId: contract.downPaymentSafeId,
              maintenanceDeposit: contract.maintenanceDeposit,
              installmentType: contract.installmentType,
              installmentCount: contract.installmentCount,
              extraAnnual: contract.extraAnnual,
              annualPaymentValue: contract.annualPaymentValue,
              downPayment: contract.downPayment,
              paymentType: contract.paymentType,
              createdAt: new Date(contract.createdAt),
              updatedAt: new Date(contract.updatedAt),
              deletedAt: contract.deletedAt ? new Date(contract.deletedAt) : null
            }
          })
        } catch (error) {
          console.log('Error importing contract:', contract.id, error)
        }
      }
    }

    // Import installments
    if (data.installments && data.installments.length > 0) {
      console.log(`Importing ${data.installments.length} installments...`)
      for (const installment of data.installments) {
        try {
          await prisma.installment.create({
            data: {
              id: installment.id,
              unitId: installment.unitId,
              amount: installment.amount,
              dueDate: new Date(installment.dueDate),
              status: installment.status,
              notes: installment.notes,
              createdAt: new Date(installment.createdAt),
              updatedAt: new Date(installment.updatedAt),
              deletedAt: installment.deletedAt ? new Date(installment.deletedAt) : null
            }
          })
        } catch (error) {
          console.log('Error importing installment:', installment.id, error)
        }
      }
    }

    // Import vouchers
    if (data.vouchers && data.vouchers.length > 0) {
      console.log(`Importing ${data.vouchers.length} vouchers...`)
      for (const voucher of data.vouchers) {
        try {
          await prisma.voucher.create({
            data: {
              id: voucher.id,
              type: voucher.type,
              date: new Date(voucher.date),
              amount: voucher.amount,
              safeId: voucher.safeId,
              description: voucher.description,
              payer: voucher.payer,
              beneficiary: voucher.beneficiary,
              linkedRef: voucher.linkedRef,
              createdAt: new Date(voucher.createdAt),
              updatedAt: new Date(voucher.updatedAt),
              deletedAt: voucher.deletedAt ? new Date(voucher.deletedAt) : null
            }
          })
        } catch (error) {
          console.log('Error importing voucher:', voucher.id, error)
        }
      }
    }

    // Import transfers
    if (data.transfers && data.transfers.length > 0) {
      console.log(`Importing ${data.transfers.length} transfers...`)
      for (const transfer of data.transfers) {
        try {
          await prisma.transfer.create({
            data: {
              id: transfer.id,
              fromSafeId: transfer.fromSafeId,
              toSafeId: transfer.toSafeId,
              amount: transfer.amount,
              description: transfer.description,
              createdAt: new Date(transfer.createdAt),
              updatedAt: new Date(transfer.updatedAt),
              deletedAt: transfer.deletedAt ? new Date(transfer.deletedAt) : null
            }
          })
        } catch (error) {
          console.log('Error importing transfer:', transfer.id, error)
        }
      }
    }

    // Import unit partners
    if (data.unitPartners && data.unitPartners.length > 0) {
      console.log(`Importing ${data.unitPartners.length} unit partners...`)
      for (const unitPartner of data.unitPartners) {
        try {
          await prisma.unitPartner.create({
            data: {
              id: unitPartner.id,
              unitId: unitPartner.unitId,
              partnerId: unitPartner.partnerId,
              percentage: unitPartner.percentage,
              createdAt: new Date(unitPartner.createdAt),
              updatedAt: new Date(unitPartner.updatedAt),
              deletedAt: unitPartner.deletedAt ? new Date(unitPartner.deletedAt) : null
            }
          })
        } catch (error) {
          console.log('Error importing unit partner:', unitPartner.id, error)
        }
      }
    }

    // Import broker dues
    if (data.brokerDues && data.brokerDues.length > 0) {
      console.log(`Importing ${data.brokerDues.length} broker dues...`)
      for (const brokerDue of data.brokerDues) {
        try {
          await prisma.brokerDue.create({
            data: {
              id: brokerDue.id,
              brokerId: brokerDue.brokerId,
              amount: brokerDue.amount,
              dueDate: new Date(brokerDue.dueDate),
              status: brokerDue.status,
              notes: brokerDue.notes,
              createdAt: new Date(brokerDue.createdAt),
              updatedAt: new Date(brokerDue.updatedAt),
              deletedAt: brokerDue.deletedAt ? new Date(brokerDue.deletedAt) : null
            }
          })
        } catch (error) {
          console.log('Error importing broker due:', brokerDue.id, error)
        }
      }
    }

    // Import partner debts
    if (data.partnerDebts && data.partnerDebts.length > 0) {
      console.log(`Importing ${data.partnerDebts.length} partner debts...`)
      for (const partnerDebt of data.partnerDebts) {
        try {
          await prisma.partnerDebt.create({
            data: {
              id: partnerDebt.id,
              partnerId: partnerDebt.partnerId,
              amount: partnerDebt.amount,
              dueDate: new Date(partnerDebt.dueDate),
              status: partnerDebt.status,
              notes: partnerDebt.notes,
              createdAt: new Date(partnerDebt.createdAt),
              updatedAt: new Date(partnerDebt.updatedAt),
              deletedAt: partnerDebt.deletedAt ? new Date(partnerDebt.deletedAt) : null
            }
          })
        } catch (error) {
          console.log('Error importing partner debt:', partnerDebt.id, error)
        }
      }
    }

    // Import partner groups
    if (data.partnerGroups && data.partnerGroups.length > 0) {
      console.log(`Importing ${data.partnerGroups.length} partner groups...`)
      for (const partnerGroup of data.partnerGroups) {
        try {
          await prisma.partnerGroup.create({
            data: {
              id: partnerGroup.id,
              name: partnerGroup.name,
              notes: partnerGroup.notes,
              createdAt: new Date(partnerGroup.createdAt),
              updatedAt: new Date(partnerGroup.updatedAt),
              deletedAt: partnerGroup.deletedAt ? new Date(partnerGroup.deletedAt) : null
            }
          })
        } catch (error) {
          console.log('Error importing partner group:', partnerGroup.name, error)
        }
      }
    }

    // Import partner group partners
    if (data.partnerGroupPartners && data.partnerGroupPartners.length > 0) {
      console.log(`Importing ${data.partnerGroupPartners.length} partner group partners...`)
      for (const partnerGroupPartner of data.partnerGroupPartners) {
        try {
          await prisma.partnerGroupPartner.create({
            data: {
              id: partnerGroupPartner.id,
              partnerGroupId: partnerGroupPartner.partnerGroupId,
              partnerId: partnerGroupPartner.partnerId,
              percentage: partnerGroupPartner.percentage,
              createdAt: new Date(partnerGroupPartner.createdAt),
              updatedAt: new Date(partnerGroupPartner.updatedAt),
              deletedAt: partnerGroupPartner.deletedAt ? new Date(partnerGroupPartner.deletedAt) : null
            }
          })
        } catch (error) {
          console.log('Error importing partner group partner:', partnerGroupPartner.id, error)
        }
      }
    }

    // Import audit logs
    if (data.auditLogs && data.auditLogs.length > 0) {
      console.log(`Importing ${data.auditLogs.length} audit logs...`)
      for (const auditLog of data.auditLogs) {
        try {
          await prisma.auditLog.create({
            data: {
              id: auditLog.id,
              userId: auditLog.userId,
              action: auditLog.action,
              entityType: (auditLog as any).tableName || (auditLog as any).entityType || 'unknown',
              entityId: (auditLog as any).recordId || (auditLog as any).entityId || '',
              oldValues: auditLog.oldValues,
              newValues: auditLog.newValues,
              ipAddress: auditLog.ipAddress,
              userAgent: auditLog.userAgent,
              createdAt: new Date(auditLog.createdAt)
            }
          })
        } catch (error) {
          console.log('Error importing audit log:', auditLog.id, error)
        }
      }
    }

    console.log('System import completed successfully')

    // Verify data was actually saved
    console.log('Verifying imported data...')
    const verificationResults = {
      users: await prisma.user.count(),
      units: await prisma.unit.count(),
      customers: await prisma.customer.count(),
      brokers: await prisma.broker.count(),
      contracts: await prisma.contract.count(),
      installments: await prisma.installment.count(),
      safes: await prisma.safe.count(),
      partners: await prisma.partner.count(),
      vouchers: await prisma.voucher.count(),
      transfers: await prisma.transfer.count(),
      unitPartners: await prisma.unitPartner.count(),
      brokerDues: await prisma.brokerDue.count(),
      partnerDebts: await prisma.partnerDebt.count(),
      partnerGroups: await prisma.partnerGroup.count(),
      partnerGroupPartners: await prisma.partnerGroupPartner.count(),
      auditLogs: await prisma.auditLog.count()
    }

    console.log('Verification results:', verificationResults)

    return NextResponse.json({
      success: true,
      message: 'تم استيراد البيانات بنجاح',
      importedData: {
        users: data.users?.length || 0,
        units: data.units?.length || 0,
        customers: data.customers?.length || 0,
        brokers: data.brokers?.length || 0,
        contracts: data.contracts?.length || 0,
        installments: data.installments?.length || 0,
        safes: data.safes?.length || 0,
        partners: data.partners?.length || 0,
        vouchers: data.vouchers?.length || 0,
        transfers: data.transfers?.length || 0,
        unitPartners: data.unitPartners?.length || 0,
        brokerDues: data.brokerDues?.length || 0,
        partnerDebts: data.partnerDebts?.length || 0,
        partnerGroups: data.partnerGroups?.length || 0,
        partnerGroupPartners: data.partnerGroupPartners?.length || 0,
        auditLogs: data.auditLogs?.length || 0
      },
      verificationResults
    })

  } catch (error) {
    console.error('System import error:', error)
    
    // Try to get current data count for debugging
    let currentDataCount = {}
    try {
      currentDataCount = {
        users: await prisma.user.count(),
        units: await prisma.unit.count(),
        customers: await prisma.customer.count(),
        brokers: await prisma.broker.count(),
        contracts: await prisma.contract.count(),
        installments: await prisma.installment.count(),
        safes: await prisma.safe.count(),
        partners: await prisma.partner.count(),
        vouchers: await prisma.voucher.count(),
        transfers: await prisma.transfer.count(),
        unitPartners: await prisma.unitPartner.count(),
        brokerDues: await prisma.brokerDue.count(),
        partnerDebts: await prisma.partnerDebt.count(),
        partnerGroups: await prisma.partnerGroup.count(),
        partnerGroupPartners: await prisma.partnerGroupPartner.count(),
        auditLogs: await prisma.auditLog.count()
      }
    } catch (countError) {
      console.error('Error getting current data count:', countError)
    }
    
    // Return a more user-friendly error message
    const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف'
    const isDatabaseError = errorMessage.includes('database') || errorMessage.includes('connection') || errorMessage.includes('timeout')
    
    return NextResponse.json(
      { 
        error: isDatabaseError ? 'خطأ في الاتصال بقاعدة البيانات' : 'فشل في استيراد البيانات',
        details: errorMessage,
        currentDataCount,
        timestamp: new Date().toISOString(),
        // Don't include stack trace in production
        ...(process.env.NODE_ENV === 'development' && { stack: error instanceof Error ? error.stack : undefined })
      },
      { status: 500 }
    )
  }
}