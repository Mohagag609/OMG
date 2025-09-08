/**
 * اختبار الاتصالات مع قواعد البيانات
 * Test Database Connections
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

class ConnectionTester {
    constructor() {
        this.results = {
            local: null,
            cloud: null,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * اختبار قاعدة البيانات المحلية
     * Test local database
     */
    async testLocalDatabase() {
        console.log('🔍 اختبار قاعدة البيانات المحلية...');
        
        try {
            const localClient = new PrismaClient({
                datasources: {
                    db: {
                        url: process.env.DATABASE_URL
                    }
                }
            });

            // اختبار الاتصال
            await localClient.$queryRaw`SELECT 1 as test`;
            
            // اختبار الجداول
            const tables = await localClient.$queryRaw`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            `;

            this.results.local = {
                status: 'success',
                message: 'قاعدة البيانات المحلية تعمل بشكل صحيح',
                tables: tables.length,
                connection: 'active'
            };

            console.log('✅ قاعدة البيانات المحلية: متصلة');
            console.log(`   📊 عدد الجداول: ${tables.length}`);

            await localClient.$disconnect();

        } catch (error) {
            this.results.local = {
                status: 'error',
                message: error.message,
                connection: 'failed'
            };

            console.log('❌ قاعدة البيانات المحلية: غير متصلة');
            console.log(`   خطأ: ${error.message}`);
        }
    }

    /**
     * اختبار قاعدة البيانات السحابية
     * Test cloud database
     */
    async testCloudDatabase() {
        console.log('🔍 اختبار قاعدة البيانات السحابية (Neon)...');
        
        try {
            const cloudClient = new PrismaClient({
                datasources: {
                    db: {
                        url: process.env.NEON_DATABASE_URL
                    }
                }
            });

            // اختبار الاتصال
            await cloudClient.$queryRaw`SELECT 1 as test`;
            
            // اختبار الجداول
            const tables = await cloudClient.$queryRaw`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            `;

            this.results.cloud = {
                status: 'success',
                message: 'قاعدة البيانات السحابية (Neon) تعمل بشكل صحيح',
                tables: tables.length,
                connection: 'active'
            };

            console.log('✅ قاعدة البيانات السحابية (Neon): متصلة');
            console.log(`   📊 عدد الجداول: ${tables.length}`);

            await cloudClient.$disconnect();

        } catch (error) {
            this.results.cloud = {
                status: 'error',
                message: error.message,
                connection: 'failed'
            };

            console.log('❌ قاعدة البيانات السحابية (Neon): غير متصلة');
            console.log(`   خطأ: ${error.message}`);
        }
    }

    /**
     * اختبار جميع الاتصالات
     * Test all connections
     */
    async testAllConnections() {
        console.log('🚀 بدء اختبار جميع الاتصالات...\n');

        // تحميل متغيرات البيئة
        this.loadEnvironmentVariables();

        // اختبار قاعدة البيانات المحلية
        await this.testLocalDatabase();
        console.log('');

        // اختبار قاعدة البيانات السحابية
        await this.testCloudDatabase();
        console.log('');

        // عرض النتائج
        this.displayResults();

        // حفظ النتائج
        this.saveResults();

        return this.results;
    }

    /**
     * تحميل متغيرات البيئة
     * Load environment variables
     */
    loadEnvironmentVariables() {
        const envFiles = ['.env.local', '.env.production', '.env'];
        
        for (const envFile of envFiles) {
            const envPath = path.join(process.cwd(), envFile);
            if (fs.existsSync(envPath)) {
                const envContent = fs.readFileSync(envPath, 'utf8');
                const envLines = envContent.split('\n');
                
                for (const line of envLines) {
                    if (line.trim() && !line.startsWith('#')) {
                        const [key, ...valueParts] = line.split('=');
                        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
                        if (key && value) {
                            process.env[key] = value;
                        }
                    }
                }
                break;
            }
        }
    }

    /**
     * عرض النتائج
     * Display results
     */
    displayResults() {
        console.log('📊 نتائج الاختبار:');
        console.log('==================');

        // قاعدة البيانات المحلية
        if (this.results.local) {
            console.log(`\n🏠 قاعدة البيانات المحلية:`);
            console.log(`   الحالة: ${this.results.local.status === 'success' ? '✅ متصلة' : '❌ غير متصلة'}`);
            console.log(`   الرسالة: ${this.results.local.message}`);
            if (this.results.local.tables) {
                console.log(`   الجداول: ${this.results.local.tables}`);
            }
        }

        // قاعدة البيانات السحابية
        if (this.results.cloud) {
            console.log(`\n☁️ قاعدة البيانات السحابية (Neon):`);
            console.log(`   الحالة: ${this.results.cloud.status === 'success' ? '✅ متصلة' : '❌ غير متصلة'}`);
            console.log(`   الرسالة: ${this.results.cloud.message}`);
            if (this.results.cloud.tables) {
                console.log(`   الجداول: ${this.results.cloud.tables}`);
            }
        }

        // التوصيات
        this.displayRecommendations();
    }

    /**
     * عرض التوصيات
     * Display recommendations
     */
    displayRecommendations() {
        console.log('\n💡 التوصيات:');
        console.log('=============');

        if (this.results.local?.status === 'error') {
            console.log('🔧 لإصلاح قاعدة البيانات المحلية:');
            console.log('   1. تأكد من تشغيل PostgreSQL');
            console.log('   2. تحقق من إعدادات DATABASE_URL');
            console.log('   3. جرب: npm run db:setup:local');
        }

        if (this.results.cloud?.status === 'error') {
            console.log('🔧 لإصلاح قاعدة البيانات السحابية:');
            console.log('   1. تحقق من إعدادات NEON_DATABASE_URL');
            console.log('   2. تأكد من تفعيل SSL');
            console.log('   3. تحقق من إعدادات Firewall في Neon');
        }

        if (this.results.local?.status === 'success' && this.results.cloud?.status === 'success') {
            console.log('🎉 جميع الاتصالات تعمل بشكل صحيح!');
            console.log('   يمكنك الآن:');
            console.log('   - العمل محلياً: npm run dev:local');
            console.log('   - العمل سحابياً: npm run dev:cloud');
            console.log('   - مزامنة البيانات: curl -X POST http://localhost:3000/api/database/sync');
        }
    }

    /**
     * حفظ النتائج
     * Save results
     */
    saveResults() {
        const resultsPath = path.join(process.cwd(), 'connection-test-results.json');
        fs.writeFileSync(resultsPath, JSON.stringify(this.results, null, 2));
        console.log(`\n💾 تم حفظ النتائج في: ${resultsPath}`);
    }

    /**
     * اختبار سريع
     * Quick test
     */
    async quickTest() {
        console.log('⚡ اختبار سريع...');
        
        this.loadEnvironmentVariables();
        
        if (process.env.DATABASE_URL) {
            await this.testLocalDatabase();
        }
        
        if (process.env.NEON_DATABASE_URL) {
            await this.testCloudDatabase();
        }
        
        this.displayResults();
        return this.results;
    }
}

// تشغيل الاختبار
async function main() {
    const tester = new ConnectionTester();
    const command = process.argv[2];

    switch (command) {
        case 'quick':
            await tester.quickTest();
            break;
        case 'all':
        default:
            await tester.testAllConnections();
            break;
    }
}

// تشغيل إذا كان الملف يتم تنفيذه مباشرة
if (require.main === module) {
    main().catch(console.error);
}

module.exports = ConnectionTester;