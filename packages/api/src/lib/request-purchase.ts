import { TRPCError } from '@trpc/server'
import { Prisma, PrismaClient } from '@fixpro/db'

import { spendCompanyCreditsTx } from './credit-balance'
import { calculateRequestUnlockPricing } from './showcase-pricing'
import { expireShowcaseSubscriptions } from './showcase-subscription'

type Tx = Prisma.TransactionClient

type PurchaseRequestWithCreditsInput = {
  db: PrismaClient
  companyId: string
  requestId: string
}

function toCreditError(error: unknown): TRPCError | null {
  if (!(error instanceof Error)) return null

  if (error.message.startsWith('INSUFFICIENT_CREDITS:')) {
    const [, current, required] = error.message.split(':')

    return new TRPCError({
      code: 'BAD_REQUEST',
      message: `Crediti insufficienti: hai ${current}, servono ${required}`,
    })
  }

  if (error.message.startsWith('INSUFFICIENT_ACTIVE_CREDITS:')) {
    return new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Crediti insufficienti: alcuni crediti sono scaduti e non sono più utilizzabili.',
    })
  }

  return null
}

function toPurchaseConcurrencyError(error: unknown): TRPCError | null {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
  ) {
    return new TRPCError({
      code: 'CONFLICT',
      message: 'Richiesta già acquistata o non più disponibile.',
    })
  }

  return null
}

function toTransactionTimeoutError(error: unknown): TRPCError | null {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2028'
  ) {
    return new TRPCError({
      code: 'TIMEOUT',
      message: 'Acquisto non completato entro il tempo massimo. Riprova tra pochi secondi.',
    })
  }

  return null
}

async function loadPurchasedRequestForCompanyView(db: PrismaClient, requestId: string) {
  return db.serviceRequest.findUniqueOrThrow({
    where: { id: requestId },
    include: {
      categoria: { include: { settore: { select: { nome: true } } } },
      servizio: { select: { nome: true } },
    },
  })
}

async function purchaseRequestWithCreditsTx(
  tx: Tx,
  {
    companyId,
    requestId,
  }: {
    companyId: string
    requestId: string
  },
) {
  const lockedRequests = await tx.$queryRaw<
    Array<{
      id: string
      status: string
      expiresAt: Date | null
      maxBuyers: number | null
      creditCost: number | null
      targetCompanyId: string | null
    }>
  >`
    SELECT
      "id",
      "status",
      "expiresAt",
      "maxBuyers",
      "creditCost",
      "targetCompanyId"
    FROM "service_requests"
    WHERE "id" = ${requestId}
    FOR UPDATE
  `

  const request = lockedRequests[0]

  if (!request || request.status !== 'APPROVED') {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Richiesta già acquistata o non più disponibile.',
    })
  }

  if (request.expiresAt && request.expiresAt < new Date()) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Richiesta già acquistata o non più disponibile.',
    })
  }

  const existing = await tx.requestPurchase.findUnique({
    where: {
      companyId_requestId: {
        companyId,
        requestId,
      },
    },
    select: { id: true },
  })

  if (existing) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Richiesta già acquistata.',
    })
  }

  if (request.maxBuyers !== null) {
    const buyerCount = await tx.requestPurchase.count({
      where: { requestId },
    })

    if (buyerCount >= request.maxBuyers) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Richiesta già acquistata o non più disponibile.',
      })
    }
  }

  const baseCreditCost = request.creditCost

  if (baseCreditCost == null) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Costo crediti non impostato su questa richiesta.',
    })
  }

  const sourceType =
    request.targetCompanyId === companyId ? 'SHOWCASE_PROFILE' : 'MARKETPLACE_REQUEST'

  let effectiveCost = baseCreditCost
  let discountPercent = 0
  let discountReason: string | null = null
  let planSnapshot: unknown = null

  if (sourceType === 'SHOWCASE_PROFILE') {
    const sub = await tx.showcaseSubscription.findUnique({
      where: { companyId },
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

      const freeUsed = await tx.requestPurchase.count({
        where: {
          companyId,
          contactSourceType: { not: 'MARKETPLACE_REQUEST' },
          discountReason: 'SHOWCASE_PRO_FREE',
          purchasedAt: { gte: startOfMonth },
        },
      })

      const pricing = calculateRequestUnlockPricing({
        baseCredits: baseCreditCost,
        baseAmountCents: 0,
        isShowcaseDirect: true,
        showcase: {
          tier: sub.plan.tier,
          freeContactsUsedThisMonth: freeUsed,
          freeContactsQuota: sub.plan.freeContactsPerMonth,
          overQuotaDiscountPercent: sub.plan.overQuotaDiscountPercent,
          discountPercent: sub.plan.discountPercent,
        },
      })

      effectiveCost = pricing.credits.finalCredits
      discountPercent = pricing.discountPercent
      discountReason = pricing.discountReason
      planSnapshot = pricing.planSnapshot ?? null
    }
  }

  if (effectiveCost > 0) {
    await spendCompanyCreditsTx(tx, {
      companyId,
      amount: effectiveCost,
      reference: `request:${requestId}`,
    })
  }

  const safeDiscountReason =
    effectiveCost === 0 ? discountReason || 'SHOWCASE_PRO_FREE' : discountReason

  await tx.requestPurchase.create({
    data: {
      companyId,
      requestId,
      paymentMethod: 'CREDITS',
      creditSpent: effectiveCost,
      contactSourceType: sourceType,
      baseCreditCost,
      finalCreditCost: effectiveCost,
      discountPercent,
      discountReason: safeDiscountReason,
      planSnapshot: planSnapshot as never,
      pricingContext: {
        sourceType,
        isDirectRequest: sourceType === 'SHOWCASE_PROFILE',
      },
    },
  })

  return { requestId }
}

export async function purchaseRequestWithCredits({
  db,
  companyId,
  requestId,
}: PurchaseRequestWithCreditsInput) {
  try {
    await expireShowcaseSubscriptions(db, { companyId })

    const result = await db.$transaction(
      (tx: Prisma.TransactionClient) => purchaseRequestWithCreditsTx(tx, { companyId, requestId }),
      {
        maxWait: 3_000,
        timeout: 8_000,
      },
    )

    return loadPurchasedRequestForCompanyView(db, result.requestId)
  } catch (error: unknown) {
    const creditError = toCreditError(error)
    if (creditError) throw creditError

    const concurrencyError = toPurchaseConcurrencyError(error)
    if (concurrencyError) throw concurrencyError

    const transactionTimeoutError = toTransactionTimeoutError(error)
    if (transactionTimeoutError) throw transactionTimeoutError

    throw error
  }
}