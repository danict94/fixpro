import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@fixpro/db'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { sessionId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const { sessionId } = body
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })
  }

  let checkoutSession: Stripe.Checkout.Session
  try {
    checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)
  } catch {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  if (checkoutSession.payment_status !== 'paid') {
    return NextResponse.json({ ok: true, processed: false, status: 'pending_payment' })
  }

  const meta = checkoutSession.metadata ?? {}
  if (meta.type !== 'SHOWCASE_SUBSCRIPTION') {
    return NextResponse.json({ ok: true, processed: false, status: 'ignored' })
  }

  const { tier, companyId: metaCompanyId } = meta
  if (!metaCompanyId || !tier) {
    return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
  }

  const company = await prisma.company.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!company || company.id !== metaCompanyId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const paymentIntentId = checkoutSession.payment_intent as string
  const existing = await prisma.showcaseSubscription.findUnique({
    where: { stripePaymentIntentId: paymentIntentId },
    select: { id: true, plan: { select: { tier: true } }, expiresAt: true },
  })

  return NextResponse.json({
    ok: true,
    processed: Boolean(existing),
    status: existing ? 'processed' : 'pending_webhook',
    tier: existing?.plan.tier ?? tier,
    expiresAt: existing?.expiresAt ?? null,
  })
}
