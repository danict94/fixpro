import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, companyProcedure, clientProcedure } from '../trpc'

export const contactsRouter = createTRPCRouter({

  /* ------------------------------------------------------------------ */
  /* COMPANY                                                              */
  /* ------------------------------------------------------------------ */

  listThreads: companyProcedure.query(async ({ ctx }) => {
    const company = await ctx.db.company.findUniqueOrThrow({
      where:  { userId: ctx.session.user.id },
      select: { id: true },
    })

    const purchases = await ctx.db.requestPurchase.findMany({
      where: { companyId: company.id },
      include: {
        request: {
          select: {
            id:             true,
            title:          true,
            city:           true,
            province:       true,
            intervento:     { select: { nome: true } },
            contactName:    true,
            contactSurname: true,
            categoria:      { select: { nome: true } },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: { messages: { where: { senderType: 'CLIENT', readAt: null } } },
        },
      },
    })

    return purchases
      .sort((a, b) => {
        const aDate = a.messages[0]?.createdAt ?? a.purchasedAt
        const bDate = b.messages[0]?.createdAt ?? b.purchasedAt
        return new Date(bDate).getTime() - new Date(aDate).getTime()
      })
      .map((p) => ({
        purchaseId:     p.id,
        requestId:      p.request.id,
        title:          p.request.title,
        interventoNome: p.request.intervento?.nome ?? null,
        city:           p.request.city,
        province:       p.request.province,
        contactName:    p.request.contactName,
        contactSurname: p.request.contactSurname,
        categoriaNome:  p.request.categoria.nome,
        lastMessage:    p.messages[0] ?? null,
        unreadCount:    p._count.messages,
        purchasedAt:    p.purchasedAt,
      }))
  }),

  getThread: companyProcedure
    .input(z.object({ purchaseId: z.string() }))
    .query(async ({ ctx, input }) => {
      const company = await ctx.db.company.findUniqueOrThrow({
        where:  { userId: ctx.session.user.id },
        select: { id: true },
      })

      const purchase = await ctx.db.requestPurchase.findUnique({
        where: { id: input.purchaseId },
        select: {
          id:          true,
          companyId:   true,
          purchasedAt: true,
          request: {
            select: {
              id:             true,
              title:          true,
              city:           true,
              province:       true,
              intervento:     { select: { nome: true } },
              contactName:    true,
              contactSurname: true,
              contactPhone:   true,
              contactEmail:   true,
              categoria:      { select: { nome: true } },
            },
          },
          messages: { orderBy: { createdAt: 'asc' } },
        },
      })

      if (!purchase)               throw new TRPCError({ code: 'NOT_FOUND' })
      if (purchase.companyId !== company.id) throw new TRPCError({ code: 'FORBIDDEN' })

      // Marca messaggi CLIENT come letti
      await ctx.db.contactMessage.updateMany({
        where: { purchaseId: input.purchaseId, senderType: 'CLIENT', readAt: null },
        data:  { readAt: new Date() },
      })

      return purchase
    }),

  sendMessage: companyProcedure
    .input(z.object({
      purchaseId: z.string(),
      body:       z.string().min(1).max(2000).trim(),
    }))
    .mutation(async ({ ctx, input }) => {
      const company = await ctx.db.company.findUniqueOrThrow({
        where:  { userId: ctx.session.user.id },
        select: { id: true },
      })

      const purchase = await ctx.db.requestPurchase.findUnique({
        where:  { id: input.purchaseId },
        select: {
          companyId: true,
          request:   { select: { clientId: true } },
        },
      })
      if (!purchase)                          throw new TRPCError({ code: 'NOT_FOUND' })
      if (purchase.companyId !== company.id)  throw new TRPCError({ code: 'FORBIDDEN' })

      const message = await ctx.db.contactMessage.create({
        data: {
          purchaseId: input.purchaseId,
          senderType: 'COMPANY',
          senderId:   company.id,
          body:       input.body,
        },
      })

      // Notifica al cliente (non-blocking)
      ctx.db.notification.create({
        data: {
          userId:  purchase.request.clientId,
          type:    'CLIENT_MESSAGE',
          channel: 'IN_APP',
          title:   "Nuovo messaggio dall'impresa",
          body:    input.body.slice(0, 100),
        },
      }).catch(console.error)

      return message
    }),

  /* ------------------------------------------------------------------ */
  /* CLIENT                                                               */
  /* ------------------------------------------------------------------ */

  listClientThreads: clientProcedure.query(async ({ ctx }) => {
    const purchases = await ctx.db.requestPurchase.findMany({
      where: { request: { clientId: ctx.session.user.id } },
      include: {
        request: {
          select: {
            id:        true,
            title:     true,
            city:      true,
            province:  true,
            intervento: { select: { nome: true } },
            categoria: { select: { nome: true } },
          },
        },
        company: { select: { id: true, ragioneSociale: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: {
          select: { messages: { where: { senderType: 'COMPANY', readAt: null } } },
        },
      },
    })

    return purchases
      .sort((a, b) => {
        const aDate = a.messages[0]?.createdAt ?? a.purchasedAt
        const bDate = b.messages[0]?.createdAt ?? b.purchasedAt
        return new Date(bDate).getTime() - new Date(aDate).getTime()
      })
      .map((p) => ({
        purchaseId:   p.id,
        requestId:    p.request.id,
        title:        p.request.title,
        interventoNome: p.request.intervento?.nome ?? null,
        city:         p.request.city,
        province:     p.request.province,
        categoriaNome: p.request.categoria.nome,
        companyName:  p.company.ragioneSociale,
        lastMessage:  p.messages[0] ?? null,
        unreadCount:  p._count.messages,
        purchasedAt:  p.purchasedAt,
      }))
  }),

  getClientThread: clientProcedure
    .input(z.object({ purchaseId: z.string() }))
    .query(async ({ ctx, input }) => {
      const purchase = await ctx.db.requestPurchase.findUnique({
        where: { id: input.purchaseId },
        select: {
          id:          true,
          purchasedAt: true,
          request: {
            select: {
              id:       true,
              title:    true,
              clientId: true,
              city:     true,
              province: true,
              intervento: { select: { nome: true } },
              categoria: { select: { nome: true } },
            },
          },
          company:  { select: { id: true, ragioneSociale: true } },
          messages: { orderBy: { createdAt: 'asc' } },
        },
      })

      if (!purchase)                                         throw new TRPCError({ code: 'NOT_FOUND' })
      if (purchase.request.clientId !== ctx.session.user.id) throw new TRPCError({ code: 'FORBIDDEN' })

      // Marca messaggi COMPANY come letti
      await ctx.db.contactMessage.updateMany({
        where: { purchaseId: input.purchaseId, senderType: 'COMPANY', readAt: null },
        data:  { readAt: new Date() },
      })

      return purchase
    }),

  sendClientMessage: clientProcedure
    .input(z.object({
      purchaseId: z.string(),
      body:       z.string().min(1).max(2000).trim(),
    }))
    .mutation(async ({ ctx, input }) => {
      const purchase = await ctx.db.requestPurchase.findUnique({
        where:  { id: input.purchaseId },
        select: {
          companyId: true,
          request:   { select: { clientId: true } },
          company:   { select: { userId: true } },
        },
      })
      if (!purchase)                                          throw new TRPCError({ code: 'NOT_FOUND' })
      if (purchase.request.clientId !== ctx.session.user.id) throw new TRPCError({ code: 'FORBIDDEN' })

      const message = await ctx.db.contactMessage.create({
        data: {
          purchaseId: input.purchaseId,
          senderType: 'CLIENT',
          senderId:   ctx.session.user.id,
          body:       input.body,
        },
      })

      // Notifica all'impresa (non-blocking)
      ctx.db.notification.create({
        data: {
          userId:  purchase.company.userId,
          type:    'CLIENT_MESSAGE',
          channel: 'IN_APP',
          title:   'Nuovo messaggio dal cliente',
          body:    input.body.slice(0, 100),
          data:    { purchaseId: input.purchaseId },
        },
      }).catch(console.error)

      return message
    }),
})
