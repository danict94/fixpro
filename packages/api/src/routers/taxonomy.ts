import { z } from 'zod'
import { createTRPCRouter, publicProcedure } from '../trpc'
import type { prisma } from '@fixpro/db'
import { buildActivePublicShowcaseCompanyWhere } from '../lib/public-showcase-company'
import { expireShowcaseSubscriptions } from '../lib/showcase-subscription'

type SearchTaxonomyOptions = {
  smartSuggestions?: boolean
}

type SearchInterventoResult = {
  id: string
  nome: string
  slug: string
  descrizione: string | null
}

type SearchCategoriaResult = {
  id: string
  nome: string
  slug: string
  settore: {
    id: string
    nome: string
  }
}

type SearchServizioResult = {
  id: string
  nome: string
  slug: string
  categoria: {
    id: string
    nome: string
  }
}

type SearchInterventoInternal = SearchInterventoResult & {
  ordine: number
  alias: string[]
  searchTerms: string[]
}

type SearchCategoriaInternal = SearchCategoriaResult & {
  ordine: number
  alias: string[]
  searchTerms: string[]
}

type SearchServizioInternal = SearchServizioResult & {
  ordine: number
  alias: string[]
  searchTerms: string[]
}

const INTERVENTO_SEARCH_SELECT = {
  id: true,
  nome: true,
  slug: true,
  descrizione: true,
  ordine: true,
  alias: true,
  searchTerms: true,
} as const

const CATEGORIA_SEARCH_SELECT = {
  id: true,
  nome: true,
  slug: true,
  ordine: true,
  alias: true,
  searchTerms: true,
  settore: { select: { id: true, nome: true } },
} as const

const SERVIZIO_SEARCH_SELECT = {
  id: true,
  nome: true,
  slug: true,
  ordine: true,
  alias: true,
  searchTerms: true,
  categoria: { select: { id: true, nome: true } },
} as const

function normalizeSearchText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[â€™']/g, "'")
    .replace(/\s+/g, ' ')
}

function getTokenStems(value: string) {
  return normalizeSearchText(value)
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length >= 3)
    .map((token) => (token.length > 4 ? token.replace(/[aeiou]$/i, '') : token))
}

function uniqueById<T extends { id: string }>(items: T[]) {
  return Array.from(new Map(items.map((item) => [item.id, item])).values())
}

function setBestScore(scores: Map<string, number>, id: string, score: number) {
  scores.set(id, Math.max(scores.get(id) ?? 0, score))
}

function textScore(
  item: { nome: string; slug: string; alias: string[]; searchTerms: string[] },
  normalizedQuery: string,
  queryTokens: string[],
) {
  const name = normalizeSearchText(item.nome)
  const slug = normalizeSearchText(item.slug)
  const values = [item.nome, item.slug, ...item.alias, ...item.searchTerms].map(normalizeSearchText)

  let score = 0

  if (name === normalizedQuery || slug === normalizedQuery) score = Math.max(score, 100)
  if (values.some((value) => value === normalizedQuery)) score = Math.max(score, 90)
  if (name.startsWith(normalizedQuery)) score = Math.max(score, 80)
  if (values.some((value) => value.includes(normalizedQuery))) score = Math.max(score, 70)

  const itemTokens = new Set(getTokenStems(values.join(' ')))
  const overlap = queryTokens.filter((token) => itemTokens.has(token)).length

  if (overlap > 0) score = Math.max(score, 40 + overlap * 10)

  return score
}

function isExactEntityMatch(
  item: { nome: string; slug: string; alias: string[] },
  normalizedQuery: string,
) {
  const name = normalizeSearchText(item.nome)
  const slug = normalizeSearchText(item.slug)
  const aliases = item.alias.map(normalizeSearchText)

  return name === normalizedQuery || slug === normalizedQuery || aliases.includes(normalizedQuery)
}

function rankItems<T extends { id: string; nome: string; ordine: number }>(
  items: T[],
  scores: Map<string, number>,
) {
  return uniqueById(items).sort((a, b) => {
    const scoreDiff = (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0)
    if (scoreDiff !== 0) return scoreDiff

    const orderDiff = a.ordine - b.ordine
    if (orderDiff !== 0) return orderDiff

    return a.nome.localeCompare(b.nome, 'it')
  })
}

