import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@fixpro/db'
import { applyRequestPurchasePayment, getPaymentIntentId } from '@/lib/stripe-payment-fulfillment'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

type RequestFulfillStatus =
  | 'processed'
  | 'already_processed'
  | 'pending_payment'
  | 'pending_capture'
  | 'ignored'

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

function isUniqueConstraintError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: unknown }).code === 'P2002'
  )
}

async function retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

  if (!paymentIntent || paymentIntent.object !== 'payment_intent') {
    throw new Error('PAYMENT_INTENT_NOT_FOUND')
  }

  return paymentIntent
}

async function captureRequestPaymentIntent(
  paymentIntentId: string,
): Promise<Stripe.PaymentIntent> {
  const paymentIntent = await retrievePaymentIntent(paymentIntentId)

  if (paymentIntent.status === 'succeeded') {
    return paymentIntent
  }

  if (paymentIntent.status !== 'requires_capture') {
    throw new Error(`PAYMENT_INTENT_NOT_CAPTURABLE:${paymentIntent.status}`)
  }

  return stripe.paymentIntents.capture(paymentIntentId)
}

async function cancelRequiresCapturePaymentIntent(
  paymentIntentId: string,
  reason: string,
): Promise<void> {
  const paymentIntent = await retrievePaymentIntent(paymentIntentId)

  if (paymentIntent.status !== 'requires_capture') {
    return
  }

  await stripe.paymentIntents.cancel(paymentIntentId, {
    cancellation_reason: 'abandoned',
  })

  console.warn('[requests-fulfill] Uncaptured PaymentIntent cancelled:', {
    paymentIntentId,
    reason,
  })
}

async function preflightRequestPurchaseBeforeCapture(
  checkoutSession: Stripe.Checkout.Session,
): Promise<RequestFulfillStatus> {
  const meta = checkoutSession.metadata ?? {}
  const requestId = meta.requestId?.trim()
  const companyId = meta.companyId?.trim()
  const paymentIntentId = getPaymentIntentId(checkoutSession)

  if (!requestId || !companyId) {
    throw new Error('MISSING_REQUEST_PURCHASE_METADATA')
  }

  return prisma.$transaction(
    async (tx) => {
      const existingByIntent = await tx.requestPurchase.findFirst({
        where: { stripePaymentIntentId: paymentIntentId },
        select: { id: true },
      })

      if (existingByIntent) {
        return 'already_processed' as const
      }

      const existingByPair = await tx.requestPurchase.findUnique({
        where: { companyId_requestId: { companyId, requestId } },
        select: { id: true },
      })

      if (existingByPair) {
        return 'already_processed' as const
      }

      const lockedRequests = await tx.$queryRaw<Array<{
        id: string
        status: string
        expiresAt: Date | null
        maxBuyers: number | null
      }>>`
        SELECT
          "id",
          "status",
          "expiresAt",
          "maxBuyers"
        FROM "service_requests"
        WHERE "id" = ${requestId}
        FOR UPDATE
      `

      const request = lockedRequests[0]
      if (!request) {
        throw new Error('REQUEST_NOT_FOUND')
      }

      if (request.status !== 'APPROVED') {
        throw new Error('REQUEST_NOT_AVAILABLE')
      }

      if (request.expiresAt && request.expiresAt < new Date()) {
        throw new Error('REQUEST_EXPIRED')
      }

      const reservation = await tx.requestSlotReservation.findUnique({
        where: {
          companyId_requestId: {
            companyId,
            requestId,
          },
        },
        select: {
          id: true,
          status: true,
          expiresAt: true,
        },
      })

      if (!reservation) {
        throw new Error('REQUEST_SLOT_RESERVATION_MISSING')
      }

      if (reservation.status === 'COMPLETED') {
        return 'already_processed' as const
      }

      if (reservation.status !== 'ACTIVE') {
        throw new Error('REQUEST_SLOT_RESERVATION_NOT_ACTIVE')
      }

      if (reservation.expiresAt && reservation.expiresAt < new Date()) {
        throw new Error('REQUEST_SLOT_RESERVATION_EXPIRED')
      }

      if (request.maxBuyers !== null) {
        const buyerCount = await tx.requestPurchase.count({
          where: { requestId },
        })

        if (buyerCount >= request.maxBuyers) {
          throw new Error('REQUEST_MAXBUYERS_EXCEEDED')
        }
      }

      return 'pending_capture' as const
    },
    {
      maxWait: 10_000,
      timeout: 10_000,
    },
  )
}

