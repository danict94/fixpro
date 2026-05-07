import Link from 'next/link'
import { homeInterventi } from '@fixpro/shared'
import { ArrowRight } from 'lucide-react'
import { getEnabledGeoCitiesForIntervento } from './_content'

type InterventoPageKind = 'overview' | 'costo' | 'guida' | 'city'

export function InterventoInternalNav({
  slug,
  current,
}: {
  slug: string
  current: InterventoPageKind
}) {
  const guidaHref = current === 'guida' ? '#top' : `/interventi/${slug}/guida`
  const costiHref = current === 'costo' ? '#top' : `/interventi/${slug}/costo`

  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-7 lg:px-8">
        <nav className="flex flex-wrap gap-3 py-4 text-sm font-medium text-muted-foreground">
          <Link href={guidaHref} className="rounded-full px-3 py-1.5 transition hover:bg-muted hover:text-secondary">
            Guida
          </Link>
          <Link href={costiHref} className="rounded-full px-3 py-1.5 transition hover:bg-muted hover:text-secondary">
            Costi
          </Link>
          <Link href="#cities" className="rounded-full px-3 py-1.5 transition hover:bg-muted hover:text-secondary">
            Citta
          </Link>
        </nav>
      </div>
    </section>
  )
}

export function RelatedInterventiSection({
  currentSlug,
}: {
  currentSlug: string
}) {
  const related = homeInterventi.filter((item) => item.slug !== currentSlug).slice(0, 4)

  return (
    <section className="bg-muted page-section">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-7 lg:px-8">
        <div className="max-w-[640px]">
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-primary">
            Interventi correlati
          </p>
          <h2 className="mt-3 text-[30px] font-semibold leading-[1.1] tracking-[-0.035em] text-secondary sm:text-[36px]">
            Altri interventi simili
          </h2>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {related.map((item) => (
            <Link
              key={item.slug}
              href={`/interventi/${item.slug}`}
              className="rounded-[22px] bg-card p-5 shadow-sm ring-1 ring-border/60 transition hover:shadow-md"
            >
              <p className="text-[15px] font-semibold text-secondary">{item.nome}</p>
              <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                {item.descrizione}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export function SeoCitiesSection({
  slug,
}: {
  slug: string
}) {
  const cities = getEnabledGeoCitiesForIntervento(slug).slice(0, 3)

  return (
    <section id="cities" className="page-section">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-7 lg:px-8">
        <div className="max-w-[640px]">
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-primary">
            Copertura
          </p>
          <h2 className="mt-3 text-[30px] font-semibold leading-[1.1] tracking-[-0.035em] text-secondary sm:text-[36px]">
            Dove trovare questo servizio
          </h2>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {cities.map((city) => (
            <Link
              key={city.slug}
              href={`/interventi/${slug}/${city.slug}`}
              className="rounded-[22px] bg-card p-5 shadow-sm ring-1 ring-border/60 transition hover:shadow-md"
            >
              <p className="text-[15px] font-semibold text-secondary">{city.label}</p>
              <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                Prezzi locali, richieste simili e contesto della zona.
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export function ProgressiveCtaSection({
  slug,
  nome,
  current,
}: {
  slug: string
  nome: string
  current: InterventoPageKind
}) {
  const costHref = current === 'costo' ? '#top' : `/interventi/${slug}/costo`
  const guideHref = current === 'guida' ? '#top' : `/interventi/${slug}/guida`

  return (
    <section className="bg-primary-soft page-section">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-7 lg:px-8">
        <div className="rounded-[28px] bg-card px-6 py-8 text-center shadow-sm ring-1 ring-border/60 sm:px-8 sm:py-10">
          <div className="mx-auto max-w-[680px]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-primary">
              Prossimo passo
            </p>

            <h2 className="mt-3 text-[30px] font-semibold leading-[1.1] tracking-[-0.035em] text-secondary sm:text-[36px]">
              Hai bisogno di {nome.toLowerCase()}?
            </h2>

            <p className="mt-4 text-[15px] leading-[1.65] text-muted-foreground">
              Prima puoi capire costi e guida completa, poi inviare la richiesta quando sei pronto.
            </p>

            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href={costHref}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                Scopri i costi
              </Link>

              <Link
                href={guideHref}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold text-secondary transition hover:bg-muted"
              >
                Guida completa
              </Link>

              <Link
                href={`/richiesta?intervento=${slug}`}
                className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-primary transition hover:text-primary/80"
              >
                Richiedi preventivo
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
