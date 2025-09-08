import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import { getEnvVars, resolveUrlByType, DbType } from './env'
import { createPrismaClient, testDatabaseConnection } from './prisma'

const execAsync = promisify(exec)

// Types
export interface InitOrSwitchPayload {
  type: DbType
  mode: 'new' | 'switch'
  seed?: boolean
  pg?: {
    host: string
    port: string
    user: string
    password: string
    database: string
  }
  cloudUrl?: string
}

export interface WipePayload {
  confirm: boolean
}

export interface AdminResponse {
  ok: boolean
  message: string
  redeployTriggered?: boolean
  logs?: string[]
}

// Admin key validation
export function requireAdminKey(headers: Headers): boolean {
  const adminKey = headers.get('X-Admin-Key')
  const env = getEnvVars()
  
  if (!adminKey) {
    return false
  }
  
  return adminKey === env.ADMIN_SETUP_KEY
}

// Edit .env.local file for development
export async function editEnvFileDev(changes: Record<string, string>): Promise<void> {
  const envPath = path.join(process.cwd(), '.env.local')
  
  try {
    let envContent = ''
    
    // Read existing .env.local if it exists
    try {
      envContent = await fs.readFile(envPath, 'utf-8')
    } catch (error) {
      // File doesn't exist, start with empty content
      envContent = ''
    }
    
    // Parse existing variables
    const envLines = envContent.split('\n')
    const envVars: Record<string, string> = {}
    
    envLines.forEach(line => {
      const trimmedLine = line.trim()
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=')
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim()
        }
      }
    })
    
    // Apply changes
    Object.assign(envVars, changes)
    
    // Write back to file
    const newContent = Object.entries(envVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')
    
    await fs.writeFile(envPath, newContent, 'utf-8')
    
    console.log('✅ تم تحديث ملف .env.local')
  } catch (error) {
    console.error('❌ خطأ في تحديث ملف .env.local:', error)
    throw new Error('فشل في تحديث ملف البيئة المحلي')
  }
}

// Run Prisma commands
export async function runPrisma(cmd: string, env: Record<string, string> = {}): Promise<{ success: boolean; output: string; error?: string }> {
  try {
    const envVars = { ...process.env, ...env }
    const { stdout, stderr } = await execAsync(cmd, { env: envVars })
    
    console.log(`✅ تم تنفيذ الأمر: ${cmd}`)
    console.log('Output:', stdout)
    
    if (stderr) {
      console.warn('Warnings:', stderr)
    }
    
    return { success: true, output: stdout }
  } catch (error) {
    console.error(`❌ فشل في تنفيذ الأمر: ${cmd}`, error)
    return { 
      success: false, 
      output: '', 
      error: error instanceof Error ? error.message : 'خطأ غير معروف' 
    }
  }
}

// Create PostgreSQL database if needed
export async function createPgDatabaseIfNeeded(adminUrl: string, dbName: string): Promise<boolean> {
  try {
    const client = createPrismaClient(adminUrl)
    
    // Try to connect to the specific database
    try {
      await client.$connect()
      await client.$disconnect()
      return true // Database already exists
    } catch (error) {
      // Database doesn't exist, try to create it
      console.log(`🔧 محاولة إنشاء قاعدة البيانات: ${dbName}`)
      
      // Connect to postgres database to create new database
      const postgresUrl = adminUrl.replace(/\/[^\/]+$/, '/postgres')
      const postgresClient = createPrismaClient(postgresUrl)
      
      try {
        await postgresClient.$connect()
        await postgresClient.$executeRawUnsafe(`CREATE DATABASE "${dbName}"`)
        await postgresClient.$disconnect()
        
        console.log(`✅ تم إنشاء قاعدة البيانات: ${dbName}`)
        return true
      } catch (createError) {
        console.error('❌ فشل في إنشاء قاعدة البيانات:', createError)
        await postgresClient.$disconnect()
        return false
      }
    }
  } catch (error) {
    console.error('❌ خطأ في التحقق من قاعدة البيانات:', error)
    return false
  }
}

// Wipe database
export async function wipeDatabase(type: DbType, url: string): Promise<boolean> {
  try {
    const client = createPrismaClient(url)
    
    if (type === 'sqlite') {
      // For SQLite, we'll drop and recreate the schema
      await client.$executeRaw`PRAGMA foreign_keys = OFF`
      await client.$executeRaw`DROP SCHEMA IF EXISTS main`
      await client.$executeRaw`CREATE SCHEMA main`
      await client.$executeRaw`PRAGMA foreign_keys = ON`
    } else {
      // For PostgreSQL, drop and recreate the public schema
      await client.$executeRaw`DROP SCHEMA IF EXISTS public CASCADE`
      await client.$executeRaw`CREATE SCHEMA public`
    }
    
    console.log(`✅ تم مسح قاعدة البيانات: ${type}`)
    return true
  } catch (error) {
    console.error('❌ فشل في مسح قاعدة البيانات:', error)
    return false
  }
}

