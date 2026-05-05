import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { Prisma } from '@fixpro/db'
import { maskEmail, maskPhone, maskName } from '@fixpro/shared'
import { isActiveShowcase } from '../lib/showcase-visibility'
import {
  createTRPCRouter,
  protectedProcedure,
  clientProcedure,
  publicProcedure,
  companyProcedure,
} from '../trpc'
import type { Context } from '../trpc'
import { calculateRequestUnlockPricing } from '../lib/showcase-pricing'
import { getAvailableCreditBalanceReadOnly } from '../lib/credit-balance'
import { expireShowcaseSubscriptions } from '../lib/showcase-subscription'
import { purchaseRequestWithCredits } from '../lib/request-purchase'
import { buildAndCreateRequest, createInput, createInputBase } from '../lib/request-create'
import {
  normalizePhoneToE164,
  sendGuestOtpSms,
  type GuestOtpPayload,
} from '../lib/request-guest-otp'
import { createRequestFromGuest } from '../lib/request-guest-create'
import {
  evaluateRequestCompanyMatch,
  loadInterventoCategoryMap,
  normalizeText,
} from '../lib/matching-engine'
import { searchTaxonomyEntities } from './taxonomy'
import {
  checkRateLimit,
  CREATE_REQUEST_LIMIT,
  PURCHASE_LIMIT,
  RESEND_EMAIL_LIMIT,
} from '../lib/rate-limit'
import { requireVerifiedUser } from '../lib/verified-user'
import { captureMessage, addBreadcrumb, setUser } from '../lib/sentry'

function getVerificationEmailSenderFromContext(ctx: Context) {
  if (!ctx.sendVerificationEmail) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Email verification non disponibile in questo contesto',
    })
  }

  return ctx.sendVerificationEmail as (email: string, callbackURL?: string) => Promise<void>
}

function getMagicLinkSenderFromContext(ctx: Context) {
  if (!ctx.sendMagicLink) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Magic link non disponibile in questo contesto',
    })
  }

  return ctx.sendMagicLink as (email: string, callbackURL?: string) => Promise<void>
}

type AvailableRow = {
  id: string
  title: string
  interventoNome: string | null
  description: string
  workType: 'SMALL' | 'FULL' | 'UNKNOWN'
  city: string | null
  province: string | null
  lat: number | null
  lng: number | null
  urgency: string | null
  creditCost: number | null
  oneTimePriceCents: number | null
  hasImages: boolean
  contactName: string | null
  contactSurname: string | null
  contactPhone: string | null
  contactEmail: string | null
  interventoId: string | null
  categoriaId: string
  servizioId: string | null
  settoreId: string
  categoriaNome: string
  settoreNome: string
  createdAt: Date
  approvedAt: Date | null
  expiresAt: Date | null
  maxBuyers: number | null
  targetCompanyId: string | null
  distance_km: number
  buyer_count: number
  already_purchased: number
}

const listAvailableInput = z
  .object({
    q: z.string().trim().min(2).max(100).optional(),
    city: z.string().trim().max(120).optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
    sectorId: z.string().optional(),
    interventoId: z.string().optional(),
    categoriaId: z.string().optional(),
    servizioId: z.string().optional(),
    mode: z.enum(['matching', 'explore']).optional(),
  })
  .optional()

function cityMatches(rowCity: string | null, selectedCity: string | undefined) {
  if (!selectedCity) return true

  const left = normalizeText(rowCity)
  const right = normalizeText(selectedCity)

  if (!left || !right) return false

  return left === right || left.includes(right) || right.includes(left)
}

function createdAtTime(value: Date) {
  return value instanceof Date ? value.getTime() : new Date(value).getTime()
}

function textMatchesQuery(row: AvailableRow, q: string | undefined) {
  if (!q) return true

  const needle = normalizeText(q)
  if (!needle) return true

  const haystack = normalizeText(
    [
      row.title,
      row.description,
      row.city,
      row.province,
      row.interventoNome,
      row.categoriaNome,
      row.settoreNome,
    ]
      .filter(Boolean)
      .join(' '),
  )

  return haystack.includes(needle)
}

