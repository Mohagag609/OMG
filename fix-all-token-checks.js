const fs = require('fs');
const path = require('path');

// Find all TypeScript/JavaScript files in src/app
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findFiles(filePath, fileList);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Fix token checks in a file
function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Remove all token-related code
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
    // Pattern 6: if (!token) { router.push('/login'); return; } (with extra spaces)
    {
      regex: /if\s*\(\s*!token\s*\)\s*\{\s*router\.push\(['"]\/login['"]\)\s*;\s*return\s*;\s*\}/g,
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
const appDir = path.join(__dirname, 'src', 'app');
const files = findFiles(appDir);

console.log(`Found ${files.length} files to check...`);

let fixedCount = 0;
files.forEach(file => {
  if (fixFile(file)) {
    fixedCount++;
  }
});

console.log(`Fixed ${fixedCount} files`);