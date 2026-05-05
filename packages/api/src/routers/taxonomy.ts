import { z } from 'zod'
import { createTRPCRouter, publicProcedure } from '../trpc'
import type { prisma } from '@fixpro/db'
import { buildActivePublicShowcaseCompanyWhere } from '../lib/public-showcase-company'
import { expireShowcaseSubscriptions } from '../lib/showcase-subscription'

export async function searchTaxonomyEntities(db: typeof prisma, q: string) {
  return Promise.all([
    db.intervento.findMany({
      where: {
        attivo: true,
        OR: [
          { nome: { contains: q, mode: 'insensitive' } },
          { alias: { has: q } },
          { searchTerms: { has: q } },
        ],
      },
      orderBy: { ordine: 'asc' },
      select: { id: true, nome: true, slug: true, descrizione: true },
      take: 10,
    }),
    db.categoria.findMany({
      where: {
        attivo: true,
        OR: [
          { nome: { contains: q, mode: 'insensitive' } },
          { alias: { has: q } },
          { searchTerms: { has: q } },
        ],
      },
      orderBy: { ordine: 'asc' },
      select: {
        id: true,
        nome: true,
        slug: true,
        settore: { select: { id: true, nome: true } },
      },
      take: 10,
    }),
    db.servizio.findMany({
      where: {
        attivo: true,
        OR: [
          { nome: { contains: q, mode: 'insensitive' } },
          { alias: { has: q } },
          { searchTerms: { has: q } },
        ],
      },
      orderBy: { ordine: 'asc' },
      select: {
        id: true,
        nome: true,
        slug: true,
        categoria: { select: { id: true, nome: true } },
      },
      take: 10,
    }),
  ]).then(([interventi, categorie, servizi]) => ({
    interventi,
    categorie,
    servizi,
  }))
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
   * Ricerca cross-entita: interventi, categorie, servizi.
   * Cerca su nome, alias e searchTerms in modo case-insensitive.
   * Restituisce un oggetto con tre array ordinati per rilevanza.
   */
  searchTaxonomy: publicProcedure
    .input(z.object({ q: z.string().min(2).max(100) }))
    .query(async ({ ctx, input }) => {
      return searchTaxonomyEntities(ctx.db, input.q.trim())
    }),
})