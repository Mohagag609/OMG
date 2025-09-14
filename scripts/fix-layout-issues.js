const fs = require('fs');
const path = require('path');

// قائمة الصفحات التي تحتاج إصلاح
const pagesToFix = [
  'src/app/admin/page.tsx',
  'src/app/brokers/page.tsx',
  'src/app/installments/page.tsx',
  'src/app/partners/page.tsx',
  'src/app/contracts/page.tsx',
  'src/app/units/page.tsx',
  'src/app/customers/page.tsx'
];

function fixPage(filePath) {
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
      const lastImportMatch = content.match(/import.*from.*['"][^'"]+['"];?\s*$/gm);
      if (lastImportMatch && lastImportMatch.length > 0) {
        const lastImport = lastImportMatch[lastImportMatch.length - 1];
        const lastImportIndex = content.lastIndexOf(lastImport);
        const insertIndex = lastImportIndex + lastImport.length;
        
        content = content.slice(0, insertIndex) + 
          "\nimport Layout from '@/components/Layout'" + 
          content.slice(insertIndex);
        modified = true;
      }
    }

    // إصلاح loading state
    const loadingPattern = /if\s*\(\s*loading\s*\)\s*\{\s*return\s*\(\s*<div\s+className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">[\s\S]*?<\/div>\s*\)\s*\}/g;
    
    if (loadingPattern.test(content)) {
      content = content.replace(loadingPattern, `if (loading) {
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
  }`);
      modified = true;
    }

    // إصلاح authentication check
    const authPattern = /if\s*\(\s*!isAuthenticated\s*\)\s*\{\s*return\s*\(\s*<div\s+className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">[\s\S]*?<\/div>\s*\)\s*\}/g;
    
    if (authPattern.test(content)) {
      content = content.replace(authPattern, `if (!isAuthenticated) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">🔒</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">تحتاج إلى صلاحيات</h2>
            <p className="text-gray-600">يرجى تسجيل الدخول للوصول إلى هذه الصفحة</p>
          </div>
        </div>
      </Layout>
    )
  }`);
      modified = true;
    }

    // إصلاح return statement الرئيسي
    const mainReturnPattern = /return\s*\(\s*<div\s+className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">[\s\S]*?(?=<\/div>\s*\)\s*$)/g;
    
    if (mainReturnPattern.test(content)) {
      // العثور على المحتوى داخل الـ div الرئيسي
      const match = content.match(mainReturnPattern);
      if (match && match.length > 0) {
        let innerContent = match[0].replace(/return\s*\(\s*<div\s+className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">/, '');
        
        // إزالة الـ header والـ sidebar
        innerContent = innerContent.replace(/{.*?Sidebar.*?}\s*/, '');
        innerContent = innerContent.replace(/{.*?Header.*?}\s*/, '');
        innerContent = innerContent.replace(/{.*?SidebarToggle.*?}\s*/, '');
        innerContent = innerContent.replace(/{.*?NavigationButtons.*?}\s*/, '');
        
        // إزالة الـ div الإضافية
        innerContent = innerContent.replace(/<div\s+className="max-w-7xl mx-auto px-6 py-8">/, '');
        innerContent = innerContent.replace(/<div\s+className="[^"]*transition-all[^"]*">/, '');
        
        // تنظيف المسافات البادئة
        innerContent = innerContent.replace(/^\s+/gm, '');
        innerContent = innerContent.replace(/\n\s*\n/g, '\n');
        
        // استبدال الـ return statement
        content = content.replace(mainReturnPattern, `return (
    <Layout>
      ${innerContent.trim()}
    </Layout>`);
        modified = true;
      }
    }

    // إزالة imports غير مستخدمة
    const unusedImports = [
      "import SidebarToggle from '@/components/SidebarToggle'",
      "import Sidebar from '@/components/Sidebar'",
      "import Header from '@/components/Header'",
      "import NavigationButtons from '@/components/NavigationButtons'"
    ];

    unusedImports.forEach(importStatement => {
      const importRegex = new RegExp(importStatement + '\\s*\\n?', 'g');
      if (content.includes(importStatement)) {
        content = content.replace(importRegex, '');
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
      const varRegex = new RegExp(varPattern + '\\s*\\n?', 'g');
      if (content.includes(varPattern)) {
        content = content.replace(varRegex, '');
        modified = true;
      }
    });

    // تنظيف المسافات البادئة الزائدة
    content = content.replace(/^\s*\n/gm, '\n');
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

    if (modified) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ تم إصلاح: ${filePath}`);
    } else {
      console.log(`⏭️  لا يحتاج إصلاح: ${filePath}`);
    }

  } catch (error) {
    console.error(`❌ خطأ في إصلاح ${filePath}:`, error.message);
  }
}

// تشغيل الإصلاح
console.log('🔧 بدء إصلاح مشاكل الـ layout...\n');

pagesToFix.forEach(page => {
  fixPage(page);
});

console.log('\n✅ تم الانتهاء من إصلاح جميع المشاكل!');