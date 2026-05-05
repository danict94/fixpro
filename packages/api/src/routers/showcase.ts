/**
 * showcase.ts — Router Vetrina Premium
 *
 * Struttura sub-router:
 *   public.*    → profili pubblici e listing vetrina (no auth)
 *   company.*   → gestione vetrina lato impresa
 *   admin.*     → gestione piani, subscription e visibilità lato admin
 */

import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, publicProcedure, companyProcedure, superAdminProcedure } from '../trpc'
import type { prisma } from '@fixpro/db'
import { calculateShowcaseContactCost, isShowcaseSource } from '../lib/showcase-pricing'
import { expireShowcaseSubscriptions } from '../lib/showcase-subscription'
import { buildActivePublicShowcaseCompanyWhere } from '../lib/public-showcase-company'
import { isActiveShowcase } from '../lib/showcase-visibility'
// ─── Campi pubblici di un profilo vetrina ────────────────────────────────────

const PUBLIC_COMPANY_SELECT = {
  id: true,
  slug: true,
  ragioneSociale: true,
  description: true,
  descriptionExtended: true,
  logoUrl: true,
  coverImageUrl: true,
  galleryImages: true,
  phone: true,
  city: true,
  province: true,
  verified: true,
  status: true,
  createdAt: true,
  categories: {
    select: {
      categoria: {
        select: {
          id: true,
          nome: true,
          slug: true,
          settore: { select: { id: true, nome: true, slug: true } },
        },
      },
    },
  },
  showcase: {
    select: {
      status: true,
      expiresAt: true,
      plan: {
        select: {
          tier: true,
          name: true,
          description: true,
        },
      },
    },
  },
  reviews: {
    where: { published: true },
    orderBy: { createdAt: 'desc' as const },
    take: 10,
    select: {
      id: true,
      rating: true,
      body: true,
      createdAt: true,
    },
  },
}

// ─── Helper: conta contatti vetrina gratuiti usati questo mese ───────────────

async function countFreeShowcaseContactsThisMonth(
  db: Pick<typeof prisma, 'requestPurchase'>,
  companyId: string,
): Promise<number> {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  return db.requestPurchase.count({
    where: {
      companyId,
      contactSourceType: { not: 'MARKETPLACE_REQUEST' },
      discountReason: 'SHOWCASE_PRO_FREE',
      purchasedAt: { gte: startOfMonth },
    },
  })
}

// ─── Router principale ───────────────────────────────────────────────────────

