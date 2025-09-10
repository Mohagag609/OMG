import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const url = req.nextUrl
  const isSettings = url.pathname.startsWith('/settings/database') || url.pathname.startsWith('/api/settings/database')
  const setupComplete = process.env.SETUP_COMPLETE === 'true'
  const hasDb = !!process.env.DATABASE_URL

  if ((!setupComplete || !hasDb) && !isSettings) {
    url.pathname = '/settings/database'
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = { 
  matcher: [
    '/((?!_next|favicon.ico|public|api/settings/database).*)'
  ] 
}