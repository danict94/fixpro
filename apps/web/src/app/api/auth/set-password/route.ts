import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { AUTH_RATE_LIMIT, checkRateLimit, getClientIp } from '@/lib/rate-limit'

const setPasswordSchema = z.object({
  newPassword: z.string().min(8),
})

export async function POST(req: Request) {
  const rate = checkRateLimit(`set-password:${getClientIp(req)}`, AUTH_RATE_LIMIT)
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Troppi tentativi. Riprova tra poco.' }, { status: 429 })
  }

  const parsed = setPasswordSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Password non valida.' }, { status: 400 })
  }

  try {
    await auth.api.setPassword({
      body: { newPassword: parsed.data.newPassword },
      headers: req.headers,
    })
  } catch {
    return NextResponse.json(
      { error: 'Non siamo riusciti a impostare la password.' },
      { status: 400 },
    )
  }

  return NextResponse.json({ ok: true })
}
