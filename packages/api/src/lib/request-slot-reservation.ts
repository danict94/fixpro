import crypto from 'node:crypto'
import { Prisma } from '@fixpro/db'

type ReservationDb = {
  $queryRaw<T = unknown>(query: Prisma.Sql): Promise<T>
  $executeRaw(query: Prisma.Sql): Promise<number>
}

type LockedRequestRow = {
  id: string
  status: string
  expiresAt: Date | null
  maxBuyers: number | null
}

type ReservationRow = {
  id: string
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED'
  expiresAt: Date | null
}

type CountRow = {
  count: number
}

export const REQUEST_SLOT_RESERVATION_TTL_MS = 10 * 60 * 1000
export const REQUEST_SLOT_RESERVATION_TTL_SECONDS = REQUEST_SLOT_RESERVATION_TTL_MS / 1000

export const REQUEST_SLOT_ERROR_MESSAGES = new Set([
  'REQUEST_NOT_FOUND',
  'REQUEST_NOT_AVAILABLE',
  'REQUEST_EXPIRED',
  'REQUEST_MAXBUYERS_EXCEEDED',
  'REQUEST_SLOT_RESERVATION_MISSING',
  'REQUEST_SLOT_RESERVATION_EXPIRED',
])

export function isRequestSlotError(error: unknown): error is Error {
  return error instanceof Error && REQUEST_SLOT_ERROR_MESSAGES.has(error.message)
}

export async function reserveRequestSlot(
  db: ReservationDb,
  input: {
    requestId: string
    companyId: string
    expiresAt?: Date
  },
): Promise<
  | { status: 'reserved'; reservationId: string; expiresAt: Date }
  | { status: 'already_reserved'; reservationId: string; expiresAt: Date | null }
  | { status: 'already_completed'; reservationId: string; expiresAt: Date | null }
> {
  const now = new Date()
  const nextExpiry = input.expiresAt ?? new Date(now.getTime() + REQUEST_SLOT_RESERVATION_TTL_MS)

  const lockedRequests = await db.$queryRaw<LockedRequestRow[]>(Prisma.sql`
    SELECT "id", "status", "expiresAt", "maxBuyers"
    FROM "service_requests"
    WHERE "id" = ${input.requestId}
    FOR UPDATE
  `)

  const request = lockedRequests[0]
  if (!request) {
    throw new Error('REQUEST_NOT_FOUND')
  }
  if (request.status !== 'APPROVED') {
    throw new Error('REQUEST_NOT_AVAILABLE')
  }
  if (request.expiresAt && request.expiresAt < now) {
    throw new Error('REQUEST_EXPIRED')
  }

  await expireActiveRequestSlotReservations(db, { requestId: input.requestId })

  const existingReservations = await db.$queryRaw<ReservationRow[]>(Prisma.sql`
    SELECT "id", "status", "expiresAt"
    FROM "request_slot_reservations"
    WHERE "companyId" = ${input.companyId}
      AND "requestId" = ${input.requestId}
    LIMIT 1
    FOR UPDATE
  `)

  const existingReservation = existingReservations[0]
  if (existingReservation?.status === 'COMPLETED') {
    return {
      status: 'already_completed',
      reservationId: existingReservation.id,
      expiresAt: existingReservation.expiresAt,
    }
  }

  const purchaseCountRows = await db.$queryRaw<CountRow[]>(Prisma.sql`
    SELECT COUNT(*)::int AS "count"
    FROM "request_purchases"
    WHERE "requestId" = ${input.requestId}
  `)

  const completedPurchases = purchaseCountRows[0]?.count ?? 0

  if (
    request.maxBuyers !== null &&
    completedPurchases >= request.maxBuyers
  ) {
    throw new Error('REQUEST_MAXBUYERS_EXCEEDED')
  }

  if (
    existingReservation?.status === 'ACTIVE' &&
    (!existingReservation.expiresAt || existingReservation.expiresAt > now)
  ) {
    await db.$executeRaw(Prisma.sql`
      UPDATE "request_slot_reservations"
      SET
        "expiresAt" = ${nextExpiry},
        "updatedAt" = NOW()
      WHERE "id" = ${existingReservation.id}
    `)

    return {
      status: 'reserved',
      reservationId: existingReservation.id,
      expiresAt: nextExpiry,
    }
  }

  const reservationId = existingReservation?.id ?? crypto.randomUUID()

  if (existingReservation) {
    await db.$executeRaw(Prisma.sql`
      UPDATE "request_slot_reservations"
      SET
        "status" = 'ACTIVE',
        "expiresAt" = ${nextExpiry},
        "updatedAt" = NOW()
      WHERE "id" = ${reservationId}
    `)
  } else {
    await db.$executeRaw(Prisma.sql`
      INSERT INTO "request_slot_reservations" (
        "id",
        "requestId",
        "companyId",
        "status",
        "expiresAt",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        ${reservationId},
        ${input.requestId},
        ${input.companyId},
        'ACTIVE',
        ${nextExpiry},
        NOW(),
        NOW()
      )
    `)
  }

  return {
    status: 'reserved',
    reservationId,
    expiresAt: nextExpiry,
  }
}

