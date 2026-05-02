import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@fixpro/db'
import { checkRateLimit, getClientIp, CHECKOUT_RATE_LIMIT } from '@/lib/rate-limit'
import { requireVerifiedSessionResponse } from '@/lib/verified-session'

export async function POST(req: Request) {
  // Rate limit: max 5 checkout/min per IP
  const rl = checkRateLimit(getClientIp(req), CHECKOUT_RATE_LIMIT)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Troppe richieste. Riprova tra poco.' }, { status: 429 })
  }

  const session = await auth.api.getSession({ headers: await headers() })
  const verificationError = requireVerifiedSessionResponse(session)
  if (verificationError) {
    return verificationError
  }

  const verifiedSession = session as NonNullable<typeof session>

  let body: { packageId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const packageId = body.packageId?.trim()
  if (!packageId) {
    return NextResponse.json({ error: 'Missing packageId' }, { status: 400 })
  }

  const pkg = await prisma.creditPackage.findFirst({
    where: {
      id: packageId,
      active: true,
    },
    select: {
      id: true,
      name: true,
      description: true,
      credits: true,
      priceCents: true,
      validityMonths: true,
    },
  })

  if (!pkg) {
    return NextResponse.json({ error: 'Package not found or inactive' }, { status: 400 })
  }

  if (!Number.isInteger(pkg.credits) || pkg.credits <= 0) {
    return NextResponse.json({ error: 'Invalid package credits' }, { status: 400 })
  }

  if (!Number.isInteger(pkg.priceCents) || pkg.priceCents <= 0) {
    return NextResponse.json({ error: 'Invalid package price' }, { status: 400 })
  }

  if (!Number.isInteger(pkg.validityMonths) || pkg.validityMonths <= 0) {
    return NextResponse.json({ error: 'Invalid package validity' }, { status: 400 })
  }

  const company = await prisma.company.findUnique({
    where: {
      userId: verifiedSession.user.id,
    },
    select: {
      id: true,
    },
  })

  if (!company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 })
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  if (!stripeSecretKey) {
    console.error('[credits-checkout] Missing STRIPE_SECRET_KEY')
    return NextResponse.json({ error: 'Stripe configuration missing' }, { status: 500 })
  }

  const stripe = new Stripe(stripeSecretKey)
  const appUrl = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'

  const creditMetadata = {
    type: 'CREDIT_PACKAGE',
    packageId: pkg.id,
    companyId: company.id,
    credits: String(pkg.credits),
    validityMonths: String(pkg.validityMonths),
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'payment',

    /**
     * P0 release-safety:
     * For credit packages, Stripe must authorize the payment but NOT capture funds yet.
     *
     * Flow:
     * 1. Customer completes Checkout.
     * 2. FixPro fulfills credits in DB.
     * 3. Only after DB fulfillment succeeds, webhook/fallback captures the PaymentIntent.
     *
     * This prevents the bad state:
     * "customer captured/charged definitively but credits not accredited".
     */
    payment_intent_data: {
      capture_method: 'manual',
      metadata: creditMetadata,
    },

    /**
     * Manual capture is primarily a card authorization/capture flow.
     * Keep this explicit for release instead of enabling payment methods that may not support it.
     */
    payment_method_types: ['card'],

    line_items: [
      {
        price_data: {
          currency: 'eur',
          unit_amount: pkg.priceCents,
          product_data: {
            name: `FixPro — Pacchetto ${pkg.name} (${pkg.credits} crediti)`,
            description: pkg.description ?? undefined,
          },
        },
        quantity: 1,
      },
    ],

    metadata: creditMetadata,

    success_url: `${appUrl}/area-impresa/crediti?success=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/area-impresa/crediti?canceled=1`,
  })

  if (!checkoutSession.url) {
    console.error('[credits-checkout] Stripe Checkout session created without URL', {
      sessionId: checkoutSession.id,
      companyId: company.id,
      packageId: pkg.id,
    })

    return NextResponse.json({ error: 'Checkout session URL missing' }, { status: 500 })
  }

  return NextResponse.json({ url: checkoutSession.url })
}