// Netlify API integration
export async function netlifyUpdateEnvAndRedeploy(vars: Record<string, string>): Promise<{ success: boolean; message: string }> {
  const env = getEnvVars()
  
  if (!env.NETLIFY_AUTH_TOKEN || !env.NETLIFY_SITE_ID) {
    return { success: false, message: 'متغيرات Netlify غير مُعدة' }
  }
  
  try {
    // Update environment variables
    const updateResponse = await fetch(`https://api.netlify.com/api/v1/sites/${env.NETLIFY_SITE_ID}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${env.NETLIFY_AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        build_settings: {
          env: vars
        }
      })
    })
    
    if (!updateResponse.ok) {
      throw new Error(`فشل في تحديث متغيرات البيئة: ${updateResponse.statusText}`)
    }
    
    // Trigger build hook
    if (env.BUILD_HOOK_URL) {
      const buildResponse = await fetch(env.BUILD_HOOK_URL, {
        method: 'POST'
      })
      
      if (!buildResponse.ok) {
        throw new Error(`فشل في تشغيل Build Hook: ${buildResponse.statusText}`)
      }
    }
    
    console.log('✅ تم تحديث متغيرات البيئة وتشغيل إعادة النشر')
    return { success: true, message: 'تم تحديث الإعدادات وتشغيل إعادة النشر' }
  } catch (error) {
    console.error('❌ خطأ في تحديث Netlify:', error)
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'خطأ غير معروف' 
    }
  }
}

// Main handler for init and switch operations
export async function handleInitOrSwitch(payload: InitOrSwitchPayload): Promise<AdminResponse> {
  const { type, mode, seed = false, pg, cloudUrl } = payload
  const logs: string[] = []
  
  try {
    // Determine target URL
    let targetUrl: string
    
    if (type === 'postgresql-local' && pg) {
      targetUrl = `postgresql://${pg.user}:${pg.password}@${pg.host}:${pg.port}/${pg.database}`
    } else if (type === 'postgresql-cloud' && cloudUrl) {
      targetUrl = cloudUrl
    } else if (type === 'sqlite') {
      targetUrl = resolveUrlByType(type)
    } else {
      // Fallback to environment variable or default
      targetUrl = process.env.DATABASE_URL || resolveUrlByType(type)
    }
    
    logs.push(`🎯 نوع القاعدة المستهدفة: ${type}`)
    logs.push(`🔗 رابط القاعدة: ${targetUrl.replace(/\/\/.*@/, '//***@')}`)
    
    // For PostgreSQL, ensure database exists
    if (type.startsWith('postgresql') && mode === 'new') {
      const dbName = type === 'postgresql-local' && pg ? pg.database : 'estate_management'
      const adminUrl = type === 'postgresql-local' && pg 
        ? `postgresql://${pg.user}:${pg.password}@${pg.host}:${pg.port}/postgres`
        : cloudUrl?.replace(/\/[^\/]+$/, '/postgres') || ''
      
      if (adminUrl) {
        const dbCreated = await createPgDatabaseIfNeeded(adminUrl, dbName)
        if (!dbCreated) {
          return {
            ok: false,
            message: 'فشل في إنشاء قاعدة البيانات',
            logs
          }
        }
        logs.push('✅ تم إنشاء/التحقق من قاعدة البيانات')
      }
    }
    
    // Test connection
    const connectionTest = await testDatabaseConnection(targetUrl)
    if (!connectionTest.success) {
      return {
        ok: false,
        message: `فشل في الاتصال بقاعدة البيانات: ${connectionTest.error}`,
        logs
      }
    }
    logs.push('✅ تم التحقق من الاتصال بقاعدة البيانات')
    
    // Handle based on environment
    const env = getEnvVars()
    
    if (env.NODE_ENV === 'production') {
      // Production: Update Netlify environment variables
      const envVars = {
        DATABASE_TYPE: type,
        DATABASE_URL: targetUrl
      }
      
      const netlifyResult = await netlifyUpdateEnvAndRedeploy(envVars)
      if (!netlifyResult.success) {
        return {
          ok: false,
          message: netlifyResult.message,
          logs
        }
      }
      
      // Update database config file
      const { saveDatabaseConfig } = await import('./databaseConfig')
      const configSaved = saveDatabaseConfig({
        type: type as any,
        connectionString: targetUrl,
        isConnected: true,
        lastTested: new Date().toISOString()
      })
      
      if (configSaved) {
        logs.push('✅ تم تحديث ملف إعدادات قاعدة البيانات')
      }
      
      logs.push('✅ تم تحديث متغيرات البيئة على Netlify')
      logs.push('🚀 تم تشغيل إعادة النشر')
      
      return {
        ok: true,
        message: 'تم تحديث الإعدادات وتشغيل إعادة النشر',
        redeployTriggered: true,
        logs
      }
    } else {
      // Development: Update .env.local and run Prisma commands
      const envChanges = {
        DATABASE_TYPE: type,
        DATABASE_URL: targetUrl
      }
      
      await editEnvFileDev(envChanges)
      logs.push('✅ تم تحديث ملف .env.local')
      
      // Update database config file
      const { saveDatabaseConfig } = await import('./databaseConfig')
      const configSaved = saveDatabaseConfig({
        type: type as any,
        connectionString: targetUrl,
        isConnected: true,
        lastTested: new Date().toISOString()
      })
      
      if (configSaved) {
        logs.push('✅ تم تحديث ملف إعدادات قاعدة البيانات')
      }
      
      // Run Prisma commands
      const generateResult = await runPrisma('npx prisma generate', { DATABASE_URL: targetUrl })
      if (!generateResult.success) {
        return {
          ok: false,
          message: `فشل في توليد Prisma Client: ${generateResult.error}`,
          logs
        }
      }
      logs.push('✅ تم توليد Prisma Client')
      
      // Try migrate deploy first, if it fails, use db push
      const migrateResult = await runPrisma('npx prisma migrate deploy', { DATABASE_URL: targetUrl })
      if (!migrateResult.success) {
        console.log('⚠️ migrate deploy فشل، جاري استخدام db push...')
        const pushResult = await runPrisma('npx prisma db push', { DATABASE_URL: targetUrl })
        if (!pushResult.success) {
          return {
            ok: false,
            message: `فشل في تطبيق المهاجرات: ${migrateResult.error} و db push: ${pushResult.error}`,
            logs
          }
        }
        logs.push('✅ تم تطبيق المهاجرات باستخدام db push')
      } else {
        logs.push('✅ تم تطبيق المهاجرات')
      }
      
      // Optional seed
      if (seed) {
        const seedResult = await runPrisma('npx tsx prisma/seed.ts', { DATABASE_URL: targetUrl })
        if (seedResult.success) {
          logs.push('✅ تم زرع البيانات التجريبية')
        } else {
          logs.push('⚠️ فشل في زرع البيانات التجريبية (اختياري)')
        }
      }
      
      return {
        ok: true,
        message: 'تم تحديث إعدادات قاعدة البيانات بنجاح',
        logs
      }
    }
  } catch (error) {
    console.error('❌ خطأ في handleInitOrSwitch:', error)
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'خطأ غير معروف',
      logs
    }
  }
}

