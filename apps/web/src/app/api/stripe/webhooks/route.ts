import Stripe from 'stripe'
import * as Sentry from '@sentry/nextjs'
import { Prisma, prisma } from '@fixpro/db'
import { expireRequestSlotReservation, isRequestSlotError } from '@fixpro/api'
import {
  activateCreditPackagePaymentTx,
  applyRequestPurchasePayment,
  applyShowcasePayment,
  getPaymentIntentId,
  prepareCreditPackagePaymentTx,
  voidCreditPackagePaymentTx,
} from '@/lib/stripe-payment-fulfillment'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

type FulfillmentStatus = 'processed' | 'already_processed' | 'ignored'

const NON_RETRYABLE_FULFILLMENT_ERRORS = new Set([
  'MISSING_PAYMENT_INTENT',
  'REQUEST_NOT_FOUND',
])

function hasNonEmptyMetadataValue(
  metadata: Stripe.Metadata | undefined,
  key: string,
): boolean {
  const value = metadata?.[key]
  return typeof value === 'string' && value.trim().length > 0
}

function hasPositiveIntegerMetadataValue(
  metadata: Stripe.Metadata | undefined,
  key: string,
): boolean {
  const value = metadata?.[key]
  if (typeof value !== 'string') return false

  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0
}

function validateCheckoutMetadata(session: Stripe.Checkout.Session): string | null {
  const metadata = session.metadata ?? {}

  if (!hasNonEmptyMetadataValue(metadata, 'type')) {
    return 'MISSING_METADATA:type'
  }

  const type = metadata.type
  if (
    type !== 'CREDIT_PACKAGE' &&
    type !== 'SHOWCASE_SUBSCRIPTION' &&
    type !== 'REQUEST_PURCHASE'
  ) {
    return `INVALID_METADATA:type:${type}`
  }

  if (!hasNonEmptyMetadataValue(metadata, 'companyId')) {
    return 'MISSING_METADATA:companyId'
  }

  if (type === 'CREDIT_PACKAGE') {
    if (!hasNonEmptyMetadataValue(metadata, 'packageId')) return 'MISSING_METADATA:packageId'
    if (!hasPositiveIntegerMetadataValue(metadata, 'credits')) return 'INVALID_METADATA:credits'
    if (!hasPositiveIntegerMetadataValue(metadata, 'validityMonths')) {
      return 'INVALID_METADATA:validityMonths'
    }
  }

  if (type === 'SHOWCASE_SUBSCRIPTION') {
    if (!hasNonEmptyMetadataValue(metadata, 'planId')) return 'MISSING_METADATA:planId'
    if (!hasPositiveIntegerMetadataValue(metadata, 'durationMonths')) {
      return 'INVALID_METADATA:durationMonths'
    }
  }

  if (type === 'REQUEST_PURCHASE') {
    if (!hasNonEmptyMetadataValue(metadata, 'requestId')) return 'MISSING_METADATA:requestId'
    if (!hasNonEmptyMetadataValue(metadata, 'amountCents')) return 'MISSING_METADATA:amountCents'
  }

  return null
}

function isUniqueConstraintError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: unknown }).code === 'P2002'
  )
}

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

async function hasProcessedWebhookEvent(eventId: string): Promise<boolean> {
  const existing = await prisma.stripeWebhookEvent.findUnique({
    where: { id: eventId },
    select: { id: true },
  })

  return Boolean(existing)
}

async function markWebhookEventProcessedTx(
  tx: Prisma.TransactionClient,
  eventId: string,
): Promise<void> {
  try {
    await tx.stripeWebhookEvent.create({
      data: { id: eventId },
    })
  } catch (err) {
    if (!isUniqueConstraintError(err)) {
      throw err
    }
  }
}

async function retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

  if (!paymentIntent || paymentIntent.object !== 'payment_intent') {
    throw new Error('PAYMENT_INTENT_NOT_FOUND')
  }

  return paymentIntent
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

  console.warn('[stripe-webhook] Uncaptured PaymentIntent cancelled:', {
    paymentIntentId,
    reason,
  })
}

