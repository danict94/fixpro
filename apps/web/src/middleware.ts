import { NextRequest, NextResponse } from 'next/server'

/**
 * Middleware — protezione route private.
 *
 * Strategia sessione in Edge:
 * better-auth usa un cookie HTTP-only con nome `better-auth.session_token`.
 * Il middleware non può eseguire DB queries (Edge runtime), quindi valida la
 * PRESENZA del cookie come segnale di autenticazione e delega la verifica
 * completa delle autorizzazioni ai Server Components/Route Handlers.
 *
 * Per il blocco delle verifiche incomplete (email/phone) la verifica reale
 * avviene in `apps/web/src/app/verifica/page.tsx` che legge la sessione completa.
 *
 * Nota: una validazione Edge più sicura richiede JWT session (better-auth ha
 * il plugin `jwt` per questo caso d'uso) — da abilitare prima del go-live.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isPrivateClientRoute = pathname.startsWith('/area-cliente')
  const isPrivateCompanyRoute = pathname.startsWith('/area-impresa')

  if (!isPrivateClientRoute && !isPrivateCompanyRoute) {
    return NextResponse.next()
  }

  // Verifica presenza cookie sessione better-auth
  const sessionCookie =
    req.cookies.get('better-auth.session_token') ??
    req.cookies.get('__Secure-better-auth.session_token')

  if (!sessionCookie) {
    const loginUrl = new URL('/accedi', req.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Sessione presente — lascia passare.
  // La verifica completa (ruolo + emailVerified + phoneNumberVerified)
  // è delegata ai Server Components di ogni area protetta.
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/area-cliente/:path*',
    '/area-impresa/:path*',
  ],
}
