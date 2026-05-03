import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import type { Prisma } from '@fixpro/db'
import { slugify } from '@fixpro/shared'
import {
  createTRPCRouter,
  companyProcedure,
  protectedProcedure,
  publicProcedure,
} from '../trpc'

const PARTITA_IVA_IN_USE_MESSAGE = 'Questa partita IVA è già associata a un profilo impresa.'

type CompanyTaxonomyDb = Pick<Prisma.TransactionClient, 'categoria' | 'servizio'>

function isPartitaIvaUniqueError(error: unknown) {
  if (!error || typeof error !== 'object') return false

  const maybePrismaError = error as { code?: string; meta?: { target?: unknown } }
  const target = maybePrismaError.meta?.target

  return (
    maybePrismaError.code === 'P2002' &&
    ((Array.isArray(target) && target.includes('partitaIva')) ||
      target === 'Company_partitaIva_key')
  )
}

async function validateCompanyTaxonomySelection(
  db: CompanyTaxonomyDb,
  categoriaIds: string[],
  servizioIds: string[],
) {
  const uniqueCategoriaIds = Array.from(new Set(categoriaIds))
  const uniqueServizioIds = Array.from(new Set(servizioIds))

  const [activeCategories, activeServices] = await Promise.all([
    db.categoria.findMany({
      where: {
        id: { in: uniqueCategoriaIds },
        attivo: true,
      },
      select: { id: true },
    }),
    uniqueServizioIds.length > 0
      ? db.servizio.findMany({
          where: {
            id: { in: uniqueServizioIds },
            attivo: true,
          },
          select: {
            id: true,
            categoriaId: true,
          },
        })
      : [],
  ])

  if (activeCategories.length !== uniqueCategoriaIds.length) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Una o più categorie selezionate non sono valide',
    })
  }

  if (activeServices.length !== uniqueServizioIds.length) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Uno o più servizi selezionati non sono validi',
    })
  }

  const invalidService = activeServices.find(
    (servizio) => !uniqueCategoriaIds.includes(servizio.categoriaId),
  )

  if (invalidService) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Ogni servizio selezionato deve appartenere a una categoria selezionata',
    })
  }

  return {
    categoriaIds: uniqueCategoriaIds,
    servizioIds: uniqueServizioIds,
  }
}