async function captureManualPaymentIntent(
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

/* -------------------------------------------------------------------------- */
/* CREDIT PACKAGE                                                             */
/* -------------------------------------------------------------------------- */

async function voidCreditPackageAndMarkProcessed(
  eventId: string,
  session: Stripe.Checkout.Session,
  error: string,
): Promise<FulfillmentStatus> {
  await prisma.$transaction(
    async (tx) => {
      const existingEvent = await tx.stripeWebhookEvent.findUnique({
        where: { id: eventId },
        select: { id: true },
      })

      if (existingEvent) return

      await voidCreditPackagePaymentTx(tx, session, {
        error,
        voidedAt: new Date(),
      })

      await markWebhookEventProcessedTx(tx, eventId)
    },
    {
      maxWait: 10_000,
      timeout: 10_000,
    },
  )

  return 'processed'
}

async function activateCreditPackageAndMarkProcessed(
  eventId: string,
  session: Stripe.Checkout.Session,
): Promise<FulfillmentStatus> {
  return prisma.$transaction(
    async (tx) => {
      const existingEvent = await tx.stripeWebhookEvent.findUnique({
        where: { id: eventId },
        select: { id: true },
      })

      if (existingEvent) {
        return 'already_processed' as const
      }

      const result = await activateCreditPackagePaymentTx(tx, session, {
        capturedAt: new Date(),
      })

      await markWebhookEventProcessedTx(tx, eventId)

      return result.status
    },
    {
      maxWait: 10_000,
      timeout: 10_000,
    },
  )
}

async function handleCreditPackageCheckoutCompleted(
  event: Stripe.Event,
  session: Stripe.Checkout.Session,
): Promise<FulfillmentStatus> {
  if (await hasProcessedWebhookEvent(event.id)) {
    return 'already_processed'
  }

  const paymentIntentId = getPaymentIntentId(session)

  await prisma.$transaction(
    async (tx) => {
      const existingEvent = await tx.stripeWebhookEvent.findUnique({
        where: { id: event.id },
        select: { id: true },
      })

      if (existingEvent) return

      await prepareCreditPackagePaymentTx(tx, session)
    },
    {
      maxWait: 10_000,
      timeout: 10_000,
    },
  )

  let capturedPaymentIntent: Stripe.PaymentIntent

  try {
    capturedPaymentIntent = await captureManualPaymentIntent(paymentIntentId)
  } catch (captureErr) {
    const captureMessage = getErrorMessage(captureErr)

    let latestPaymentIntent: Stripe.PaymentIntent | null = null
    try {
      latestPaymentIntent = await retrievePaymentIntent(paymentIntentId)
    } catch (retrieveErr) {
      Sentry.captureException(retrieveErr, {
        tags: { webhook: 'stripe_payment_intent_retrieve_after_capture_failed' },
        extra: {
          eventId: event.id,
          sessionId: session.id,
          paymentIntentId,
          captureMessage,
        },
      })
    }

    if (latestPaymentIntent?.status === 'succeeded') {
      capturedPaymentIntent = latestPaymentIntent
    } else {
      try {
        await cancelRequiresCapturePaymentIntent(paymentIntentId, captureMessage)
      } catch (cancelErr) {
        Sentry.captureException(cancelErr, {
          tags: { webhook: 'stripe_payment_intent_cancel_failed' },
          extra: {
            eventId: event.id,
            sessionId: session.id,
            paymentIntentId,
            captureMessage,
          },
        })

        throw cancelErr
      }

      const voided = await voidCreditPackageAndMarkProcessed(
        event.id,
        session,
        captureMessage,
      )

      console.error('[stripe-webhook] Credit package capture failed; batch voided:', {
        eventId: event.id,
        sessionId: session.id,
        paymentIntentId,
        message: captureMessage,
      })

      return voided
    }
  }

  if (capturedPaymentIntent.status !== 'succeeded') {
    throw new Error(`PAYMENT_INTENT_CAPTURE_NOT_SUCCEEDED:${capturedPaymentIntent.status}`)
  }

  const activated = await activateCreditPackageAndMarkProcessed(event.id, session)

  console.info('[stripe-webhook] Credit package fulfilled:', {
    eventId: event.id,
    sessionId: session.id,
    paymentIntentId,
    status: activated,
  })

  return activated
}

/* -------------------------------------------------------------------------- */
/* REQUEST PURCHASE ONE-TIME                                                  */
/* -------------------------------------------------------------------------- */

async function preflightRequestPurchaseBeforeCapture(
  session: Stripe.Checkout.Session,
): Promise<FulfillmentStatus> {
  const meta = session.metadata ?? {}
  const requestId = meta.requestId?.trim()
  const companyId = meta.companyId?.trim()
  const paymentIntentId = getPaymentIntentId(session)

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

      return 'processed' as const
    },
    {
      maxWait: 10_000,
      timeout: 10_000,
    },
  )
}

