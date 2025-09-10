import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

// This function checks if the database has been configured by looking for a flag file.
async function isDbConfigured(): Promise<boolean> {
  try {
    const flagPath = path.join(process.cwd(), '.db_configured')
    await fs.access(flagPath)
    return true
  } catch (error) {
    return false
  }
}

export async function middleware(request: NextRequest) {
  const dbConfigured = await isDbConfigured()
  const { pathname } = request.nextUrl

  // If the database is not configured, redirect all traffic to the settings page,
  // allowing access only to the settings page itself and its API.
  if (!dbConfigured) {
    // Allow access to the settings page and related APIs
    if (pathname.startsWith('/settings') || pathname.startsWith('/api/database/settings')) {
      return NextResponse.next()
    }
    // Redirect everything else to the settings page
    return NextResponse.redirect(new URL('/settings', request.url))
  }

  // If DB is configured, proceed with original logic
  // Skip auth for public routes
  const publicRoutes = ['/login', '/api/auth/login']
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // For client-side routes, let the client handle auth
  // The client will check localStorage and redirect if needed
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}