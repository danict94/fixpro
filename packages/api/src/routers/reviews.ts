import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, clientProcedure } from '../trpc'

export const reviewsRouter = createTRPCRouter({
  /**
   * Il cliente lascia una recensione per un'impresa che ha acquistato la sua richiesta.
   * Ownership: verifica che il purchase appartenga a una richiesta del cliente loggato.
   * Limite: una sola recensione per acquisto (purchaseId @unique).
   */
  createByClient: clientProcedure
    .input(
      z.object({
        purchaseId: z.string().min(1),
        rating:     z.number().int().min(1).max(5),
        body:       z.string().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Carica l'acquisto verificando ownership tramite la catena purchase → request → client
      const purchase = await ctx.db.requestPurchase.findUnique({
        where:  { id: input.purchaseId },
        select: {
          id:        true,
          companyId: true,
          request:   { select: { clientId: true } },
          review:    { select: { id: true } },
        },
      })

      if (!purchase) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Acquisto non trovato' })
      }

      // Ownership: solo il cliente della richiesta può recensire
      if (purchase.request.clientId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Non autorizzato' })
      }

      // Una sola recensione per acquisto
      if (purchase.review) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Hai già lasciato una recensione per questo professionista' })
      }

      return ctx.db.review.create({
        data: {
          purchaseId: input.purchaseId,
          companyId:  purchase.companyId,
          rating:     input.rating,
          body:       input.body?.trim() || null,
          published:  false, // l'admin deve approvare prima della pubblicazione
        },
      })
    }),
})
