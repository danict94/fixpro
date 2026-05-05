import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@fixpro/db'
import { checkRateLimit, getClientIp, CHECKOUT_RATE_LIMIT } from '@/lib/rate-limit'
import { requireVerifiedSessionResponse } from '@/lib/verified-session'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  // Rate limit: max 5 checkout/min per IP
  const rl = checkRateLimit(getClientIp(req), CHECKOUT_RATE_LIMIT)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Troppe richieste. Riprova tra poco.' }, { status: 429 })
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  if (!stripeSecretKey) {
    console.error('[showcase-checkout] Missing STRIPE_SECRET_KEY')
    return NextResponse.json({ error: 'Checkout non disponibile.' }, { status: 500 })
  }

  const session = await auth.api.getSession({ headers: await headers() })
  const verificationError = requireVerifiedSessionResponse(session)
  if (verificationError) {
    return verificationError
  }
  const verifiedSession = session as NonNullable<typeof session>

  let body: { planId?: string; period?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  if (!body.planId) {
    return NextResponse.json({ error: 'Missing planId' }, { status: 400 })
  }

  if (body.period !== 'monthly' && body.period !== 'yearly') {
    return NextResponse.json(
      { error: 'Invalid period, must be monthly or yearly' },
      { status: 400 },
    )
  }

  const plan = await prisma.showcasePlan.findFirst({
    where: { id: body.planId, active: true },
  })

  if (!plan) {
    return NextResponse.json({ error: 'Plan not found or inactive' }, { status: 400 })
  }

  // Per periodo annuale, il prezzo annuale deve essere configurato
  if (body.period === 'yearly' && (plan.yearlyPriceCents == null || plan.yearlyPriceCents <= 0)) {
    return NextResponse.json(
      { error: 'Yearly price not configured for this plan' },
      { status: 400 },
    )
  }

  const company = await prisma.company.findUnique({
    where: { userId: verifiedSession.user.id },
    select: { id: true },
  })

  if (!company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 })
  }

  const priceCents = body.period === 'yearly' ? plan.yearlyPriceCents! : plan.monthlyPriceCents
  const durationMonths = body.period === 'yearly' ? 12 : 1
  const periodLabel = body.period === 'yearly' ? 'annuale' : 'mensile'
  if (priceCents <= 0) {
    console.error('[showcase-checkout] Invalid selected price configured:', {
      planId: plan.id,
      period: body.period,
      priceCents,
    })

    return NextResponse.json(
      { error: 'Prezzo piano non configurato correttamente.' },
      { status: 400 },
    )
  }

  const stripe = new Stripe(stripeSecretKey)
  const appUrl = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      client_reference_id: company.id,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: priceCents,
            product_data: {
              name: `FixPro — Vetrina ${plan.name} (${periodLabel})`,
              description: plan.description ?? undefined,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'SHOWCASE_SUBSCRIPTION',
        planId: plan.id,
        tier: plan.tier,
        period: body.period,
        companyId: company.id,
        durationMonths: String(durationMonths),
      },
      success_url: `${appUrl}/area-impresa/vetrina?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/area-impresa/vetrina/acquisto?cancelled=1`,
    })

    if (!checkoutSession.url) {
      console.error('[showcase-checkout] Stripe checkout session missing url:', {
        sessionId: checkoutSession.id,
        companyId: company.id,
        planId: plan.id,
        period: body.period,
      })

      return NextResponse.json({ error: 'Checkout non disponibile.' }, { status: 500 })
    }

    return NextResponse.json({ url: checkoutSession.url })
  } catch (err) {
    console.error('[showcase-checkout] Stripe checkout creation failed:', {
      companyId: company.id,
      planId: plan.id,
      period: body.period,
      message: err instanceof Error ? err.message : String(err),
    })

    return NextResponse.json(
      { error: 'Non siamo riusciti ad avviare il checkout.' },
      { status: 500 },
    )
  }
}