async function createRequestPurchaseAndMarkProcessed(
  eventId: string,
  session: Stripe.Checkout.Session,
): Promise<FulfillmentStatus> {
  try {
    return await prisma.$transaction(
      async (tx) => {
        const existingEvent = await tx.stripeWebhookEvent.findUnique({
          where: { id: eventId },
          select: { id: true },
        })

        if (existingEvent) {
          return 'already_processed' as const
        }

        const result = await applyRequestPurchasePayment(tx, session)

        await markWebhookEventProcessedTx(tx, eventId)

        return result.status
      },
      {
        maxWait: 10_000,
        timeout: 10_000,
      },
    )
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      return 'already_processed'
    }

    throw err
  }
}

async function handleRequestPurchaseCheckoutCompleted(
  event: Stripe.Event,
  session: Stripe.Checkout.Session,
): Promise<FulfillmentStatus> {
  if (await hasProcessedWebhookEvent(event.id)) {
    return 'already_processed'
  }

  const paymentIntentId = getPaymentIntentId(session)

  const preflight = await preflightRequestPurchaseBeforeCapture(session)
  if (preflight === 'already_processed') {
    await prisma.$transaction(async (tx) => {
      await markWebhookEventProcessedTx(tx, event.id)
    })

    return 'already_processed'
  }

  let capturedPaymentIntent: Stripe.PaymentIntent

  try {
    capturedPaymentIntent = await captureManualPaymentIntent(paymentIntentId)
  } catch (captureErr) {
    const captureMessage = getErrorMessage(captureErr)

    let latestPaymentIntent: Stripe.PaymentIntent | null = null
    try {
      latestPaymentIntent = await retrievePaymentIntent(paymentIntentId)
    } catch (retrieveErr) {
      Sentry.captureException(retrieveErr, {
        tags: { webhook: 'stripe_request_payment_intent_retrieve_after_capture_failed' },
        extra: {
          eventId: event.id,
          sessionId: session.id,
          paymentIntentId,
          captureMessage,
        },
      })
    }

    if (latestPaymentIntent?.status === 'succeeded') {
      capturedPaymentIntent = latestPaymentIntent
    } else {
      try {
        await cancelRequiresCapturePaymentIntent(paymentIntentId, captureMessage)
      } catch (cancelErr) {
        Sentry.captureException(cancelErr, {
          tags: { webhook: 'stripe_request_payment_intent_cancel_failed' },
          extra: {
            eventId: event.id,
            sessionId: session.id,
            paymentIntentId,
            captureMessage,
          },
        })

        throw cancelErr
      }

      const meta = session.metadata ?? {}
      const requestId = meta.requestId?.trim()
      const companyId = meta.companyId?.trim()
      const reservationId = meta.reservationId?.trim()

      if (requestId && companyId) {
        await expireRequestSlotReservation(prisma, {
          requestId,
          companyId,
          reservationId: reservationId || undefined,
        })
      }

      console.error('[stripe-webhook] Request purchase capture failed; reservation expired:', {
        eventId: event.id,
        sessionId: session.id,
        paymentIntentId,
        message: captureMessage,
      })

      return 'processed'
    }
  }

  if (capturedPaymentIntent.status !== 'succeeded') {
    throw new Error(`PAYMENT_INTENT_CAPTURE_NOT_SUCCEEDED:${capturedPaymentIntent.status}`)
  }

  const purchased = await createRequestPurchaseAndMarkProcessed(event.id, session)

  console.info('[stripe-webhook] Request purchase fulfilled:', {
    eventId: event.id,
    sessionId: session.id,
    paymentIntentId,
    status: purchased,
  })

  return purchased
}

/* -------------------------------------------------------------------------- */
/* STANDARD FLOWS                                                             */
/* -------------------------------------------------------------------------- */

