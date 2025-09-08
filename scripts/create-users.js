const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createUsers() {
  console.log('🔐 بدء إنشاء المستخدمين...');
  try {
    // Check if we're in production
    const isProduction = process.env.NODE_ENV === 'production'
    const databaseUrl = process.env.DATABASE_URL

    if (isProduction && databaseUrl && !databaseUrl.startsWith('file:')) {
      console.log('Production environment detected - skipping user creation');
      return
    }

    // Hash passwords
    const hashedPasswordAdmin = await bcrypt.hash('admin123', 12);
    const hashedPasswordUser = await bcrypt.hash('user123', 12);

    // Create admin user
    await prisma.user.upsert({
      where: { username: 'admin' },
      update: { password: hashedPasswordAdmin },
      create: {
        username: 'admin',
        password: hashedPasswordAdmin,
        email: 'admin@example.com',
        fullName: 'مدير النظام',
        role: 'admin',
      },
    });
    console.log('✅ تم إنشاء مستخدم admin');

    // Create regular user
    await prisma.user.upsert({
      where: { username: 'user' },
      update: { password: hashedPasswordUser },
      create: {
        username: 'user',
        password: hashedPasswordUser,
        email: 'user@example.com',
        fullName: 'مستخدم عادي',
        role: 'user',
      },
    });
    console.log('✅ تم إنشاء مستخدم user');

    console.log('🎉 تم الانتهاء من إنشاء المستخدمين!');
    console.log('📋 بيانات الدخول:');
    console.log('👤 Admin: username=admin, password=admin123');
    console.log('👤 User: username=user, password=user123');

  } catch (error) {
    console.error('❌ خطأ في إنشاء المستخدمين:', error);
    // Don't exit in production
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    } else {
      console.log('Continuing build despite user creation error in production');
    }
  } finally {
    await prisma.$disconnect();
  }
}

createUsers();