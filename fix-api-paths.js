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

// Fix API paths in a file
function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Replace API paths with Netlify Functions paths
  const apiMappings = [
    { from: "fetch('/api/units'", to: "fetch('/.netlify/functions/units'" },
    { from: "fetch('/api/customers'", to: "fetch('/.netlify/functions/customers'" },
    { from: "fetch('/api/partners'", to: "fetch('/.netlify/functions/partners'" },
    { from: "fetch('/api/contracts'", to: "fetch('/.netlify/functions/contracts'" },
    { from: "fetch('/api/installments'", to: "fetch('/.netlify/functions/installments'" },
    { from: "fetch('/api/safes'", to: "fetch('/.netlify/functions/safes'" },
    { from: "fetch('/api/brokers'", to: "fetch('/.netlify/functions/brokers'" },
    { from: "fetch('/api/vouchers'", to: "fetch('/.netlify/functions/vouchers'" },
    { from: "fetch('/api/dashboard'", to: "fetch('/.netlify/functions/dashboard'" },
    { from: "fetch('/api/partner-groups'", to: "fetch('/.netlify/functions/partner-groups'" },
    { from: "fetch('/api/unit-partners'", to: "fetch('/.netlify/functions/unit-partners'" },
    { from: "fetch('/api/partner-debts'", to: "fetch('/.netlify/functions/partner-debts'" },
    { from: "fetch('/api/transfers'", to: "fetch('/.netlify/functions/transfers'" },
    { from: "fetch('/api/broker-due'", to: "fetch('/.netlify/functions/broker-due'" },
    { from: "fetch('/api/audit'", to: "fetch('/.netlify/functions/audit'" },
    { from: "fetch('/api/health'", to: "fetch('/.netlify/functions/health'" },
    { from: "fetch('/api/test-db'", to: "fetch('/.netlify/functions/test-db'" }
  ];
  
  apiMappings.forEach(mapping => {
    const newContent = content.replace(new RegExp(mapping.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), mapping.to);
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