import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'

export function middleware(request: NextRequest) {
  // Skip auth for public routes
  const publicRoutes = ['/login', '/api/auth/login']
  if (publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Check authentication for protected routes
  const user = getUserFromRequest(request)
  
  if (!user) {
    // Redirect to login for pages
    if (request.nextUrl.pathname.startsWith('/')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    // Return 401 for API routes
    return NextResponse.json(
      { success: false, error: 'غير مخول للوصول' },
      { status: 401 }
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth/login (login endpoint)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth/login|_next/static|_next/image|favicon.ico).*)',
  ],
}