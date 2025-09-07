const fs = require('fs')
const path = require('path')

// List of API route files that need fixing
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

function fixImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const lines = content.split('\n')
    
    // Find where imports end
    let importEndIndex = 0
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ') || lines[i].startsWith('//') || lines[i].trim() === '') {
        importEndIndex = i + 1
      } else {
        break
      }
    }
    
    // Find dynamic and runtime exports
    let dynamicIndex = -1
    let runtimeIndex = -1
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('export const dynamic')) {
        dynamicIndex = i
      }
      if (lines[i].includes('export const runtime')) {
        runtimeIndex = i
      }
    }
    
    // Remove dynamic and runtime exports from their current positions
    if (dynamicIndex !== -1) {
      lines.splice(dynamicIndex, 1)
      if (runtimeIndex > dynamicIndex) runtimeIndex--
    }
    if (runtimeIndex !== -1) {
      lines.splice(runtimeIndex, 1)
    }
    
    // Insert dynamic and runtime exports after imports
    const exportsToInsert = []
    if (dynamicIndex !== -1) {
      exportsToInsert.push('export const dynamic = \'force-dynamic\'')
    }
    if (runtimeIndex !== -1) {
      exportsToInsert.push('export const runtime = \'nodejs\'')
    }
    
    if (exportsToInsert.length > 0) {
      lines.splice(importEndIndex, 0, '', ...exportsToInsert)
    }
    
    const newContent = lines.join('\n')
    fs.writeFileSync(filePath, newContent)
    console.log(`Fixed imports in ${filePath}`)
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message)
  }
}

// Process all files
apiFiles.forEach(fixImports)

console.log('Finished fixing import order in API routes')