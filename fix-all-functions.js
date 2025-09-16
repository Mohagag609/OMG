const fs = require('fs');
const path = require('path');

// List of function files to fix
const functionFiles = [
  'netlify/functions/partners.js',
  'netlify/functions/contracts.js',
  'netlify/functions/installments.js',
  'netlify/functions/safes.js',
  'netlify/functions/brokers.js',
  'netlify/functions/vouchers.js',
  'netlify/functions/unit-partners.js',
  'netlify/functions/partner-groups.js',
  'netlify/functions/partner-debts.js',
  'netlify/functions/transfers.js',
  'netlify/functions/broker-due.js',
  'netlify/functions/audit.js'
];

// Fix a single function file
function fixFunctionFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Extract entity name from file path
  const entityName = path.basename(filePath, '.js').replace('-', '');
  const entityId = entityName + 'Id';

  // Fix the parameter extraction
  const oldPattern = /const method = event\.httpMethod\s*const \{ id \} = event\.pathParameters \|\| \{\}\s*const body = event\.body \? JSON\.parse\(event\.body\) : \{\}/;
  const newPattern = `const method = event.httpMethod
    const { id } = event.pathParameters || {}
    const queryParams = event.queryStringParameters || {}
    const body = event.body ? JSON.parse(event.body) : {}
    
    // Get ID from query parameters if not in path
    const ${entityId} = id || queryParams.id`;

  if (content.match(oldPattern)) {
    content = content.replace(oldPattern, newPattern);
    modified = true;
  }

  // Fix all references to 'id' to use the entityId
  const idReferences = [
    { from: new RegExp(`where: \\{ id, deletedAt: null \\}`, 'g'), to: `where: { id: ${entityId}, deletedAt: null }` },
    { from: new RegExp(`where: \\{ id \\}`, 'g'), to: `where: { id: ${entityId} }` },
    { from: new RegExp(`if \\(id\\)`, 'g'), to: `if (${entityId})` },
    { from: new RegExp(`if \\(!id\\)`, 'g'), to: `if (!${entityId})` },
    { from: new RegExp(`if \\(method === 'GET' && !id\\)`, 'g'), to: `if (method === 'GET' && !${entityId})` }
  ];

  idReferences.forEach(ref => {
    const newContent = content.replace(ref.from, ref.to);
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
console.log(`Fixing ${functionFiles.length} function files...`);

let fixedCount = 0;
functionFiles.forEach(file => {
  if (fixFunctionFile(file)) {
    fixedCount++;
  }
});

console.log(`Fixed ${fixedCount} files`);