function toInterventoResult(item: SearchInterventoInternal): SearchInterventoResult {
  return {
    id: item.id,
    nome: item.nome,
    slug: item.slug,
    descrizione: item.descrizione,
  }
}

function toCategoriaResult(item: SearchCategoriaInternal): SearchCategoriaResult {
  return {
    id: item.id,
    nome: item.nome,
    slug: item.slug,
    settore: item.settore,
  }
}

function toServizioResult(item: SearchServizioInternal): SearchServizioResult {
  return {
    id: item.id,
    nome: item.nome,
    slug: item.slug,
    categoria: item.categoria,
  }
}

export async function searchTaxonomyEntities(
  db: typeof prisma,
  q: string,
  options: SearchTaxonomyOptions = {},
) {
  const query = q.trim()

  if (query.length < 2) {
    return { interventi: [], categorie: [], servizi: [] }
  }

  const normalizedQuery = normalizeSearchText(query)
  const queryTokens = getTokenStems(query)
  const queryVariants = Array.from(new Set([query, query.toLowerCase(), normalizedQuery]))

  const [interventi, categorie, servizi] = await Promise.all([
    db.intervento.findMany({
      where: {
        attivo: true,
        OR: [
          { nome: { contains: query, mode: 'insensitive' } },
          { alias: { hasSome: queryVariants } },
          { searchTerms: { hasSome: queryVariants } },
        ],
      },
      orderBy: { ordine: 'asc' },
      select: INTERVENTO_SEARCH_SELECT,
      take: 10,
    }),
    db.categoria.findMany({
      where: {
        attivo: true,
        OR: [
          { nome: { contains: query, mode: 'insensitive' } },
          { alias: { hasSome: queryVariants } },
          { searchTerms: { hasSome: queryVariants } },
        ],
      },
      orderBy: { ordine: 'asc' },
      select: CATEGORIA_SEARCH_SELECT,
      take: 10,
    }),
    db.servizio.findMany({
      where: {
        attivo: true,
        OR: [
          { nome: { contains: query, mode: 'insensitive' } },
          { alias: { hasSome: queryVariants } },
          { searchTerms: { hasSome: queryVariants } },
        ],
      },
      orderBy: { ordine: 'asc' },
      select: SERVIZIO_SEARCH_SELECT,
      take: 10,
    }),
  ])

  const interventoScores = new Map<string, number>()
  const categoriaScores = new Map<string, number>()
  const servizioScores = new Map<string, number>()

  interventi.forEach((item) =>
    setBestScore(interventoScores, item.id, 1000 + textScore(item, normalizedQuery, queryTokens)),
  )
  categorie.forEach((item) =>
    setBestScore(categoriaScores, item.id, 1000 + textScore(item, normalizedQuery, queryTokens)),
  )
  servizi.forEach((item) =>
    setBestScore(servizioScores, item.id, 1000 + textScore(item, normalizedQuery, queryTokens)),
  )

  if (!options.smartSuggestions) {
    return {
      interventi: rankItems(interventi, interventoScores).map(toInterventoResult),
      categorie: rankItems(categorie, categoriaScores).map(toCategoriaResult),
      servizi: rankItems(servizi, servizioScores).map(toServizioResult),
    }
  }

  const categoriaIds = categorie.map((item) => item.id)
  const servizioIds = servizi.map((item) => item.id)
  const interventoIds = interventi.map((item) => item.id)

  const exactCategoriaIds = new Set(
    categorie
      .filter((item) => isExactEntityMatch(item, normalizedQuery))
      .map((item) => item.id),
  )

  const [
    serviziDaCategorie,
    interventiDaCategorie,
    categorieDaServizi,
    interventiDaServizi,
    categorieDaInterventi,
    serviziDaInterventi,
  ] = await Promise.all([
    categoriaIds.length
      ? db.servizio.findMany({
          where: {
            attivo: true,
            categoriaId: { in: categoriaIds },
          },
          orderBy: { ordine: 'asc' },
          select: SERVIZIO_SEARCH_SELECT,
          take: 20,
        })
      : [],

    categoriaIds.length
      ? db.intervento.findMany({
          where: {
            attivo: true,
            matchingCategorie: {
              some: {
                attivo: true,
                categoriaId: { in: categoriaIds },
              },
            },
          },
          orderBy: { ordine: 'asc' },
          select: INTERVENTO_SEARCH_SELECT,
          take: 20,
        })
      : [],

    servizioIds.length
      ? db.categoria.findMany({
          where: {
            attivo: true,
            servizi: {
              some: {
                id: { in: servizioIds },
                attivo: true,
              },
            },
          },
          orderBy: { ordine: 'asc' },
          select: CATEGORIA_SEARCH_SELECT,
          take: 10,
        })
      : [],

    servizioIds.length
      ? db.intervento.findMany({
          where: {
            attivo: true,
            matchingServizi: {
              some: {
                attivo: true,
                servizioId: { in: servizioIds },
              },
            },
          },
          orderBy: { ordine: 'asc' },
          select: INTERVENTO_SEARCH_SELECT,
          take: 20,
        })
      : [],

    interventoIds.length
      ? db.categoria.findMany({
          where: {
            attivo: true,
            matchingInterventi: {
              some: {
                attivo: true,
                interventoId: { in: interventoIds },
              },
            },
          },
          orderBy: { ordine: 'asc' },
          select: CATEGORIA_SEARCH_SELECT,
          take: 10,
        })
      : [],

    interventoIds.length
      ? db.servizio.findMany({
          where: {
            attivo: true,
            matchingInterventi: {
              some: {
                attivo: true,
                interventoId: { in: interventoIds },
              },
            },
          },
          orderBy: { ordine: 'asc' },
          select: SERVIZIO_SEARCH_SELECT,
          take: 20,
        })
      : [],
  ])

  const hasExactCategoriaMatch = exactCategoriaIds.size > 0

  serviziDaCategorie.forEach((item) => {
    const base = exactCategoriaIds.has(item.categoria.id) ? 650 : 350
    setBestScore(servizioScores, item.id, base + textScore(item, normalizedQuery, queryTokens))
  })

  interventiDaCategorie.forEach((item) => {
    const base = hasExactCategoriaMatch ? 650 : 350
    setBestScore(interventoScores, item.id, base + textScore(item, normalizedQuery, queryTokens))
  })

  categorieDaServizi.forEach((item) =>
    setBestScore(categoriaScores, item.id, 450 + textScore(item, normalizedQuery, queryTokens)),
  )

  interventiDaServizi.forEach((item) =>
    setBestScore(interventoScores, item.id, 550 + textScore(item, normalizedQuery, queryTokens)),
  )

  categorieDaInterventi.forEach((item) =>
    setBestScore(categoriaScores, item.id, 450 + textScore(item, normalizedQuery, queryTokens)),
  )

  serviziDaInterventi.forEach((item) =>
    setBestScore(servizioScores, item.id, 500 + textScore(item, normalizedQuery, queryTokens)),
  )

  const rankedInterventi = rankItems(
    [...interventi, ...interventiDaCategorie, ...interventiDaServizi],
    interventoScores,
  )
  const rankedCategorie = rankItems(
    [...categorie, ...categorieDaServizi, ...categorieDaInterventi],
    categoriaScores,
  )
  const rankedServizi = rankItems(
    [...servizi, ...serviziDaCategorie, ...serviziDaInterventi],
    servizioScores,
  )

  return {
    interventi: rankedInterventi.slice(0, 6).map(toInterventoResult),
    categorie: rankedCategorie.slice(0, 3).map(toCategoriaResult),
    servizi: rankedServizi.slice(0, 5).map(toServizioResult),
  }
}

