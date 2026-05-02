import { type NextRequest, NextResponse } from 'next/server'

// Cookie name usato da better-auth (default)
const SESSION_COOKIE = 'better-auth.session_token'

/**
 * Middleware di protezione del pannello admin.
 *
 * Edge-safe: controlla solo la presenza del cookie di sessione.
 * Il gate isAdmin completo viene eseguito nel Server Component
 * (protected)/layout.tsx che ha accesso al Node runtime e al DB.
 *
 * Nota: Rate limit per login viene gestito nella logica di auth via
 * tRPC admin-users router e middleware node-side.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Escludi login, reset password e route auth dal gate
  if (
    pathname.startsWith('/accedi') ||
    pathname.startsWith('/reimposta-password') ||
    pathname.startsWith('/api/auth')
  ) {
    return NextResponse.next()
  }

  const hasSession = request.cookies.has(SESSION_COOKIE)
  if (!hasSession) {
    return NextResponse.redirect(new URL('/accedi', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api/trpc|_next/static|_next/image|favicon.ico).*)'],
}
