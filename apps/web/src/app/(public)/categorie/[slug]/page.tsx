export const revalidate = 3600
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { cn, buttonVariants } from '@fixpro/ui'

import { prisma } from '@fixpro/db'
import { SectionShell } from '../../_components/home/section-shell'
import {
  getGroupDetailInterventoSlugs,
  interventiBySlug,
  macroInterventoGroups,
  resolveRequestInterventoSlug,
  type MacroInterventoGroup,
} from '@/lib/taxonomy/interventi'

type InterventoForRow = {
  nome: string
  slug: string
  descrizione: string | null
}

type ServizioForRow = {
  nome: string
  slug: string
  descrizione: string | null
}

type CategoriaPageData = {
  nome: string
  slug: string
  descrizione: string | null
  settore: {
    nome: string
    slug: string
  }
  servizi: ServizioForRow[]
  interventiPrimary: InterventoForRow[]
  interventiSecondary: InterventoForRow[]
}

type CategoriaActionRow =
  | {
      type: 'intervento'
      nome: string
      slug: string
      descrizione: string | null
    }
  | {
      type: 'servizio'
      nome: string
      slug: string
      descrizione: string | null
    }

function getGroupOrNull(slug: string) {
  return macroInterventoGroups.find((group) => group.slug === slug) ?? null
}

