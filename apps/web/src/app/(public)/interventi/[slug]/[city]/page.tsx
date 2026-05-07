import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MapPin, Star } from 'lucide-react'
import {
  InterventoInternalNav,
  ProgressiveCtaSection,
  RelatedInterventiSection,
  SeoCitiesSection,
} from '../../_components'
import {
  geoProfessionisti,
  getCityOrNull,
  getEnabledGeoCitiesForIntervento,
  getGeoInterventoSeo,
  getInterventoContentOrNull,
  getInterventoOrNull,
  interventoContentBySlug,
  isGeoInterventoEnabled,
} from '../../_content'

export function generateStaticParams() {
  return Object.keys(interventoContentBySlug).flatMap((slug) =>
    getEnabledGeoCitiesForIntervento(slug).map((city) => ({
      slug,
      city: city.slug,
    })),
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; city: string }>
}): Promise<Metadata> {
  const { slug, city } = await params
  const intervento = getInterventoOrNull(slug)
  const content = getInterventoContentOrNull(slug)
  const cityData = getCityOrNull(city)

  if (!intervento || !content || !cityData || !isGeoInterventoEnabled(slug, city)) return {}

  const seo = getGeoInterventoSeo({ intervento, content, city: cityData })

  return {
  title: seo.title,
  description: seo.description,

  alternates: {
    canonical: `/interventi/${intervento.slug}/${cityData.slug}`,
  },

  openGraph: {
    title: seo.title,
    description: seo.description,
    url: `/interventi/${intervento.slug}/${cityData.slug}`,
    type: 'article',
  },
}
}

export default async function InterventoCityPage({
  params,
}: {
  params: Promise<{ slug: string; city: string }>
}) {
  const { slug, city } = await params
  const intervento = getInterventoOrNull(slug)
  const content = getInterventoContentOrNull(slug)
  const cityData = getCityOrNull(city)

  if (!intervento || !content || !cityData || !isGeoInterventoEnabled(slug, city)) {
    notFound()
  }

  const seo = getGeoInterventoSeo({ intervento, content, city: cityData })

  return (
    <div id="top" className="bg-background">
      <section className="bg-muted py-16 sm:py-20">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-7 lg:px-8">
          <div className="max-w-[760px]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-primary">
              Intervento in citta
            </p>
            <h1 className="mt-3 text-[34px] font-semibold leading-[1.02] tracking-[-0.05em] text-secondary sm:text-[42px] lg:text-[50px]">
              {intervento.nome} a {cityData.label}
            </h1>
            <p className="mt-4 max-w-[620px] text-[16px] leading-[1.7] text-muted-foreground">
              Prezzi, contesto locale e come trovare il professionista giusto nella tua zona.
            </p>
          </div>
        </div>
      </section>

      <InterventoInternalNav slug={intervento.slug} current="city" />

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-7 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
            <div>
              <h2 className="text-[28px] font-semibold tracking-[-0.03em] text-secondary">
                Come si presenta la richiesta a {cityData.label}
              </h2>
              <p className="mt-4 text-[15px] leading-[1.65] text-muted-foreground">
                {seo.intro}
              </p>
              <p className="mt-4 text-[14px] leading-7 text-muted-foreground">
                {seo.localNotes}
              </p>
            </div>

            <div className="rounded-[24px] bg-card p-6 shadow-sm ring-1 ring-border/60">
              <p className="text-[14px] font-semibold text-secondary">Prezzo indicativo a {cityData.label}</p>
              <p className="mt-2 text-[26px] font-semibold tracking-[-0.03em] text-primary">
                {seo.priceRange}
              </p>
              <p className="mt-3 text-[14px] leading-7 text-muted-foreground">
                {seo.priceNote}
              </p>
            </div>
          </div>

          <div className="mt-12">
            <h2 className="text-[28px] font-semibold tracking-[-0.03em] text-secondary">
              Professionisti gia attivi in area {cityData.label}
            </h2>

            <div className="mt-6 grid gap-5 lg:grid-cols-3">
              {geoProfessionisti.map((company) => (
                <div
                  key={`${cityData.slug}-${company.name}`}
                  className="rounded-[22px] bg-card p-5 shadow-sm ring-1 ring-border/60"
                >
                  <div className="flex items-center gap-2 text-primary">
                    <Star className="h-4 w-4 fill-current stroke-current" />
                    <p className="text-[12px] font-semibold uppercase tracking-[0.08em]">
                      Professionista in evidenza
                    </p>
                  </div>
                  <p className="mt-4 text-[15px] font-semibold text-secondary">{company.name}</p>
                  <div className="mt-2 flex items-center gap-2 text-[13px] text-muted-foreground">
                    <MapPin className="h-4 w-4" strokeWidth={1.9} />
                    <span>{cityData.label}</span>
                  </div>
                  <p className="mt-3 text-[13px] leading-6 text-muted-foreground">
                    {company.badge}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SeoCitiesSection slug={intervento.slug} />
      <RelatedInterventiSection currentSlug={intervento.slug} />
      <ProgressiveCtaSection slug={intervento.slug} nome={intervento.nome} current="city" />
    </div>
  )
}
