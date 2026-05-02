import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { prisma } from '@fixpro/db'
import { SectionIntro } from '../_components/home/section-intro'
import { SectionShell } from '../_components/home/section-shell'
import {
  getGroupDetailInterventoSlugs,
  interventiBySlug,
  macroInterventoGroups,
  type MacroInterventoGroupIcon,
} from '@/lib/taxonomy/interventi'

export const metadata: Metadata = {
  title: 'Categorie e settori | FixPro',
  description:
    'Esplora tutti i settori, le categorie professionali e gli interventi disponibili su FixPro.',
}

type MacroGroupVisual = {
  title: string
  imageSrc: string
}

type SettoreIndexItem = {
  id: string
  nome: string
  slug: string
  descrizione: string | null
  categorie: {
    id: string
    nome: string
    slug: string
    descrizione: string | null
  }[]
}

const macroGroupVisualMap = {
  bath: {
    title: 'Bagni e sanitari',
    imageSrc: '/images/home/service-areas/bagni-sanitari.webp',
  },
  house: {
    title: 'Costruzioni e ristrutturazioni',
    imageSrc: '/images/home/service-areas/casa-ristrutturazioni.webp',
  },
  hammer: {
    title: 'Lavori edili',
    imageSrc: '/images/home/service-areas/lavori-edili.webp',
  },
  droplets: {
    title: 'Impianti e riparazioni',
    imageSrc: '/images/home/service-areas/impianti-riparazioni.webp',
  },
  truck: {
    title: 'Traslochi e sgomberi',
    imageSrc: '/images/home/service-areas/traslochi-sgomberi.webp',
  },
  wrench: {
    title: 'Manutenzione casa',
    imageSrc: '/images/home/service-areas/manutenzione-casa.webp',
  },
  clipboard: {
    title: 'Progettazione tecnica',
    imageSrc: '/images/home/service-areas/progettazione-tecnica.webp',
  },
} satisfies Partial<Record<MacroInterventoGroupIcon, MacroGroupVisual>>

function getCategoriaHref(categoriaSlug: string): string {
  return `/categorie/${categoriaSlug}`
}

async function getSettoriIndex(): Promise<SettoreIndexItem[]> {
  return prisma.settore.findMany({
    where: {
      attivo: true,
    },
    orderBy: {
      ordine: 'asc',
    },
    select: {
      id: true,
      nome: true,
      slug: true,
      descrizione: true,
      categorie: {
        where: {
          attivo: true,
        },
        orderBy: [
          {
            ordine: 'asc',
          },
          {
            nome: 'asc',
          },
        ],
        select: {
          id: true,
          nome: true,
          slug: true,
          descrizione: true,
        },
      },
    },
  })
}

function getInterventoNames(slugs: readonly string[]) {
  return slugs.flatMap((slug) => {
    const nome = interventiBySlug[slug]?.nome
    return nome ? [nome] : []
  })
}