async function handleStandardCheckoutCompleted(
  event: Stripe.Event,
  session: Stripe.Checkout.Session,
): Promise<FulfillmentStatus> {
  const meta = session.metadata ?? {}

  if (session.payment_status !== 'paid') {
    console.warn('[stripe-webhook] Checkout session not paid yet, skipping standard fulfillment:', {
      eventId: event.id,
      eventType: event.type,
      sessionId: session.id,
      paymentStatus: session.payment_status,
      metadataType: meta.type,
    })

    return 'ignored'
  }

  return prisma.$transaction(
    async (tx) => {
      const existingEvent = await tx.stripeWebhookEvent.findUnique({
        where: { id: event.id },
        select: { id: true },
      })

      if (existingEvent) {
        return 'already_processed' as const
      }

      let status: FulfillmentStatus = 'ignored'

      if (meta.type === 'SHOWCASE_SUBSCRIPTION') {
        status = (await applyShowcasePayment(tx, session)).status
      }

      await markWebhookEventProcessedTx(tx, event.id)

      return status
    },
    {
      maxWait: 10_000,
      timeout: 10_000,
    },
  )
}

export async function POST(req: Request) {
  const rawBody = await req.text()
  const sig = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('[stripe-webhook] Signature verification failed:', err)

    Sentry.captureException(err, {
      tags: { webhook: 'stripe_signature_failed' },
    })

    return new Response('Webhook signature invalid', { status: 400 })
  }

  Sentry.addBreadcrumb({
    category: 'stripe',
    message: 'Webhook event received',
    data: { type: event.type, id: event.id },
  })

  if (
    event.type !== 'checkout.session.completed' &&
    event.type !== 'checkout.session.async_payment_succeeded'
  ) {
    return new Response('ok', { status: 200 })
  }

  const session = event.data.object as Stripe.Checkout.Session
  const meta = session.metadata ?? {}
  const metadataError = validateCheckoutMetadata(session)

  if (metadataError) {
    Sentry.captureMessage(`Stripe checkout metadata rejected: ${metadataError}`, 'warning')
    return new Response(metadataError, { status: 200 })
  }

  try {
    const result =
      meta.type === 'CREDIT_PACKAGE'
        ? await handleCreditPackageCheckoutCompleted(event, session)
        : meta.type === 'REQUEST_PURCHASE'
          ? await handleRequestPurchaseCheckoutCompleted(event, session)
          : await handleStandardCheckoutCompleted(event, session)

    if (result === 'already_processed') {
      return new Response('Already processed', { status: 200 })
    }

    return new Response('ok', { status: 200 })
  } catch (err: unknown) {
    const cleanupRequestReservation = async () => {
      if (meta.type !== 'REQUEST_PURCHASE') return

      const requestId = meta.requestId?.trim()
      const companyId = meta.companyId?.trim()
      const reservationId = meta.reservationId?.trim()
      if (!requestId || !companyId) return

      await expireRequestSlotReservation(prisma, {
        requestId,
        companyId,
        reservationId: reservationId || undefined,
      })
    }

    if (err instanceof Error) {
      const errorMessage = err.message

      console.error('[stripe-webhook] Checkout fulfillment failed:', {
        eventId: event.id,
        eventType: event.type,
        metadataType: meta.type,
        message: errorMessage,
        metadata: meta,
      })

      if (errorMessage === 'REQUEST_MAXBUYERS_EXCEEDED') {
        await cleanupRequestReservation()
        Sentry.captureMessage('Request purchase: maxBuyers limit reached', 'warning')
        return new Response('maxBuyers limit reached', { status: 200 })
      }

      if (isRequestSlotError(err) || NON_RETRYABLE_FULFILLMENT_ERRORS.has(errorMessage)) {
        await cleanupRequestReservation()
        Sentry.captureMessage(`Stripe checkout fulfillment skipped: ${errorMessage}`, 'warning')
        return new Response(errorMessage, { status: 200 })
      }
    }

    if (isUniqueConstraintError(err)) {
      return new Response('Already processed (race)', { status: 200 })
    }

    Sentry.captureException(err, {
      tags: { webhook: 'stripe_checkout_session_completed' },
      extra: { eventId: event.id, type: meta.type ?? 'unknown' },
    })

    return new Response('Webhook processing failed', { status: 500 })
  }
}