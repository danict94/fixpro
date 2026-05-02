import { z } from 'zod'
import { createTRPCRouter, companyProcedure, adminProcedure } from '../trpc'

export const assistanceRouter = createTRPCRouter({

  // ── COMPANY ────────────────────────────────────────────────────────────────

  getThread: companyProcedure.query(async ({ ctx }) => {
    const company = await ctx.db.company.findUniqueOrThrow({
      where:  { userId: ctx.session.user.id },
      select: { id: true },
    })

    const messages = await ctx.db.assistanceMessage.findMany({
      where:   { companyId: company.id },
      orderBy: { createdAt: 'asc' },
    })

    // Marca messaggi ADMIN come letti
    await ctx.db.assistanceMessage.updateMany({
      where: { companyId: company.id, senderType: 'ADMIN', readAt: null },
      data:  { readAt: new Date() },
    })

    return messages
  }),

  sendMessage: companyProcedure
    .input(z.object({ body: z.string().min(1).max(2000).trim() }))
    .mutation(async ({ ctx, input }) => {
      const company = await ctx.db.company.findUniqueOrThrow({
        where:  { userId: ctx.session.user.id },
        select: { id: true },
      })

      return ctx.db.assistanceMessage.create({
        data: {
          companyId:  company.id,
          userId:     ctx.session.user.id,
          senderType: 'COMPANY',
          body:       input.body,
        },
      })
    }),

  getUnreadCount: companyProcedure.query(async ({ ctx }) => {
    const company = await ctx.db.company.findUniqueOrThrow({
      where:  { userId: ctx.session.user.id },
      select: { id: true },
    })

    return ctx.db.assistanceMessage.count({
      where: { companyId: company.id, senderType: 'ADMIN', readAt: null },
    })
  }),

  // ── ADMIN ──────────────────────────────────────────────────────────────────

  /** Lista thread: una riga per impresa che ha messaggi, con ultimo msg e unread count. */
  adminListThreads: adminProcedure.query(async ({ ctx }) => {
    // Raggruppa per companyId con ultimo messaggio e messaggi non letti (COMPANY → non letti da admin)
    const companies = await ctx.db.company.findMany({
      where: {
        assistanceMessages: { some: {} },
      },
      select: {
        id:              true,
        ragioneSociale:  true,
        slug:            true,
        assistanceMessages: {
          orderBy: { createdAt: 'desc' },
          take:    1,
          select:  { body: true, senderType: true, createdAt: true },
        },
        _count: {
          select: {
            assistanceMessages: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    // Calcola unread (messaggi COMPANY non letti dall'admin = readAt null e senderType COMPANY)
    const unreadCounts = await ctx.db.assistanceMessage.groupBy({
      by:     ['companyId'],
      where:  { senderType: 'COMPANY', readAt: null },
      _count: { id: true },
    })
    const unreadMap = new Map(unreadCounts.map((r) => [r.companyId, r._count.id]))

    return companies.map((c) => ({
      companyId:      c.id,
      ragioneSociale: c.ragioneSociale,
      slug:           c.slug,
      lastMessage:    c.assistanceMessages[0] ?? null,
      unreadCount:    unreadMap.get(c.id) ?? 0,
    }))
  }),

  /** Thread completo con un'impresa specifica. Marca i messaggi COMPANY come letti. */
  adminGetThread: adminProcedure
    .input(z.object({ companyId: z.string() }))
    .query(async ({ ctx, input }) => {
      const messages = await ctx.db.assistanceMessage.findMany({
        where:   { companyId: input.companyId },
        orderBy: { createdAt: 'asc' },
      })

      // Marca messaggi COMPANY come letti (li ha letti l'admin)
      await ctx.db.assistanceMessage.updateMany({
        where: { companyId: input.companyId, senderType: 'COMPANY', readAt: null },
        data:  { readAt: new Date() },
      })

      const company = await ctx.db.company.findUniqueOrThrow({
        where:  { id: input.companyId },
        select: { id: true, ragioneSociale: true, user: { select: { id: true, email: true } } },
      })

      return { messages, company }
    }),

  /** Admin invia messaggio a un'impresa + notifica IN_APP. */
  adminSendMessage: adminProcedure
    .input(z.object({
      companyId: z.string(),
      body:      z.string().min(1).max(2000).trim(),
    }))
    .mutation(async ({ ctx, input }) => {
      const company = await ctx.db.company.findUniqueOrThrow({
        where:  { id: input.companyId },
        select: { id: true, userId: true, ragioneSociale: true },
      })

      const [message] = await Promise.all([
        ctx.db.assistanceMessage.create({
          data: {
            companyId:  company.id,
            userId:     ctx.session.user.id,
            senderType: 'ADMIN',
            body:       input.body,
          },
        }),
        // Notifica IN_APP all'impresa
        ctx.db.notification.create({
          data: {
            userId:  company.userId,
            type:    'ADMIN_MESSAGE',
            channel: 'IN_APP',
            title:   'Nuovo messaggio da FixPro',
            body:    input.body.length > 100 ? input.body.slice(0, 100) + '…' : input.body,
            data:    { section: 'assistenza' },
          },
        }),
      ])

      return message
    }),
})