// Handle wipe operation
export async function handleWipe(payload: WipePayload): Promise<AdminResponse> {
  const { confirm } = payload
  const logs: string[] = []
  
  if (!confirm) {
    return {
      ok: false,
      message: 'يجب تأكيد عملية المسح',
      logs
    }
  }
  
  try {
    const env = getEnvVars()
    const targetUrl = env.DATABASE_URL
    
    logs.push(`🎯 مسح قاعدة البيانات: ${env.DATABASE_TYPE}`)
    logs.push(`🔗 رابط القاعدة: ${targetUrl.replace(/\/\/.*@/, '//***@')}`)
    
    const wipeResult = await wipeDatabase(env.DATABASE_TYPE as DbType, targetUrl)
    if (!wipeResult) {
      return {
        ok: false,
        message: 'فشل في مسح قاعدة البيانات',
        logs
      }
    }
    
    logs.push('✅ تم مسح قاعدة البيانات بنجاح')
    
    // Re-run migrations to recreate schema
    const migrateResult = await runPrisma('npx prisma migrate deploy', { DATABASE_URL: targetUrl })
    if (!migrateResult.success) {
      console.log('⚠️ migrate deploy فشل، جاري استخدام db push...')
      const pushResult = await runPrisma('npx prisma db push', { DATABASE_URL: targetUrl })
      if (!pushResult.success) {
        return {
          ok: false,
          message: `تم مسح البيانات لكن فشل في إعادة إنشاء الجداول: ${migrateResult.error} و db push: ${pushResult.error}`,
          logs
        }
      }
      logs.push('✅ تم إعادة إنشاء الجداول باستخدام db push')
    } else {
      logs.push('✅ تم إعادة إنشاء الجداول')
    }
    
    return {
      ok: true,
      message: 'تم مسح قاعدة البيانات وإعادة إنشاء الجداول بنجاح',
      logs
    }
  } catch (error) {
    console.error('❌ خطأ في handleWipe:', error)
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'خطأ غير معروف',
      logs
    }
  }
}