async function createRequestPurchaseAfterCapture(
  checkoutSession: Stripe.Checkout.Session,
): Promise<RequestFulfillStatus> {
  try {
    const result = await prisma.$transaction(
      async (tx) => {
        return applyRequestPurchasePayment(tx, checkoutSession)
      },
      {
        maxWait: 10_000,
        timeout: 10_000,
      },
    )

    return result.status === 'already_processed' ? 'already_processed' : 'processed'
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      return 'already_processed'
    }

    throw err
  }
}

async function fulfillRequestPurchaseCheckoutSession(
  checkoutSession: Stripe.Checkout.Session,
): Promise<RequestFulfillStatus> {
  const paymentIntentId = getPaymentIntentId(checkoutSession)

  const preflight = await preflightRequestPurchaseBeforeCapture(checkoutSession)
  if (preflight === 'already_processed') {
    return 'already_processed'
  }

  let capturedPaymentIntent: Stripe.PaymentIntent

  try {
    capturedPaymentIntent = await captureRequestPaymentIntent(paymentIntentId)
  } catch (captureErr) {
    const captureMessage = getErrorMessage(captureErr)

    let latestPaymentIntent: Stripe.PaymentIntent | null = null
    try {
      latestPaymentIntent = await retrievePaymentIntent(paymentIntentId)
    } catch (retrieveErr) {
      console.error('[requests-fulfill] Failed to retrieve PaymentIntent after capture failure:', {
        paymentIntentId,
        captureMessage,
        retrieveMessage: getErrorMessage(retrieveErr),
      })
    }

    if (latestPaymentIntent?.status === 'succeeded') {
      capturedPaymentIntent = latestPaymentIntent
    } else {
      try {
        await cancelRequiresCapturePaymentIntent(paymentIntentId, captureMessage)
      } catch (cancelErr) {
        console.error('[requests-fulfill] Failed to cancel uncaptured PaymentIntent:', {
          paymentIntentId,
          captureMessage,
          cancelMessage: getErrorMessage(cancelErr),
        })

        throw cancelErr
      }

      throw captureErr
    }
  }

  if (capturedPaymentIntent.status !== 'succeeded') {
    throw new Error(`PAYMENT_INTENT_CAPTURE_NOT_SUCCEEDED:${capturedPaymentIntent.status}`)
  }

  return createRequestPurchaseAfterCapture(checkoutSession)
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  let body: { sessionId?: string }
  try {
    body = (await req.json()) as { sessionId?: string }
  } catch {
    return NextResponse.json({ error: 'Body non valido' }, { status: 400 })
  }

  const sessionId = body.sessionId?.trim()
  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId mancante' }, { status: 400 })
  }

  const company = await prisma.company.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })

  if (!company) {
    return NextResponse.json({ error: 'Impresa non trovata' }, { status: 404 })
  }

  let checkoutSession: Stripe.Checkout.Session
  try {
    checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)
  } catch {
    return NextResponse.json({ error: 'Sessione Stripe non trovata' }, { status: 400 })
  }

  const meta = checkoutSession.metadata ?? {}

  if (meta.type !== 'REQUEST_PURCHASE') {
    return NextResponse.json({
      ok: true,
      processed: false,
      status: 'ignored' satisfies RequestFulfillStatus,
    })
  }

  const requestId = meta.requestId?.trim()
  const companyId = meta.companyId?.trim()

  if (!requestId || !companyId) {
    return NextResponse.json({ error: 'Metadati sessione incompleti' }, { status: 400 })
  }

  if (company.id !== companyId) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
  }

  let paymentIntentId: string
  try {
    paymentIntentId = getPaymentIntentId(checkoutSession)
  } catch {
    return NextResponse.json({ error: 'PaymentIntent mancante' }, { status: 400 })
  }

  const paymentIntent = await retrievePaymentIntent(paymentIntentId)

  if (
    paymentIntent.status !== 'requires_capture' &&
    paymentIntent.status !== 'succeeded'
  ) {
    return NextResponse.json({
      ok: true,
      processed: false,
      status: 'pending_payment' satisfies RequestFulfillStatus,
      paymentIntentStatus: paymentIntent.status,
    })
  }

  try {
    const status = await fulfillRequestPurchaseCheckoutSession(checkoutSession)

    return NextResponse.json({
      ok: true,
      processed: status === 'processed' || status === 'already_processed',
      status,
      requestId,
      paymentIntentId,
    })
  } catch (err) {
    const message = getErrorMessage(err)

    console.error('[requests-fulfill] Request purchase fallback fulfillment failed:', {
      sessionId,
      requestId,
      companyId: company.id,
      paymentIntentId,
      message,
    })

    return NextResponse.json(
      {
        ok: false,
        error: 'Request purchase fulfillment failed',
        status: 'pending_capture' satisfies RequestFulfillStatus,
      },
      { status: 500 },
    )
  }
}