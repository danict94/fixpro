import { z } from 'zod'
import type { Prisma } from '@fixpro/db'
import { createTRPCRouter, publicProcedure } from '../trpc'
import { buildActivePublicShowcaseCompanyWhere } from '../lib/public-showcase-company'

const MATCHING_COMPANY_SELECT = {
  id: true,
  slug: true,
  ragioneSociale: true,
  city: true,
  province: true,
  lat: true,
  lng: true,
  radiusKm: true,
  verified: true,
  updatedAt: true,
  showcase: {
    select: {
      plan: {
        select: {
          tier: true,
        },
      },
    },
  },
  reviews: {
    where: { published: true },
    select: { rating: true },
  },
} as const

type MatchingCompany = Prisma.CompanyGetPayload<{
  select: typeof MATCHING_COMPANY_SELECT
}>

type MatchingInterventoCategoryRow = {
  categoriaId: string
}

type ShowcaseTier = 'BASE' | 'PLUS' | 'PRO'

type PreviewCompany = {
  id: string
  slug: string
  ragioneSociale: string
  city: string | null
  province: string | null
  avgRating: number | null
  reviewCount: number
  showcaseTier: ShowcaseTier | null
  distanceKm: number | null
}

function calculateDistanceKm(params: {
  originLat: number
  originLng: number
  targetLat: number
  targetLng: number
}): number {
  const earthRadiusKm = 6371
  const deltaLat = ((params.targetLat - params.originLat) * Math.PI) / 180
  const deltaLng = ((params.targetLng - params.originLng) * Math.PI) / 180

  const originLatRad = (params.originLat * Math.PI) / 180
  const targetLatRad = (params.targetLat * Math.PI) / 180

  const haversineValue =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(originLatRad) *
      Math.cos(targetLatRad) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2)

  return earthRadiusKm * (2 * Math.atan2(Math.sqrt(haversineValue), Math.sqrt(1 - haversineValue)))
}

function getShowcaseTierRank(tier: ShowcaseTier | null): number {
  if (tier === 'PRO') return 3
  if (tier === 'PLUS') return 2
  if (tier === 'BASE') return 1

  return 0
}

function getAverageRating(reviews: { rating: number }[]): number | null {
  if (reviews.length === 0) {
    return null
  }

  const total = reviews.reduce((sum: number, review: { rating: number }) => sum + review.rating, 0)

  return Math.round((total / reviews.length) * 10) / 10
}

function mapPreviewCompany(
  company: MatchingCompany & { distanceKm: number | null },
): PreviewCompany {
  const showcaseTier = company.showcase?.plan?.tier ?? null

  return {
    id: company.id,
    slug: company.slug,
    ragioneSociale: company.ragioneSociale,
    city: company.city,
    province: company.province,
    avgRating: getAverageRating(company.reviews),
    reviewCount: company.reviews.length,
    showcaseTier,
    distanceKm: company.distanceKm,
  }
}

export const matchingRouter = createTRPCRouter({
  /**
   * Preview aziende per wizard cliente.
   *
   * Responsabilità:
   * - leggere aziende pubblicamente contattabili come vetrina
   * - filtrare per categoria/intervento
   * - applicare geo leggera
   * - restituire output pubblico leggero
   *
   * Non deve gestire:
   * - acquisti
   * - pricing
   * - lifecycle richiesta
   * - dati sensibili
   */
  previewCompanies: publicProcedure
    .input(
      z.object({
        interventoId: z.string().trim().min(1),
        categoriaId: z.string().trim().min(1).optional(),
        province: z
          .string()
          .trim()
          .max(2)
          .optional()
          .transform((value) => value?.toUpperCase()),
        lat: z.number().optional(),
        lng: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const normalizedCategoriaId = input.categoriaId?.trim() || null
      const geo =
        input.lat !== undefined && input.lng !== undefined
          ? { lat: input.lat, lng: input.lng }
          : null
      const hasPreciseGeo = geo !== null

      const compatibleCategoryRows = await ctx.db.matchingInterventoCat.findMany({
        where: {
          interventoId: input.interventoId,
          attivo: true,
        },
        orderBy: [{ isPrimary: 'desc' }, { priorita: 'asc' }],
        select: {
          categoriaId: true,
        },
      })

      const compatibleCategoriaIds = compatibleCategoryRows.map(
        (row: MatchingInterventoCategoryRow) => row.categoriaId,
      )

      const effectiveCategoriaIds =
        normalizedCategoriaId !== null ? [normalizedCategoriaId] : compatibleCategoriaIds

      if (effectiveCategoriaIds.length === 0) {
        return []
      }

      const where: Prisma.CompanyWhereInput = {
        ...buildActivePublicShowcaseCompanyWhere({
          province: hasPreciseGeo ? undefined : input.province,
        }),
        categories: {
          some: {
            categoriaId: {
              in: effectiveCategoriaIds,
            },
          },
        },
      }

      const companies = await ctx.db.company.findMany({
        where,
        select: MATCHING_COMPANY_SELECT,
        orderBy: [{ verified: 'desc' }, { updatedAt: 'desc' }],
        take: 80,
      })

      const companiesWithDistance = companies.map((company: MatchingCompany) => {
        const distanceKm =
          geo !== null && company.lat !== null && company.lng !== null
            ? calculateDistanceKm({
                originLat: geo.lat,
                originLng: geo.lng,
                targetLat: company.lat,
                targetLng: company.lng,
              })
            : null

        return {
          ...company,
          distanceKm,
        }
      })

      const geoFilteredCompanies = companiesWithDistance.filter((company) => {
        if (!hasPreciseGeo) {
          return true
        }

        if (company.distanceKm === null) {
          return input.province ? company.province === input.province : true
        }

        return company.distanceKm <= company.radiusKm
      })

      const sortedCompanies = geoFilteredCompanies.sort((left, right) => {
        const leftTierRank = getShowcaseTierRank(left.showcase?.plan?.tier ?? null)
        const rightTierRank = getShowcaseTierRank(right.showcase?.plan?.tier ?? null)

        if (rightTierRank !== leftTierRank) {
          return rightTierRank - leftTierRank
        }

        if (left.distanceKm !== null && right.distanceKm !== null) {
          return left.distanceKm - right.distanceKm
        }

        if (left.distanceKm !== null && right.distanceKm === null) {
          return -1
        }

        if (left.distanceKm === null && right.distanceKm !== null) {
          return 1
        }

        if (Number(right.verified) !== Number(left.verified)) {
          return Number(right.verified) - Number(left.verified)
        }

        return right.updatedAt.getTime() - left.updatedAt.getTime()
      })

      return sortedCompanies.slice(0, 20).map((company) => mapPreviewCompany(company))
    }),
})