function buildMatchingTaxonomyWhere(args: {
  companyCategoriaIds: string[]
  companyServizioIds: string[]
  settoreIds: string[]
}): Prisma.ServiceRequestWhereInput {
  const or: Prisma.ServiceRequestWhereInput[] = []

  if (args.companyCategoriaIds.length > 0) {
    or.push({ categoriaId: { in: args.companyCategoriaIds } })
  }

  if (args.companyServizioIds.length > 0) {
    or.push({ servizioId: { in: args.companyServizioIds } })
  }

  if (args.settoreIds.length > 0) {
    or.push({ categoria: { settoreId: { in: args.settoreIds } } })
  }

  return or.length > 0 ? { OR: or } : { id: '__NO_MATCHING_TAXONOMY__' }
}

function buildMatchingTaxonomySql(args: {
  companyCategoriaIds: string[]
  companyServizioIds: string[]
  settoreIds: string[]
}) {
  const clauses: Prisma.Sql[] = []

  if (args.companyCategoriaIds.length > 0) {
    clauses.push(Prisma.sql`r."categoriaId" IN (${Prisma.join(args.companyCategoriaIds)})`)
  }

  if (args.companyServizioIds.length > 0) {
    clauses.push(Prisma.sql`r."servizioId" IN (${Prisma.join(args.companyServizioIds)})`)
  }

  if (args.settoreIds.length > 0) {
    clauses.push(Prisma.sql`cat."settoreId" IN (${Prisma.join(args.settoreIds)})`)
  }

  if (clauses.length === 0) {
    return Prisma.sql`AND FALSE`
  }

  return Prisma.sql`AND (${Prisma.join(clauses, ' OR ')})`
}

