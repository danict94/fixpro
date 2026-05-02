import 'server-only'
import { prisma } from '@fixpro/db'
import { NextRequest, NextResponse } from 'next/server'
import { requestAdminPasswordReset } from '@/lib/auth'
import { checkRateLimit, getClientIp, RESET_REQUEST_RATE_LIMIT } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  // Rate limit: 3 richieste / 10 minuti per IP (public endpoint)
  const ip = getClientIp(req)
  const rl = await checkRateLimit(`request-reset:${ip}`, RESET_REQUEST_RATE_LIMIT)
  if (!rl.allowed) {
    console.warn(`[request-reset] Rate limit superato — IP: ${ip}`)
    return NextResponse.json({ success: true }) // stesso 200 per sicurezza (no user enumeration)
  }

  try {
    const body = await req.json()
    const email = typeof body?.email === 'string' ? body.email.toLowerCase().trim() : null

    if (!email) {
      return NextResponse.json({ error: 'Email richiesta' }, { status: 400 })
    }

    // Only trigger reset for existing admin users (prevents non-admin user enumeration)
    const user = await prisma.user.findFirst({
      where: { email, adminRole: { not: null } },
      select: { id: true },
    })

    if (user) {
      await requestAdminPasswordReset(email, 'request-reset').catch((err) => {
        console.error('[request-reset] requestPasswordReset failed:', err)
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[request-reset] Error:', err)
    return NextResponse.json({ error: 'Errore durante la richiesta' }, { status: 500 })
  }
}
