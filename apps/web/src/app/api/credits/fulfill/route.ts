import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@fixpro/db'
import {
  activateCreditPackagePaymentTx,
  getPaymentIntentId,
  prepareCreditPackagePaymentTx,
  voidCreditPackagePaymentTx,
} from '@/lib/stripe-payment-fulfillment'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

type CreditFulfillStatus =
  | 'processed'
  | 'already_processed'
  | 'pending_payment'
  | 'pending_capture'
  | 'voided'
  | 'ignored'

function isCreditPackageSession(session: Stripe.Checkout.Session): boolean {
  return session.metadata?.type === 'CREDIT_PACKAGE'
}

function getStripeErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

async function retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

  if (!paymentIntent || paymentIntent.object !== 'payment_intent') {
    throw new Error('PAYMENT_INTENT_NOT_FOUND')
  }

  return paymentIntent
}

async function captureCreditPackagePaymentIntent(
  paymentIntentId: string,
): Promise<Stripe.PaymentIntent> {
  const paymentIntent = await retrievePaymentIntent(paymentIntentId)

  if (paymentIntent.status === 'succeeded') {
    return paymentIntent
  }

  if (paymentIntent.status === 'requires_capture') {
    return stripe.paymentIntents.capture(paymentIntentId)
  }

  throw new Error(`PAYMENT_INTENT_NOT_CAPTURABLE:${paymentIntent.status}`)
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

  console.warn('[credits-fulfill] Uncaptured PaymentIntent cancelled:', {
    paymentIntentId,
    reason,
  })
}

async function preparePendingCreditBatch(
  checkoutSession: Stripe.Checkout.Session,
): Promise<void> {
  await prisma.$transaction(
    async (tx) => {
      await prepareCreditPackagePaymentTx(tx, checkoutSession)
    },
    {
      maxWait: 10_000,
      timeout: 10_000,
    },
  )
}

async function activateCapturedCreditBatch(
  checkoutSession: Stripe.Checkout.Session,
): Promise<CreditFulfillStatus> {
  const result = await prisma.$transaction(
    async (tx) => {
      return activateCreditPackagePaymentTx(tx, checkoutSession, {
        capturedAt: new Date(),
      })
    },
    {
      maxWait: 10_000,
      timeout: 10_000,
    },
  )

  return result.status === 'already_processed' ? 'already_processed' : 'processed'
}

async function voidPendingCreditBatch(
  checkoutSession: Stripe.Checkout.Session,
  error: string,
): Promise<CreditFulfillStatus> {
  await prisma.$transaction(
    async (tx) => {
      await voidCreditPackagePaymentTx(tx, checkoutSession, {
        error,
        voidedAt: new Date(),
      })
    },
    {
      maxWait: 10_000,
      timeout: 10_000,
    },
  )

  return 'voided'
}

async function fulfillCreditPackageCheckoutSession(
  checkoutSession: Stripe.Checkout.Session,
): Promise<CreditFulfillStatus> {
  const paymentIntentId = getPaymentIntentId(checkoutSession)

  await preparePendingCreditBatch(checkoutSession)

  let capturedPaymentIntent: Stripe.PaymentIntent

  try {
    capturedPaymentIntent = await captureCreditPackagePaymentIntent(paymentIntentId)
  } catch (captureErr) {
    const captureMessage = getStripeErrorMessage(captureErr)

    let latestPaymentIntent: Stripe.PaymentIntent | null = null
    try {
      latestPaymentIntent = await retrievePaymentIntent(paymentIntentId)
    } catch (retrieveErr) {
      console.error('[credits-fulfill] Failed to retrieve PaymentIntent after capture failure:', {
        paymentIntentId,
        captureMessage,
        retrieveMessage: getStripeErrorMessage(retrieveErr),
      })
    }

    /**
     * Safety case:
     * Stripe capture may have succeeded but the response was lost.
     * If Stripe now says "succeeded", activate credits instead of voiding.
     */
    if (latestPaymentIntent?.status === 'succeeded') {
      capturedPaymentIntent = latestPaymentIntent
    } else {
      try {
        await cancelRequiresCapturePaymentIntent(paymentIntentId, captureMessage)
      } catch (cancelErr) {
        /**
         * If we cannot confirm/cancel the authorization, do not void locally.
         * Return an error so the caller/front-end can retry instead of creating
         * an inconsistent state.
         */
        console.error('[credits-fulfill] Failed to cancel uncaptured PaymentIntent:', {
          paymentIntentId,
          captureMessage,
          cancelMessage: getStripeErrorMessage(cancelErr),
        })

        throw cancelErr
      }

      await voidPendingCreditBatch(checkoutSession, captureMessage)
      return 'voided'
    }
  }

  if (capturedPaymentIntent.status !== 'succeeded') {
    throw new Error(`PAYMENT_INTENT_CAPTURE_NOT_SUCCEEDED:${capturedPaymentIntent.status}`)
  }

  /**
   * From here Stripe has captured money.
   * If DB activation fails, do not void: return 500 so this endpoint/webhook can retry.
   */
  return activateCapturedCreditBatch(checkoutSession)
}

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

  const sessionId = body.sessionId?.trim()
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })
  }

  let checkoutSession: Stripe.Checkout.Session
  try {
    checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)
  } catch {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  if (!isCreditPackageSession(checkoutSession)) {
    return NextResponse.json({
      ok: true,
      processed: false,
      status: 'ignored' satisfies CreditFulfillStatus,
    })
  }

  const meta = checkoutSession.metadata ?? {}

  const company = await prisma.company.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })

  if (!company || company.id !== meta.companyId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let paymentIntentId: string
  try {
    paymentIntentId = getPaymentIntentId(checkoutSession)
  } catch {
    return NextResponse.json({ error: 'Missing payment intent' }, { status: 400 })
  }

  const paymentIntent = await retrievePaymentIntent(paymentIntentId)

  if (
    paymentIntent.status !== 'requires_capture' &&
    paymentIntent.status !== 'succeeded'
  ) {
    return NextResponse.json({
      ok: true,
      processed: false,
      status: 'pending_payment' satisfies CreditFulfillStatus,
      paymentIntentStatus: paymentIntent.status,
    })
  }

  try {
    const status = await fulfillCreditPackageCheckoutSession(checkoutSession)

    return NextResponse.json({
      ok: true,
      processed: status === 'processed' || status === 'already_processed',
      status,
      paymentIntentId,
    })
  } catch (err) {
    const message = getStripeErrorMessage(err)

    console.error('[credits-fulfill] Credit package fallback fulfillment failed:', {
      sessionId,
      paymentIntentId,
      companyId: company.id,
      message,
    })

    return NextResponse.json(
      {
        ok: false,
        error: 'Credit fulfillment failed',
        status: 'pending_capture' satisfies CreditFulfillStatus,
      },
      { status: 500 },
    )
  }
}