export const showcaseRouter = createTRPCRouter({
  // ─── PUBLIC ───────────────────────────────────────────────────────────────

  public: createTRPCRouter({
    /** Lista professionisti in evidenza: solo imprese APPROVED con vetrina ACTIVE non scaduta. */
    listFeatured: publicProcedure
      .input(
        z.object({
          take: z.number().int().min(1).max(50).default(12),
          province: z.string().optional(),
          categoriaSlug: z.string().optional(),
        }),
      )
      .query(async ({ ctx, input }) => {
        await expireShowcaseSubscriptions(ctx.db)

        const companies = await ctx.db.company.findMany({
          where: buildActivePublicShowcaseCompanyWhere({
            province: input.province,
            categoriaSlug: input.categoriaSlug,
          }),
          orderBy: [
            { showcase: { plan: { tier: 'desc' } } },
            { verified: 'desc' },
            { updatedAt: 'desc' },
          ],
          take: input.take,
          select: PUBLIC_COMPANY_SELECT,
        })

        return companies.map((company) => ({
          ...company,
          avgRating:
            company.reviews.length > 0
              ? Math.round(
                  (company.reviews.reduce((sum, review) => sum + review.rating, 0) /
                    company.reviews.length) *
                    10,
                ) / 10
              : null,
          reviewCount: company.reviews.length,
        }))
      }),

    /** Profilo pubblico singola impresa per slug: solo APPROVED con vetrina ACTIVE non scaduta. */
    getProfile: publicProcedure
      .input(z.object({ slug: z.string().min(1) }))
      .query(async ({ ctx, input }) => {
        await expireShowcaseSubscriptions(ctx.db)

        const company = await ctx.db.company.findFirst({
          where: buildActivePublicShowcaseCompanyWhere({
            slug: input.slug,
          }),
          select: PUBLIC_COMPANY_SELECT,
        })

        if (!company) {
          throw new TRPCError({ code: 'NOT_FOUND' })
        }

        const avgRating =
          company.reviews.length > 0
            ? Math.round(
                (company.reviews.reduce((sum, review) => sum + review.rating, 0) /
                  company.reviews.length) *
                  10,
              ) / 10
            : null

        return {
          ...company,
          descriptionExtended: company.descriptionExtended,
          coverImageUrl: company.coverImageUrl,
          galleryImages: company.galleryImages,
          hasActiveShowcase: true,
          avgRating,
          reviewCount: company.reviews.length,
        }
      }),
  }),

  // ─── COMPANY ──────────────────────────────────────────────────────────────

  company: createTRPCRouter({
    /** Stato vetrina dell'impresa autenticata */
    getStatus: companyProcedure.query(async ({ ctx }) => {
      const companyRef = await ctx.db.company.findUniqueOrThrow({
        where: { userId: ctx.session.user.id },
        select: { id: true },
      })

      await expireShowcaseSubscriptions(ctx.db, { companyId: companyRef.id })

      const company = await ctx.db.company.findUniqueOrThrow({
        where: { userId: ctx.session.user.id },
        select: {
          id: true,
          slug: true,
          verified: true,
          showcase: {
            select: {
              id: true,
              status: true,
              startsAt: true,
              expiresAt: true,
              plan: true,
            },
          },
        },
      })

      const now = new Date()
      const isActive = isActiveShowcase(company.showcase, now)

      const showcaseContactsTotal = await ctx.db.requestPurchase.count({
        where: {
          companyId: company.id,
          contactSourceType: { not: 'MARKETPLACE_REQUEST' },
        },
      })

      const freeContacts = await ctx.db.requestPurchase.count({
        where: {
          companyId: company.id,
          contactSourceType: { not: 'MARKETPLACE_REQUEST' },
          discountReason: 'SHOWCASE_PRO_FREE',
        },
      })

      return {
        company,
        isActive,
        showcaseContactsTotal,
        freeContactsCount: freeContacts,
      }
    }),

    /** Piani disponibili per l'acquisto */
    listPlans: companyProcedure.query(async ({ ctx }) => {
      return ctx.db.showcasePlan.findMany({
        where: { active: true },
        orderBy: { tier: 'asc' },
      })
    }),

    /** Aggiorna campi del profilo pubblico: logo libero, premium fields solo con vetrina attiva. */
    updateProfile: companyProcedure
      .input(
        z.object({
          descriptionExtended: z.string().max(2000).optional(),
          logoUrl: z.string().url().optional().or(z.literal('')),
          coverImageUrl: z.string().url().optional().or(z.literal('')),
          galleryImages: z.array(z.string().url()).max(10).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const company = await ctx.db.company.findUniqueOrThrow({
          where: { userId: ctx.session.user.id },
          select: { id: true },
        })

        const hasPremiumFields =
          input.descriptionExtended !== undefined ||
          input.coverImageUrl !== undefined ||
          input.galleryImages !== undefined

        if (hasPremiumFields) {
          await expireShowcaseSubscriptions(ctx.db, { companyId: company.id })

          const sub = await ctx.db.showcaseSubscription.findUnique({
            where: { companyId: company.id },
            select: { status: true, expiresAt: true },
          })

          const isActive = isActiveShowcase(sub)

          if (!isActive) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: 'Cover, gallery e descrizione estesa richiedono una Vetrina Premium attiva.',
            })
          }
        }

        await ctx.db.company.update({
          where: { id: company.id },
          data: {
            ...(input.descriptionExtended !== undefined
              ? { descriptionExtended: input.descriptionExtended }
              : {}),
            ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl || null } : {}),
            ...(input.coverImageUrl !== undefined
              ? { coverImageUrl: input.coverImageUrl || null }
              : {}),
            ...(input.galleryImages !== undefined ? { galleryImages: input.galleryImages } : {}),
          },
        })

        return { ok: true }
      }),

    /** Calcola il costo effettivo di un contatto da vetrina */
    previewContactCost: companyProcedure
      .input(z.object({ baseCredits: z.number().int().min(0) }))
      .query(async ({ ctx, input }) => {
        const companyRef = await ctx.db.company.findUniqueOrThrow({
          where: { userId: ctx.session.user.id },
          select: { id: true },
        })

        await expireShowcaseSubscriptions(ctx.db, { companyId: companyRef.id })

        const company = await ctx.db.company.findUniqueOrThrow({
          where: { userId: ctx.session.user.id },
          select: {
            id: true,
            showcase: {
              select: {
                status: true,
                expiresAt: true,
                plan: true,
              },
            },
          },
        })

        const sub = company.showcase

        if (!sub || !isActiveShowcase(sub)) {
          return {
            baseCredits: input.baseCredits,
            finalCredits: input.baseCredits,
            savedCredits: 0,
            isFree: false,
            discountLabel: 'Nessuno sconto (vetrina non attiva)',
          }
        }

        const freeUsed = await countFreeShowcaseContactsThisMonth(ctx.db, company.id)

        return calculateShowcaseContactCost({
          baseCredits: input.baseCredits,
          tier: sub.plan.tier,
          freeContactsUsedThisMonth: freeUsed,
          freeContactsQuota: sub.plan.freeContactsPerMonth,
          overQuotaDiscountPercent: sub.plan.overQuotaDiscountPercent,
          discountPercent: sub.plan.discountPercent,
        })
      }),

    /** Statistiche vetrina per la dashboard impresa */
    getStats: companyProcedure.query(async ({ ctx }) => {
      const company = await ctx.db.company.findUniqueOrThrow({
        where: { userId: ctx.session.user.id },
        select: { id: true },
      })

      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const [totalContacts, monthContacts, publishedReviews] = await Promise.all([
        ctx.db.requestPurchase.count({
          where: {
            companyId: company.id,
            contactSourceType: { not: 'MARKETPLACE_REQUEST' },
          },
        }),
        ctx.db.requestPurchase.count({
          where: {
            companyId: company.id,
            contactSourceType: { not: 'MARKETPLACE_REQUEST' },
            purchasedAt: { gte: startOfMonth },
          },
        }),
        ctx.db.review.findMany({
          where: { companyId: company.id, published: true },
          select: { rating: true },
        }),
      ])

      const avgRating =
        publishedReviews.length > 0
          ? Math.round(
              (publishedReviews.reduce((sum, review) => sum + review.rating, 0) /
                publishedReviews.length) *
                10,
            ) / 10
          : null

      return {
        totalShowcaseContacts: totalContacts,
        monthShowcaseContacts: monthContacts,
        reviewCount: publishedReviews.length,
        avgRating,
      }
    }),
  }),

  // ─── ADMIN ────────────────────────────────────────────────────────────────

  admin: createTRPCRouter({
    /** Lista piani vetrina */
    listPlans: superAdminProcedure.query(async ({ ctx }) => {
      return ctx.db.showcasePlan.findMany({ orderBy: { tier: 'asc' } })
    }),

    /** Crea o aggiorna un piano vetrina */
    upsertPlan: superAdminProcedure
      .input(
        z.object({
          tier: z.enum(['BASE', 'PLUS', 'PRO']),
          name: z.string().min(1).max(100),
          description: z.string().optional(),
          monthlyPriceCents: z.number().int().min(0),
          yearlyPriceCents: z.number().int().min(0).optional(),
          discountPercent: z.number().int().min(0).max(100),
          freeContactsPerMonth: z.number().int().min(0).default(0),
          overQuotaDiscountPercent: z.number().int().min(0).max(100).default(0),
          active: z.boolean().default(true),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        return ctx.db.showcasePlan.upsert({
          where: { tier: input.tier },
          create: input,
          update: input,
        })
      }),

    /** Lista subscription */
    listSubscriptions: superAdminProcedure
      .input(
        z.object({
          status: z.enum(['ACTIVE', 'EXPIRED', 'CANCELLED']).optional(),
          take: z.number().int().min(1).max(100).default(50),
          skip: z.number().int().min(0).default(0),
        }),
      )
      .query(async ({ ctx, input }) => {
        await expireShowcaseSubscriptions(ctx.db)

        return ctx.db.showcaseSubscription.findMany({
          where: input.status ? { status: input.status } : undefined,
          orderBy: { createdAt: 'desc' },
          take: input.take,
          skip: input.skip,
          include: {
            plan: true,
            company: {
              select: {
                id: true,
                ragioneSociale: true,
                slug: true,
                verified: true,
                status: true,
              },
            },
          },
        })
      }),

    /** Assegna manualmente una subscription vetrina a un'impresa */
    assignSubscription: superAdminProcedure
      .input(
        z.object({
          companyId: z.string(),
          tier: z.enum(['BASE', 'PLUS', 'PRO']),
          months: z.number().int().min(1).max(24).default(1),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const plan = await ctx.db.showcasePlan.findUniqueOrThrow({
          where: { tier: input.tier },
        })

        await expireShowcaseSubscriptions(ctx.db, { companyId: input.companyId })

        const existing = await ctx.db.showcaseSubscription.findUnique({
          where: { companyId: input.companyId },
          select: { expiresAt: true, status: true },
        })

        const now = new Date()
        const activeExistingExpiresAt =
          existing && isActiveShowcase(existing, now) ? existing.expiresAt : null

        const anchor = activeExistingExpiresAt ? new Date(activeExistingExpiresAt) : new Date(now)

        const expiresAt = new Date(anchor)
        expiresAt.setMonth(expiresAt.getMonth() + input.months)

        await ctx.db.showcaseSubscription.upsert({
          where: { companyId: input.companyId },
          create: {
            companyId: input.companyId,
            planId: plan.id,
            status: 'ACTIVE',
            startsAt: now,
            expiresAt,
          },
          update: {
            planId: plan.id,
            status: 'ACTIVE',
            startsAt: now,
            expiresAt,
          },
        })

        return { ok: true }
      }),

    /** Revoca subscription vetrina */
    revokeSubscription: superAdminProcedure
      .input(z.object({ companyId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await ctx.db.showcaseSubscription.update({
          where: { companyId: input.companyId },
          data: { status: 'CANCELLED' },
        })

        return { ok: true }
      }),

    /** Pubblica o nasconde una recensione */
    setReviewPublished: superAdminProcedure
      .input(z.object({ reviewId: z.string(), published: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        await ctx.db.review.update({
          where: { id: input.reviewId },
          data: { published: input.published },
        })

        return { ok: true }
      }),
  }),
})

// Re-export per uso in showcase-pricing
export { isShowcaseSource, calculateShowcaseContactCost }
