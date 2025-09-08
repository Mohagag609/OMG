const { execSync } = require('child_process')

console.log('🔧 إعداد قاعدة البيانات...')

try {
  // Generate Prisma client
  console.log('🔄 توليد Prisma Client...')
  execSync('npx prisma generate', { stdio: 'inherit' })
  console.log('✅ تم توليد Prisma Client بنجاح')
  
  // Push schema to database
  console.log('🔄 تطبيق المخطط على قاعدة البيانات...')
  execSync('npx prisma db push', { stdio: 'inherit' })
  console.log('✅ تم تطبيق المخطط بنجاح')
  
  console.log('🎉 تم إعداد قاعدة البيانات بنجاح!')
  
} catch (error) {
  console.error('❌ فشل في إعداد قاعدة البيانات:', error.message)
  process.exit(1)
}