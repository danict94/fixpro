import type Stripe from 'stripe'
import { Prisma } from '@fixpro/db'
import {
  completeRequestSlotReservation,
  expireShowcaseSubscriptions,
} from '@fixpro/api'

type PaymentTx = Prisma.TransactionClient

type FulfillmentResult = {
  status: 'processed' | 'already_processed' | 'ignored'
}

type CreditPackageMetadata = {
  companyId: string
  packageId: string
  creditsNum: number
  validityMonths: number
  paymentIntentId: string
}

function getRequiredMetadataValue(
  metadata: Stripe.Metadata | undefined,
  key: string,
): string {
  const value = metadata?.[key]
  if (!value) {
    throw new Error(`MISSING_METADATA:${key}`)
  }
  return value
}

export function getPaymentIntentId(session: Stripe.Checkout.Session): string {
  if (typeof session.payment_intent !== 'string' || session.payment_intent.length === 0) {
    throw new Error('MISSING_PAYMENT_INTENT')
  }

  return session.payment_intent
}

function parseOptionalNumber(value: string | undefined): number | null {
  if (!value) return null

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function parsePositiveIntegerMetadata(
  metadata: Stripe.Metadata | undefined,
  key: string,
): number {
  const parsed = Number(getRequiredMetadataValue(metadata, key))
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`INVALID_METADATA:${key}`)
  }

  return parsed
}

function parseOptionalJson(value: string | undefined): Prisma.InputJsonValue | undefined {
  if (!value) return undefined
  return JSON.parse(value) as Prisma.InputJsonValue
}

function getCreditPackageMetadata(session: Stripe.Checkout.Session): CreditPackageMetadata | null {
  const metadata = session.metadata ?? {}

  if (metadata.type !== 'CREDIT_PACKAGE') {
    return null
  }

  return {
    companyId: getRequiredMetadataValue(metadata, 'companyId'),
    packageId: getRequiredMetadataValue(metadata, 'packageId'),
    creditsNum: parsePositiveIntegerMetadata(metadata, 'credits'),
    validityMonths: parsePositiveIntegerMetadata(metadata, 'validityMonths'),
    paymentIntentId: getPaymentIntentId(session),
  }
}

function getCreditPackageExpiresAt(validityMonths: number): Date {
  const expiresAt = new Date()
  expiresAt.setMonth(expiresAt.getMonth() + validityMonths)
  return expiresAt
}

function isUniqueConstraintError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: unknown }).code === 'P2002'
  )
}

/**
 * Ensures the company has a CreditBalance row and locks it for the current transaction.
 *
 * This lock protects CreditBalance.total from concurrent updates.
 * Only ACTIVE credit batches should ever update the balance.
 */
async function ensureAndLockCreditBalanceTx(
  tx: PaymentTx,
  companyId: string,
): Promise<number> {
  await tx.creditBalance.upsert({
    where: { companyId },
    create: {
      companyId,
      total: 0,
    },
    update: {
      total: {
        increment: 0,
      },
    },
    select: {
      companyId: true,
    },
  })

  const lockedRows = await tx.$queryRaw<Array<{ total: number }>>`
    SELECT "total"
    FROM "credit_balances"
    WHERE "companyId" = ${companyId}
    FOR UPDATE
  `

  const lockedBalance = lockedRows[0]
  if (!lockedBalance) {
    throw new Error('CREDIT_BALANCE_LOCK_FAILED')
  }

  return lockedBalance.total
}

async function lockCreditBatchByPaymentIntentTx(
  tx: PaymentTx,
  paymentIntentId: string,
): Promise<{
  id: string
  companyId: string
  amount: number
  remaining: number
  status: 'PENDING' | 'ACTIVE' | 'VOIDED'
} | null> {
  const lockedRows = await tx.$queryRaw<Array<{
    id: string
    companyId: string
    amount: number
    remaining: number
    status: 'PENDING' | 'ACTIVE' | 'VOIDED'
  }>>`
    SELECT
      "id",
      "companyId",
      "amount",
      "remaining",
      "status"
    FROM "credit_batches"
    WHERE "stripePaymentIntentId" = ${paymentIntentId}
    FOR UPDATE
  `

  return lockedRows[0] ?? null
}

/**
 * Step 1 for manual-capture Stripe credit packages.
 *
 * Creates a PENDING batch with remaining = 0.
 * The customer has authorized the payment, but credits are NOT usable yet.
 *
 * This function is idempotent on CreditBatch.stripePaymentIntentId.
 */
export async function prepareCreditPackagePaymentTx(
  tx: PaymentTx,
  session: Stripe.Checkout.Session,
): Promise<FulfillmentResult> {
  const parsed = getCreditPackageMetadata(session)
  if (!parsed) {
    return { status: 'ignored' }
  }

  const {
    companyId,
    creditsNum,
    validityMonths,
    paymentIntentId,
  } = parsed

  const existing = await tx.creditBatch.findUnique({
    where: { stripePaymentIntentId: paymentIntentId },
    select: {
      id: true,
      status: true,
    },
  })

  if (existing) {
    if (existing.status === 'VOIDED') {
      throw new Error('CREDIT_BATCH_ALREADY_VOIDED')
    }

    return { status: 'already_processed' }
  }

  try {
    await tx.creditBatch.create({
      data: {
        companyId,
        amount: creditsNum,
        remaining: 0,
        expiresAt: getCreditPackageExpiresAt(validityMonths),
        status: 'PENDING',
        stripePaymentIntentId: paymentIntentId,
      },
    })
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      return { status: 'already_processed' }
    }

    throw err
  }

  return { status: 'processed' }
}

