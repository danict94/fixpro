import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@fixpro/db'
import { checkRateLimit, getClientIp, CHECKOUT_RATE_LIMIT } from '@/lib/rate-limit'
import {
  calculateRequestUnlockPricing,
  expireRequestSlotReservation,
  expireShowcaseSubscriptions,
  isRequestSlotError,
  reserveRequestSlot,
} from '@fixpro/api'
import { requireVerifiedSessionResponse } from '@/lib/verified-session'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const STRIPE_CHECKOUT_MIN_EXPIRES_SECONDS = 30 * 60
const REQUEST_CHECKOUT_RESERVATION_SECONDS = 45 * 60

function getRequestCheckoutExpiresAt(): Date {
  const ttlSeconds = Math.max(
    REQUEST_CHECKOUT_RESERVATION_SECONDS,
    STRIPE_CHECKOUT_MIN_EXPIRES_SECONDS + 60,
  )

  return new Date(Date.now() + ttlSeconds * 1000)
}

export async function POST(req: Request) {
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

  let body: { requestId?: string }
  try {
    body = (await req.json()) as { requestId?: string }
  } catch {
    return NextResponse.json({ error: 'Body non valido' }, { status: 400 })
  }

  const requestId = body.requestId?.trim()
  if (!requestId) {
    return NextResponse.json({ error: 'requestId mancante' }, { status: 400 })
  }

  const company = await prisma.company.findUnique({
    where: { userId: verifiedSession.user.id },
    select: { id: true },
  })

  if (!company) {
    return NextResponse.json({ error: 'Impresa non trovata' }, { status: 404 })
  }

  const request = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      status: true,
      expiresAt: true,
      maxBuyers: true,
      oneTimePriceCents: true,
      creditCost: true,
      targetCompanyId: true,
      title: true,
      _count: { select: { purchases: true } },
    },
  })

  if (!request) {
    return NextResponse.json({ error: 'Richiesta non trovata' }, { status: 404 })
  }

  if (request.status !== 'APPROVED') {
    return NextResponse.json({ error: 'Richiesta non disponibile' }, { status: 400 })
  }

  if (request.expiresAt && request.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Richiesta scaduta' }, { status: 400 })
  }

  if (request.oneTimePriceCents === null) {
    return NextResponse.json({ error: 'Prezzo one-time non configurato' }, { status: 400 })
  }

  if (request.maxBuyers !== null && request._count.purchases >= request.maxBuyers) {
    return NextResponse.json({ error: 'Numero massimo di acquirenti raggiunto' }, { status: 400 })
  }

  const alreadyPurchased = await prisma.requestPurchase.findUnique({
    where: { companyId_requestId: { companyId: company.id, requestId } },
    select: { id: true },
  })

  if (alreadyPurchased) {
    return NextResponse.json({ error: 'Richiesta già acquistata' }, { status: 400 })
  }

  const isDirectRequest = request.targetCompanyId === company.id
  let finalAmountCents = request.oneTimePriceCents
  const baseAmountCents = request.oneTimePriceCents
  let discountPercent = 0
  let discountReason: string | null = null
  let planSnapshotStr: string | null = null
  let pricingContextStr: string | null = null

  if (isDirectRequest) {
    await expireShowcaseSubscriptions(prisma, { companyId: company.id })

    const sub = await prisma.showcaseSubscription.findUnique({
      where: { companyId: company.id },
      select: {
        status: true,
        expiresAt: true,
        plan: {
          select: {
            tier: true,
            freeContactsPerMonth: true,
            overQuotaDiscountPercent: true,
            discountPercent: true,
          },
        },
      },
    })

    const isSubActive = sub?.status === 'ACTIVE' && sub.expiresAt > new Date()
    if (isSubActive && sub?.plan) {
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const freeUsed = await prisma.requestPurchase.count({
        where: {
          companyId: company.id,
          contactSourceType: { not: 'MARKETPLACE_REQUEST' },
          discountReason: 'SHOWCASE_PRO_FREE',
          purchasedAt: { gte: startOfMonth },
        },
      })

      const pricing = calculateRequestUnlockPricing({
        baseCredits: request.creditCost ?? 0,
        baseAmountCents,
        isShowcaseDirect: true,
        showcase: {
          tier: sub.plan.tier,
          freeContactsUsedThisMonth: freeUsed,
          freeContactsQuota: sub.plan.freeContactsPerMonth,
          overQuotaDiscountPercent: sub.plan.overQuotaDiscountPercent,
          discountPercent: sub.plan.discountPercent,
        },
      })

      if (pricing.oneTime.isFree) {
        return NextResponse.json(
          {
            error:
              'Questo contatto è incluso nel tuo piano — usa "Sblocca contatto incluso nel tuo piano"',
          },
          { status: 400 },
        )
      }

      finalAmountCents = pricing.oneTime.finalAmountCents
      discountPercent = pricing.discountPercent
      discountReason = pricing.discountReason
      planSnapshotStr = JSON.stringify(pricing.planSnapshot)
      pricingContextStr = JSON.stringify({
        sourceType: 'SHOWCASE_PROFILE',
        isDirectRequest: true,
        freeUsed,
      })
    }
  }

  const reservationExpiresAt = getRequestCheckoutExpiresAt()

  let reservation:
    | { status: 'reserved'; reservationId: string; expiresAt: Date }
    | { status: 'already_reserved'; reservationId: string; expiresAt: Date | null }
    | { status: 'already_completed'; reservationId: string; expiresAt: Date | null }

  try {
    reservation = await prisma.$transaction((tx) =>
      reserveRequestSlot(tx, {
        companyId: company.id,
        requestId,
        expiresAt: reservationExpiresAt,
      }),
    )
  } catch (error) {
    if (isRequestSlotError(error)) {
      if (error.message === 'REQUEST_MAXBUYERS_EXCEEDED') {
        return NextResponse.json(
          { error: 'Richiesta già acquistata o non più disponibile.' },
          { status: 409 },
        )
      }

      if (
        error.message === 'REQUEST_NOT_AVAILABLE' ||
        error.message === 'REQUEST_EXPIRED' ||
        error.message === 'REQUEST_SLOT_RESERVATION_MISSING' ||
        error.message === 'REQUEST_SLOT_RESERVATION_EXPIRED'
      ) {
        return NextResponse.json(
          { error: 'Richiesta già acquistata o non più disponibile.' },
          { status: 400 },
        )
      }
    }

    throw error
  }

  if (reservation.status === 'already_completed') {
    return NextResponse.json(
      { error: 'Richiesta già acquistata o slot già completato' },
      { status: 400 },
    )
  }

  if (reservation.status === 'already_reserved') {
    return NextResponse.json(
      {
        error:
          'Hai già una prenotazione attiva per questa richiesta. Completa il pagamento entro la scadenza prima di riprovare.',
      },
      { status: 409 },
    )
  }

  const appUrl = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'

  const metadata = {
    type: 'REQUEST_PURCHASE',
    reservationId: reservation.reservationId,
    requestId,
    companyId: company.id,
    amountCents: String(finalAmountCents),
    baseAmountCents: String(baseAmountCents),
    discountPercent: String(discountPercent),
    discountReason: discountReason ?? '',
    planSnapshot: planSnapshotStr ?? '',
    pricingContext: pricingContextStr ?? '',
  }

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      expires_at: Math.floor(reservation.expiresAt.getTime() / 1000),
      payment_method_types: ['card'],
      payment_intent_data: {
        capture_method: 'manual',
        metadata,
      },
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: finalAmountCents,
            product_data: {
              name: `FixPro - Contatto cliente (richiesta ${request.title ?? requestId})`,
              description:
                discountPercent > 0
                  ? 'Tariffa riservata Vetrina - Acquisto one-time'
                  : 'Acquisto one-time: sblocchi i dati di contatto del cliente.',
            },
          },
          quantity: 1,
        },
      ],
      metadata,
      success_url: `${appUrl}/area-impresa/richieste/${requestId}?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/area-impresa/richieste/${requestId}?canceled=1`,
    })

    if (!checkoutSession.url) {
      await expireRequestSlotReservation(prisma, {
        companyId: company.id,
        requestId,
        reservationId: reservation.reservationId,
      })

      return NextResponse.json({ error: 'URL Checkout Stripe mancante' }, { status: 500 })
    }

    return NextResponse.json({ url: checkoutSession.url, sessionId: checkoutSession.id })
  } catch (err) {
    await expireRequestSlotReservation(prisma, {
      companyId: company.id,
      requestId,
      reservationId: reservation.reservationId,
    })

    throw err
  }
}