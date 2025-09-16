const fs = require('fs');
const path = require('path');

// List of files that still have token issues
const filesToFix = [
  'src/app/vouchers/page.tsx',
  'src/app/profile/page.tsx', 
  'src/app/test-safes/page.tsx',
  'src/app/treasury/page.tsx',
  'src/app/system/page.tsx',
  'src/app/reports/page.tsx',
  'src/app/partners/page.tsx',
  'src/app/customers/page.tsx',
  'src/app/partner-debts/page.tsx',
  'src/app/partner-groups/page.tsx',
  'src/app/installments/page.tsx',
  'src/app/contracts/page.tsx',
  'src/app/brokers/page.tsx',
  'src/app/reset-password/page.tsx'
];

// Fix token checks in a file
function fixFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Remove all token-related code patterns
  const patterns = [
    // Pattern 1: if (!token) { router.push('/login'); return; }
    {
      regex: /if\s*\(\s*!token\s*\)\s*\{\s*router\.push\(['"]\/login['"]\)\s*;\s*return\s*;\s*\}/g,
      replacement: ''
    },
    // Pattern 2: if (!token) { router.push('/login'); return; } (multiline)
    {
      regex: /if\s*\(\s*!token\s*\)\s*\{\s*router\.push\(['"]\/login['"]\)\s*;\s*return\s*;\s*\}/gs,
      replacement: ''
    },
    // Pattern 3: const token = localStorage.getItem('authToken')
    {
      regex: /const\s+token\s*=\s*localStorage\.getItem\(['"]authToken['"]\)\s*;?\s*/g,
      replacement: ''
    },
    // Pattern 4: let token = localStorage.getItem('authToken')
    {
      regex: /let\s+token\s*=\s*localStorage\.getItem\(['"]authToken['"]\)\s*;?\s*/g,
      replacement: ''
    },
    // Pattern 5: var token = localStorage.getItem('authToken')
    {
      regex: /var\s+token\s*=\s*localStorage\.getItem\(['"]authToken['"]\)\s*;?\s*/g,
      replacement: ''
    },
    // Pattern 6: if (!token) { router.push('/login'); return; } (with extra spaces and newlines)
    {
      regex: /if\s*\(\s*!token\s*\)\s*\{\s*router\.push\(['"]\/login['"]\)\s*;\s*return\s*;\s*\}/gs,
      replacement: ''
    }
  ];
  
  patterns.forEach(pattern => {
    const newContent = content.replace(pattern.regex, pattern.replacement);
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${filePath}`);
    return true;
  }
  
  return false;
}

// Main execution
console.log(`Fixing ${filesToFix.length} files...`);

let fixedCount = 0;
filesToFix.forEach(file => {
  if (fixFile(file)) {
    fixedCount++;
  }
});

console.log(`Fixed ${fixedCount} files`);