import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@fixpro/db'
import { auth } from '@/lib/auth'
import { AUTH_RATE_LIMIT, checkRateLimit, getClientIp } from '@/lib/rate-limit'

const startSchema = z.object({
  email: z.string().email(),
})

export async function POST(req: Request) {
  const rate = checkRateLimit(`passwordless-sms:start:${getClientIp(req)}`, AUTH_RATE_LIMIT)
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Troppi tentativi. Riprova tra poco.' }, { status: 429 })
  }

  const parsed = startSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Email non valida.' }, { status: 400 })
  }

  const email = parsed.data.email.toLowerCase().trim()
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
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
    await auth.api.sendPhoneNumberOTP({
      body: { phoneNumber: user.phoneNumber },
      headers: req.headers,
    })
  } catch (error) {
    console.error('[passwordless-sms/start] send otp failed:', error)
    return NextResponse.json(
      { error: 'Impossibile inviare il codice SMS. Riprova tra poco.' },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true })
}
