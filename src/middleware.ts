import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Allow all requests to pass through
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Only match API routes to avoid interfering with page routing
    '/api/:path*',
  ],
}