export const companyRouter = createTRPCRouter({
  checkPartitaIva: publicProcedure
    .input(
      z.object({
        partitaIva: z
          .string()
          .length(11, 'La partita IVA deve essere di 11 cifre')
          .regex(/^\d+$/, 'La partita IVA deve contenere solo cifre'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.company.findUnique({
        where: { partitaIva: input.partitaIva },
        select: { id: true },
      })

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: PARTITA_IVA_IN_USE_MESSAGE,
        })
      }

      return { available: true }
    }),

  /**
   * Crea il profilo Company dopo la registrazione utente.
   *
   * Register leggero:
   * - categorie obbligatorie
   * - servizi opzionali/vuoti
   * - zona operativa obbligata dal frontend
   *
   * I servizi specifici vengono completati dopo il primo accesso
   * in area impresa/profilo.
   */
  register: protectedProcedure
    .input(
      z.object({
        ragioneSociale: z.string().min(2, 'Ragione sociale troppo corta'),
        partitaIva: z
          .string()
          .length(11, 'La partita IVA deve essere di 11 cifre')
          .regex(/^\d+$/, 'La partita IVA deve contenere solo cifre'),
        categoriaIds: z.array(z.string()).min(1).max(2),
        servizioIds: z.array(z.string()).optional().default([]),
        workType: z.enum(['SMALL', 'FULL', 'BOTH']).optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        province: z
          .string()
          .max(2)
          .optional()
          .transform((v) => v?.toUpperCase()),
        lat: z.number().optional(),
        lng: z.number().optional(),
        radiusKm: z.number().int().min(5).max(200).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== 'COMPANY' && ctx.session.user.role !== 'CLIENT') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Solo gli utenti autenticati possono registrare un profilo impresa',
        })
      }

      const { categoriaIds, servizioIds } = await validateCompanyTaxonomySelection(
        ctx.db,
        input.categoriaIds,
        input.servizioIds ?? [],
      )

      if (categoriaIds.length === 0 || categoriaIds.length > 2) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Seleziona da 1 a 2 categorie professionali valide',
        })
      }

      const companyWithSamePartitaIva = await ctx.db.company.findUnique({
        where: { partitaIva: input.partitaIva },
        select: { userId: true },
      })

      if (
        companyWithSamePartitaIva &&
        companyWithSamePartitaIva.userId !== ctx.session.user.id
      ) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: PARTITA_IVA_IN_USE_MESSAGE,
        })
      }

      try {
        return await ctx.db.$transaction(async (tx: Prisma.TransactionClient) => {
          if (ctx.session.user.role !== 'COMPANY') {
            await tx.user.update({
              where: { id: ctx.session.user.id },
              data: { role: 'COMPANY' },
            })
          }

          const existing = await tx.company.findUnique({
            where: { userId: ctx.session.user.id },
            include: {
              categories: {
                select: { categoriaId: true },
              },
              services: {
                select: { servizioId: true },
              },
            },
          })

          if (existing) {
            const existingCategoryIds = new Set(
              existing.categories.map(
                (category: { categoriaId: string }) => category.categoriaId,
              ),
            )
            const existingServiceIds = new Set(
              existing.services.map(
                (service: { servizioId: string }) => service.servizioId,
              ),
            )

            const missingCategoryIds = categoriaIds.filter(
              (categoriaId) => !existingCategoryIds.has(categoriaId),
            )
            const missingServiceIds = servizioIds.filter(
              (servizioId) => !existingServiceIds.has(servizioId),
            )

            if (missingCategoryIds.length > 0) {
              await tx.companyCategory.createMany({
                data: missingCategoryIds.map((categoriaId) => ({
                  companyId: existing.id,
                  categoriaId,
                })),
                skipDuplicates: true,
              })
            }

            if (missingServiceIds.length > 0) {
              await tx.companyService.createMany({
                data: missingServiceIds.map((servizioId) => ({
                  companyId: existing.id,
                  servizioId,
                })),
                skipDuplicates: true,
              })
            }

            const updatedCompany = await tx.company.update({
              where: { id: existing.id },
              data: {
                ragioneSociale: input.ragioneSociale,
                partitaIva: input.partitaIva,
                ...(input.address !== undefined ? { address: input.address || null } : {}),
                ...(input.city !== undefined ? { city: input.city || null } : {}),
                ...(input.province !== undefined ? { province: input.province ?? null } : {}),
                ...(input.lat !== undefined ? { lat: input.lat ?? null } : {}),
                ...(input.lng !== undefined ? { lng: input.lng ?? null } : {}),
                ...(input.radiusKm !== undefined ? { radiusKm: input.radiusKm } : {}),
                ...(input.workType !== undefined ? { workType: input.workType } : {}),
              },
            })

            return updatedCompany
          }

          const baseSlug = slugify(input.ragioneSociale)
          const suffix = Math.random().toString(36).slice(2, 8)
          const slug = `${baseSlug}-${suffix}`

          const company = await tx.company.create({
            data: {
              userId: ctx.session.user.id,
              slug,
              ragioneSociale: input.ragioneSociale,
              partitaIva: input.partitaIva,
              description: '',
              address: input.address ?? null,
              city: input.city ?? null,
              province: input.province?.toUpperCase() ?? null,
              lat: input.lat ?? null,
              lng: input.lng ?? null,
              radiusKm: input.radiusKm ?? 30,
              workType: input.workType ?? 'BOTH',
              status: 'PENDING',
            },
          })

          await tx.companyCategory.createMany({
            data: categoriaIds.map((categoriaId) => ({
              companyId: company.id,
              categoriaId,
            })),
            skipDuplicates: true,
          })

          if (servizioIds.length > 0) {
            await tx.companyService.createMany({
              data: servizioIds.map((servizioId) => ({
                companyId: company.id,
                servizioId,
              })),
              skipDuplicates: true,
            })
          }

          return company
        })
      } catch (error) {
        if (isPartitaIvaUniqueError(error)) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: PARTITA_IVA_IN_USE_MESSAGE,
          })
        }

        throw error
      }
    }),

  /**
   * Restituisce il profilo dell'impresa autenticata con categorie,
   * servizi e saldo crediti.
   */
  me: companyProcedure.query(async ({ ctx }) => {
    const company = await ctx.db.company.findUnique({
      where: { userId: ctx.session.user.id },
      include: {
        categories: {
          include: {
            categoria: {
              include: { settore: true },
            },
          },
        },
        services: {
          include: {
            servizio: {
              include: {
                categoria: true,
              },
            },
          },
        },
        creditBalance: true,
        _count: {
          select: {
            purchases: true,
            rescues: true,
          },
        },
      },
    })

    if (!company) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Profilo impresa non trovato',
      })
    }

    return company
  }),

  /**
   * Aggiorna i campi del profilo impresa.
   * Ownership garantita da companyProcedure.
   */
  updateProfile: companyProcedure
    .input(
      z.object({
        description: z.string().max(1000).optional(),
        phone: z.string().max(20).optional(),
        website: z.string().url('URL non valido').optional().or(z.literal('')),
        logoUrl: z.string().url('URL non valido').optional().or(z.literal('')),
        address: z.string().max(200).optional(),
        streetNumber: z.string().max(20).optional(),
        city: z.string().max(100).optional(),
        province: z
          .string()
          .max(2)
          .optional()
          .transform((v) => v?.toUpperCase()),
        cap: z.string().max(10).optional(),
        lat: z.number().optional(),
        lng: z.number().optional(),
        googlePlaceId: z.string().optional(),
        radiusKm: z.number().int().min(5).max(200).optional(),
        workType: z.enum(['SMALL', 'FULL', 'BOTH']).optional(),
        notificationEmail: z.boolean().optional(),
        notificationWhatsapp: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.company.update({
        where: { userId: ctx.session.user.id },
        data: {
          ...(input.description !== undefined && { description: input.description }),
          ...(input.phone !== undefined && { phone: input.phone }),
          ...(input.website !== undefined && { website: input.website || null }),
          ...(input.logoUrl !== undefined && { logoUrl: input.logoUrl || null }),
          ...(input.address !== undefined && { address: input.address }),
          ...(input.streetNumber !== undefined && { streetNumber: input.streetNumber }),
          ...(input.city !== undefined && { city: input.city }),
          ...(input.province !== undefined && { province: input.province?.toUpperCase() }),
          ...(input.cap !== undefined && { cap: input.cap }),
          ...(input.lat !== undefined && { lat: input.lat }),
          ...(input.lng !== undefined && { lng: input.lng }),
          ...(input.googlePlaceId !== undefined && { googlePlaceId: input.googlePlaceId }),
          ...(input.radiusKm !== undefined && { radiusKm: input.radiusKm }),
          ...(input.workType !== undefined && { workType: input.workType }),
          ...(input.notificationEmail !== undefined && {
            notificationEmail: input.notificationEmail,
          }),
          ...(input.notificationWhatsapp !== undefined && {
            notificationWhatsapp: input.notificationWhatsapp,
          }),
        },
      })
    }),

  /**
   * Segna tutte le notifiche IN_APP non lette dell'utente come lette.
   */
  markAllNotificationsRead: companyProcedure.mutation(async ({ ctx }) => {
    await ctx.db.notification.updateMany({
      where: {
        userId: ctx.session.user.id,
        channel: 'IN_APP',
        readAt: null,
      },
      data: { readAt: new Date() },
    })

    return { ok: true }
  }),

  /**
   * Segna una singola notifica come letta.
   */
  markNotificationRead: companyProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.notification.updateMany({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
          channel: 'IN_APP',
          readAt: null,
        },
        data: { readAt: new Date() },
      })

      return { ok: true }
    }),

  /**
   * Sostituisce categorie e servizi dell'impresa.
   *
   * Usato nell'area profilo, non nel register leggero.
   * Qui i servizi possono essere configurati in modo completo.
   */
  updateCategories: companyProcedure
    .input(
      z.object({
        categoriaIds: z.array(z.string()).min(1, 'Seleziona almeno una categoria'),
        servizioIds: z.array(z.string()).optional().default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const company = await ctx.db.company.findUnique({
        where: { userId: ctx.session.user.id },
        select: {
          id: true,
          categories: { select: { categoriaId: true } },
          services: { select: { servizioId: true } },
        },
      })

      if (!company) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      const { categoriaIds, servizioIds } = await validateCompanyTaxonomySelection(
        ctx.db,
        input.categoriaIds,
        input.servizioIds ?? [],
      )

      const existingCategoryIds = new Set(
        company.categories.map((category) => category.categoriaId),
      )
      const existingServiceIds = new Set(
        company.services.map((service) => service.servizioId),
      )

      const categoriaIdsToAdd = categoriaIds.filter(
        (categoriaId) => !existingCategoryIds.has(categoriaId),
      )

      const categoriaIdsToRemove = company.categories
        .map((category) => category.categoriaId)
        .filter((categoriaId) => !categoriaIds.includes(categoriaId))

      const servizioIdsToAdd = servizioIds.filter(
        (servizioId) => !existingServiceIds.has(servizioId),
      )

      const servizioIdsToRemove = company.services
        .map((service) => service.servizioId)
        .filter((servizioId) => !servizioIds.includes(servizioId))

      return ctx.db.$transaction(async (tx: Prisma.TransactionClient) => {
        if (categoriaIdsToRemove.length > 0) {
          await tx.companyCategory.deleteMany({
            where: {
              companyId: company.id,
              categoriaId: { in: categoriaIdsToRemove },
            },
          })
        }

        if (categoriaIdsToAdd.length > 0) {
          await tx.companyCategory.createMany({
            data: categoriaIdsToAdd.map((categoriaId) => ({
              companyId: company.id,
              categoriaId,
            })),
            skipDuplicates: true,
          })
        }

        if (servizioIdsToRemove.length > 0) {
          await tx.companyService.deleteMany({
            where: {
              companyId: company.id,
              servizioId: { in: servizioIdsToRemove },
            },
          })
        }

        if (servizioIdsToAdd.length > 0) {
          await tx.companyService.createMany({
            data: servizioIdsToAdd.map((servizioId) => ({
              companyId: company.id,
              servizioId,
            })),
            skipDuplicates: true,
          })
        }

        return { ok: true }
      })
    }),
})