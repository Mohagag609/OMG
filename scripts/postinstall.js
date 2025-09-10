/**
 * Postinstall Script - يحدد نوع قاعدة البيانات حسب البيئة
 * Postinstall Script - Determines database type based on environment
 */

const { execSync } = require('child_process');

console.log('🔧 تشغيل Postinstall Script...');

try {
  // تحديد نوع قاعدة البيانات حسب البيئة
  let schemaPath;
  
  if (process.env.NETLIFY) {
    // في بيئة Netlify، استخدم PostgreSQL
    console.log('🌐 بيئة Netlify - استخدام PostgreSQL');
    schemaPath = 'prisma/schema.postgres.prisma';
    process.env.PRISMA_SCHEMA_PATH = schemaPath;
  } else if (process.env.NODE_ENV === 'production') {
    // في بيئة الإنتاج، استخدم PostgreSQL
    console.log('☁️ بيئة الإنتاج - استخدام PostgreSQL');
    schemaPath = process.env.PRISMA_SCHEMA_PATH || 'prisma/schema.postgres.prisma';
  } else {
    // في بيئة التطوير، استخدم SQLite
    console.log('🏠 بيئة التطوير - استخدام SQLite');
    schemaPath = 'prisma/schema.sqlite.prisma';
    process.env.PRISMA_SCHEMA_PATH = schemaPath;
  }

  console.log(`📁 مسار السكيما: ${schemaPath}`);

  // تشغيل prisma generate
  console.log('📦 توليد Prisma Client...');
  const generateCmd = `npx prisma generate --schema=${schemaPath}`;
  execSync(generateCmd, { stdio: 'inherit' });

  // تشغيل setup-db.js
  console.log('🔧 إعداد قاعدة البيانات...');
  execSync('node scripts/setup-db.js', { stdio: 'inherit' });

  console.log('✅ تم إكمال Postinstall بنجاح!');

} catch (error) {
  console.error('❌ فشل في Postinstall:', error.message);
  console.log('💡 تأكد من إعداد متغيرات البيئة بشكل صحيح');
  process.exit(1);
}