/**
 * Step 2 after Stripe capture succeeds.
 *
 * Turns a PENDING batch into ACTIVE, makes credits usable, updates CreditBalance,
 * and writes the PURCHASE movement.
 *
 * This function is idempotent:
 * - ACTIVE means already activated.
 * - VOIDED means this payment was cancelled/failed and cannot be activated.
 */
export async function activateCreditPackagePaymentTx(
  tx: PaymentTx,
  session: Stripe.Checkout.Session,
  options?: {
    capturedAt?: Date
  },
): Promise<FulfillmentResult> {
  const parsed = getCreditPackageMetadata(session)
  if (!parsed) {
    return { status: 'ignored' }
  }

  const {
    companyId,
    packageId,
    creditsNum,
    validityMonths,
    paymentIntentId,
  } = parsed

  let lockedBatch = await lockCreditBatchByPaymentIntentTx(tx, paymentIntentId)

  if (!lockedBatch) {
    await prepareCreditPackagePaymentTx(tx, session)
    lockedBatch = await lockCreditBatchByPaymentIntentTx(tx, paymentIntentId)
  }

  if (!lockedBatch) {
    throw new Error('CREDIT_BATCH_NOT_FOUND_AFTER_PREPARE')
  }

  if (lockedBatch.companyId !== companyId) {
    throw new Error('CREDIT_BATCH_COMPANY_MISMATCH')
  }

  if (lockedBatch.status === 'ACTIVE') {
    return { status: 'already_processed' }
  }

  if (lockedBatch.status === 'VOIDED') {
    throw new Error('CREDIT_BATCH_ALREADY_VOIDED')
  }

  const balanceBefore = await ensureAndLockCreditBalanceTx(tx, companyId)
  const balanceAfter = balanceBefore + creditsNum
  const capturedAt = options?.capturedAt ?? new Date()

  await tx.creditBatch.update({
    where: { id: lockedBatch.id },
    data: {
      status: 'ACTIVE',
      remaining: creditsNum,
      activatedAt: capturedAt,
      stripeCapturedAt: capturedAt,
      stripeCaptureError: null,
    },
  })

  await tx.creditBalance.update({
    where: { companyId },
    data: {
      total: balanceAfter,
    },
  })

  await tx.creditMovement.create({
    data: {
      companyId,
      batchId: lockedBatch.id,
      type: 'PURCHASE',
      amount: creditsNum,
      balanceBefore,
      balanceAfter,
      reference: `stripe:${paymentIntentId}`,
      note: `Pacchetto ${packageId} (${validityMonths} mesi)`,
    },
  })

  return { status: 'processed' }
}

/**
 * Step 2b when Stripe capture fails or the authorization must be cancelled.
 *
 * PENDING batch becomes VOIDED and remains unusable.
 * ACTIVE batches are never voided here, because credits may already have been spent.
 */
export async function voidCreditPackagePaymentTx(
  tx: PaymentTx,
  session: Stripe.Checkout.Session,
  options?: {
    error?: string
    voidedAt?: Date
  },
): Promise<FulfillmentResult> {
  const parsed = getCreditPackageMetadata(session)
  if (!parsed) {
    return { status: 'ignored' }
  }

  const {
    companyId,
    paymentIntentId,
  } = parsed

  const lockedBatch = await lockCreditBatchByPaymentIntentTx(tx, paymentIntentId)

  if (!lockedBatch) {
    try {
      await tx.creditBatch.create({
        data: {
          companyId,
          amount: parsed.creditsNum,
          remaining: 0,
          expiresAt: getCreditPackageExpiresAt(parsed.validityMonths),
          status: 'VOIDED',
          stripePaymentIntentId: paymentIntentId,
          voidedAt: options?.voidedAt ?? new Date(),
          stripeCaptureError: options?.error?.slice(0, 500) ?? null,
        },
      })

      return { status: 'processed' }
    } catch (err) {
      if (isUniqueConstraintError(err)) {
        return { status: 'already_processed' }
      }

      throw err
    }
  }

  if (lockedBatch.companyId !== companyId) {
    throw new Error('CREDIT_BATCH_COMPANY_MISMATCH')
  }

  if (lockedBatch.status === 'ACTIVE') {
    throw new Error('CREDIT_BATCH_ALREADY_ACTIVE')
  }

  if (lockedBatch.status === 'VOIDED') {
    return { status: 'already_processed' }
  }

  await tx.creditBatch.update({
    where: { id: lockedBatch.id },
    data: {
      status: 'VOIDED',
      remaining: 0,
      voidedAt: options?.voidedAt ?? new Date(),
      stripeCaptureError: options?.error?.slice(0, 500) ?? null,
    },
  })

  return { status: 'processed' }
}

