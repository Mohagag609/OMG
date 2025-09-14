const fs = require('fs');
const path = require('path');

// قائمة الصفحات التي تحتاج تحديث
const pagesToUpdate = [
  'src/app/settings/page.tsx',
  'src/app/system/page.tsx',
  'src/app/reports/page.tsx',
  'src/app/reports/cashflow/page.tsx',
  'src/app/treasury/page.tsx',
  'src/app/vouchers/page.tsx',
  'src/app/profile/page.tsx',
  'src/app/brokers/page.tsx',
  'src/app/backup-system/page.tsx',
  'src/app/installments/page.tsx',
  'src/app/partners/page.tsx',
  'src/app/admin/page.tsx'
];

// استثناء صفحات المصادقة
const authPages = [
  'src/app/reset-password/page.tsx',
  'src/app/forgot-password/page.tsx'
];

function updatePage(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`❌ الملف غير موجود: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;

    // إضافة import للـ Layout إذا لم يكن موجود
    if (!content.includes("import Layout from '@/components/Layout'")) {
      // البحث عن آخر import statement
      const importRegex = /import.*from.*['"][^'"]+['"];?\s*$/gm;
      const imports = content.match(importRegex);
      
      if (imports && imports.length > 0) {
        const lastImport = imports[imports.length - 1];
        const lastImportIndex = content.lastIndexOf(lastImport);
        const insertIndex = lastImportIndex + lastImport.length;
        
        content = content.slice(0, insertIndex) + 
          "\nimport Layout from '@/components/Layout'" + 
          content.slice(insertIndex);
        modified = true;
      }
    }

    // استبدال loading state
    const loadingPattern = /if\s*\(\s*loading\s*\)\s*\{\s*return\s*\(\s*<div\s+className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">[\s\S]*?<\/div>\s*\)\s*\}/g;
    const loadingReplacement = `if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-700">جاري التحميل...</h2>
          </div>
        </div>
      </Layout>
    )
  }`;

    if (loadingPattern.test(content)) {
      content = content.replace(loadingPattern, loadingReplacement);
      modified = true;
    }

    // استبدال return statement الرئيسي
    const mainReturnPattern = /return\s*\(\s*<div\s+className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">[\s\S]*?<\/div>\s*\)\s*$/gm;
    const mainReturnReplacement = `return (
    <Layout>
      {content}
    </Layout>
  )`;

    // استبدال الـ header والـ sidebar
    const headerSidebarPattern = /<div\s+className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">\s*{.*?Sidebar.*?}\s*<div\s+className=.*?>\s*{.*?Header.*?}\s*<div\s+className="max-w-7xl mx-auto px-6 py-8">/gs;
    
    if (headerSidebarPattern.test(content)) {
      content = content.replace(headerSidebarPattern, '<Layout>');
      modified = true;
    }

    // إزالة الـ div الإضافية في النهاية
    const endDivPattern = /<\/div>\s*<\/div>\s*\)\s*$/gm;
    if (endDivPattern.test(content)) {
      content = content.replace(endDivPattern, '</Layout>\n  )');
      modified = true;
    }

    // إزالة imports غير مستخدمة
    const unusedImports = [
      "import SidebarToggle from '@/components/SidebarToggle'",
      "import Sidebar from '@/components/Sidebar'",
      "import Header from '@/components/Header'",
      "import NavigationButtons from '@/components/NavigationButtons'"
    ];

    unusedImports.forEach(importStatement => {
      if (content.includes(importStatement)) {
        content = content.replace(new RegExp(importStatement + '\\s*', 'g'), '');
        modified = true;
      }
    });

    // إزالة متغيرات sidebar غير مستخدمة
    const sidebarVars = [
      'const [sidebarOpen, setSidebarOpen] = useState(false)',
      'setSidebarOpen(!sidebarOpen)',
      'setSidebarOpen(false)',
      'setSidebarOpen(true)'
    ];

    sidebarVars.forEach(varPattern => {
      if (content.includes(varPattern)) {
        content = content.replace(new RegExp(varPattern + '\\s*', 'g'), '');
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ تم تحديث: ${filePath}`);
    } else {
      console.log(`⏭️  لا يحتاج تحديث: ${filePath}`);
    }

  } catch (error) {
    console.error(`❌ خطأ في تحديث ${filePath}:`, error.message);
  }
}

// تشغيل التحديث
console.log('🚀 بدء تحديث الصفحات...\n');

pagesToUpdate.forEach(page => {
  updatePage(page);
});

console.log('\n✅ تم الانتهاء من تحديث جميع الصفحات!');