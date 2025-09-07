const fs = require('fs')
const path = require('path')

// List of API route files that need the runtime export
const apiFiles = [
  'src/app/api/notifications/route.ts',
  'src/app/api/notifications/[id]/acknowledge/route.ts',
  'src/app/api/customers/route.ts',
  'src/app/api/customers/[id]/route.ts',
  'src/app/api/audit/route.ts',
  'src/app/api/audit/[id]/route.ts',
  'src/app/api/monitoring/health/route.ts',
  'src/app/api/monitoring/dashboard/route.ts',
  'src/app/api/monitoring/metrics/route.ts',
  'src/app/api/auth/verify/route.ts',
  'src/app/api/auth/login/route.ts',
  'src/app/api/vouchers/route.ts',
  'src/app/api/units/route.ts',
  'src/app/api/units/[id]/route.ts',
  'src/app/api/backup/list/route.ts',
  'src/app/api/backup/create/route.ts',
  'src/app/api/trash/restore/route.ts',
  'src/app/api/trash/route.ts',
  'src/app/api/trash/permanent-delete/route.ts',
  'src/app/api/safes/route.ts',
  'src/app/api/installments/route.ts',
  'src/app/api/installments/[id]/route.ts',
  'src/app/api/export/route.ts',
  'src/app/api/export/excel/route.ts',
  'src/app/api/export/csv/route.ts',
  'src/app/api/import/route.ts',
  'src/app/api/dashboard/route.ts'
]

function addRuntimeExport(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    
    // Check if runtime export already exists
    if (content.includes('export const runtime')) {
      console.log(`Skipping ${filePath} - already has runtime export`)
      return
    }
    
    // Find the dynamic export line and add runtime after it
    const lines = content.split('\n')
    let insertIndex = -1
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('export const dynamic')) {
        insertIndex = i + 1
        break
      }
    }
    
    if (insertIndex === -1) {
      console.log(`Could not find dynamic export in ${filePath}`)
      return
    }
    
    // Insert the runtime export
    lines.splice(insertIndex, 0, 'export const runtime = \'nodejs\'')
    
    const newContent = lines.join('\n')
    fs.writeFileSync(filePath, newContent)
    console.log(`Added runtime export to ${filePath}`)
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message)
  }
}

// Process all files
apiFiles.forEach(addRuntimeExport)

console.log('Finished adding runtime exports to API routes')