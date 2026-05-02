import { Prisma, PrismaClient } from '@fixpro/db'

type CreditTx = Prisma.TransactionClient
type CreditReadClient = Pick<PrismaClient, 'creditBatch'>
type CreditBatchAggregateDelegate = Pick<PrismaClient['creditBatch'], 'aggregate'>

type LockedCreditBatch = Awaited<
  ReturnType<CreditTx['creditBatch']['findMany']>
>[number]

function resolveBalanceBefore(
  storedTotal: number | null | undefined,
  totalRemainingCredits: number,
): number {
  if (typeof storedTotal !== 'number') return totalRemainingCredits
  return Math.max(storedTotal, totalRemainingCredits)
}

async function loadAndLockRemainingBatchesTx(
  tx: CreditTx,
  companyId: string,
): Promise<LockedCreditBatch[]> {
  const batches = await tx.creditBatch.findMany({
    where: {
      companyId,
      status: 'ACTIVE',
      remaining: { gt: 0 },
    },
    orderBy: [{ expiresAt: 'asc' }, { createdAt: 'asc' }],
  })

  if (batches.length === 0) return []

  const batchIds = batches.map((batch) => batch.id)

  await tx.$queryRaw`
    SELECT id
    FROM "credit_batches"
    WHERE id = ANY(${batchIds}::text[])
    FOR UPDATE
  `

  return batches
}

export async function lockCompanyCreditBalanceTx(
  tx: CreditTx,
  companyId: string,
): Promise<void> {
  await tx.creditBalance.upsert({
    where: { companyId },
    create: { companyId, total: 0 },
    update: { total: { increment: 0 } },
  })

  await tx.$queryRaw`
    SELECT id
    FROM "credit_balances"
    WHERE "companyId" = ${companyId}
    FOR UPDATE
  `
}

async function syncCompanyCreditBalanceFromLockedBatchesTx(
  tx: CreditTx,
  companyId: string,
  batches: LockedCreditBatch[],
  now: Date,
): Promise<{
  total: number
  activeBatches: LockedCreditBatch[]
}> {
  const balance = await tx.creditBalance.findUnique({
    where: { companyId },
    select: { total: true },
  })

  const activeBatches = batches.filter((batch) => batch.expiresAt >= now)
  const expiredBatches = batches.filter((batch) => batch.expiresAt < now)

  const totalRemainingCredits = batches.reduce((sum, batch) => sum + batch.remaining, 0)
  const activeTotal = activeBatches.reduce((sum, batch) => sum + batch.remaining, 0)

  let runningBalance = resolveBalanceBefore(balance?.total, totalRemainingCredits)

  for (const batch of expiredBatches) {
    const expiredAmount = batch.remaining
    const balanceBefore = runningBalance
    const balanceAfter = Math.max(balanceBefore - expiredAmount, 0)

    await tx.creditBatch.update({
      where: { id: batch.id },
      data: { remaining: 0 },
    })

    await tx.creditMovement.create({
      data: {
        companyId,
        batchId: batch.id,
        type: 'EXPIRY',
        amount: -expiredAmount,
        balanceBefore,
        balanceAfter,
        reference: `credit-expiry:${batch.id}`,
        note: 'Crediti scaduti automaticamente',
      },
    })

    runningBalance = balanceAfter
  }

  await tx.creditBalance.upsert({
    where: { companyId },
    create: { companyId, total: activeTotal },
    update: { total: activeTotal },
  })

  return {
    total: activeTotal,
    activeBatches,
  }
}

export async function syncCompanyCreditBalanceTx(
  tx: CreditTx,
  companyId: string,
): Promise<number> {
  await lockCompanyCreditBalanceTx(tx, companyId)

  const now = new Date()
  const batches = await loadAndLockRemainingBatchesTx(tx, companyId)
  const synced = await syncCompanyCreditBalanceFromLockedBatchesTx(
    tx,
    companyId,
    batches,
    now,
  )

  return synced.total
}

export async function getAvailableCreditBalance(
  db: PrismaClient,
  companyId: string,
): Promise<number> {
  return db.$transaction((tx) => syncCompanyCreditBalanceTx(tx, companyId))
}

async function getActiveCreditBalanceTotal(
  creditBatch: CreditBatchAggregateDelegate,
  companyId: string,
): Promise<number> {
  const result = await creditBatch.aggregate({
    where: {
      companyId,
      status: 'ACTIVE',
      remaining: { gt: 0 },
      expiresAt: { gte: new Date() },
    },
    _sum: { remaining: true },
  })

  return result._sum.remaining ?? 0
}

export async function getAvailableCreditBalanceReadOnlyTx(
  tx: CreditTx,
  companyId: string,
): Promise<number> {
  return getActiveCreditBalanceTotal(tx.creditBatch, companyId)
}

export async function getAvailableCreditBalanceReadOnly(
  db: CreditReadClient,
  companyId: string,
): Promise<number> {
  return getActiveCreditBalanceTotal(db.creditBatch, companyId)
}

export async function spendCompanyCreditsTx(
  tx: CreditTx,
  {
    companyId,
    amount,
    reference,
    note,
  }: {
    companyId: string
    amount: number
    reference: string
    note?: string
  },
): Promise<{
  balanceBefore: number
  balanceAfter: number
  primaryBatchId: string | null
}> {
  await lockCompanyCreditBalanceTx(tx, companyId)

  const now = new Date()
  const batches = await loadAndLockRemainingBatchesTx(tx, companyId)
  const { total: currentTotal, activeBatches } =
    await syncCompanyCreditBalanceFromLockedBatchesTx(tx, companyId, batches, now)

  if (amount <= 0) {
    return {
      balanceBefore: currentTotal,
      balanceAfter: currentTotal,
      primaryBatchId: null,
    }
  }

  if (currentTotal < amount) {
    throw new Error(`INSUFFICIENT_CREDITS:${currentTotal}:${amount}`)
  }

  let primaryBatchId: string | null = null
  let toConsume = amount

  for (const batch of activeBatches) {
    if (toConsume <= 0) break

    const consume = Math.min(batch.remaining, toConsume)
    const newRemaining = batch.remaining - consume

    if (primaryBatchId === null) {
      primaryBatchId = batch.id
    }

    await tx.creditBatch.update({
      where: { id: batch.id },
      data: { remaining: newRemaining },
    })

    toConsume -= consume
  }

  if (toConsume > 0) {
    throw new Error(`INSUFFICIENT_ACTIVE_CREDITS:${amount}`)
  }

  const balanceAfter = currentTotal - amount

  await tx.creditBalance.update({
    where: { companyId },
    data: { total: balanceAfter },
  })

  await tx.creditMovement.create({
    data: {
      companyId,
      batchId: primaryBatchId,
      type: 'SPEND',
      amount: -amount,
      balanceBefore: currentTotal,
      balanceAfter,
      reference,
      note,
    },
  })

  return {
    balanceBefore: currentTotal,
    balanceAfter,
    primaryBatchId,
  }
}