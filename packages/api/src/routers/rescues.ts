import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, companyProcedure } from '../trpc'

export const rescuesRouter = createTRPCRouter({

  list: companyProcedure.query(async ({ ctx }) => {
    const company = await ctx.db.company.findUniqueOrThrow({
      where:  { userId: ctx.session.user.id },
      select: { id: true },
    })

    return ctx.db.rescue.findMany({
      where:   { companyId: company.id },
      orderBy: { createdAt: 'desc' },
      include: {
        request: {
          select: {
            title:     true,
            city:      true,
            province:  true,
            createdAt: true,
            approvedAt: true,
            intervento: { select: { nome: true } },
            categoria: { select: { nome: true } },
          },
        },
        audit: { orderBy: { createdAt: 'desc' } },
      },
    })
  }),

  open: companyProcedure
    .input(z.object({
      requestId: z.string(),
      reason:    z.string().min(20, 'Descrivi il problema in almeno 20 caratteri.').max(2000).trim(),
    }))
    .mutation(async ({ ctx, input }) => {
      const company = await ctx.db.company.findUniqueOrThrow({
        where:  { userId: ctx.session.user.id },
        select: { id: true },
      })

      // Verifica acquisto esistente
      const purchase = await ctx.db.requestPurchase.findUnique({
        where:  { companyId_requestId: { companyId: company.id, requestId: input.requestId } },
        select: { id: true },
      })
      if (!purchase) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Nessun acquisto trovato per questa richiesta.' })
      }

      // Verifica no rescue già aperto
      const existing = await ctx.db.rescue.findFirst({
        where:  { companyId: company.id, requestId: input.requestId, status: { in: ['OPEN', 'UNDER_REVIEW'] } },
        select: { id: true },
      })
      if (existing) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Esiste già un rescue aperto per questa richiesta.' })
      }

      return ctx.db.rescue.create({
        data: {
          companyId: company.id,
          requestId: input.requestId,
          reason:    input.reason,
          status:    'OPEN',
          audit: {
            create: {
              action: 'OPENED',
              actor:  ctx.session.user.id,
              note:   'Apertura rescue da impresa',
            },
          },
        },
      })
    }),

  // Acquisti eleggibili: hanno purchase ma nessun rescue OPEN/UNDER_REVIEW
  eligiblePurchases: companyProcedure.query(async ({ ctx }) => {
    const company = await ctx.db.company.findUniqueOrThrow({
      where:  { userId: ctx.session.user.id },
      select: { id: true },
    })

    const blockedIds = await ctx.db.rescue
      .findMany({
        where:  { companyId: company.id, status: { in: ['OPEN', 'UNDER_REVIEW'] } },
        select: { requestId: true },
      })
      .then((rows) => rows.map((r) => r.requestId))

    return ctx.db.requestPurchase.findMany({
      where: {
        companyId: company.id,
        requestId: blockedIds.length > 0 ? { notIn: blockedIds } : undefined,
      },
      orderBy: { purchasedAt: 'desc' },
      select: {
        id:        true,
        requestId: true,
        request: {
          select: {
            title:     true,
            city:      true,
            province:  true,
            createdAt: true,
            approvedAt: true,
            intervento: { select: { nome: true } },
            categoria: { select: { nome: true } },
          },
        },
      },
    })
  }),
})
