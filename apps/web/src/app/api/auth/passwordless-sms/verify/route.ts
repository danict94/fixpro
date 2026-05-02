import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@fixpro/db'
import { auth } from '@/lib/auth'
import { AUTH_RATE_LIMIT, checkRateLimit, getClientIp } from '@/lib/rate-limit'

const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  redirectTo: z.string().optional(),
})

function getSafeRedirect(value: string | undefined) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return null
  }

  return value
}

export async function POST(req: Request) {
  const rate = checkRateLimit(`passwordless-sms:verify:${getClientIp(req)}`, AUTH_RATE_LIMIT)
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Troppi tentativi. Riprova tra poco.' }, { status: 429 })
  }

  const parsed = verifySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Codice non valido.' }, { status: 400 })
  }

  const email = parsed.data.email.toLowerCase().trim()
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      role: true,
      emailVerified: true,
      phoneNumber: true,
      phoneNumberVerified: true,
    },
  })

  if (!user?.phoneNumber || !user.phoneNumberVerified) {
    return NextResponse.json(
      { error: 'Accesso via SMS non disponibile per questo account.' },
      { status: 400 },
    )
  }

  const phoneOwnerCount = await prisma.user.count({
    where: { phoneNumber: user.phoneNumber },
  })

  if (phoneOwnerCount !== 1) {
    return NextResponse.json(
      { error: 'Accesso via SMS non disponibile per questo account.' },
      { status: 409 },
    )
  }

  try {
    await auth.api.verifyPhoneNumber({
      body: {
        phoneNumber: user.phoneNumber,
        code: parsed.data.code,
      },
      headers: req.headers,
    })
  } catch {
    return NextResponse.json({ error: 'Codice non valido o scaduto.' }, { status: 400 })
  }

  const defaultRedirect =
    !user.emailVerified || !user.phoneNumberVerified
      ? '/verifica'
      : user.role === 'COMPANY'
        ? '/area-impresa/dashboard'
        : '/area-cliente'
  const safeRedirect =
    user.emailVerified && user.phoneNumberVerified ? getSafeRedirect(parsed.data.redirectTo) : null

  return NextResponse.json({
    ok: true,
    redirectTo: safeRedirect ?? defaultRedirect,
  })
}
