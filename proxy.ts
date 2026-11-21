import { NextResponse, type NextRequest } from 'next/server'
import { auth0 } from '@/lib/auth0'

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === '/auth/connect' && !await auth0.getSession(request)) {
    const response = NextResponse.redirect(new URL('/auth/login?returnTo=/settings', request.url))
    response.headers.set('Cache-Control', 'private, no-store')
    return response
  }
  return auth0.middleware(request)
}

export const config = {
  matcher: ['/auth/:path*'],
}
