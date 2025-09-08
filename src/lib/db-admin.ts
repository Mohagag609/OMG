// Database administration utilities
import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { 
  DbType, 
  resolveUrlByType, 
  validateDatabaseUrl, 
  parsePostgresUrl, 
  buildPostgresUrl,
  isProduction,
  isDevelopment 
} from './env'
import { createPrismaClient, testDatabaseConnection } from './prisma'

const execAsync = promisify(exec)

// Types for API requests
export interface InitDatabaseRequest {
  type: DbType
  mode: 'new' | 'switch'
  seed?: boolean
  postgres?: {
    host: string
    port: number
    username: string
    password: string
    database: string
    ssl?: boolean
  }
  cloudUrl?: string
}

export interface SwitchDatabaseRequest {
  type: DbType
  mode: 'switch'
  seed?: boolean
  postgres?: {
    host: string
    port: number
    username: string
    password: string
    database: string
    ssl?: boolean
  }
  cloudUrl?: string
}

export interface WipeDatabaseRequest {
  confirm: boolean
}

// Admin key validation
export function requireAdminKey(headers: Headers): boolean {
  const adminKey = headers.get('X-Admin-Key')
  const expectedKey = process.env.ADMIN_SETUP_KEY
  
  if (!expectedKey) {
    throw new Error('ADMIN_SETUP_KEY not configured')
  }
  
  if (!adminKey || adminKey !== expectedKey) {
    throw new Error('Invalid admin key')
  }
  
  return true
}

// Edit .env.local file for development
export function editEnvFileDev(changes: Record<string, string>): void {
  if (isProduction()) {
    throw new Error('Cannot edit .env.local in production')
  }
  
  const envPath = join(process.cwd(), '.env.local')
  let envContent = ''
  
  // Read existing .env.local if it exists
  if (existsSync(envPath)) {
    envContent = readFileSync(envPath, 'utf8')
  }
  
  // Parse existing variables
  const envVars: Record<string, string> = {}
  const lines = envContent.split('\n')
  
  for (const line of lines) {
    const trimmedLine = line.trim()
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=')
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim()
      }
    }
  }
  
  // Apply changes
  Object.assign(envVars, changes)
  
  // Write back to file
  const newEnvContent = Object.entries(envVars)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')
  
  writeFileSync(envPath, newEnvContent, 'utf8')
  console.log('✅ تم تحديث ملف .env.local')
}

// Run Prisma commands
export async function runPrisma(command: string, env: Record<string, string> = {}): Promise<{ success: boolean; output: string; error?: string }> {
  try {
    const envVars = { ...process.env, ...env }
    const { stdout, stderr } = await execAsync(command, { env: envVars })
    
    console.log(`✅ تم تنفيذ الأمر: ${command}`)
    console.log(stdout)
    
    if (stderr) {
      console.warn('تحذير:', stderr)
    }
    
    return { success: true, output: stdout, error: stderr }
  } catch (error: any) {
    console.error(`❌ فشل في تنفيذ الأمر: ${command}`)
    console.error(error.message)
    
    return { 
      success: false, 
      output: error.stdout || '', 
      error: error.message 
    }
  }
}

// Create PostgreSQL database if needed
export async function createPgDatabaseIfNeeded(adminUrl: string, dbName: string): Promise<boolean> {
  try {
    const parsed = parsePostgresUrl(adminUrl)
    if (!parsed) {
      throw new Error('Invalid PostgreSQL URL')
    }
    
    // Connect to postgres database to create new database
    const postgresUrl = buildPostgresUrl(
      parsed.host,
      parsed.port,
      parsed.username,
      parsed.password,
      'postgres',
      parsed.ssl
    )
    
    const prisma = createPrismaClient(postgresUrl)
    
    // Check if database exists
    const result = await prisma.$queryRaw`
      SELECT 1 FROM pg_database WHERE datname = ${dbName}
    ` as any[]
    
    if (result.length === 0) {
      // Create database
      await prisma.$executeRaw`CREATE DATABASE "${dbName}"`
      console.log(`✅ تم إنشاء قاعدة البيانات: ${dbName}`)
    } else {
      console.log(`✅ قاعدة البيانات موجودة بالفعل: ${dbName}`)
    }
    
    await prisma.$disconnect()
    return true
  } catch (error) {
    console.error('❌ فشل في إنشاء قاعدة البيانات:', error)
    return false
  }
}

