import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { Prisma } from '@fixpro/db'
import type { prisma } from '@fixpro/db'
import { Resend } from 'resend'
import { formatRequestDisplayTitle } from '@fixpro/shared'
import { createTRPCRouter, adminProcedure, superAdminProcedure } from '../trpc'
import { syncCompanyCreditBalanceTx } from '../lib/credit-balance'
import {
  haversineKm,
  loadInterventoCategoryMap,
  selectMatchingCompaniesForRequest,
  type MatchingRequestProfile,
} from '../lib/matching-engine'

type MatchingCategoriaRow = {
  categoriaId: string
  isPrimary: boolean
}

async function getAvailableCreditsMap(
  db: {
    creditBatch: {
      groupBy(args: {
        by: ['companyId']
        where: {
          companyId: { in: string[] }
          remaining: { gt: number }
          expiresAt: { gte: Date }
        }
        _sum: { remaining: true }
      }): Promise<Array<{ companyId: string; _sum: { remaining: number | null } }>>
    }
  },
  companyIds: string[],
): Promise<Map<string, number>> {
  if (companyIds.length === 0) return new Map()

  const rows = await db.creditBatch.groupBy({
    by: ['companyId'],
    where: {
      companyId: { in: companyIds },
      remaining: { gt: 0 },
      expiresAt: { gte: new Date() },
    },
    _sum: { remaining: true },
  })

  return new Map(rows.map((row) => [row.companyId, row._sum.remaining ?? 0]))
}