export async function completeRequestSlotReservation(
  db: ReservationDb,
  input: {
    requestId: string
    companyId: string
  },
): Promise<'completed' | 'already_completed'> {
  await expireActiveRequestSlotReservations(db, input)

  const reservationRows = await db.$queryRaw<ReservationRow[]>(Prisma.sql`
    SELECT "id", "status", "expiresAt"
    FROM "request_slot_reservations"
    WHERE "companyId" = ${input.companyId}
      AND "requestId" = ${input.requestId}
    LIMIT 1
    FOR UPDATE
  `)

  const reservation = reservationRows[0]
  if (!reservation) {
    throw new Error('REQUEST_SLOT_RESERVATION_MISSING')
  }

  if (reservation.status === 'COMPLETED') {
    return 'already_completed'
  }

  if (
    reservation.status !== 'ACTIVE' ||
    (reservation.expiresAt && reservation.expiresAt < new Date())
  ) {
    throw new Error('REQUEST_SLOT_RESERVATION_EXPIRED')
  }

  await db.$executeRaw(Prisma.sql`
    UPDATE "request_slot_reservations"
    SET
      "status" = 'COMPLETED',
      "expiresAt" = NULL,
      "updatedAt" = NOW()
    WHERE "id" = ${reservation.id}
  `)

  return 'completed'
}

export async function expireActiveRequestSlotReservations(
  db: ReservationDb,
  input: {
    requestId: string
    companyId?: string
  },
): Promise<void> {
  const companyFilter = input.companyId
    ? Prisma.sql`AND "companyId" = ${input.companyId}`
    : Prisma.empty

  await db.$executeRaw(Prisma.sql`
    UPDATE "request_slot_reservations"
    SET
      "status" = 'EXPIRED',
      "updatedAt" = NOW()
    WHERE "requestId" = ${input.requestId}
      AND "status" = 'ACTIVE'
      AND "expiresAt" IS NOT NULL
      AND "expiresAt" < NOW()
      ${companyFilter}
  `)
}

export async function expireRequestSlotReservation(
  db: ReservationDb,
  input: {
    requestId: string
    companyId: string
    reservationId?: string
  },
): Promise<void> {
  const reservationFilter = input.reservationId
    ? Prisma.sql`AND "id" = ${input.reservationId}`
    : Prisma.empty

  await db.$executeRaw(Prisma.sql`
    UPDATE "request_slot_reservations"
    SET
      "status" = 'EXPIRED',
      "updatedAt" = NOW()
    WHERE "requestId" = ${input.requestId}
      AND "companyId" = ${input.companyId}
      AND "status" = 'ACTIVE'
      ${reservationFilter}
  `)
}