// Wipe database data
export async function wipeDatabase(type: DbType, url: string): Promise<boolean> {
  try {
    if (type === 'sqlite') {
      // For SQLite, delete the file
      const fs = require('fs')
      const path = require('path')
      const dbPath = url.replace('file:', '')
      const fullPath = path.resolve(dbPath)
      
      if (existsSync(fullPath)) {
        fs.unlinkSync(fullPath)
        console.log('✅ تم حذف ملف قاعدة البيانات SQLite')
      }
      return true
    }
    
    if (type === 'postgresql-local' || type === 'postgresql-cloud') {
      // For PostgreSQL, drop and recreate schema
      const prisma = createPrismaClient(url)
      
      await prisma.$executeRaw`DROP SCHEMA IF EXISTS public CASCADE`
      await prisma.$executeRaw`CREATE SCHEMA public`
      await prisma.$executeRaw`GRANT ALL ON SCHEMA public TO postgres`
      await prisma.$executeRaw`GRANT ALL ON SCHEMA public TO public`
      
      await prisma.$disconnect()
      console.log('✅ تم مسح بيانات قاعدة البيانات PostgreSQL')
      return true
    }
    
    return false
  } catch (error) {
    console.error('❌ فشل في مسح قاعدة البيانات:', error)
    return false
  }
}

// Update Netlify environment variables and trigger redeploy
export async function netlifyUpdateEnvAndRedeploy(vars: Record<string, string>): Promise<{ success: boolean; message: string }> {
  try {
    const authToken = process.env.NETLIFY_AUTH_TOKEN
    const siteId = process.env.NETLIFY_SITE_ID
    const buildHookUrl = process.env.BUILD_HOOK_URL
    
    if (!authToken || !siteId || !buildHookUrl) {
      throw new Error('Netlify configuration missing')
    }
    
    // Update environment variables
    const updateResponse = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        build_settings: {
          env: vars
        }
      })
    })
    
    if (!updateResponse.ok) {
      throw new Error(`Failed to update Netlify env vars: ${updateResponse.statusText}`)
    }
    
    // Trigger build hook
    const buildResponse = await fetch(buildHookUrl, {
      method: 'POST'
    })
    
    if (!buildResponse.ok) {
      throw new Error(`Failed to trigger build: ${buildResponse.statusText}`)
    }
    
    console.log('✅ تم تحديث متغيرات البيئة وإطلاق إعادة النشر على Netlify')
    return { 
      success: true, 
      message: 'تم تحديث متغيرات البيئة وإطلاق إعادة النشر بنجاح' 
    }
  } catch (error) {
    console.error('❌ فشل في تحديث Netlify:', error)
    return { 
      success: false, 
      message: `فشل في تحديث Netlify: ${error}` 
    }
  }
}

