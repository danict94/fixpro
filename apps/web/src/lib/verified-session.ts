import { NextResponse } from 'next/server'

type SessionLike = {
  user?: {
    emailVerified?: boolean | null
    phoneNumberVerified?: boolean | null
  } | null
} | null

export function requireVerifiedSessionResponse(session: SessionLike) {
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!session.user.emailVerified || !session.user.phoneNumberVerified) {
    return NextResponse.json(
      { error: 'Account non verificato. Completa verifica email e telefono.' },
      { status: 403 },
    )
  }

  return null
}
