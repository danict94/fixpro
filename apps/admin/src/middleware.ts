import { type NextRequest, NextResponse } from 'next/server'

const BETTER_AUTH_SESSION_COOKIE_NAMES = [
  'better-auth.session_token',
  '__Secure-better-auth.session_token',
  'better-auth.session-token',
  '__Secure-better-auth.session-token',
]

function hasBetterAuthSessionCookie(request: NextRequest) {
  return BETTER_AUTH_SESSION_COOKIE_NAMES.some((cookieName) =>
    request.cookies.has(cookieName),
  )
}

/**
 * Middleware di protezione del pannello admin.
 *
 * Edge-safe: controlla solo la presenza di un cookie sessione Better Auth.
 * Il gate isAdmin completo viene eseguito nel Server Component
 * (protected)/layout.tsx che ha accesso al Node runtime e al DB.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/accedi') ||
    pathname.startsWith('/reimposta-password') ||
    pathname.startsWith('/api/auth')
  ) {
    return NextResponse.next()
  }

  const hasSession = hasBetterAuthSessionCookie(request)

  if (!hasSession) {
    return NextResponse.redirect(new URL('/accedi', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api/trpc|_next/static|_next/image|favicon.ico).*)'],
}