export default async function CategoriePage() {
  const settori = await getSettoriIndex()

  return (
    <main>
      <SectionShell tone="default" spacing="xl">
        <SectionIntro
          eyebrow="Categorie"
          title="Trova il professionista partendo dal tipo di lavoro."
          description="Esplora le aree più richieste e consulta l&apos;elenco completo delle categorie professionali attive su FixPro: edilizia, impianti, giardinaggio, fabbro, coperture, pulizie, disinfestazione, progettazione tecnica e altro."
          align="center"
        />

        <div className="mt-12 grid gap-x-7 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
          {macroInterventoGroups.map((group) => {
            const visual = macroGroupVisualMap[group.icon]

            return (
              <CategoryCard
                key={group.slug}
                title={visual?.title ?? group.title}
                text={group.description}
                href={`/categorie/${group.slug}`}
                imageSrc={visual?.imageSrc}
                items={getInterventoNames(group.interventoSlugs)}
                totalItemCount={getGroupDetailInterventoSlugs(group).length}
              />
            )
          })}
        </div>

        <section className="mt-20 rounded-[32px] border border-border/70 bg-white px-5 py-8 shadow-sm md:px-8 md:py-10">
          <div className="max-w-3xl">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-primary">
              Tutte le categorie disponibili
            </p>

            <h2 className="mt-3 text-[28px] font-semibold tracking-[-0.03em] text-secondary md:text-[34px]">
              Sfoglia tutte le categorie professionali FixPro.
            </h2>

           <p className="mt-4 text-[14px] leading-7 text-muted-foreground">
               Le card sopra mostrano le aree più comuni. Qui trovi invece
                l&apos;elenco completo delle categorie professionali attive sulla
                 piattaforma, aggiornato automaticamente dal database.
           </p>
           
          </div>

          {settori.length > 0 ? (
            <div className="mt-8 divide-y divide-border/70">
              {settori.map((settore) => (
                <SettoreIndexRow key={settore.id} settore={settore} />
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-[24px] border border-dashed border-border bg-[#F6F7FB] px-5 py-8 text-center">
              <p className="text-[14px] font-semibold text-secondary">
                Nessuna categoria disponibile.
              </p>
              <p className="mt-2 text-[14px] leading-6 text-muted-foreground">
                Verifica il seed e i flag attivo su settori e categorie.
              </p>
            </div>
          )}
        </section>
      </SectionShell>
    </main>
  )
}

function SettoreIndexRow({ settore }: { settore: SettoreIndexItem }) {
  return (
    <div className="grid gap-4 py-7 lg:grid-cols-[280px_1fr] lg:gap-10">
      <div className="border-l-2 border-primary pl-4">
        <h3 className="text-[18px] font-semibold tracking-[-0.02em] text-secondary">
          {settore.nome}
        </h3>

        {settore.descrizione ? (
          <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
            {settore.descrizione}
          </p>
        ) : null}
      </div>

      {settore.categorie.length > 0 ? (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-2 pt-1">
          {settore.categorie.map((categoria, index) => (
            <span key={categoria.id} className="inline-flex items-center gap-2">
              {index > 0 ? (
                <span className="text-border" aria-hidden="true">
                  |
                </span>
              ) : null}

              <Link
                href={getCategoriaHref(categoria.slug)}
                className="text-[14px] font-medium text-secondary underline-offset-4 transition hover:text-primary hover:underline"
                title={categoria.descrizione ?? categoria.nome}
              >
                {categoria.nome}
              </Link>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-[14px] text-muted-foreground">
          Nessuna categoria attiva in questo settore.
        </p>
      )}
    </div>
  )
}

function CategoryCard({
  title,
  text,
  href,
  imageSrc,
  items,
  totalItemCount,
}: {
  title: string
  text: string
  href: string
  imageSrc?: string
  items: string[]
  totalItemCount?: number
}) {
  const visibleItems = items.slice(0, 5)
  const hiddenCount = Math.max(
    (totalItemCount ?? items.length) - visibleItems.length,
    0,
  )

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-border/70 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-md">
      {imageSrc ? (
        <div className="relative aspect-[4/3] overflow-hidden bg-[#F6F7FB]">
          <Image
            src={imageSrc}
            alt={title}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          />
        </div>
      ) : (
        <div className="flex aspect-[4/3] items-center justify-center bg-[#F6F7FB] px-6 text-center">
          <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-primary">
            Area lavori
          </span>
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <h2 className="text-[20px] font-semibold leading-7 tracking-[-0.02em] text-secondary">
          {title}
        </h2>

        <p className="mt-3 text-[14px] leading-7 text-muted-foreground">
          {text}
        </p>

        {visibleItems.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {visibleItems.map((item) => (
              <span
                key={item}
                className="rounded-full bg-[#F6F7FB] px-3 py-1 text-[12px] font-medium text-secondary ring-1 ring-border/70"
              >
                {item}
              </span>
            ))}

            {hiddenCount > 0 ? (
              <span className="rounded-full bg-primary/10 px-3 py-1 text-[12px] font-semibold text-primary">
                +{hiddenCount}
              </span>
            ) : null}
          </div>
        ) : null}

        <Link
          href={href}
          className="mt-6 inline-flex w-fit items-center gap-2 text-[14px] font-semibold text-primary transition hover:text-primary/80"
        >
          Vedi interventi
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </Link>
      </div>
    </article>
  )
}