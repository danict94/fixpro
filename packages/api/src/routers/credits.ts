import { createTRPCRouter, companyProcedure, publicProcedure } from '../trpc'
import { getAvailableCreditBalanceReadOnly } from '../lib/credit-balance'

export const creditsRouter = createTRPCRouter({

  /**
   * Pacchetti crediti attivi (pubblico — usato da pagina crediti e checkout).
   */
  listPackages: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.creditPackage.findMany({
      where:   { active: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    })
  }),

  /**
   * Saldo crediti, batch attivi (remaining > 0) e storico movimenti.
   */
  getBalance: companyProcedure.query(async ({ ctx }) => {
    const company = await ctx.db.company.findUniqueOrThrow({
      where: { userId: ctx.session.user.id },
      select: { id: true },
    })

    const [total, batches, movements] = await Promise.all([
      getAvailableCreditBalanceReadOnly(ctx.db, company.id),
      ctx.db.creditBatch.findMany({
        where: {
          companyId: company.id,
          remaining: { gt: 0 },
          expiresAt: { gte: new Date() },
        },
        orderBy: [
          { expiresAt: 'asc' },
          { createdAt: 'asc' },
        ],
      }),
      ctx.db.creditMovement.findMany({
        where: { companyId: company.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ])

    return {
      total,
      batches,
      movements,
    }
  }),
})
