const fs = require('fs')
const path = require('path')

// List of API route files that need the dynamic export
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
  'src/app/api/import/route.ts'
]

function addDynamicExport(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    
    // Check if dynamic export already exists
    if (content.includes('export const dynamic')) {
      console.log(`Skipping ${filePath} - already has dynamic export`)
      return
    }
    
    // Find the first import statement
    const lines = content.split('\n')
    let insertIndex = 0
    
    // Find where to insert the dynamic export (after imports)
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ') || lines[i].startsWith('//')) {
        insertIndex = i + 1
      } else if (lines[i].trim() === '') {
        continue
      } else {
        break
      }
    }
    
    // Insert the dynamic export
    lines.splice(insertIndex, 0, '', 'export const dynamic = \'force-dynamic\'')
    
    const newContent = lines.join('\n')
    fs.writeFileSync(filePath, newContent)
    console.log(`Added dynamic export to ${filePath}`)
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message)
  }
}

// Process all files
apiFiles.forEach(addDynamicExport)

console.log('Finished adding dynamic exports to API routes')