// Handle database initialization or switching
export async function handleInitOrSwitch(payload: InitDatabaseRequest | SwitchDatabaseRequest): Promise<{ success: boolean; message: string; redeployTriggered?: boolean }> {
  try {
    const { type, mode, seed = false, postgres, cloudUrl } = payload
    
    // Determine target URL
    let targetUrl: string
    
    if (type === 'postgresql-local' && postgres) {
      targetUrl = buildPostgresUrl(
        postgres.host,
        postgres.port,
        postgres.username,
        postgres.password,
        postgres.database,
        postgres.ssl
      )
    } else if (type === 'postgresql-cloud' && cloudUrl) {
      targetUrl = cloudUrl
    } else {
      targetUrl = resolveUrlByType(type)
    }
    
    // Validate URL
    if (!validateDatabaseUrl(targetUrl, type)) {
      throw new Error(`Invalid ${type} URL format`)
    }
    
    // Create database if needed for PostgreSQL
    if ((type === 'postgresql-local' || type === 'postgresql-cloud') && postgres) {
      const adminUrl = buildPostgresUrl(
        postgres.host,
        postgres.port,
        postgres.username,
        postgres.password,
        'postgres',
        postgres.ssl
      )
      
      const dbCreated = await createPgDatabaseIfNeeded(adminUrl, postgres.database)
      if (!dbCreated) {
        throw new Error('Failed to create PostgreSQL database')
      }
    }
    
    if (isProduction()) {
      // Production: Update Netlify environment variables and trigger redeploy
      const envVars = {
        DATABASE_TYPE: type,
        DATABASE_URL: targetUrl
      }
      
      const result = await netlifyUpdateEnvAndRedeploy(envVars)
      
      if (!result.success) {
        throw new Error(result.message)
      }
      
      return {
        success: true,
        message: 'تم تحديث إعدادات قاعدة البيانات وإطلاق إعادة النشر',
        redeployTriggered: true
      }
    } else {
      // Development: Update .env.local and run Prisma commands
      editEnvFileDev({
        DATABASE_TYPE: type,
        DATABASE_URL: targetUrl
      })
      
      // Run Prisma commands
      const env = {
        DATABASE_URL: targetUrl
      }
      
      // Generate Prisma client
      const generateResult = await runPrisma('npx prisma generate', env)
      if (!generateResult.success) {
        throw new Error(`Failed to generate Prisma client: ${generateResult.error}`)
      }
      
      // Run migrations
      const migrateResult = await runPrisma('npx prisma migrate deploy', env)
      if (!migrateResult.success) {
        throw new Error(`Failed to run migrations: ${migrateResult.error}`)
      }
      
      // Seed database if requested
      if (seed) {
        const seedResult = await runPrisma('npx prisma db seed', env)
        if (!seedResult.success) {
          console.warn(`Seed failed: ${seedResult.error}`)
        }
      }
      
      // Test connection
      const isConnected = await testDatabaseConnection(targetUrl)
      if (!isConnected) {
        throw new Error('Failed to connect to new database')
      }
      
      return {
        success: true,
        message: `تم ${mode === 'new' ? 'تهيئة' : 'التبديل إلى'} قاعدة البيانات بنجاح`
      }
    }
  } catch (error) {
    console.error('❌ فشل في إدارة قاعدة البيانات:', error)
    return {
      success: false,
      message: `فشل في إدارة قاعدة البيانات: ${error}`
    }
  }
}

// Handle database wipe
export async function handleWipe(payload: WipeDatabaseRequest): Promise<{ success: boolean; message: string }> {
  try {
    if (!payload.confirm) {
      throw new Error('Confirmation required for database wipe')
    }
    
    const type = (process.env.DATABASE_TYPE as DbType) || 'sqlite'
    const url = process.env.DATABASE_URL || resolveUrlByType(type)
    
    const wiped = await wipeDatabase(type, url)
    if (!wiped) {
      throw new Error('Failed to wipe database')
    }
    
    if (isProduction()) {
      // In production, trigger redeploy after wipe
      const envVars = {
        DATABASE_TYPE: type,
        DATABASE_URL: url
      }
      
      const result = await netlifyUpdateEnvAndRedeploy(envVars)
      if (!result.success) {
        throw new Error(result.message)
      }
      
      return {
        success: true,
        message: 'تم مسح قاعدة البيانات وإطلاق إعادة النشر'
      }
    } else {
      return {
        success: true,
        message: 'تم مسح قاعدة البيانات بنجاح'
      }
    }
  } catch (error) {
    console.error('❌ فشل في مسح قاعدة البيانات:', error)
    return {
      success: false,
      message: `فشل في مسح قاعدة البيانات: ${error}`
    }
  }
}