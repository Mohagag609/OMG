import { NextResponse } from 'next/server'
import { testConnection } from '../../../util/db'

type DbType = 'sqlite'|'postgres-local'|'postgres-cloud'

function buildDatabaseUrl(dbType: DbType, form: any) {
  if (dbType === 'sqlite') return form.sqliteFile || 'file:./dev.db'
  if (dbType === 'postgres-local') {
    const { pgHost, pgPort, pgDatabase, pgUser, pgPassword } = form
    const pwd = encodeURIComponent(pgPassword || '')
    return `postgresql://${pgUser}:${pwd}@${pgHost}:${pgPort}/${pgDatabase}`
  }
  if (dbType === 'postgres-cloud') return form.pgUrl
  throw new Error('unsupported db type')
}

function isServerless() {
  return !!process.env.VERCEL || !!process.env.NETLIFY
}

export async function GET() {
  return NextResponse.json({
    dbTypeHint: process.env.PRISMA_SCHEMA_PATH?.includes('sqlite') ? 'sqlite' : 'postgres',
    databaseUrlPreview: process.env.DATABASE_URL ? 'configured' : 'missing'
  })
}

export async function POST(req: Request) {
  try {
    const { dbType, form } = await req.json() as { dbType: DbType, form: any }
    const dbUrl = buildDatabaseUrl(dbType, form)
    const provider = dbType === 'sqlite' ? 'sqlite' : 'postgres'
    const schemaPath = provider === 'sqlite'
      ? 'prisma/schema.sqlite.prisma'
      : 'prisma/schema.postgres.prisma'

    const ok = await testConnection(provider, dbUrl)
    if (!ok) return NextResponse.json({ ok: false, error: 'فشل الاتصال. راجع الإعدادات.' }, { status: 400 })

    if (isServerless()) {
      return NextResponse.json({
        ok: true,
        nextSteps: 'لوحة المتغيرات ثم إعادة النشر',
        envToSet: {
          DATABASE_URL: dbUrl,
          PRISMA_SCHEMA_PATH: schemaPath,
          SETUP_COMPLETE: 'true'
        },
        migrateHint: 'شغّل prisma migrate deploy في مرحلة البناء'
      })
    }

    // على سيرفر عادي أو تطوير محلي: احفظ .env.local وشغّل migrate/generate
    try {
      const fs = await import('node:fs')
      const path = await import('node:path')
      const { execSync } = await import('node:child_process')

      const envPath = path.join(process.cwd(), '.env.local')
      const envContent = [
        `DATABASE_URL="${dbUrl}"`,
        `PRISMA_SCHEMA_PATH="${schemaPath}"`,
        `SETUP_COMPLETE="true"`
      ].join('\n')
      
      fs.writeFileSync(envPath, envContent, { encoding: 'utf-8' })

      const dbPushCmd = provider === 'sqlite'
        ? `npx prisma db push --schema=prisma/schema.sqlite.prisma --accept-data-loss`
        : `npx prisma db push --schema=prisma/schema.postgres.prisma --accept-data-loss`
      const generateCmd = provider === 'sqlite'
        ? 'npx prisma generate --schema=prisma/schema.sqlite.prisma'
        : 'npx prisma generate --schema=prisma/schema.postgres.prisma'

      process.env.DATABASE_URL = dbUrl

      execSync(dbPushCmd, { stdio: 'inherit' })
      execSync(generateCmd, { stdio: 'inherit' })

      return NextResponse.json({ ok: true, message: 'تم الحفظ والتجهيز بنجاح.' })
    } catch (writeError: any) {
      if (writeError.code === 'EROFS' || writeError.message?.includes('read-only')) {
        return NextResponse.json({
          ok: true,
          nextSteps: 'لوحة المتغيرات ثم إعادة النشر',
          envToSet: {
            DATABASE_URL: dbUrl,
            PRISMA_SCHEMA_PATH: schemaPath,
            SETUP_COMPLETE: 'true'
          },
          migrateHint: 'شغّل prisma migrate deploy في مرحلة البناء'
        })
      }
      throw writeError
    }
  } catch (e:any) {
    return NextResponse.json({ ok: false, error: e.message || 'unexpected error' }, { status: 500 })
  }
}