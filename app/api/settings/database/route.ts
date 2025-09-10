import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    dbTypeHint: process.env.PRISMA_SCHEMA_PATH?.includes('sqlite') ? 'sqlite' : 'postgres',
    databaseUrlPreview: process.env.DATABASE_URL ? 'configured' : 'missing'
  })
}

export async function POST(req: Request) {
  try {
    const { dbType, form } = await req.json()
    
    if (process.env.NETLIFY || process.env.VERCEL) {
      return NextResponse.json({
        ok: true,
        nextSteps: 'لوحة المتغيرات ثم إعادة النشر',
        envToSet: {
          DATABASE_URL: form.databaseUrl || process.env.DATABASE_URL,
          PRISMA_SCHEMA_PATH: 'prisma/schema.postgres.prisma',
          SETUP_COMPLETE: 'true'
        }
      })
    }

    return NextResponse.json({ ok: true, message: 'تم الحفظ بنجاح.' })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || 'unexpected error' }, { status: 500 })
  }
}