/**
 * Backward-compatible name used by existing webhook code.
 *
 * Important:
 * with manual capture, this now PREPARES a pending, non-usable credit batch.
 * The webhook/fallback must then capture Stripe and call activateCreditPackagePaymentTx().
 */
export async function applyCreditPackagePayment(
  tx: PaymentTx,
  session: Stripe.Checkout.Session,
): Promise<FulfillmentResult> {
  return prepareCreditPackagePaymentTx(tx, session)
}

export async function applyShowcasePayment(
  tx: PaymentTx,
  session: Stripe.Checkout.Session,
): Promise<FulfillmentResult> {
  const metadata = session.metadata ?? {}
  if (metadata.type !== 'SHOWCASE_SUBSCRIPTION') {
    return { status: 'ignored' }
  }

  const companyId = getRequiredMetadataValue(metadata, 'companyId')
  const planId = getRequiredMetadataValue(metadata, 'planId')
  const durationMonths = Number(getRequiredMetadataValue(metadata, 'durationMonths'))
  const paymentIntentId = getPaymentIntentId(session)

  const existing = await tx.showcaseSubscription.findUnique({
    where: { stripePaymentIntentId: paymentIntentId },
    select: { id: true },
  })

  if (existing) {
    return { status: 'already_processed' }
  }

  await expireShowcaseSubscriptions(tx, { companyId })

  const existingSubscription = await tx.showcaseSubscription.findUnique({
    where: { companyId },
    select: { expiresAt: true, status: true },
  })

  const now = new Date()
  const extensionAnchor =
    existingSubscription?.status === 'ACTIVE' && existingSubscription.expiresAt > now
      ? new Date(existingSubscription.expiresAt)
      : new Date(now)

  const expiresAt = new Date(extensionAnchor)
  expiresAt.setMonth(expiresAt.getMonth() + durationMonths)

  await tx.showcaseSubscription.upsert({
    where: { companyId },
    create: {
      companyId,
      planId,
      status: 'ACTIVE',
      startsAt: now,
      expiresAt,
      stripePaymentIntentId: paymentIntentId,
    },
    update: {
      planId,
      status: 'ACTIVE',
      startsAt: now,
      expiresAt,
      stripePaymentIntentId: paymentIntentId,
    },
  })

  return { status: 'processed' }
}

export async function applyRequestPurchasePayment(
  tx: PaymentTx,
  session: Stripe.Checkout.Session,
): Promise<FulfillmentResult> {
  const metadata = session.metadata ?? {}
  if (metadata.type !== 'REQUEST_PURCHASE') {
    return { status: 'ignored' }
  }

  const companyId = getRequiredMetadataValue(metadata, 'companyId')
  const requestId = getRequiredMetadataValue(metadata, 'requestId')
  const amountCents = Number(getRequiredMetadataValue(metadata, 'amountCents'))
  const paymentIntentId = getPaymentIntentId(session)

  const existingByIntent = await tx.requestPurchase.findFirst({
    where: { stripePaymentIntentId: paymentIntentId },
    select: { id: true },
  })

  if (existingByIntent) {
    return { status: 'already_processed' }
  }

  const existingByPair = await tx.requestPurchase.findUnique({
    where: { companyId_requestId: { companyId, requestId } },
    select: { id: true },
  })

  if (existingByPair) {
    return { status: 'already_processed' }
  }

  const lockedRequests = await tx.$queryRaw<Array<{
    id: string
    status: string
    expiresAt: Date | null
    targetCompanyId: string | null
    maxBuyers: number | null
  }>>`
    SELECT
      "id",
      "status",
      "expiresAt",
      "targetCompanyId",
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

  if (request.maxBuyers !== null) {
    const buyerCount = await tx.requestPurchase.count({
      where: { requestId },
    })

    if (buyerCount >= request.maxBuyers) {
      throw new Error('REQUEST_MAXBUYERS_EXCEEDED')
    }
  }

  const sourceType =
    request.targetCompanyId === companyId ? 'SHOWCASE_PROFILE' : 'MARKETPLACE_REQUEST'

  await completeRequestSlotReservation(tx, {
    companyId,
    requestId,
  })

  await tx.requestPurchase.create({
    data: {
      companyId,
      requestId,
      paymentMethod: 'ONE_TIME',
      stripePaymentIntentId: paymentIntentId,
      amountCents,
      baseAmountCents: parseOptionalNumber(metadata.baseAmountCents),
      baseCreditCost: null,
      finalCreditCost: null,
      creditSpent: 0,
      contactSourceType: sourceType,
      discountPercent: parseOptionalNumber(metadata.discountPercent),
      discountReason: metadata.discountReason || null,
      planSnapshot: parseOptionalJson(metadata.planSnapshot),
      pricingContext: parseOptionalJson(metadata.pricingContext),
    },
  })

  return { status: 'processed' }
}