export const requestsRouter = createTRPCRouter({
  create: clientProcedure.input(createInput).mutation(async ({ ctx, input }) => {
    requireVerifiedUser(ctx.session)
    setUser(ctx.session.user.id)

    const allowed = await checkRateLimit(`client:${ctx.session.user.id}`, CREATE_REQUEST_LIMIT)
    if (!allowed) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: "Troppe richieste. Riprova fra un'ora.",
      })
    }

    addBreadcrumb('request', 'Creating service request', {
      categoria: input.categoriaId,
      servizio: input.servizioId,
      province: input.province,
    })

    const result = await ctx.db.$transaction((tx: Prisma.TransactionClient) =>
      buildAndCreateRequest(tx, ctx.session.user.id, input),
    )

    captureMessage('Service request created', 'info', {
      requestId: result.id,
      clientId: ctx.session.user.id,
      categoria: input.categoriaId,
    })

    return result
  }),

  checkCoverage: publicProcedure
    .input(
      z.object({
        city: z.string(),
        province: z.string().max(2).optional(),
        lat: z.number().optional(),
        lng: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      let count = 0
      let message: 'great' | 'some' | 'none' | 'unknown' = 'unknown'

      if (input.lat !== undefined && input.lng !== undefined) {
        const rows = await ctx.db.$queryRaw<{ cnt: bigint }[]>(
          Prisma.sql`
            SELECT COUNT(*)::bigint AS cnt
            FROM companies c
            WHERE c.status = 'APPROVED'
              AND c.lat IS NOT NULL
              AND c.lng IS NOT NULL
              AND (
                6371 * acos(LEAST(1.0, GREATEST(-1.0,
                  cos(radians(c.lat)) * cos(radians(${input.lat}::float)) *
                  cos(radians(${input.lng}::float) - radians(c.lng)) +
                  sin(radians(c.lat)) * sin(radians(${input.lat}::float))
                )))
              ) <= c."radiusKm"
          `,
        )

        count = Number(rows[0]?.cnt ?? 0)
        message = count >= 5 ? 'great' : count >= 1 ? 'some' : 'none'
      }

      return { count, message, isPrecise: message !== 'unknown' }
    }),

  sendGuestOtp: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().min(1),
        surname: z.string().min(1),
        phone: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const email = input.email.toLowerCase().trim()
      const normalizedPhone = normalizePhoneToE164(input.phone?.trim() ?? '')

      if (!normalizedPhone) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Inserisci un numero di telefono valido per ricevere il codice via SMS.',
        })
      }

      const identifier = `guest-otp:${normalizedPhone}`

      const existingUser = await ctx.db.user.findUnique({
        where: { email },
        select: { role: true, phoneNumber: true, phoneNumberVerified: true },
      })

      if (existingUser?.role === 'COMPANY') {
        throw new TRPCError({
          code: 'CONFLICT',
          message: "Questa email è associata a un account impresa. Usa un'altra email.",
        })
      }

      if (
        existingUser?.role === 'CLIENT' &&
        (!existingUser.phoneNumberVerified || existingUser.phoneNumber !== normalizedPhone)
      ) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'EMAIL_REGISTRATA_CLIENT',
        })
      }

      const existing = await ctx.db.verification.findFirst({
        where: { identifier },
      })

      if (existing && existing.expiresAt > new Date()) {
        const payload = JSON.parse(existing.value) as GuestOtpPayload

        if (payload.sendCount >= 3) {
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: 'Troppi tentativi. Riprova tra qualche minuto.',
          })
        }
      }

      const prevSendCount = existing ? (JSON.parse(existing.value) as GuestOtpPayload).sendCount : 0

      const payload: GuestOtpPayload = {
        sendCount: prevSendCount + 1,
        email,
        phone: normalizedPhone,
      }

      const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

      await ctx.db.verification.deleteMany({ where: { identifier } })
      await ctx.db.verification.create({
        data: { identifier, value: JSON.stringify(payload), expiresAt },
      })

      const sentSms = await sendGuestOtpSms(normalizedPhone)

      return { ok: true, sentSms }
    }),

  createFromGuest: publicProcedure
    .input(
      createInputBase.extend({
        email: z.string().email(),
        name: z.string().min(1),
        surname: z.string().min(1),
        phone: z.string().min(6),
        otp: z.string().length(6),
        privacyAccepted: z.literal(true),
        privacyVersion: z.string().default('2026-01-01'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return createRequestFromGuest({
        db: ctx.db,
        input,
        sendMagicLink: getMagicLinkSenderFromContext(ctx),
      })
    }),

  list: clientProcedure.query(async ({ ctx }) => {
    return ctx.db.serviceRequest.findMany({
      where: { clientId: ctx.session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        categoria: { select: { nome: true, slug: true } },
        servizio: { select: { nome: true } },
        targetCompany: { select: { ragioneSociale: true, slug: true } },
        purchases: {
          select: {
            id: true,
            company: { select: { id: true, ragioneSociale: true, slug: true } },
            review: { select: { id: true } },
          },
        },
      },
    })
  }),

  listAvailable: companyProcedure.input(listAvailableInput).query(async ({ ctx, input }) => {
    const filters = {
      q: input?.q?.trim() || undefined,
      city: input?.city?.trim() || undefined,
      lat: input?.lat,
      lng: input?.lng,
      sectorId: input?.sectorId,
      interventoId: input?.interventoId,
      categoriaId: input?.categoriaId,
      servizioId: input?.servizioId,
      mode: input?.mode === 'explore' ? ('explore' as const) : ('matching' as const),
    }

    const company = await ctx.db.company.findUniqueOrThrow({
      where: { userId: ctx.session.user.id },
      include: {
        categories: { include: { categoria: { select: { settoreId: true } } } },
        services: { select: { servizioId: true } },
      },
    })

    const companyCategoriaIds = company.categories.map((cc) => cc.categoriaId)
    const companyServizioIds = company.services.map((service) => service.servizioId)
    const settoreIds = [...new Set(company.categories.map((cc) => cc.categoria.settoreId))]
    const now = new Date()

    const matchingTaxonomyWhere = buildMatchingTaxonomyWhere({
      companyCategoriaIds,
      companyServizioIds,
      settoreIds,
    })

    const matchingTaxonomySql = buildMatchingTaxonomySql({
      companyCategoriaIds,
      companyServizioIds,
      settoreIds,
    })

    const mapRequestRow = (r: {
      id: string
      title: string
      interventoNome?: string | null
      description: string
      workType?: 'SMALL' | 'FULL' | 'UNKNOWN'
      city: string | null
      province: string | null
      lat: number | null
      lng: number | null
      urgency: string | null
      creditCost: number | null
      oneTimePriceCents: number | null
      hasImages: boolean
      contactName: string | null
      contactSurname: string | null
      contactPhone: string | null
      contactEmail: string | null
      interventoId?: string | null
      categoriaId: string
      servizioId?: string | null
      servizio?: { id: string } | null
      createdAt: Date
      approvedAt?: Date | null
      expiresAt: Date | null
      maxBuyers: number | null
      targetCompanyId: string | null
      categoria: { nome: string; settore: { id: string; nome: string } }
      intervento?: { nome: string } | null
      purchases: { id: string }[]
      _count: { purchases: number }
    }): AvailableRow => ({
      id: r.id,
      title: r.title,
      interventoNome: r.interventoNome ?? r.intervento?.nome ?? null,
      description: r.description,
      workType: r.workType ?? 'UNKNOWN',
      city: r.city,
      province: r.province,
      lat: r.lat,
      lng: r.lng,
      urgency: r.urgency,
      creditCost: r.creditCost,
      oneTimePriceCents: r.oneTimePriceCents,
      hasImages: r.hasImages,
      contactName: r.contactName,
      contactSurname: r.contactSurname,
      contactPhone: r.contactPhone,
      contactEmail: r.contactEmail,
      interventoId: r.interventoId ?? null,
      categoriaId: r.categoriaId,
      servizioId: r.servizioId ?? r.servizio?.id ?? null,
      settoreId: r.categoria.settore.id,
      categoriaNome: r.categoria.nome,
      settoreNome: r.categoria.settore.nome,
      createdAt: r.createdAt,
      approvedAt: 'approvedAt' in r ? (r.approvedAt ?? null) : null,
      expiresAt: r.expiresAt,
      maxBuyers: r.maxBuyers,
      targetCompanyId: r.targetCompanyId,
      distance_km: 0,
      buyer_count: r._count.purchases,
      already_purchased: r.purchases.length,
    })

    const targetedDbRows = await ctx.db.serviceRequest.findMany({
      where: {
        targetCompanyId: company.id,
        status: 'APPROVED',
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      include: {
        categoria: {
          select: {
            nome: true,
            settore: { select: { id: true, nome: true } },
          },
        },
        intervento: { select: { nome: true } },
        purchases: { where: { companyId: company.id }, select: { id: true } },
        servizio: { select: { id: true } },
        _count: { select: { purchases: true } },
      },
    })

    const targetedRows = targetedDbRows.map((r) => mapRequestRow(r))
    const targetedIds = new Set(targetedRows.map((r) => r.id))

    let rows: AvailableRow[] = []

    if (filters.mode === 'matching') {
      if (companyCategoriaIds.length > 0 && company.lat !== null && company.lng !== null) {
        rows = await ctx.db.$queryRaw<AvailableRow[]>(
          Prisma.sql`
              SELECT DISTINCT
                r.id,
                r.title,
                i.nome AS "interventoNome",
                r.description,
                r."workType",
                r.city,
                r.province,
                r.lat,
                r.lng,
                r.urgency,
                r."creditCost",
                r."oneTimePriceCents",
                r."hasImages",
                r."contactName",
                r."contactSurname",
                r."contactPhone",
                r."contactEmail",
                r."interventoId",
                r."categoriaId",
                r."servizioId",
                cat."settoreId" AS "settoreId",
                cat.nome AS "categoriaNome",
                s.nome AS "settoreNome",
                r."createdAt",
                r."approvedAt",
                r."expiresAt",
                r."maxBuyers",
                r."targetCompanyId",
                ROUND((6371 * acos(LEAST(1.0, GREATEST(-1.0,
                  cos(radians(${company.lat}::float)) * cos(radians(r.lat)) *
                  cos(radians(r.lng) - radians(${company.lng}::float)) +
                  sin(radians(${company.lat}::float)) * sin(radians(r.lat))
                ))))::numeric, 1) AS distance_km,
                (SELECT COUNT(*)::int FROM request_purchases rp WHERE rp."requestId" = r.id) AS buyer_count,
                (SELECT COUNT(*)::int FROM request_purchases rp WHERE rp."requestId" = r.id AND rp."companyId" = ${company.id}) AS already_purchased
              FROM service_requests r
              INNER JOIN categorie cat ON cat.id = r."categoriaId"
              INNER JOIN settori s ON s.id = cat."settoreId"
              LEFT JOIN interventi i ON i.id = r."interventoId"
              WHERE r.status = 'APPROVED'
                AND r.lat IS NOT NULL
                AND r.lng IS NOT NULL
                AND (r."expiresAt" IS NULL OR r."expiresAt" > NOW())
                AND (r."targetCompanyId" IS NULL OR r."targetCompanyId" = ${company.id})
                ${matchingTaxonomySql}
                AND (
                  (
                    SELECT COUNT(*)::int
                    FROM request_purchases rp
                    WHERE rp."requestId" = r.id
                      AND rp."companyId" = ${company.id}
                  ) > 0
                  OR r."maxBuyers" IS NULL
                  OR (
                    SELECT COUNT(*)::int
                    FROM request_purchases rp
                    WHERE rp."requestId" = r.id
                  ) < r."maxBuyers"
                )
                AND (
                  6371 * acos(LEAST(1.0, GREATEST(-1.0,
                    cos(radians(${company.lat}::float)) * cos(radians(r.lat)) *
                    cos(radians(r.lng) - radians(${company.lng}::float)) +
                    sin(radians(${company.lat}::float)) * sin(radians(r.lat))
                  )))
                ) <= ${company.radiusKm}::float
              ORDER BY r."createdAt" DESC
              LIMIT 200
            `,
        )

        if (company.province) {
          const noCoordRows = await ctx.db.serviceRequest.findMany({
            where: {
              status: 'APPROVED',
              province: company.province,
              lat: null,
              OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
              AND: [
                { OR: [{ targetCompanyId: null }, { targetCompanyId: company.id }] },
                matchingTaxonomyWhere,
              ],
            },
            include: {
              categoria: {
                select: {
                  nome: true,
                  settore: { select: { id: true, nome: true } },
                },
              },
              intervento: { select: { nome: true } },
              purchases: { where: { companyId: company.id }, select: { id: true } },
              servizio: { select: { id: true } },
              _count: { select: { purchases: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 80,
          })

          const noCoordMapped = noCoordRows.map((r) => mapRequestRow(r))
          const existingIds = new Set(rows.map((r) => r.id))

          rows = [...rows, ...noCoordMapped.filter((r) => !existingIds.has(r.id))]
        }
      } else if (companyCategoriaIds.length > 0 && company.province) {
        const prismaRows = await ctx.db.serviceRequest.findMany({
          where: {
            status: 'APPROVED',
            province: company.province,
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
            AND: [
              { OR: [{ targetCompanyId: null }, { targetCompanyId: company.id }] },
              matchingTaxonomyWhere,
            ],
          },
          include: {
            categoria: {
              select: {
                nome: true,
                settore: { select: { id: true, nome: true } },
              },
            },
            intervento: { select: { nome: true } },
            purchases: { where: { companyId: company.id }, select: { id: true } },
            servizio: { select: { id: true } },
            _count: { select: { purchases: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 200,
        })

        rows = prismaRows.map((r) => mapRequestRow(r))
      }
    } else {
      const exploreRows = await ctx.db.serviceRequest.findMany({
        where: {
          status: 'APPROVED',
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          AND: [
            { OR: [{ targetCompanyId: null }, { targetCompanyId: company.id }] },
            ...(filters.city
              ? [{ city: { equals: filters.city, mode: Prisma.QueryMode.insensitive } }]
              : []),
            ...(filters.sectorId ? [{ categoria: { settoreId: filters.sectorId } }] : []),
            ...(filters.categoriaId ? [{ categoriaId: filters.categoriaId }] : []),
            ...(filters.servizioId ? [{ servizioId: filters.servizioId }] : []),
          ],
        },
        include: {
          categoria: {
            select: {
              nome: true,
              settore: { select: { id: true, nome: true } },
            },
          },
          intervento: { select: { nome: true } },
          purchases: { where: { companyId: company.id }, select: { id: true } },
          servizio: { select: { id: true } },
          _count: { select: { purchases: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 250,
      })

      rows = exploreRows.map((r) => mapRequestRow(r))
    }

    const taxonomyMatches = filters.q ? await searchTaxonomyEntities(ctx.db, filters.q) : null
    const matchedInterventoIds = new Set(taxonomyMatches?.interventi.map((item) => item.id) ?? [])
    const matchedCategoryIds = new Set(taxonomyMatches?.categorie.map((item) => item.id) ?? [])
    const matchedServiceIds = new Set(taxonomyMatches?.servizi.map((item) => item.id) ?? [])
    const hasTaxonomyMatches =
      matchedInterventoIds.size > 0 || matchedCategoryIds.size > 0 || matchedServiceIds.size > 0

    const interventoCategoryMap = await loadInterventoCategoryMap(ctx.db, [
      ...new Set([
        ...rows
          .map((row) => row.interventoId)
          .filter((interventoId): interventoId is string => Boolean(interventoId)),
        ...(filters.interventoId ? [filters.interventoId] : []),
        ...matchedInterventoIds,
      ]),
    ])

    const selectedInterventoCategoryIds = filters.interventoId
      ? interventoCategoryMap.get(filters.interventoId)
      : undefined

    rows = [...targetedRows, ...rows.filter((r) => !targetedIds.has(r.id))]

    const filtered = rows
      .filter((r) => r.already_purchased > 0 || r.maxBuyers === null || r.buyer_count < r.maxBuyers)
      .filter((r) => {
        if (filters.city && !cityMatches(r.city, filters.city)) return false
        if (filters.sectorId && r.settoreId !== filters.sectorId) return false

        if (filters.interventoId) {
          const compatibleByIntervento =
            r.interventoId === filters.interventoId ||
            (selectedInterventoCategoryIds?.has(r.categoriaId) ?? false)

          if (!compatibleByIntervento) return false
        }

        if (filters.categoriaId && r.categoriaId !== filters.categoriaId) return false
        if (filters.servizioId && r.servizioId !== filters.servizioId) return false

        if (filters.q) {
          const qTextMatch = textMatchesQuery(r, filters.q)

          if (!hasTaxonomyMatches) return qTextMatch

          const qInterventoMatch =
            (r.interventoId ? matchedInterventoIds.has(r.interventoId) : false) ||
            Array.from(matchedInterventoIds).some(
              (interventoId) =>
                interventoCategoryMap.get(interventoId)?.has(r.categoriaId) ?? false,
            )

          const qServiceMatch = r.servizioId ? matchedServiceIds.has(r.servizioId) : false
          const qCategoryMatch = matchedCategoryIds.has(r.categoriaId)

          return qTextMatch || qInterventoMatch || qServiceMatch || qCategoryMatch
        }

        return true
      })
      .map((r) => {
        const evaluation = evaluateRequestCompanyMatch({
          company: {
            id: company.id,
            lat: company.lat,
            lng: company.lng,
            province: company.province,
            radiusKm: company.radiusKm,
            workType: company.workType ?? 'BOTH',
            categoriaIds: companyCategoriaIds,
            servizioIds: companyServizioIds,
            settoreIds,
          },
          request: {
            id: r.id,
            interventoId: r.interventoId,
            categoriaId: r.categoriaId,
            servizioId: r.servizioId,
            workType: r.workType,
            settoreId: r.settoreId,
            lat: r.lat,
            lng: r.lng,
            province: r.province,
            targetCompanyId: r.targetCompanyId,
          },
          interventoCategoryIds: r.interventoId
            ? interventoCategoryMap.get(r.interventoId)
            : undefined,
          allowSectorFallback: filters.mode === 'matching',
        })

        const serviceMatch = r.servizioId ? matchedServiceIds.has(r.servizioId) : false
        const categoryMatch = matchedCategoryIds.has(r.categoriaId)
        const sectorMatch = !!filters.sectorId && r.settoreId === filters.sectorId
        const selectedCityMatch = !!filters.city && cityMatches(r.city, filters.city)
        const textMatch = textMatchesQuery(r, filters.q)

        const relevanceScore =
          evaluation.score * 20 +
          (serviceMatch ? 20 : 0) +
          (categoryMatch ? 10 : 0) +
          (sectorMatch ? 20 : 0) +
          (selectedCityMatch ? 15 : 0) +
          (textMatch && filters.q ? 8 : 0)

        return {
          ...r,
          distance_km: Number(r.distance_km ?? 0),
          buyer_count: Number(r.buyer_count),
          already_purchased: Number(r.already_purchased),
          relevanceScore,
          matchesCompanyPreferences: evaluation.matchesCompanyPreferences,
          matchingTier: evaluation.matchingTier,
        }
      })
      .filter((r) => filters.mode === 'explore' || r.matchingTier !== 'none')
      .sort((left, right) => {
        if (left.targetCompanyId === company.id && right.targetCompanyId !== company.id) return -1
        if (right.targetCompanyId === company.id && left.targetCompanyId !== company.id) return 1

        const leftTier =
          left.matchingTier === 'intervento'
            ? 3
            : left.matchingTier === 'categoria'
              ? 2
              : left.matchingTier === 'settore'
                ? 1
                : 0

        const rightTier =
          right.matchingTier === 'intervento'
            ? 3
            : right.matchingTier === 'categoria'
              ? 2
              : right.matchingTier === 'settore'
                ? 1
                : 0

        if (rightTier !== leftTier) return rightTier - leftTier
        if (right.relevanceScore !== left.relevanceScore)
          return right.relevanceScore - left.relevanceScore

        return createdAtTime(right.createdAt) - createdAtTime(left.createdAt)
      })

    return filtered.map((r) => {
      const purchased = r.already_purchased > 0

      return {
        ...r,
        purchased,
        isTargeted: r.targetCompanyId === company.id,
        relevanceLabel: r.matchesCompanyPreferences ? 'Rilevante' : 'Fuori preferenze',
        contactName: purchased ? r.contactName : r.contactName ? maskName(r.contactName) : null,
        contactSurname: purchased
          ? r.contactSurname
          : r.contactSurname
            ? maskName(r.contactSurname)
            : null,
        contactPhone: purchased
          ? r.contactPhone
          : r.contactPhone
            ? maskPhone(r.contactPhone)
            : null,
        contactEmail: purchased
          ? r.contactEmail
          : r.contactEmail
            ? maskEmail(r.contactEmail)
            : null,
      }
    })
  }),

  getAvailable: companyProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const company = await ctx.db.company.findUniqueOrThrow({
        where: { userId: ctx.session.user.id },
        select: {
          id: true,
          showcase: {
            select: {
              status: true,
              expiresAt: true,
              plan: {
                select: {
                  tier: true,
                  name: true,
                  freeContactsPerMonth: true,
                  overQuotaDiscountPercent: true,
                  discountPercent: true,
                },
              },
            },
          },
        },
      })

      await expireShowcaseSubscriptions(ctx.db, { companyId: company.id })

      const creditBalance = await getAvailableCreditBalanceReadOnly(ctx.db, company.id)

      const req = await ctx.db.serviceRequest.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          title: true,
          description: true,
          city: true,
          province: true,
          lat: true,
          lng: true,
          urgency: true,
          intention: true,
          propertyType: true,
          cap: true,
          address: true,
          status: true,
          expiresAt: true,
          maxBuyers: true,
          createdAt: true,
          approvedAt: true,
          hasImages: true,
          creditCost: true,
          oneTimePriceCents: true,
          clientId: true,
          targetCompanyId: true,
          servizioId: true,
          categoriaId: true,
          categoria: { select: { id: true, nome: true, settore: { select: { nome: true } } } },
          servizio: { select: { nome: true } },
          intervento: { select: { nome: true } },
        },
      })

      if (!req || req.status !== 'APPROVED') {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Richiesta non disponibile' })
      }

      if (req.expiresAt !== null && req.expiresAt <= new Date()) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Richiesta non disponibile' })
      }

      if (req.targetCompanyId !== null && req.targetCompanyId !== company.id) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Richiesta non disponibile' })
      }

      const [purchase, buyerCount, openRescue] = await Promise.all([
        ctx.db.requestPurchase.findUnique({
          where: { companyId_requestId: { companyId: company.id, requestId: input.id } },
        }),
        ctx.db.requestPurchase.count({ where: { requestId: input.id } }),
        ctx.db.rescue.findFirst({
          where: {
            companyId: company.id,
            requestId: input.id,
            status: { in: ['OPEN', 'UNDER_REVIEW'] },
          },
          select: { id: true },
        }),
      ])

      const purchased = !!purchase
      const isDirectRequest = req.targetCompanyId === company.id

      if (!purchased && req.maxBuyers !== null && buyerCount >= req.maxBuyers) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Richiesta non più disponibile',
        })
      }

      const unlockedContact = purchased
        ? await ctx.db.serviceRequest.findUnique({
            where: { id: input.id },
            select: {
              contactName: true,
              contactSurname: true,
              contactPhone: true,
              contactEmail: true,
            },
          })
        : null

      let showcasePricing: ReturnType<typeof calculateRequestUnlockPricing>['credits'] | null = null
      let showcaseOneTimePriceCents: number | null = null
      let showcaseTier: string | null = null

      if (isDirectRequest && req.creditCost !== null && !purchased) {
        const sub = company.showcase
        const isSubActive = isActiveShowcase(sub)

        if (isSubActive && sub?.plan) {
          const startOfMonth = new Date()
          startOfMonth.setDate(1)
          startOfMonth.setHours(0, 0, 0, 0)

          const freeUsed = await ctx.db.requestPurchase.count({
            where: {
              companyId: company.id,
              contactSourceType: { not: 'MARKETPLACE_REQUEST' },
              discountReason: 'SHOWCASE_PRO_FREE',
              purchasedAt: { gte: startOfMonth },
            },
          })

          const pricing = calculateRequestUnlockPricing({
            baseCredits: req.creditCost,
            baseAmountCents: req.oneTimePriceCents ?? 0,
            isShowcaseDirect: true,
            showcase: {
              tier: sub.plan.tier,
              freeContactsUsedThisMonth: freeUsed,
              freeContactsQuota: sub.plan.freeContactsPerMonth,
              overQuotaDiscountPercent: sub.plan.overQuotaDiscountPercent,
              discountPercent: sub.plan.discountPercent,
            },
          })

          showcasePricing = pricing.credits
          showcaseOneTimePriceCents =
            req.oneTimePriceCents !== null ? pricing.oneTime.finalAmountCents : null
          showcaseTier = sub.plan.tier
        }
      }

      return {
        ...req,
        purchased,
        purchaseId: purchase?.id ?? null,
        purchasedAt: purchase?.purchasedAt ?? null,
        buyerCount,
        hasOpenRescue: !!openRescue,
        creditBalance,
        isDirectRequest,
        showcasePricing,
        showcaseOneTimePriceCents,
        showcaseTier,
        contactName: unlockedContact?.contactName ?? null,
        contactSurname: unlockedContact?.contactSurname ?? null,
        contactPhone: unlockedContact?.contactPhone ?? null,
        contactEmail: unlockedContact?.contactEmail ?? null,
      }
    }),

  purchaseWithCredits: companyProcedure
    .input(z.object({ requestId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      setUser(ctx.session.user.id)

      const allowed = await checkRateLimit(
        `company:${ctx.session.user.id}:purchase`,
        PURCHASE_LIMIT,
      )

      if (!allowed) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: "Troppi acquisti. Riprova fra un'ora.",
        })
      }

      const company = await ctx.db.company.findUniqueOrThrow({
        where: { userId: ctx.session.user.id },
        select: { id: true },
      })

      addBreadcrumb('purchase', 'Attempting credit purchase', {
        requestId: input.requestId,
        companyId: company.id,
      })

      return purchaseRequestWithCredits({
        db: ctx.db,
        companyId: company.id,
        requestId: input.requestId,
      })
    }),

  listPurchased: companyProcedure.query(async ({ ctx }) => {
    const company = await ctx.db.company.findUniqueOrThrow({
      where: { userId: ctx.session.user.id },
      select: { id: true },
    })

    return ctx.db.requestPurchase.findMany({
      where: { companyId: company.id },
      orderBy: { purchasedAt: 'desc' },
      include: {
        request: {
          include: {
            categoria: { include: { settore: { select: { nome: true } } } },
            servizio: { select: { nome: true } },
          },
        },
      },
    })
  }),

  stats: clientProcedure.query(async ({ ctx }) => {
    const groups = await ctx.db.serviceRequest.groupBy({
      by: ['status'],
      where: { clientId: ctx.session.user.id },
      _count: { _all: true },
    })

    const countOf = (status: string) =>
      groups.find((group) => group.status === status)?._count._all ?? 0

    return {
      total: groups.reduce((sum, group) => sum + group._count._all, 0),
      pending: countOf('PENDING'),
      approved: countOf('APPROVED'),
      fulfilled: countOf('FULFILLED'),
      rejected: countOf('REJECTED'),
      expired: countOf('EXPIRED'),
    }
  }),

  resendVerificationEmail: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id
    const userEmail = ctx.session.user.email
    const sendVerificationEmail = getVerificationEmailSenderFromContext(ctx)

    const allowed = await checkRateLimit(`resend-email:${userId}`, RESEND_EMAIL_LIMIT)

    if (!allowed) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: "Troppi tentativi. Riprova fra un'ora.",
      })
    }

    try {
      await sendVerificationEmail(userEmail, '/verifica')
    } catch (error) {
      console.error('[requests] resendVerificationEmail error:', error)

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: "Impossibile inviare l'email di verifica. Riprova fra poco.",
      })
    }

    return { success: true }
  }),
})