export const taxonomyRouter = createTRPCRouter({
  getSettori: publicProcedure.query(({ ctx }) => {
    return ctx.db.settore.findMany({
      where: { attivo: true },
      orderBy: { ordine: 'asc' },
      include: {
        categorie: {
          where: { attivo: true },
          orderBy: { ordine: 'asc' },
          include: {
            servizi: {
              where: { attivo: true },
              orderBy: { ordine: 'asc' },
            },
          },
        },
      },
    })
  }),

  /**
   * Risolve uno slug pubblico con precedenza conservativa:
   * settore -> categoria -> intervento -> servizio.
   * Usato dalle pagine pubbliche /[slug]/.
   */
  getBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ ctx, input }) => {
    const now = new Date()

    await expireShowcaseSubscriptions(ctx.db)

    const settore = await ctx.db.settore.findUnique({
      where: { slug: input.slug },
      include: {
        categorie: {
          where: { attivo: true },
          orderBy: { ordine: 'asc' },
          include: {
            _count: {
              select: {
                companies: {
                  where: {
                    company: buildActivePublicShowcaseCompanyWhere({ now }),
                  },
                },
              },
            },
          },
        },
      },
    })

    if (settore) return { type: 'settore' as const, settore }

    const categoria = await ctx.db.categoria.findUnique({
      where: { slug: input.slug },
      include: {
        settore: { select: { id: true, nome: true, slug: true } },
        _count: {
          select: {
            companies: {
              where: {
                company: buildActivePublicShowcaseCompanyWhere({ now }),
              },
            },
          },
        },
      },
    })

    if (categoria) return { type: 'categoria' as const, categoria }

    const intervento = await ctx.db.intervento.findUnique({
      where: { slug: input.slug },
      include: {
        matchingCategorie: {
          where: { attivo: true, categoria: { attivo: true } },
          orderBy: { priorita: 'asc' },
          include: {
            categoria: {
              select: {
                id: true,
                nome: true,
                slug: true,
                settoreId: true,
                settore: { select: { id: true, nome: true, slug: true } },
              },
            },
          },
        },
        matchingServizi: {
          where: { attivo: true, servizio: { attivo: true } },
          orderBy: { priorita: 'asc' },
          include: {
            servizio: {
              select: {
                id: true,
                nome: true,
                slug: true,
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
          },
        },
      },
    })

    if (intervento) return { type: 'intervento' as const, intervento }

    const servizio = await ctx.db.servizio.findUnique({
      where: { slug: input.slug },
      select: {
        id: true,
        nome: true,
        slug: true,
        categoria: {
          select: {
            id: true,
            nome: true,
            slug: true,
            settore: { select: { id: true, nome: true, slug: true } },
          },
        },
      },
    })

    if (servizio) return { type: 'servizio' as const, servizio }

    return null
  }),

  /** Lista imprese per una categoria, con filtro provincia opzionale. */
  getImpreseByCategoria: publicProcedure
    .input(
      z.object({
        categoriaId: z.string(),
        province: z.string().optional(),
        take: z.number().int().min(1).max(50).default(24),
      }),
    )
    .query(async ({ ctx, input }) => {
      await expireShowcaseSubscriptions(ctx.db)

      return ctx.db.company.findMany({
        where: {
          ...buildActivePublicShowcaseCompanyWhere({
            province: input.province,
          }),
          categories: { some: { categoriaId: input.categoriaId } },
        },
        select: {
          id: true,
          slug: true,
          ragioneSociale: true,
          description: true,
          city: true,
          province: true,
          verified: true,
          categories: {
            select: { categoria: { select: { nome: true, slug: true } } },
          },
        },
        orderBy: [
          { showcase: { plan: { tier: 'desc' } } },
          { verified: 'desc' },
          { createdAt: 'desc' },
        ],
        take: input.take,
      })
    }),

  /** Province distinte che hanno imprese in una determinata categoria (per link zona). */
  getProvinceByCategoria: publicProcedure
    .input(z.object({ categoriaId: z.string() }))
    .query(async ({ ctx, input }) => {
      await expireShowcaseSubscriptions(ctx.db)

      const rows = await ctx.db.company.findMany({
        where: {
          ...buildActivePublicShowcaseCompanyWhere(),
          province: { not: null },
          categories: { some: { categoriaId: input.categoriaId } },
        },
        select: { province: true, city: true },
        distinct: ['province'],
        orderBy: { province: 'asc' },
      })

      return rows
        .filter((r): r is { province: string; city: string | null } => r.province !== null)
        .map((r) => ({ province: r.province, city: r.city }))
    }),

  /** Profilo pubblico impresa per slug. */
  getPublicProfile: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      await expireShowcaseSubscriptions(ctx.db)

      return ctx.db.company.findFirst({
        where: buildActivePublicShowcaseCompanyWhere({ slug: input.slug }),
        select: {
          id: true,
          slug: true,
          ragioneSociale: true,
          description: true,
          city: true,
          province: true,
          verified: true,
          status: true,
          createdAt: true,
          categories: {
            select: {
              categoria: {
                select: {
                  nome: true,
                  slug: true,
                  settore: { select: { nome: true } },
                },
              },
            },
          },
        },
      })
    }),

  /** Tutti gli slug per generateStaticParams. */
  getAllPublicSlugs: publicProcedure.query(async ({ ctx }) => {
    await expireShowcaseSubscriptions(ctx.db)

    const [settori, categorie, interventi, servizi, imprese] = await Promise.all([
      ctx.db.settore.findMany({ where: { attivo: true }, select: { slug: true } }),
      ctx.db.categoria.findMany({ where: { attivo: true }, select: { slug: true } }),
      ctx.db.intervento.findMany({ where: { attivo: true }, select: { slug: true } }),
      ctx.db.servizio.findMany({ where: { attivo: true }, select: { slug: true } }),
      ctx.db.company.findMany({
        where: buildActivePublicShowcaseCompanyWhere(),
        select: { slug: true },
      }),
    ])

    return { settori, categorie, interventi, servizi, imprese }
  }),

  /** Lista tutti gli interventi cliente attivi (tassonomia lato domanda). */
  getInterventi: publicProcedure.query(({ ctx }) => {
    return ctx.db.intervento.findMany({
      where: { attivo: true },
      orderBy: { ordine: 'asc' },
      select: {
        id: true,
        nome: true,
        slug: true,
        descrizione: true,
        alias: true,
        searchTerms: true,
        matchingCategorie: {
          where: { attivo: true, categoria: { attivo: true } },
          orderBy: { priorita: 'asc' },
          select: {
            categoriaId: true,
            priorita: true,
            isPrimary: true,
            categoria: {
              select: {
                id: true,
                nome: true,
                slug: true,
                settoreId: true,
                settore: { select: { id: true, nome: true, slug: true } },
              },
            },
          },
        },
        matchingServizi: {
          where: { attivo: true, servizio: { attivo: true } },
          orderBy: { priorita: 'asc' },
          select: {
            servizioId: true,
            priorita: true,
          },
        },
      },
    })
  }),

  /** Dettaglio intervento con categorie e servizi compatibili. */
  getIntervento: publicProcedure.input(z.object({ slug: z.string() })).query(({ ctx, input }) => {
    return ctx.db.intervento.findUnique({
      where: { slug: input.slug },
      include: {
        matchingCategorie: {
          where: { attivo: true },
          orderBy: { priorita: 'asc' },
          include: {
            categoria: {
              select: {
                id: true,
                nome: true,
                slug: true,
                settore: { select: { nome: true } },
              },
            },
          },
        },
        matchingServizi: {
          where: { attivo: true },
          orderBy: { priorita: 'asc' },
          include: {
            servizio: { select: { id: true, nome: true, slug: true } },
          },
        },
      },
    })
  }),

  /**
   * Ricerca cross-entità per hero/funnel pubblico.
   * Di default searchTaxonomyEntities resta conservativa per i filtri interni;
   * questo endpoint abilita smartSuggestions per espandere i match tramite relazioni SSOT.
   */
  searchTaxonomy: publicProcedure
    .input(z.object({ q: z.string().min(2).max(100) }))
    .query(async ({ ctx, input }) => {
      return searchTaxonomyEntities(ctx.db, input.q.trim(), { smartSuggestions: true })
    }),
})
