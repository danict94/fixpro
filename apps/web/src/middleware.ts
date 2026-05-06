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

  // 🔒 PROTEZIONE GLOBALE (TEMP — rimuovere dopo upgrade sito)
  const isProtected = process.env.SITE_PROTECTED === 'true'
  const USER = process.env.SITE_USER
  const PASS = process.env.SITE_PASSWORD

  const PUBLIC_PATHS = [
    '/api',            // webhook, tRPC
    '/_next',          // assets Next.js
    '/images',         // static images used by next/image optimizer
    '/favicon.ico',
  ]

  const isPublic = PUBLIC_PATHS.some(path =>
    pathname.startsWith(path)
  )

  if (isProtected && !isPublic) {
    const basicAuth = req.headers.get('authorization')

    if (basicAuth) {
      const authValue = basicAuth.split(' ')[1]
      const [user, pwd] = atob(authValue).split(':')

      if (user === USER && pwd === PASS) {
        // ✔ accesso consentito → continua
      } else {
        return new NextResponse('Auth required', {
          status: 401,
          headers: {
            'WWW-Authenticate': 'Basic realm="Secure Area"',
          },
        })
      }
    } else {
      return new NextResponse('Auth required', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Secure Area"',
        },
      })
    }
  }

  // 👇 LOGICA ESISTENTE (NON TOCCATA)
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
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