function normalizeLabel(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

async function getCategoriaPageData(categoriaSlug: string): Promise<CategoriaPageData | null> {
  const categoria = await prisma.categoria.findFirst({
    where: {
      slug: categoriaSlug,
      attivo: true,
    },
    select: {
      nome: true,
      slug: true,
      descrizione: true,
      settore: {
        select: {
          nome: true,
          slug: true,
        },
      },
      servizi: {
        where: {
          attivo: true,
        },
        orderBy: {
          ordine: 'asc',
        },
        select: {
          nome: true,
          slug: true,
          descrizione: true,
        },
      },
      matchingInterventi: {
        where: {
          attivo: true,
          intervento: {
            attivo: true,
          },
        },
        orderBy: {
          priorita: 'asc',
        },
        select: {
          isPrimary: true,
          priorita: true,
          intervento: {
            select: {
              nome: true,
              slug: true,
              descrizione: true,
              ordine: true,
            },
          },
        },
      },
    },
  })

  if (!categoria) {
    return null
  }

  const sortedMatches = [...categoria.matchingInterventi].sort((a, b) => {
    if (a.priorita !== b.priorita) return a.priorita - b.priorita
    return a.intervento.ordine - b.intervento.ordine
  })

  const interventiPrimary = sortedMatches
    .filter((match) => match.isPrimary)
    .map((match) => ({
      nome: match.intervento.nome,
      slug: match.intervento.slug,
      descrizione: match.intervento.descrizione,
    }))

  const interventiSecondary = sortedMatches
    .filter((match) => !match.isPrimary)
    .map((match) => ({
      nome: match.intervento.nome,
      slug: match.intervento.slug,
      descrizione: match.intervento.descrizione,
    }))

  return {
    nome: categoria.nome,
    slug: categoria.slug,
    descrizione: categoria.descrizione,
    settore: categoria.settore,
    servizi: categoria.servizi,
    interventiPrimary,
    interventiSecondary,
  }
}

function mergeInterventiAndServizi({
  interventi,
  servizi,
}: {
  interventi: InterventoForRow[]
  servizi: ServizioForRow[]
}): CategoriaActionRow[] {
  const rows: CategoriaActionRow[] = []
  const seenNames = new Set<string>()

  for (const intervento of interventi) {
    rows.push({
      type: 'intervento',
      nome: intervento.nome,
      slug: intervento.slug,
      descrizione: intervento.descrizione,
    })

    seenNames.add(normalizeLabel(intervento.nome))
  }

  for (const servizio of servizi) {
    const normalizedName = normalizeLabel(servizio.nome)

    if (seenNames.has(normalizedName)) {
      continue
    }

    rows.push({
      type: 'servizio',
      nome: servizio.nome,
      slug: servizio.slug,
      descrizione:
        servizio.descrizione ?? 'Servizio disponibile per questa categoria professionale.',
    })

    seenNames.add(normalizedName)
  }

  return rows
}

async function getGroupInterventi(group: MacroInterventoGroup): Promise<InterventoForRow[]> {
  const slugs = getGroupDetailInterventoSlugs(group)

  const interventi: InterventoForRow[] = await prisma.intervento.findMany({
    where: { attivo: true },
    select: {
      nome: true,
      slug: true,
      descrizione: true,
    },
  })

  const map = new Map<string, InterventoForRow>(
    interventi.map((i: InterventoForRow) => [i.slug, i]),
  )

  return slugs.flatMap((slug: string): InterventoForRow[] => {
    const intervento = map.get(slug)

    if (intervento) {
      return [
        {
          nome: intervento.nome,
          slug: intervento.slug,
          descrizione: intervento.descrizione,
        },
      ]
    }

    const fallback = interventiBySlug[slug]

    return fallback
      ? [
          {
            nome: fallback.nome,
            slug: fallback.slug,
            descrizione: fallback.descrizione,
          },
        ]
      : []
  })
}

export function generateStaticParams() {
  return macroInterventoGroups.map((group) => ({ slug: group.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const { slug } = params

  const categoria = await getCategoriaPageData(slug).catch((error) => {
    console.error('Errore metadata categoria professionale.', error)
    return null
  })

  if (categoria) {
    return {
      title: `${categoria.nome} | Categorie FixPro`,
      description:
        categoria.descrizione ??
        `Scopri interventi e servizi coperti da ${categoria.nome} su FixPro.`,
    }
  }

  const group = getGroupOrNull(slug)

  if (!group) {
    return {}
  }

  return {
    title: `${group.title} | Categorie FixPro`,
    description: `${group.description} Scegli l'intervento e avvia una richiesta su FixPro.`,
  }
}

export default async function CategoriaDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const categoria = await getCategoriaPageData(slug).catch((error) => {
    console.error('Errore caricamento categoria professionale.', error)
    return null
  })

  if (categoria) {
    return <CategoriaProfessionalePage categoria={categoria} />
  }

  const group = getGroupOrNull(slug)

  if (!group) {
    notFound()
  }

  return <MacroCategoriaPage group={group} />
}

function CategoriaProfessionalePage({ categoria }: { categoria: CategoriaPageData }) {
  const rows = mergeInterventiAndServizi({
    interventi: categoria.interventiPrimary,
    servizi: categoria.servizi,
  })

  return (
    <main>
      <SectionShell tone="default" spacing="xl">
        <nav className="text-muted-foreground flex flex-wrap items-center gap-2 text-[13px] font-medium">
          <Link href="/categorie" className="hover:text-secondary transition">
            Categorie
          </Link>
          <span>/</span>
          <span className="text-secondary">{categoria.nome}</span>
        </nav>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div className="max-w-[760px]">
            <p className="text-primary text-[12px] font-semibold tracking-[0.12em] uppercase">
              Categoria professionale
            </p>

            <h1 className="text-secondary mt-3 text-[34px] leading-[1.04] font-semibold tracking-[-0.045em] sm:text-[44px] lg:text-[52px]">
              {categoria.nome}
            </h1>

            {categoria.descrizione ? (
              <p className="text-muted-foreground mt-4 max-w-[680px] text-[16px] leading-7">
                {categoria.descrizione}
              </p>
            ) : null}

            <p className="text-muted-foreground mt-4 text-[13px] font-medium">
              Settore: <span className="text-secondary">{categoria.settore.nome}</span>
            </p>
          </div>

          <aside className="border-border/70 rounded-[28px] border bg-white/80 p-4 shadow-sm backdrop-blur sm:p-5">
            <p className="text-secondary text-[15px] font-semibold tracking-[-0.01em]">
              Hai bisogno di questo professionista?
            </p>

            <p className="text-muted-foreground mt-2 text-[13px] leading-6">
              Descrivi il lavoro e invia la richiesta ai professionisti più adatti.
            </p>

            <Link
              href={`/richiesta?categoria=${encodeURIComponent(categoria.slug)}`}
              className={cn(
                buttonVariants({ size: 'lg' }),
                'mt-5 w-full justify-center rounded-full',
              )}
            >
              Trova professionisti
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>

            <Link
              href="/categorie"
              className="text-primary hover:text-primary/80 mt-4 inline-flex w-full items-center justify-center gap-2 text-[14px] font-semibold transition"
            >
              Vedi tutte le categorie
              <ArrowRight className="h-4 w-4" />
            </Link>
          </aside>
        </div>

        <section className="mt-12">
          <div className="max-w-[680px]">
            <h2 className="text-secondary text-[26px] leading-[1.12] font-semibold tracking-[-0.03em] sm:text-[32px]">
              Interventi principali e servizi coperti
            </h2>

            <p className="text-muted-foreground mt-3 text-[15px] leading-7">
              Qui trovi le richieste più adatte a questa categoria professionale e i servizi
              dichiarabili collegati. Nel funnel potrai aggiungere dettagli prima di inviare la
              richiesta.
            </p>
          </div>

          {rows.length > 0 ? (
            <div className="divide-border/70 border-border/70 mt-8 max-w-[920px] divide-y border-y">
              {rows.map((row) => (
                <CategoriaActionRow
                  key={`${row.type}-${row.slug}`}
                  row={row}
                  categoriaSlug={categoria.slug}
                />
              ))}
            </div>
          ) : (
            <EmptyCategoriaState categoriaSlug={categoria.slug} />
          )}
        </section>

        {categoria.interventiSecondary.length > 0 ? (
          <section className="border-border/70 mt-16 rounded-[28px] border bg-white px-5 py-7 shadow-sm md:px-7">
            <div className="max-w-[680px]">
              <p className="text-primary text-[12px] font-semibold tracking-[0.12em] uppercase">
                Lavori correlati
              </p>

              <h2 className="text-secondary mt-3 text-[24px] font-semibold tracking-[-0.03em]">
                Lavori complessi dove può essere coinvolto
              </h2>

              <p className="text-muted-foreground mt-3 text-[14px] leading-7">
                In alcuni casi questa categoria professionale può essere coinvolta insieme ad altri
                specialisti. Per questo li mostriamo separati dagli interventi principali.
              </p>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {categoria.interventiSecondary.map((intervento) => (
                <Link
                  key={intervento.slug}
                  href={getInterventoHref(intervento.slug, categoria.slug)}
                  className="border-border/70 hover:border-primary/30 hover:bg-primary/5 rounded-[20px] border bg-[#F6F7FB] px-4 py-4 transition"
                >
                  <p className="text-secondary text-[14px] font-semibold">{intervento.nome}</p>

                  {intervento.descrizione ? (
                    <p className="text-muted-foreground mt-2 line-clamp-2 text-[13px] leading-6">
                      {intervento.descrizione}
                    </p>
                  ) : null}
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </SectionShell>
    </main>
  )
}

async function MacroCategoriaPage({ group }: { group: MacroInterventoGroup }) {
  const interventi = await getGroupInterventi(group)

  const rows = interventi.map(
    (intervento): CategoriaActionRow => ({
      type: 'intervento',
      nome: intervento.nome,
      slug: intervento.slug,
      descrizione: intervento.descrizione,
    }),
  )

  return (
    <main>
      <SectionShell tone="default" spacing="xl">
        <nav className="text-muted-foreground flex flex-wrap items-center gap-2 text-[13px] font-medium">
          <Link href="/categorie" className="hover:text-secondary transition">
            Categorie
          </Link>
          <span>/</span>
          <span className="text-secondary">{group.title}</span>
        </nav>

        <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[760px]">
            <p className="text-primary text-[12px] font-semibold tracking-[0.12em] uppercase">
              Categoria
            </p>

            <h1 className="text-secondary mt-3 text-[34px] leading-[1.04] font-semibold tracking-[-0.045em] sm:text-[44px] lg:text-[52px]">
              {group.title}
            </h1>

            <p className="text-muted-foreground mt-4 max-w-[680px] text-[16px] leading-7">
              {group.description}
            </p>
          </div>

          <Link
            href="/categorie"
            className="text-primary hover:text-primary/80 inline-flex w-fit items-center gap-2 text-[14px] font-semibold transition"
          >
            Tutte le categorie
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <section className="mt-12">
          <div className="max-w-[620px]">
            <h2 className="text-secondary text-[26px] leading-[1.12] font-semibold tracking-[-0.03em] sm:text-[32px]">
              Scegli il tipo di intervento
            </h2>

            <p className="text-muted-foreground mt-3 text-[15px] leading-7">
              Parti dall’intervento più vicino alla tua esigenza. Nel funnel potrai correggere la
              scelta o aggiungere dettagli prima di inviare.
            </p>
          </div>

          {rows.length > 0 ? (
            <div className="divide-border/70 border-border/70 mt-8 max-w-[920px] divide-y border-y">
              {rows.map((row) => (
                <CategoriaActionRow
                  key={`${row.type}-${row.slug}`}
                  row={row}
                  macroSlug={group.slug}
                />
              ))}
            </div>
          ) : (
            <div className="border-border/80 mt-8 border-y border-dashed py-8">
              <p className="text-secondary text-sm font-semibold">
                Nessun intervento disponibile al momento.
              </p>

              <p className="text-muted-foreground mt-2 max-w-[620px] text-sm leading-6">
                Puoi comunque descrivere il lavoro nel funnel e scegliere il servizio più vicino.
              </p>

              <Link
                href={`/richiesta?macro=${encodeURIComponent(group.slug)}`}
                className="text-primary hover:text-primary/80 mt-5 inline-flex items-center gap-2 text-sm font-semibold transition"
              >
                Avvia richiesta
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </section>
      </SectionShell>
    </main>
  )
}

function EmptyCategoriaState({ categoriaSlug }: { categoriaSlug: string }) {
  return (
    <div className="border-border/80 mt-8 border-y border-dashed py-8">
      <p className="text-secondary text-sm font-semibold">
        Nessun intervento o servizio collegato disponibile al momento.
      </p>

      <p className="text-muted-foreground mt-2 max-w-[620px] text-sm leading-6">
        Puoi comunque descrivere il lavoro nel funnel e scegliere il servizio più vicino.
      </p>

      <Link
        href={`/richiesta?categoria=${encodeURIComponent(categoriaSlug)}`}
        className="text-primary hover:text-primary/80 mt-5 inline-flex items-center gap-2 text-sm font-semibold transition"
      >
        Avvia richiesta
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}

function CategoriaActionRow({
  row,
  categoriaSlug,
  macroSlug,
}: {
  row: CategoriaActionRow
  categoriaSlug?: string
  macroSlug?: string
}) {
  const href =
    row.type === 'intervento'
      ? getInterventoHref(row.slug, categoriaSlug)
      : getServizioHref(row.slug, categoriaSlug, macroSlug)

  return (
    <article className="group grid gap-4 py-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="relative pl-5">
        <span
          className="bg-primary/70 group-hover:bg-primary absolute top-1 left-0 h-8 w-[2px] rounded-full transition-all duration-300 group-hover:h-12"
          aria-hidden="true"
        />

        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-secondary group-hover:text-primary text-[18px] leading-6 font-semibold tracking-[-0.02em] transition">
            {row.nome}
          </h3>

          {row.type === 'servizio' ? (
            <span className="bg-primary/10 text-primary rounded-full px-2.5 py-1 text-[11px] font-semibold">
              Servizio
            </span>
          ) : null}
        </div>

        <p className="text-muted-foreground mt-2 max-w-[720px] text-[14px] leading-7">
          {row.descrizione ?? 'Voce disponibile su FixPro.'}
        </p>
      </div>

      <Link
        href={href}
        className="text-primary hover:text-primary/80 inline-flex w-fit items-center gap-2 pl-5 text-[14px] font-semibold transition sm:pl-0"
      >
        Avvia richiesta
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
      </Link>
    </article>
  )
}

function getInterventoHref(interventoSlug: string, categoriaSlug?: string) {
  const requestSlug = resolveRequestInterventoSlug(interventoSlug)
  const params = new URLSearchParams()

  params.set('intervento', requestSlug)

  if (categoriaSlug) {
    params.set('categoria', categoriaSlug)
  }

  return `/richiesta?${params.toString()}`
}

function getServizioHref(servizioSlug: string, categoriaSlug?: string, macroSlug?: string) {
  const params = new URLSearchParams()

  params.set('servizio', servizioSlug)

  if (categoriaSlug) {
    params.set('categoria', categoriaSlug)
  }

  if (macroSlug) {
    params.set('macro', macroSlug)
  }

  return `/richiesta?${params.toString()}`
}
