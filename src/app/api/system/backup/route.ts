import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import JSZip from 'jszip'

export async function GET(request: NextRequest) {
  try {
    console.log('Starting comprehensive system backup...')

    // Fetch all data from database
    const [
      users,
      units,
      customers,
      brokers,
      contracts,
      installments,
      safes,
      partners,
      vouchers,
      transfers,
      unitPartners,
      brokerDues,
      partnerDebts,
      partnerGroups,
      partnerGroupPartners,
      auditLogs
    ] = await Promise.all([
      prisma.user.findMany(),
      prisma.unit.findMany(),
      prisma.customer.findMany(),
      prisma.broker.findMany(),
      prisma.contract.findMany(),
      prisma.installment.findMany(),
      prisma.safe.findMany(),
      prisma.partner.findMany(),
      prisma.voucher.findMany(),
      prisma.transfer.findMany(),
      prisma.unitPartner.findMany(),
      prisma.brokerDue.findMany(),
      prisma.partnerDebt.findMany(),
      prisma.partnerGroup.findMany(),
      prisma.partnerGroupPartner.findMany(),
      prisma.auditLog.findMany()
    ])

    console.log('Data fetched successfully:', {
      users: users.length,
      units: units.length,
      customers: customers.length,
      brokers: brokers.length,
      contracts: contracts.length,
      installments: installments.length,
      safes: safes.length,
      partners: partners.length,
      vouchers: vouchers.length,
      transfers: transfers.length,
      unitPartners: unitPartners.length,
      brokerDues: brokerDues.length,
      partnerDebts: partnerDebts.length,
      partnerGroups: partnerGroups.length,
      partnerGroupPartners: partnerGroupPartners.length,
      auditLogs: auditLogs.length
    })

    // Create ZIP file
    const zip = new JSZip()

    // 1. Database Schema
    const schemaSQL = `-- Database Schema Export
-- Generated on: ${new Date().toISOString()}

-- Users table
CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "username" VARCHAR(255) UNIQUE NOT NULL,
  "password" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255) UNIQUE,
  "fullName" VARCHAR(255),
  "role" VARCHAR(50) DEFAULT 'admin',
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Units table
CREATE TABLE IF NOT EXISTS "units" (
  "id" VARCHAR(255) PRIMARY KEY,
  "code" VARCHAR(50) UNIQUE NOT NULL,
  "name" VARCHAR(255),
  "unitType" VARCHAR(100) DEFAULT 'سكني',
  "area" VARCHAR(50),
  "floor" VARCHAR(50),
  "building" VARCHAR(50),
  "totalPrice" FLOAT DEFAULT 0,
  "status" VARCHAR(50) DEFAULT 'متاحة',
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP
);

-- Customers table
CREATE TABLE IF NOT EXISTS "customers" (
  "id" VARCHAR(255) PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "phone" VARCHAR(20) UNIQUE,
  "nationalId" VARCHAR(20) UNIQUE,
  "address" TEXT,
  "status" VARCHAR(50) DEFAULT 'نشط',
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP
);

-- Brokers table
CREATE TABLE IF NOT EXISTS "brokers" (
  "id" VARCHAR(255) PRIMARY KEY,
  "name" VARCHAR(255) UNIQUE NOT NULL,
  "phone" VARCHAR(20),
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP
);

-- Contracts table
CREATE TABLE IF NOT EXISTS "contracts" (
  "id" VARCHAR(255) PRIMARY KEY,
  "unitId" VARCHAR(255) NOT NULL,
  "customerId" VARCHAR(255) NOT NULL,
  "start" TIMESTAMP NOT NULL,
  "totalPrice" FLOAT NOT NULL,
  "discountAmount" FLOAT DEFAULT 0,
  "brokerName" VARCHAR(255),
  "brokerPercent" FLOAT DEFAULT 0,
  "brokerAmount" FLOAT DEFAULT 0,
  "commissionSafeId" VARCHAR(255),
  "downPaymentSafeId" VARCHAR(255),
  "maintenanceDeposit" FLOAT DEFAULT 0,
  "installmentType" VARCHAR(50) DEFAULT 'شهري',
  "installmentCount" INTEGER DEFAULT 0,
  "extraAnnual" INTEGER DEFAULT 0,
  "annualPaymentValue" FLOAT DEFAULT 0,
  "downPayment" FLOAT DEFAULT 0,
  "paymentType" VARCHAR(50) DEFAULT 'installment',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP,
  FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE,
  FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE
);

-- Installments table
CREATE TABLE IF NOT EXISTS "installments" (
  "id" VARCHAR(255) PRIMARY KEY,
  "unitId" VARCHAR(255) NOT NULL,
  "amount" FLOAT NOT NULL,
  "dueDate" TIMESTAMP NOT NULL,
  "status" VARCHAR(50) DEFAULT 'معلق',
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP,
  FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE
);

-- Safes table
CREATE TABLE IF NOT EXISTS "safes" (
  "id" VARCHAR(255) PRIMARY KEY,
  "name" VARCHAR(255) UNIQUE NOT NULL,
  "balance" FLOAT DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP
);

-- Partners table
CREATE TABLE IF NOT EXISTS "partners" (
  "id" VARCHAR(255) PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "phone" VARCHAR(20),
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP
);

-- Vouchers table
CREATE TABLE IF NOT EXISTS "vouchers" (
  "id" VARCHAR(255) PRIMARY KEY,
  "type" VARCHAR(50) NOT NULL,
  "date" TIMESTAMP NOT NULL,
  "amount" FLOAT NOT NULL,
  "safeId" VARCHAR(255) NOT NULL,
  "description" TEXT NOT NULL,
  "payer" VARCHAR(255),
  "beneficiary" VARCHAR(255),
  "linkedRef" VARCHAR(255),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP,
  FOREIGN KEY ("safeId") REFERENCES "safes"("id") ON DELETE CASCADE
);

-- Transfers table
CREATE TABLE IF NOT EXISTS "transfers" (
  "id" VARCHAR(255) PRIMARY KEY,
  "fromSafeId" VARCHAR(255),
  "toSafeId" VARCHAR(255),
  "amount" FLOAT NOT NULL,
  "description" TEXT,
  "date" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP,
  FOREIGN KEY ("fromSafeId") REFERENCES "safes"("id") ON DELETE SET NULL,
  FOREIGN KEY ("toSafeId") REFERENCES "safes"("id") ON DELETE SET NULL
);

-- Unit Partners table
CREATE TABLE IF NOT EXISTS "unit_partners" (
  "id" VARCHAR(255) PRIMARY KEY,
  "unitId" VARCHAR(255) NOT NULL,
  "partnerId" VARCHAR(255) NOT NULL,
  "percentage" FLOAT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP,
  FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE,
  FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE CASCADE,
  UNIQUE("unitId", "partnerId")
);

-- Broker Dues table
CREATE TABLE IF NOT EXISTS "broker_dues" (
  "id" VARCHAR(255) PRIMARY KEY,
  "brokerId" VARCHAR(255) NOT NULL,
  "amount" FLOAT NOT NULL,
  "dueDate" TIMESTAMP NOT NULL,
  "status" VARCHAR(50) DEFAULT 'معلق',
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP,
  FOREIGN KEY ("brokerId") REFERENCES "brokers"("id") ON DELETE CASCADE
);

-- Partner Debts table
CREATE TABLE IF NOT EXISTS "partner_debts" (
  "id" VARCHAR(255) PRIMARY KEY,
  "partnerId" VARCHAR(255) NOT NULL,
  "amount" FLOAT NOT NULL,
  "dueDate" TIMESTAMP NOT NULL,
  "status" VARCHAR(50) DEFAULT 'معلق',
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP,
  FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE CASCADE
);

-- Partner Groups table
CREATE TABLE IF NOT EXISTS "partner_groups" (
  "id" VARCHAR(255) PRIMARY KEY,
  "name" VARCHAR(255) UNIQUE NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP
);

-- Partner Group Partners table
CREATE TABLE IF NOT EXISTS "partner_group_partners" (
  "id" VARCHAR(255) PRIMARY KEY,
  "partnerGroupId" VARCHAR(255) NOT NULL,
  "partnerId" VARCHAR(255) NOT NULL,
  "percentage" FLOAT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP,
  FOREIGN KEY ("partnerGroupId") REFERENCES "partner_groups"("id") ON DELETE CASCADE,
  FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE CASCADE,
  UNIQUE("partnerGroupId", "partnerId")
);

-- Audit Logs table
CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" VARCHAR(255) PRIMARY KEY,
  "userId" INTEGER,
  "action" VARCHAR(100) NOT NULL,
  "tableName" VARCHAR(100),
  "recordId" VARCHAR(255),
  "oldValues" JSONB,
  "newValues" JSONB,
  "ipAddress" INET,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL
);`

    zip.file('database_schema.sql', schemaSQL)

    // 2. Data Export (SQL INSERT statements)
    const dataSQL = `-- Data Export
-- Generated on: ${new Date().toISOString()}

-- Users data
${users.map(user => `INSERT INTO "users" ("id", "username", "password", "email", "fullName", "role", "isActive", "createdAt", "updatedAt") VALUES (${user.id}, '${user.username}', '${user.password}', ${user.email ? `'${user.email}'` : 'NULL'}, ${user.fullName ? `'${user.fullName}'` : 'NULL'}, '${user.role}', ${user.isActive}, '${user.createdAt.toISOString()}', '${user.updatedAt.toISOString()}');`).join('\n')}

-- Units data
${units.map(unit => `INSERT INTO "units" ("id", "code", "name", "unitType", "area", "floor", "building", "totalPrice", "status", "notes", "createdAt", "updatedAt", "deletedAt") VALUES ('${unit.id}', '${unit.code}', ${unit.name ? `'${unit.name}'` : 'NULL'}, '${unit.unitType}', ${unit.area ? `'${unit.area}'` : 'NULL'}, ${unit.floor ? `'${unit.floor}'` : 'NULL'}, ${unit.building ? `'${unit.building}'` : 'NULL'}, ${unit.totalPrice}, '${unit.status}', ${unit.notes ? `'${unit.notes}'` : 'NULL'}, '${unit.createdAt.toISOString()}', '${unit.updatedAt.toISOString()}', ${unit.deletedAt ? `'${unit.deletedAt.toISOString()}'` : 'NULL'});`).join('\n')}

-- Customers data
${customers.map(customer => `INSERT INTO "customers" ("id", "name", "phone", "nationalId", "address", "status", "notes", "createdAt", "updatedAt", "deletedAt") VALUES ('${customer.id}', '${customer.name}', ${customer.phone ? `'${customer.phone}'` : 'NULL'}, ${customer.nationalId ? `'${customer.nationalId}'` : 'NULL'}, ${customer.address ? `'${customer.address}'` : 'NULL'}, '${customer.status}', ${customer.notes ? `'${customer.notes}'` : 'NULL'}, '${customer.createdAt.toISOString()}', '${customer.updatedAt.toISOString()}', ${customer.deletedAt ? `'${customer.deletedAt.toISOString()}'` : 'NULL'});`).join('\n')}

-- Brokers data
${brokers.map(broker => `INSERT INTO "brokers" ("id", "name", "phone", "notes", "createdAt", "updatedAt", "deletedAt") VALUES ('${broker.id}', '${broker.name}', ${broker.phone ? `'${broker.phone}'` : 'NULL'}, ${broker.notes ? `'${broker.notes}'` : 'NULL'}, '${broker.createdAt.toISOString()}', '${broker.updatedAt.toISOString()}', ${broker.deletedAt ? `'${broker.deletedAt.toISOString()}'` : 'NULL'});`).join('\n')}

-- Contracts data
${contracts.map(contract => `INSERT INTO "contracts" ("id", "unitId", "customerId", "start", "totalPrice", "discountAmount", "brokerName", "brokerPercent", "brokerAmount", "commissionSafeId", "downPaymentSafeId", "maintenanceDeposit", "installmentType", "installmentCount", "extraAnnual", "annualPaymentValue", "downPayment", "paymentType", "createdAt", "updatedAt", "deletedAt") VALUES ('${contract.id}', '${contract.unitId}', '${contract.customerId}', '${contract.start.toISOString()}', ${contract.totalPrice}, ${contract.discountAmount}, ${contract.brokerName ? `'${contract.brokerName}'` : 'NULL'}, ${contract.brokerPercent}, ${contract.brokerAmount}, ${contract.commissionSafeId ? `'${contract.commissionSafeId}'` : 'NULL'}, ${contract.downPaymentSafeId ? `'${contract.downPaymentSafeId}'` : 'NULL'}, ${contract.maintenanceDeposit}, '${contract.installmentType}', ${contract.installmentCount}, ${contract.extraAnnual}, ${contract.annualPaymentValue}, ${contract.downPayment}, '${contract.paymentType}', '${contract.createdAt.toISOString()}', '${contract.updatedAt.toISOString()}', ${contract.deletedAt ? `'${contract.deletedAt.toISOString()}'` : 'NULL'});`).join('\n')}

-- Installments data
${installments.map(installment => `INSERT INTO "installments" ("id", "unitId", "amount", "dueDate", "status", "notes", "createdAt", "updatedAt", "deletedAt") VALUES ('${installment.id}', '${installment.unitId}', ${installment.amount}, '${installment.dueDate.toISOString()}', '${installment.status}', ${installment.notes ? `'${installment.notes}'` : 'NULL'}, '${installment.createdAt.toISOString()}', '${installment.updatedAt.toISOString()}', ${installment.deletedAt ? `'${installment.deletedAt.toISOString()}'` : 'NULL'});`).join('\n')}

-- Safes data
${safes.map(safe => `INSERT INTO "safes" ("id", "name", "balance", "createdAt", "updatedAt", "deletedAt") VALUES ('${safe.id}', '${safe.name}', ${safe.balance}, '${safe.createdAt.toISOString()}', '${safe.updatedAt.toISOString()}', ${safe.deletedAt ? `'${safe.deletedAt.toISOString()}'` : 'NULL'});`).join('\n')}

-- Partners data
${partners.map(partner => `INSERT INTO "partners" ("id", "name", "phone", "notes", "createdAt", "updatedAt", "deletedAt") VALUES ('${partner.id}', '${partner.name}', ${partner.phone ? `'${partner.phone}'` : 'NULL'}, ${partner.notes ? `'${partner.notes}'` : 'NULL'}, '${partner.createdAt.toISOString()}', '${partner.updatedAt.toISOString()}', ${partner.deletedAt ? `'${partner.deletedAt.toISOString()}'` : 'NULL'});`).join('\n')}

-- Vouchers data
${vouchers.map(voucher => `INSERT INTO "vouchers" ("id", "type", "date", "amount", "safeId", "description", "payer", "beneficiary", "linkedRef", "createdAt", "updatedAt", "deletedAt") VALUES ('${voucher.id}', '${voucher.type}', '${voucher.date.toISOString()}', ${voucher.amount}, '${voucher.safeId}', '${voucher.description}', ${voucher.payer ? `'${voucher.payer}'` : 'NULL'}, ${voucher.beneficiary ? `'${voucher.beneficiary}'` : 'NULL'}, ${voucher.linkedRef ? `'${voucher.linkedRef}'` : 'NULL'}, '${voucher.createdAt.toISOString()}', '${voucher.updatedAt.toISOString()}', ${voucher.deletedAt ? `'${voucher.deletedAt.toISOString()}'` : 'NULL'});`).join('\n')}

-- Transfers data
${transfers.map(transfer => `INSERT INTO "transfers" ("id", "fromSafeId", "toSafeId", "amount", "description", "date", "createdAt", "updatedAt", "deletedAt") VALUES ('${transfer.id}', ${transfer.fromSafeId ? `'${transfer.fromSafeId}'` : 'NULL'}, ${transfer.toSafeId ? `'${transfer.toSafeId}'` : 'NULL'}, ${transfer.amount}, ${transfer.description ? `'${transfer.description}'` : 'NULL'}, '${transfer.date.toISOString()}', '${transfer.createdAt.toISOString()}', '${transfer.updatedAt.toISOString()}', ${transfer.deletedAt ? `'${transfer.deletedAt.toISOString()}'` : 'NULL'});`).join('\n')}

-- Unit Partners data
${unitPartners.map(up => `INSERT INTO "unit_partners" ("id", "unitId", "partnerId", "percentage", "createdAt", "updatedAt", "deletedAt") VALUES ('${up.id}', '${up.unitId}', '${up.partnerId}', ${up.percentage}, '${up.createdAt.toISOString()}', '${up.updatedAt.toISOString()}', ${up.deletedAt ? `'${up.deletedAt.toISOString()}'` : 'NULL'});`).join('\n')}

-- Broker Dues data
${brokerDues.map(bd => `INSERT INTO "broker_dues" ("id", "brokerId", "amount", "dueDate", "status", "notes", "createdAt", "updatedAt", "deletedAt") VALUES ('${bd.id}', '${bd.brokerId}', ${bd.amount}, '${bd.dueDate.toISOString()}', '${bd.status}', ${bd.notes ? `'${bd.notes}'` : 'NULL'}, '${bd.createdAt.toISOString()}', '${bd.updatedAt.toISOString()}', ${bd.deletedAt ? `'${bd.deletedAt.toISOString()}'` : 'NULL'});`).join('\n')}

-- Partner Debts data
${partnerDebts.map(pd => `INSERT INTO "partner_debts" ("id", "partnerId", "amount", "dueDate", "status", "notes", "createdAt", "updatedAt", "deletedAt") VALUES ('${pd.id}', '${pd.partnerId}', ${pd.amount}, '${pd.dueDate.toISOString()}', '${pd.status}', ${pd.notes ? `'${pd.notes}'` : 'NULL'}, '${pd.createdAt.toISOString()}', '${pd.updatedAt.toISOString()}', ${pd.deletedAt ? `'${pd.deletedAt.toISOString()}'` : 'NULL'});`).join('\n')}

-- Partner Groups data
${partnerGroups.map(pg => `INSERT INTO "partner_groups" ("id", "name", "notes", "createdAt", "updatedAt", "deletedAt") VALUES ('${pg.id}', '${pg.name}', ${pg.notes ? `'${pg.notes}'` : 'NULL'}, '${pg.createdAt.toISOString()}', '${pg.updatedAt.toISOString()}', ${pg.deletedAt ? `'${pg.deletedAt.toISOString()}'` : 'NULL'});`).join('\n')}

-- Partner Group Partners data
${partnerGroupPartners.map(pgp => `INSERT INTO "partner_group_partners" ("id", "partnerGroupId", "partnerId", "percentage", "createdAt", "updatedAt", "deletedAt") VALUES ('${pgp.id}', '${pgp.partnerGroupId}', '${pgp.partnerId}', ${pgp.percentage}, '${pgp.createdAt.toISOString()}', '${pgp.updatedAt.toISOString()}', ${pgp.deletedAt ? `'${pgp.deletedAt.toISOString()}'` : 'NULL'});`).join('\n')}

-- Audit Logs data
${auditLogs.map(log => `INSERT INTO "audit_logs" ("id", "userId", "action", "tableName", "recordId", "oldValues", "newValues", "ipAddress", "userAgent", "createdAt") VALUES ('${log.id}', ${log.userId || 'NULL'}, '${log.action}', ${log.tableName ? `'${log.tableName}'` : 'NULL'}, ${log.recordId ? `'${log.recordId}'` : 'NULL'}, ${log.oldValues ? `'${JSON.stringify(log.oldValues)}'` : 'NULL'}, ${log.newValues ? `'${JSON.stringify(log.newValues)}'` : 'NULL'}, ${log.ipAddress ? `'${log.ipAddress}'` : 'NULL'}, ${log.userAgent ? `'${log.userAgent}'` : 'NULL'}, '${log.createdAt.toISOString()}');`).join('\n')}`

    zip.file('database_data.sql', dataSQL)

    // 3. JSON Data Export
    const jsonData = {
      metadata: {
        exportDate: new Date().toISOString(),
        version: '1.0.0',
        description: 'Complete system backup'
      },
      data: {
        users,
        units,
        customers,
        brokers,
        contracts,
        installments,
        safes,
        partners,
        vouchers,
        transfers,
        unitPartners,
        brokerDues,
        partnerDebts,
        partnerGroups,
        partnerGroupPartners,
        auditLogs
      }
    }

    zip.file('data.json', JSON.stringify(jsonData, null, 2))

    // 4. System Configuration
    const systemConfig = {
      database: {
        provider: 'postgresql',
        version: '15+'
      },
      application: {
        name: 'Estate Management System',
        version: '1.0.0',
        framework: 'Next.js 14',
        orm: 'Prisma'
      },
      backup: {
        created: new Date().toISOString(),
        type: 'full_system_backup',
        tables: [
          'users', 'units', 'customers', 'brokers', 'contracts',
          'installments', 'safes', 'partners', 'vouchers', 'transfers',
          'unit_partners', 'broker_dues', 'partner_debts', 'partner_groups',
          'partner_group_partners', 'audit_logs'
        ]
      }
    }

    zip.file('system_config.json', JSON.stringify(systemConfig, null, 2))

    // 5. Import Instructions
    const importInstructions = `# System Import Instructions

## Prerequisites
1. PostgreSQL database (version 15+)
2. Node.js (version 18+)
3. Prisma CLI installed

## Import Steps

### 1. Database Setup
\`\`\`bash
# Create new database
createdb estate_management

# Set environment variable
export DATABASE_URL="postgresql://username:password@localhost:5432/estate_management"
\`\`\`

### 2. Schema Import
\`\`\`bash
# Import database schema
psql -d estate_management -f database_schema.sql
\`\`\`

### 3. Data Import
\`\`\`bash
# Import data
psql -d estate_management -f database_data.sql
\`\`\`

### 4. Application Setup
\`\`\`bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push
\`\`\`

### 5. Start Application
\`\`\`bash
# Development
npm run dev

# Production
npm run build
npm start
\`\`\`

## Files Description
- \`database_schema.sql\`: Complete database schema
- \`database_data.sql\`: All data as SQL INSERT statements
- \`data.json\`: Complete data export in JSON format
- \`system_config.json\`: System configuration and metadata

## Notes
- This backup contains the complete system state
- All foreign key relationships are preserved
- Soft-deleted records are included
- Audit logs are preserved for compliance

## Support
For technical support, contact the development team.
`

    zip.file('IMPORT_INSTRUCTIONS.md', importInstructions)

    // 6. Prisma Schema
    const prismaSchema = `// Prisma Schema
// This file was generated from the backup

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  username  String   @unique
  password  String
  email     String?  @unique
  fullName  String?
  role      String   @default("admin")
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}

model Unit {
  id        String    @id @default(cuid())
  code      String    @unique
  name      String?
  unitType  String    @default("سكني")
  area      String?
  floor     String?
  building  String?
  totalPrice Float    @default(0)
  status    String    @default("متاحة")
  notes     String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  @@map("units")
}

model Customer {
  id         String    @id @default(cuid())
  name       String
  phone      String?   @unique
  nationalId String?   @unique
  address    String?
  status     String    @default("نشط")
  notes      String?
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
  deletedAt  DateTime?

  @@map("customers")
}

model Broker {
  id        String    @id @default(cuid())
  name      String    @unique
  phone     String?
  notes     String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  @@map("brokers")
}

model Contract {
  id                  String    @id @default(cuid())
  unitId              String
  customerId          String
  start               DateTime
  totalPrice          Float
  discountAmount      Float     @default(0)
  brokerName          String?
  brokerPercent       Float     @default(0)
  brokerAmount        Float     @default(0)
  commissionSafeId    String?
  downPaymentSafeId   String?
  maintenanceDeposit  Float     @default(0)
  installmentType     String    @default("شهري")
  installmentCount    Int       @default(0)
  extraAnnual         Int       @default(0)
  annualPaymentValue  Float     @default(0)
  downPayment         Float     @default(0)
  paymentType         String    @default("installment")
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  deletedAt           DateTime?

  @@map("contracts")
}

model Installment {
  id        String    @id @default(cuid())
  unitId    String
  amount    Float
  dueDate   DateTime
  status    String    @default("معلق")
  notes     String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  @@map("installments")
}

model Safe {
  id        String    @id @default(cuid())
  name      String    @unique
  balance   Float     @default(0)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  @@map("safes")
}

model Partner {
  id        String    @id @default(cuid())
  name      String
  phone     String?
  notes     String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  @@map("partners")
}

model Voucher {
  id          String    @id @default(cuid())
  type        String
  date        DateTime
  amount      Float
  safeId      String
  description String
  payer       String?
  beneficiary String?
  linkedRef   String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?

  @@map("vouchers")
}

model Transfer {
  id          String    @id @default(cuid())
  fromSafeId  String?
  toSafeId    String?
  amount      Float
  description String?
  date        DateTime
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?

  @@map("transfers")
}

model UnitPartner {
  id        String    @id @default(cuid())
  unitId    String
  partnerId String
  percentage Float
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  @@map("unit_partners")
}

model BrokerDue {
  id        String    @id @default(cuid())
  brokerId  String
  amount    Float
  dueDate   DateTime
  status    String    @default("معلق")
  notes     String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  @@map("broker_dues")
}

model PartnerDebt {
  id        String    @id @default(cuid())
  partnerId String
  amount    Float
  dueDate   DateTime
  status    String    @default("معلق")
  notes     String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  @@map("partner_debts")
}

model PartnerGroup {
  id        String    @id @default(cuid())
  name      String    @unique
  notes     String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  @@map("partner_groups")
}

model PartnerGroupPartner {
  id              String    @id @default(cuid())
  partnerGroupId String
  partnerId       String
  percentage      Float
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?

  @@map("partner_group_partners")
}

model AuditLog {
  id        String    @id @default(cuid())
  userId    Int?
  action    String
  tableName String?
  recordId  String?
  oldValues Json?
  newValues Json?
  ipAddress String?
  userAgent String?
  createdAt DateTime  @default(now())

  @@map("audit_logs")
}
`

    zip.file('schema.prisma', prismaSchema)

    // Generate ZIP file
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })

    console.log('Comprehensive system backup completed successfully')

    return new NextResponse(zipBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="system-backup-${new Date().toISOString().split('T')[0]}.zip"`,
        'Content-Length': zipBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error('System backup error:', error)
    return NextResponse.json(
      { 
        error: 'فشل في إنشاء النسخة الاحتياطية الشاملة',
        details: error instanceof Error ? error.message : 'خطأ غير معروف'
      },
      { status: 500 }
    )
  }
}