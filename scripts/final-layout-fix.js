const fs = require('fs');
const path = require('path');

// قائمة الصفحات التي تحتاج إصلاح شامل
const pagesToFix = [
  'src/app/admin/page.tsx',
  'src/app/brokers/page.tsx',
  'src/app/installments/page.tsx',
  'src/app/contracts/page.tsx',
  'src/app/profile/page.tsx'
];

function fixPageCompletely(filePath) {
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

    // العثور على بداية ونهاية الـ function component
    const componentMatch = content.match(/export default function \w+\(\)[^{]*\{([\s\S]*)\}$/);
    if (!componentMatch) {
      console.log(`❌ لم يتم العثور على component في: ${filePath}`);
      return;
    }

    let componentBody = componentMatch[1];
    
    // إصلاح loading state
    componentBody = componentBody.replace(
      /if\s*\(\s*loading\s*\)\s*\{[\s\S]*?return[\s\S]*?<div\s+className="min-h-screen[\s\S]*?<\/div>\s*\)\s*\}/g,
      `if (loading) {
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
  }`
    );

    // إصلاح authentication check
    componentBody = componentBody.replace(
      /if\s*\(\s*!isAuthenticated\s*\)\s*\{[\s\S]*?return[\s\S]*?<div\s+className="min-h-screen[\s\S]*?<\/div>\s*\)\s*\}/g,
      `if (!isAuthenticated) {
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
  }`
    );

    // العثور على return statement الأخير
    const lastReturnMatch = componentBody.match(/return\s*\([\s\S]*$/);
    if (lastReturnMatch) {
      let returnContent = lastReturnMatch[0];
      
      // إزالة min-h-screen div wrapper
      returnContent = returnContent.replace(
        /return\s*\(\s*<div\s+className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">/,
        'return (\n    <Layout>'
      );

      // إزالة الـ sidebar والـ header
      returnContent = returnContent.replace(/{.*?Sidebar.*?onToggle.*?}\s*/g, '');
      returnContent = returnContent.replace(/<div\s+className="[^"]*transition-all[^"]*">\s*/g, '');
      returnContent = returnContent.replace(/{.*?Header.*?onMenuToggle.*?}\s*/g, '');
      returnContent = returnContent.replace(/<div\s+className="max-w-7xl mx-auto px-6 py-8">\s*/g, '');

      // إصلاح النهاية
      returnContent = returnContent.replace(/\s*<\/div>\s*<\/div>\s*\)\s*$/, '\n    </Layout>\n  )');
      returnContent = returnContent.replace(/\s*<\/div>\s*\)\s*$/, '\n    </Layout>\n  )');

      // استبدال return statement
      componentBody = componentBody.replace(/return\s*\([\s\S]*$/, returnContent);
      modified = true;
    }

    // إزالة المتغيرات غير المستخدمة
    componentBody = componentBody.replace(/const \[sidebarOpen, setSidebarOpen\] = useState\(false\)\s*/g, '');
    componentBody = componentBody.replace(/setSidebarOpen\([^)]*\)/g, '');

    // إزالة keyboard shortcuts للـ sidebar
    componentBody = componentBody.replace(
      /case 'b':\s*e\.preventDefault\(\)\s*setSidebarOpen\([^)]*\)\s*break\s*/g,
      ''
    );

    // إزالة imports غير مستخدمة
    content = content.replace(/import SidebarToggle from '@\/components\/SidebarToggle'\s*\n?/g, '');
    content = content.replace(/import Sidebar from '@\/components\/Sidebar'\s*\n?/g, '');
    content = content.replace(/import Header from '@\/components\/Header'\s*\n?/g, '');
    content = content.replace(/import NavigationButtons from '@\/components\/NavigationButtons'\s*\n?/g, '');

    // إعادة بناء الملف
    const beforeComponent = content.substring(0, content.indexOf(componentMatch[0]));
    const newContent = beforeComponent + `export default function ${filePath.includes('admin') ? 'AdminPage' : filePath.includes('brokers') ? 'BrokersPage' : filePath.includes('installments') ? 'InstallmentsPage' : filePath.includes('contracts') ? 'ContractsPage' : 'ProfilePage'}() {${componentBody}\n}`;

    // تنظيف المسافات الزائدة
    const cleanedContent = newContent
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .replace(/^\s*\n/gm, '\n')
      .replace(/\s+$/gm, '');

    fs.writeFileSync(fullPath, cleanedContent, 'utf8');
    console.log(`✅ تم إصلاح: ${filePath}`);
    modified = true;

  } catch (error) {
    console.error(`❌ خطأ في إصلاح ${filePath}:`, error.message);
  }
}

// تشغيل الإصلاح
console.log('🔧 بدء الإصلاح الشامل للـ layout...\n');

pagesToFix.forEach(page => {
  fixPageCompletely(page);
});

console.log('\n✅ تم الانتهاء من الإصلاح الشامل!');