// ── template email nuova richiesta ───────────────────────────────────────────
function buildNewRequestEmail(
  ragioneSociale: string,
  opts: { requestTitle: string; settore: string; categoria: string; city?: string; link: string },
): string {
  const zona = opts.city ? ` a <strong>${opts.city}</strong>` : ''
  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:12px;border:1px solid #e4e4e7;padding:40px 32px;">
        <tr><td style="padding-bottom:24px;text-align:center;">
          <span style="font-size:22px;font-weight:700;color:#e46a2e;">FixPro</span>
        </td></tr>
        <tr><td style="padding-bottom:12px;">
          <h1 style="margin:0;font-size:20px;font-weight:700;color:#09090b;">
            ${opts.requestTitle}
          </h1>
        </td></tr>
        <tr><td style="padding-bottom:20px;">
          <p style="margin:0;font-size:15px;line-height:1.6;color:#3f3f46;">
            Ciao <strong>${ragioneSociale}</strong>,<br/>
            è disponibile una nuova richiesta di lavoro per
            <strong>${opts.settore}</strong> — <strong>${opts.categoria}</strong>${zona}.
          </p>
        </td></tr>
        <tr><td style="padding-bottom:28px;text-align:center;">
          <a href="${opts.link}"
             style="display:inline-block;background:#e46a2e;color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px;">
            Vedi richiesta
          </a>
        </td></tr>
        <tr><td style="border-top:1px solid #f4f4f5;padding-top:16px;">
          <p style="margin:0;font-size:12px;color:#a1a1aa;text-align:center;">
            Hai ricevuto questa email perché hai attivato le notifiche email su FixPro.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ── helpers date ────────────────────────────────────────────────────────────
function startOfDay(d: Date) {
  const x = new Date(d); x.setHours(0, 0, 0, 0); return x
}
function startOfWeek(d: Date) {
  const x = new Date(d)
  const diff = x.getDay() === 0 ? -6 : 1 - x.getDay()
  x.setDate(x.getDate() + diff); x.setHours(0, 0, 0, 0); return x
}

// ── tipo risultato Haversine ─────────────────────────────────────────────────
// ── tipo risultato Haversine ─────────────────────────────────────────────────
async function getMatchingCompaniesForRequest(
  db: Pick<typeof prisma, 'company' | 'matchingInterventoCat'>,
  request: MatchingRequestProfile,
) {
  const matchingCategorie = request.interventoId
    ? ((await db.matchingInterventoCat.findMany({
        where: {
          interventoId: request.interventoId,
        },
        select: {
          categoriaId: true,
          isPrimary: true,
        },
      })) as MatchingCategoriaRow[])
    : []

  const compatibleCategoriaIds = new Set(
    matchingCategorie.map((matching) => matching.categoriaId),
  )

  const primaryCategoriaIds = new Set(
    matchingCategorie
      .filter((matching) => matching.isPrimary)
      .map((matching) => matching.categoriaId),
  )

  if (request.interventoId && compatibleCategoriaIds.size === 0) {
    return []
  }

  const companies = await db.company.findMany({
    where: request.targetCompanyId
      ? { id: request.targetCompanyId }
      : {
          status: 'APPROVED',
          ...(request.interventoId
            ? {
                categories: {
                  some: {
                    categoriaId: { in: [...compatibleCategoriaIds] },
                  },
                },
              }
            : {}),
          ...(request.lat !== null && request.lng !== null
            ? { lat: { not: null }, lng: { not: null } }
            : request.province
              ? { province: request.province }
              : { id: '__no_matches__' }),
        },
    select: {
      id: true,
      userId: true,
      notificationEmail: true,
      notificationWhatsapp: true,
      ragioneSociale: true,
      city: true,
      province: true,
      lat: true,
      lng: true,
      radiusKm: true,
      workType: true,
      user: { select: { email: true, phoneNumber: true, phoneNumberVerified: true } },
      categories: {
        select: {
          categoriaId: true,
          categoria: { select: { settoreId: true } },
        },
      },
      services: {
        select: {
          servizioId: true,
        },
      },
    },
  })

  const interventoCategoryMap = request.interventoId
    ? new Map([[request.interventoId, compatibleCategoriaIds]])
    : await loadInterventoCategoryMap(db, [])

  const ranked = selectMatchingCompaniesForRequest({
    companies: companies.map((company) => ({
      id: company.id,
      userId: company.userId,
      notificationEmail: company.notificationEmail,
      notificationWhatsapp: company.notificationWhatsapp,
      user: company.user,
      ragioneSociale: company.ragioneSociale,
      city: company.city,
      province: company.province,
      lat: company.lat,
      lng: company.lng,
      radiusKm: company.radiusKm,
      workType: company.workType ?? 'BOTH',
      categoriaIds: company.categories.map((category) => category.categoriaId),
      servizioIds: company.services.map((service) => service.servizioId),
      settoreIds: [...new Set(company.categories.map((category) => category.categoria.settoreId))],
      distance_km:
        request.lat !== null &&
        request.lng !== null &&
        company.lat !== null &&
        company.lng !== null
          ? Number(haversineKm(request.lat, request.lng, company.lat, company.lng).toFixed(1))
          : null,
    })),
    request,
    interventoCategoryMap,
  })

  const strictInterventoMatches = request.interventoId
    ? ranked.filter(({ company }) =>
        company.categoriaIds.some((categoriaId) =>
          compatibleCategoriaIds.has(categoriaId),
        ),
      )
    : ranked

  if (request.interventoId && strictInterventoMatches.length === 0) {
    return []
  }

  const prioritizedMatches = request.interventoId
    ? [...strictInterventoMatches].sort((left, right) => {
        const leftPrimaryMatch = left.company.categoriaIds.some((categoriaId) =>
          primaryCategoriaIds.has(categoriaId),
        )
        const rightPrimaryMatch = right.company.categoriaIds.some((categoriaId) =>
          primaryCategoriaIds.has(categoriaId),
        )

        if (leftPrimaryMatch !== rightPrimaryMatch) {
          return leftPrimaryMatch ? -1 : 1
        }

        return 0
      })
    : strictInterventoMatches

  return prioritizedMatches.map(({ company }) => ({
    ...company,
    distance_km: company.distance_km ?? (null as unknown as number),
  }))
}

// ── sub-router: requests ─────────────────────────────────────────────────────
const requestsRouter = createTRPCRouter({

  list: adminProcedure
    .input(z.object({
      status:   z.enum(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'FULFILLED', 'EXPIRED']).optional(),
      search:   z.string().max(100).optional(),
      province: z.string().max(3).optional(),
      urgency:  z.enum(['WITHIN_1_MONTH', 'WITHIN_3_MONTHS', 'WITHIN_6_MONTHS', 'NO_PREFERENCE']).optional(),
      cursor:   z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: Prisma.ServiceRequestWhereInput = {}
      if (input.status)   where.status = input.status
      if (input.province) where.province = { equals: input.province.toUpperCase(), mode: 'insensitive' }
      if (input.urgency)  where.urgency = input.urgency
      if (input.search) {
        where.OR = [
          { title:  { contains: input.search, mode: 'insensitive' } },
          { client: { name:  { contains: input.search, mode: 'insensitive' } } },
          { client: { email: { contains: input.search, mode: 'insensitive' } } },
        ]
      }

      return ctx.db.serviceRequest.findMany({
        where,
        include: {
          client: {
            select: {
              id: true, name: true, email: true,
              emailVerified: true, phoneNumberVerified: true, phoneNumber: true,
            },
          },
          categoria:     { select: { nome: true, settore: { select: { nome: true } } } },
          servizio:      { select: { nome: true } },
          targetCompany: { select: { ragioneSociale: true } },
          _count:        { select: { purchases: true, rescues: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      })
    }),

  get: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const req = await ctx.db.serviceRequest.findUnique({
        where: { id: input.id },
        include: {
          client:    { select: { id: true, name: true, email: true, phoneNumber: true } },
          categoria: {
            select: {
              nome:      true,
              settoreId: true,
              settore:   { select: { nome: true } },
            },
          },
          servizio:      { select: { nome: true } },
          targetCompany: { select: { ragioneSociale: true, slug: true } },
          purchases: {
            include: {
              company: { select: { id: true, ragioneSociale: true, city: true } },
            },
            orderBy: { purchasedAt: 'desc' },
          },
          rescues: {
            select: { id: true, status: true, reason: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
          },
        },
      })
      if (!req) throw new TRPCError({ code: 'NOT_FOUND', message: 'Richiesta non trovata' })
      return req
    }),

  /**
   * Imprese che riceverebbero questa richiesta all'approvazione.
   * Precedenza: matching per intervento -> categorie compatibili.
   * Fallback legacy: matching per settore se la richiesta non ha interventoId.
   * Fallback geografico: stessa provincia se mancano le coordinate.
   */
  matchingCompanies: adminProcedure
    .input(z.object({ requestId: z.string() }))
    .query(async ({ ctx, input }) => {
      const req = await ctx.db.serviceRequest.findUnique({
        where: { id: input.requestId },
        select: {
          id:           true,
          lat:          true,
          lng:          true,
          province:     true,
          city:         true,
          interventoId: true,
          workType:     true,
          targetCompanyId: true,
          categoriaId: true,
          servizioId: true,
          categoria: { select: { settoreId: true } },
        },
      })
      if (!req) return { companies: [], total: 0, byCoords: false }

      const rankedCompanies = await getMatchingCompaniesForRequest(ctx.db, {
        id: req.id,
        interventoId: req.interventoId,
        categoriaId: req.categoriaId,
        servizioId: req.servizioId ?? null,
        workType: req.workType ?? 'UNKNOWN',
        settoreId: req.categoria.settoreId,
        lat: req.lat,
        lng: req.lng,
        province: req.province,
        targetCompanyId: req.targetCompanyId ?? null,
      })

      return {
        companies: rankedCompanies.map((company) => ({
          id: company.id,
          ragioneSociale: company.ragioneSociale,
          city: company.city,
          province: company.province,
          distance_km: company.distance_km,
        })),
        total: rankedCompanies.length,
        byCoords: req.lat !== null && req.lng !== null,
      }

      /*
      const settoreId = req.categoria.settoreId

      // ── Matching geografico via Haversine (SQL) ──────────────────────────
      if (req.lat !== null && req.lng !== null) {
        const companies = req.interventoId
          ? await ctx.db.$queryRaw<MatchingCompanyRow[]>(
              Prisma.sql`
                SELECT sub.id, sub."ragioneSociale", sub.city, sub.province,
                       ROUND(sub.distance_km::numeric, 1) AS distance_km
                FROM (
                  SELECT DISTINCT
                    c.id,
                    c."ragioneSociale",
                    c.city,
                    c.province,
                    c."radiusKm",
                    (6371 * acos(
                      LEAST(1.0, GREATEST(-1.0,
                        cos(radians(${req.lat}::float)) * cos(radians(c.lat)) *
                        cos(radians(c.lng) - radians(${req.lng}::float)) +
                        sin(radians(${req.lat}::float)) * sin(radians(c.lat))
                      ))
                    )) AS distance_km
                  FROM companies c
                  INNER JOIN company_categories cc       ON cc."companyId" = c.id
                  INNER JOIN matching_intervento_cat mic ON mic."categoriaId" = cc."categoriaId"
                  WHERE mic."interventoId" = ${req.interventoId}
                    AND mic.attivo        = true
                    AND c.status          = 'APPROVED'
                    AND c.lat             IS NOT NULL
                    AND c.lng             IS NOT NULL
                ) sub
                WHERE sub.distance_km <= sub."radiusKm"
                ORDER BY sub.distance_km ASC
              `
            )
          : await ctx.db.$queryRaw<MatchingCompanyRow[]>(
              Prisma.sql`
                SELECT sub.id, sub."ragioneSociale", sub.city, sub.province,
                       ROUND(sub.distance_km::numeric, 1) AS distance_km
                FROM (
                  SELECT DISTINCT
                    c.id,
                    c."ragioneSociale",
                    c.city,
                    c.province,
                    c."radiusKm",
                    (6371 * acos(
                      LEAST(1.0, GREATEST(-1.0,
                        cos(radians(${req.lat}::float)) * cos(radians(c.lat)) *
                        cos(radians(c.lng) - radians(${req.lng}::float)) +
                        sin(radians(${req.lat}::float)) * sin(radians(c.lat))
                      ))
                    )) AS distance_km
                  FROM companies c
                  INNER JOIN company_categories cc ON cc."companyId" = c.id
                  INNER JOIN categorie cat         ON cat.id = cc."categoriaId"
                  WHERE cat."settoreId" = ${settoreId}
                    AND c.status        = 'APPROVED'
                    AND c.lat           IS NOT NULL
                    AND c.lng           IS NOT NULL
                ) sub
                WHERE sub.distance_km <= sub."radiusKm"
                ORDER BY sub.distance_km ASC
              `
            )
        return { companies, total: companies.length, byCoords: true }
      }

      // ── Fallback: stessa provincia ───────────────────────────────────────
      if (req.province) {
        const companies = await ctx.db.company.findMany({
          where: {
            status:   'APPROVED',
            province: req.province,
            categories: req.interventoId
              ? {
                  some: {
                    categoria: {
                      matchingInterventi: {
                        some: {
                          interventoId: req.interventoId,
                          attivo:       true,
                        },
                      },
                    },
                  },
                }
              : {
                  some: { categoria: { settoreId } },
                },
          },
          select: { id: true, ragioneSociale: true, city: true, province: true },
          take: 100,
        })
        return {
          companies: companies.map((c) => ({ ...c, distance_km: null as unknown as number })),
          total: companies.length,
          byCoords: false,
        }
      }

      return { companies: [], total: 0, byCoords: false }
      */
    }),

  approve: adminProcedure
    .input(z.object({
      id:                z.string(),
      creditCost:        z.number().int().min(1).max(100),
      oneTimePriceCents: z.number().int().min(100).optional(),
      maxBuyers:         z.number().int().min(1).max(10).default(3),
      expiresAt:         z.coerce.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user) throw new TRPCError({ code: 'UNAUTHORIZED' })
      // Verifica se è richiesta diretta per forzare maxBuyers=1 server-side
      const existing = await ctx.db.serviceRequest.findUnique({
        where:  { id: input.id },
        select: { targetCompanyId: true },
      })
      const effectiveMaxBuyers = existing?.targetCompanyId ? 1 : input.maxBuyers

      const updated = await ctx.db.serviceRequest.update({
        where: { id: input.id },
        data: {
          status:            'APPROVED',
          creditCost:        input.creditCost,
          oneTimePriceCents: input.oneTimePriceCents ?? null,
          maxBuyers:         effectiveMaxBuyers,
          expiresAt:         input.expiresAt,
          approvedAt:     new Date(),
          approvedBy:     ctx.session.user.id,
          rejectedAt:     null,
          rejectedReason: null,
        },
        include: {
          categoria: { select: { settoreId: true, nome: true, settore: { select: { nome: true } } } },
          intervento: { select: { nome: true } },
        },
      })
      const requestDisplayTitle = formatRequestDisplayTitle({
        title: updated.title,
        interventoNome: updated.intervento?.nome,
        city: updated.city,
        province: updated.province,
      })

      // ── Notifica imprese matching (IN_APP; email via BullMQ futuro) ──────
      try {
        // Richiesta diretta da vetrina: notifica solo l'impresa target
        if (updated.targetCompanyId) {
          const targetCompany = await ctx.db.company.findUnique({
            where:  { id: updated.targetCompanyId },
            select: {
              userId:               true,
              notificationEmail:    true,
              notificationWhatsapp: true,
              ragioneSociale:       true,
              user:                 { select: { email: true, phoneNumber: true, phoneNumberVerified: true } },
            },
          })
          if (targetCompany) {
            await ctx.db.notification.create({
              data: {
                userId:  targetCompany.userId,
                type:    'NEW_REQUEST_IN_ZONE' as const,
                channel: 'IN_APP' as const,
                title:   `Richiesta diretta: ${requestDisplayTitle}`,
                body:    'Hai ricevuto una richiesta diretta dal tuo profilo vetrina.',
                data:    { requestId: updated.id, requestTitle: requestDisplayTitle },
                sentAt:  new Date(),
              },
            })
            if (targetCompany.notificationEmail) {
              const resend    = new Resend(process.env.RESEND_API_KEY!)
              const appUrl    = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'
              const notifLink = `${appUrl}/area-impresa/notifiche`
              resend.emails.send({
                from:    process.env.EMAIL_FROM ?? 'FixPro <noreply@fixpro.it>',
                to:      targetCompany.user.email,
                subject: `Richiesta diretta: ${requestDisplayTitle}`,
                html:    buildNewRequestEmail(targetCompany.ragioneSociale, {
                  requestTitle: requestDisplayTitle,
                  settore:   updated.categoria.settore.nome,
                  categoria: updated.categoria.nome,
                  city:      updated.city ?? undefined,
                  link:      notifLink,
                }),
              }).catch((err: unknown) => console.error('[admin.approve] Email diretta fallita:', err))
            }
            if (
              targetCompany.notificationWhatsapp &&
              targetCompany.user.phoneNumber &&
              targetCompany.user.phoneNumberVerified &&
              ctx.sendWhatsAppNotification
            ) {
              const appUrl = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'
              const requestLink = `${appUrl}/area-impresa/richieste/${updated.id}`

              ctx.sendWhatsAppNotification({
                to: targetCompany.user.phoneNumber,
                requestTitle: requestDisplayTitle,
                city: updated.city ?? 'la tua zona',
                link: requestLink,
              }).catch((err: unknown) => console.error('[admin.approve] WhatsApp diretto fallito:', err))
            }
          }
          return updated  // skip pool matching: richiesta esclusiva
        }

        // Precedenza matching: intervento -> categorie compatibili; fallback legacy settore
        const matchingCompanies = await getMatchingCompaniesForRequest(ctx.db, {
          id: updated.id,
          interventoId: updated.interventoId,
          categoriaId: updated.categoriaId,
          servizioId: updated.servizioId ?? null,
          workType: updated.workType ?? 'UNKNOWN',
          settoreId: updated.categoria.settoreId,
          lat: updated.lat,
          lng: updated.lng,
          province: updated.province,
          targetCompanyId: null,
        })

        if (matchingCompanies.length > 0) {
          const companyUsers = matchingCompanies

          const title = `Nuova richiesta: ${requestDisplayTitle}`
          const body  = `È disponibile una nuova richiesta di lavoro${updated.city ? ` a ${updated.city}` : ''}.`

          await ctx.db.notification.createMany({
            data: companyUsers.map((c) => ({
              userId:  c.userId,
              type:    'NEW_REQUEST_IN_ZONE' as const,
              channel: 'IN_APP' as const,
              title,
              body,
              data:    { requestId: updated.id, requestTitle: requestDisplayTitle },
              sentAt:  new Date(),
            })),
            skipDuplicates: true,
          })

          // ── Email via Resend per imprese con notificationEmail=true ──────────
          const emailTargets = companyUsers.filter((c) => c.notificationEmail)
          if (emailTargets.length > 0) {
            const resend   = new Resend(process.env.RESEND_API_KEY!)
            const appUrl   = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'
            const notifLink = `${appUrl}/area-impresa/notifiche`

            await Promise.allSettled(
              emailTargets.map((c) =>
                resend.emails.send({
                  from:    process.env.EMAIL_FROM ?? 'FixPro <noreply@fixpro.it>',
                  to:      c.user.email,
                  subject: `Nuova richiesta: ${requestDisplayTitle}`,
                  html:    buildNewRequestEmail(c.ragioneSociale, {
                    requestTitle: requestDisplayTitle,
                    settore:   updated.categoria.settore.nome,
                    categoria: updated.categoria.nome,
                    city:      updated.city ?? undefined,
                    link:      notifLink,
                  }),
                })
              )
            )
          }

          const whatsappTargets = companyUsers.filter(
            (c) => c.notificationWhatsapp && c.user.phoneNumber && c.user.phoneNumberVerified,
          )
          if (whatsappTargets.length > 0 && ctx.sendWhatsAppNotification) {
            const appUrl = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'
            const requestLink = `${appUrl}/area-impresa/richieste/${updated.id}`

            await Promise.allSettled(
              whatsappTargets.map((c) =>
                ctx.sendWhatsAppNotification!({
                  to: c.user.phoneNumber!,
                  requestTitle: requestDisplayTitle,
                  city: updated.city ?? 'la tua zona',
                  link: requestLink,
                }),
              ),
            )
          }
        }
      } catch (err) {
        // Le notifiche non bloccano l'approvazione
        console.error('[admin.approve] Notifica imprese fallita:', err)
      }

      // Log admin action to AdminAuditLog
      await ctx.db.adminAuditLog.create({
        data: {
          adminId: ctx.session!.user!.id,
          action: 'APPROVE_REQUEST',
          targetId: input.id,
          targetType: 'ServiceRequest',
          meta: { creditCost: input.creditCost, oneTimePriceCents: input.oneTimePriceCents, maxBuyers: input.maxBuyers },
        },
      })

      return updated
    }),

  reject: adminProcedure
    .input(z.object({
      id:     z.string(),
      reason: z.string().min(1).max(500),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user) throw new TRPCError({ code: 'UNAUTHORIZED' })
      const rejected = await ctx.db.serviceRequest.update({
        where: { id: input.id },
        data: {
          status:         'REJECTED',
          rejectedAt:     new Date(),
          rejectedReason: input.reason,
          approvedAt:     null,
          approvedBy:     null,
        },
      })

      // Log admin action to AdminAuditLog
      await ctx.db.adminAuditLog.create({
        data: {
          adminId: ctx.session.user.id,
          action: 'REJECT_REQUEST',
          targetId: input.id,
          targetType: 'ServiceRequest',
          meta: { reason: input.reason },
        },
      })

      return rejected
    }),

  requestIntegration: adminProcedure
    .input(z.object({
      requestId: z.string(),
      message:   z.string().min(10).max(500),
    }))
    .mutation(async ({ ctx, input }) => {
      const req = await ctx.db.serviceRequest.findUnique({
        where:  { id: input.requestId },
        select: { clientId: true, title: true },
      })
      if (!req) throw new TRPCError({ code: 'NOT_FOUND', message: 'Richiesta non trovata' })

      await ctx.db.notification.create({
        data: {
          userId:  req.clientId,
          type:    'ADMIN_MESSAGE',
          channel: 'IN_APP',
          title:   `Integrazione richiesta: ${req.title}`,
          body:    input.message,
          data:    { requestId: input.requestId },
          sentAt:  new Date(),
        },
      })

      return { ok: true }
    }),
})

// ── sub-router: companies ────────────────────────────────────────────────────
const companiesRouter = createTRPCRouter({

  list: adminProcedure
    .input(z.object({
      status:       z.enum(['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED']).optional(),
      search:       z.string().max(100).optional(),
      province:     z.string().max(3).optional(),
      creditsLevel: z.enum(['zero', 'low', 'ok']).optional(),
      cursor:       z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: Prisma.CompanyWhereInput = {}
      if (input.status)   where.status = input.status
      if (input.search)   where.ragioneSociale = { contains: input.search, mode: 'insensitive' }
      if (input.province) where.province = { equals: input.province.toUpperCase(), mode: 'insensitive' }

      const companies = await ctx.db.company.findMany({
        where,
        include: {
          user: {
            select: {
              id: true, name: true, email: true, createdAt: true,
              emailVerified: true, phoneNumberVerified: true,
            },
          },
          categories:    { include: { categoria: { select: { nome: true } } } },
          creditBalance: { select: { total: true } },
          _count:        { select: { purchases: true, rescues: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: input.creditsLevel ? 200 : 50,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      })

      const creditsMap = await getAvailableCreditsMap(
        ctx.db,
        companies.map((company) => company.id),
      )

      const normalizedCompanies = companies.map((company) => ({
        ...company,
        creditBalance: { total: creditsMap.get(company.id) ?? 0 },
      }))

      const filteredCompanies = normalizedCompanies.filter((company) => {
        const credits = company.creditBalance.total
        if (input.creditsLevel === 'zero') return credits === 0
        if (input.creditsLevel === 'low') return credits > 0 && credits <= 10
        if (input.creditsLevel === 'ok') return credits > 10
        return true
      })

      return filteredCompanies.slice(0, 50)
    }),

  get: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const company = await ctx.db.company.findUnique({
        where: { id: input.id },
        include: {
          user: {
            select: {
              id: true, name: true, email: true, phoneNumber: true, createdAt: true,
              emailVerified: true, phoneNumberVerified: true,
              sessions: {
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: { id: true, ipAddress: true, userAgent: true, createdAt: true, expiresAt: true },
              },
            },
          },
          categories:    { include: { categoria: { select: { nome: true, settore: { select: { nome: true } } } } } },
          creditBalance: { select: { total: true } },
          creditBatches: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: { id: true, amount: true, remaining: true, expiresAt: true, createdAt: true },
          },
          creditMovements: {
            orderBy: { createdAt: 'desc' },
            take: 20,
            select: { id: true, type: true, amount: true, balanceBefore: true, balanceAfter: true, note: true, createdAt: true },
          },
          purchases: {
            orderBy: { purchasedAt: 'desc' },
            take: 10,
            include: {
              request: { select: { id: true, title: true, status: true, city: true } },
            },
          },
          rescues: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: { id: true, status: true, reason: true, createdAt: true, resolvedAt: true },
          },
        },
      })
      if (!company) throw new TRPCError({ code: 'NOT_FOUND', message: 'Impresa non trovata' })

      const creditsMap = await getAvailableCreditsMap(ctx.db, [company.id])

      return {
        ...company,
        creditBalance: { total: creditsMap.get(company.id) ?? 0 },
      }
    }),

  updateStatus: adminProcedure
    .input(z.object({
      id:              z.string(),
      status:          z.enum(['APPROVED', 'REJECTED', 'SUSPENDED', 'PENDING']),
      suspendedReason: z.string().max(300).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.company.update({
        where: { id: input.id },
        data:  {
          status:          input.status,
          suspendedReason: input.status === 'SUSPENDED' ? (input.suspendedReason ?? null) : null,
          // APPROVED → verified automaticamente (l'approvazione implica controllo P.IVA)
          // REJECTED/PENDING → verified revocato
          // SUSPENDED → verified invariato (sospensione temporanea, P.IVA ancora valida)
          ...(input.status === 'APPROVED'                          && { verified: true  }),
          ...(input.status === 'REJECTED' || input.status === 'PENDING' ? { verified: false } : {}),
        },
      })
    }),

  setVerified: adminProcedure
    .input(z.object({ id: z.string(), verified: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.company.update({
        where: { id: input.id },
        data:  { verified: input.verified },
      })
    }),

  saveNote: adminProcedure
    .input(z.object({ id: z.string(), adminNote: z.string().max(1000) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.company.update({
        where: { id: input.id },
        data:  { adminNote: input.adminNote },
      })
    }),

  grantCredits: adminProcedure
    .input(z.object({
      companyId: z.string(),
      amount:    z.number().int().min(1).max(1000),
      note:      z.string().min(1).max(200),
    }))
    .mutation(async ({ ctx, input }) => {
      const expiresAt = new Date()
      expiresAt.setFullYear(expiresAt.getFullYear() + 1)

      return ctx.db.$transaction(async (tx: Prisma.TransactionClient) => {
        const balanceBefore = await syncCompanyCreditBalanceTx(tx, input.companyId)
        const balanceAfter  = balanceBefore + input.amount

        const batch = await tx.creditBatch.create({
          data: { companyId: input.companyId, amount: input.amount, remaining: input.amount, expiresAt },
        })

        await tx.creditBalance.upsert({
          where:  { companyId: input.companyId },
          create: { companyId: input.companyId, total: balanceAfter },
          update: { total: balanceAfter },
        })

        await tx.creditMovement.create({
          data: {
            companyId:     input.companyId,
            batchId:       batch.id,
            type:          'BONUS',
            amount:        input.amount,
            balanceBefore,
            balanceAfter,
            reference:     `admin:${ctx.session.user.id}`,
            note:          input.note,
          },
        })

        return { balanceAfter }
      })
    }),
})

// ── sub-router: rescue ───────────────────────────────────────────────────────
const rescueRouter = createTRPCRouter({

  list: adminProcedure
    .input(z.object({
      status: z.enum(['OPEN', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CLOSED']).optional(),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.db.rescue.findMany({
        where: input.status ? { status: input.status } : undefined,
        select: {
          id:        true,
          reason:    true,
          status:    true,
          createdAt: true,
          companyId: true,
          requestId: true,
          company: { select: { id: true, ragioneSociale: true, city: true, slug: true } },
          request: {
            select: {
              id:    true,
              title: true,
              city:  true,
              purchases: {
                select: { paymentMethod: true, creditSpent: true },
                take: 1,
              },
              categoria: { select: { nome: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      })
    }),

  get: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const rescue = await ctx.db.rescue.findUnique({
        where: { id: input.id },
        include: {
          company: {
            include: {
              user:          { select: { id: true, name: true, email: true } },
              creditBalance: { select: { total: true } },
            },
          },
          request: {
            select: {
              id:             true,
              title:          true,
              description:    true,
              address:        true,
              city:           true,
              province:       true,
              urgency:        true,
              propertyType:   true,
              hasImages:      true,
              intention:      true,
              contactName:    true,
              contactSurname: true,
              contactPhone:   true,
              contactEmail:   true,
              categoria: { select: { nome: true, settore: { select: { nome: true } } } },
              servizio:  { select: { nome: true } },
              client:    { select: { id: true, name: true, email: true, phoneNumber: true } },
            },
          },
          audit: { orderBy: { createdAt: 'asc' } },
        },
      })
      if (!rescue) throw new TRPCError({ code: 'NOT_FOUND', message: 'Rescue non trovato' })

      // Acquisto originale: metodo, crediti spesi, importo pagato
      const purchase = await ctx.db.requestPurchase.findUnique({
        where: {
          companyId_requestId: { companyId: rescue.companyId, requestId: rescue.requestId },
        },
        select: {
          id: true, paymentMethod: true,
          creditSpent: true, amountCents: true, purchasedAt: true,
        },
      })

      // Anti-abuso: rescue aperti da questa company negli ultimi 30 gg
      const oneMonthAgo = new Date()
      oneMonthAgo.setDate(oneMonthAgo.getDate() - 30)
      const rescuesThisMonth = await ctx.db.rescue.count({
        where: { companyId: rescue.companyId, createdAt: { gte: oneMonthAgo } },
      })

      const creditsMap = await getAvailableCreditsMap(ctx.db, [rescue.company.id])

      return {
        ...rescue,
        company: {
          ...rescue.company,
          creditBalance: { total: creditsMap.get(rescue.company.id) ?? 0 },
        },
        purchase,
        rescuesThisMonth,
      }
    }),

  updateStatus: adminProcedure
    .input(z.object({
      id:        z.string(),
      status:    z.enum(['UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CLOSED']),
      adminNote: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const isResolved = ['APPROVED', 'REJECTED', 'CLOSED'].includes(input.status)

      return ctx.db.$transaction(async (tx: Prisma.TransactionClient) => {
        // P0-3 FIX: Pessimistic lock su rescue row PRIMA di leggere status
        // Questo previene double-refund se due admin approvano simultaneamente
        await tx.$queryRaw`
          SELECT id, status
          FROM "rescues"
          WHERE id = ${input.id}
          FOR UPDATE
        `

        const currentRescue = await tx.rescue.findUnique({
          where: { id: input.id },
          select: { id: true, status: true },
        })

        if (!currentRescue) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Rescue non trovato' })
        }

        // Guard DOPO lock: se un admin ha già approvato questo rescue,
        // il lock è su una riga che avrà status = 'APPROVED'
        if (input.status === 'APPROVED' && currentRescue.status === 'APPROVED') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Il rescue e gia stato approvato',
          })
        }

        const rescue = await tx.rescue.update({
          where: { id: input.id },
          data: {
            status:     input.status,
            adminNote:  input.adminNote,
            resolvedAt: isResolved ? new Date() : null,
            resolvedBy: isResolved ? ctx.session.user.id : null,
          },
          include: {
            company: true,
            request: { include: { intervento: { select: { nome: true } } } },
          },
        })
        const rescueRequestTitle = formatRequestDisplayTitle({
          title: rescue.request.title,
          interventoNome: rescue.request.intervento?.nome,
          city: rescue.request.city,
          province: rescue.request.province,
        })

        await tx.rescueAudit.create({
          data: { rescueId: input.id, action: input.status, actor: ctx.session.user.id, note: input.adminNote },
        })

        // Log admin action to AdminAuditLog
        if (!ctx.session?.user) throw new TRPCError({ code: 'UNAUTHORIZED' })
        await tx.adminAuditLog.create({
          data: {
            adminId: ctx.session.user.id,
            action: input.status === 'APPROVED' ? 'APPROVE_RESCUE' : input.status === 'REJECTED' ? 'REJECT_RESCUE' : 'APPROVE_RESCUE',
            targetId: input.id,
            targetType: 'Rescue',
            meta: { oldStatus: currentRescue.status, newStatus: input.status, adminNote: input.adminNote },
          },
        })

        if (input.status === 'APPROVED') {
          const purchase = await tx.requestPurchase.findUnique({
            where: {
              companyId_requestId: { companyId: rescue.companyId, requestId: rescue.requestId },
            },
          })

          if (purchase && purchase.creditSpent > 0) {
            const balanceBefore = await syncCompanyCreditBalanceTx(tx, rescue.companyId)
            const balanceAfter  = balanceBefore + purchase.creditSpent
            const expiresAt     = new Date()
            expiresAt.setFullYear(expiresAt.getFullYear() + 1)

            const batch = await tx.creditBatch.create({
              data: { companyId: rescue.companyId, amount: purchase.creditSpent, remaining: purchase.creditSpent, expiresAt },
            })

            await tx.creditBalance.upsert({
              where:  { companyId: rescue.companyId },
              create: { companyId: rescue.companyId, total: balanceAfter },
              update: { total: balanceAfter },
            })

            await tx.creditMovement.create({
              data: {
                companyId:     rescue.companyId,
                batchId:       batch.id,
                type:          'REFUND',
                amount:        purchase.creditSpent,
                balanceBefore,
                balanceAfter,
                reference:     `rescue:${input.id}`,
                note:          'Rimborso rescue approvato da admin',
              },
            })
          }
        }

        // Notifica IN_APP all'impresa per ogni cambio stato rilevante
        const NOTIFY_STATUSES = ['UNDER_REVIEW', 'APPROVED', 'REJECTED'] as const
        if (NOTIFY_STATUSES.includes(input.status as typeof NOTIFY_STATUSES[number])) {
          const notifyTitle =
            input.status === 'APPROVED'     ? 'Rimborso approvato' :
            input.status === 'REJECTED'     ? 'Rimborso rifiutato' :
                                              'Rimborso preso in carico'

          const notifyBody =
            input.status === 'APPROVED'     ? 'La tua richiesta di rimborso è stata approvata. I crediti sono stati riaccreditati sul tuo saldo.' :
            input.status === 'REJECTED'     ? `La tua richiesta di rimborso è stata rifiutata.${input.adminNote ? ` Motivo: ${input.adminNote}` : ''}` :
                                              'Il team FixPro ha preso in carico la tua richiesta di rimborso.'

          await tx.notification.create({
            data: {
              userId:  rescue.company.userId,
              type:    input.status === 'APPROVED' ? 'RESCUE_APPROVED' : input.status === 'REJECTED' ? 'RESCUE_REJECTED' : 'ADMIN_MESSAGE',
              channel: 'IN_APP',
              title:   `${notifyTitle} - ${rescueRequestTitle}`,
              body:    notifyBody,
              data:    {
                rescueId: input.id,
                requestId: rescue.requestId,
                requestTitle: rescueRequestTitle,
                section: 'rimborsi',
              },
            },
          })

          // Se c'è una nota admin, la invia anche come messaggio in assistenza
          if (input.adminNote) {
            await tx.assistanceMessage.create({
              data: {
                companyId:  rescue.companyId,
                userId:     ctx.session.user.id,
                senderType: 'ADMIN',
                body:       `[Aggiornamento rimborso — ${notifyTitle}]\n\n${input.adminNote}`,
              },
            })
          }
        }

        return rescue
      })
    }),
})

// ── root admin router ────────────────────────────────────────────────────────
// ── sub-router: credit packages ──────────────────────────────────────────────
const packagesRouter = createTRPCRouter({

  list: superAdminProcedure.query(async ({ ctx }) => {
    return ctx.db.creditPackage.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    })
  }),

  upsert: superAdminProcedure
    .input(z.object({
      id:          z.string().optional(),
      name:        z.string().min(1).max(60),
      credits:     z.number().int().positive(),
      priceCents:  z.number().int().positive(),
      validityMonths: z.number().int().positive().max(120).default(12),
      description: z.string().max(200).optional(),
      popular:     z.boolean().default(false),
      active:      z.boolean().default(true),
      sortOrder:   z.number().int().default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      if (id) {
        return ctx.db.creditPackage.update({ where: { id }, data })
      }
      return ctx.db.creditPackage.create({ data })
    }),

  toggleActive: superAdminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const pkg = await ctx.db.creditPackage.findUniqueOrThrow({ where: { id: input.id } })
      return ctx.db.creditPackage.update({
        where: { id: input.id },
        data:  { active: !pkg.active },
      })
    }),

  delete: superAdminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.creditPackage.delete({ where: { id: input.id } })
    }),
})

export const adminRouter = createTRPCRouter({
  stats: adminProcedure.query(async ({ ctx }) => {
    const now = new Date()
    const [pendingRequests, pendingCompanies, openRescues, todayRequests, weekRequests] =
      await Promise.all([
        ctx.db.serviceRequest.count({ where: { status: 'PENDING' } }),
        ctx.db.company.count({ where: { status: 'PENDING' } }),
        ctx.db.rescue.count({ where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } } }),
        ctx.db.serviceRequest.count({ where: { createdAt: { gte: startOfDay(now) } } }),
        ctx.db.serviceRequest.count({ where: { createdAt: { gte: startOfWeek(now) } } }),
      ])
    return { pendingRequests, pendingCompanies, openRescues, todayRequests, weekRequests }
  }),

  requests:  requestsRouter,
  companies: companiesRouter,
  rescue:    rescueRouter,
  packages:  packagesRouter,
})
