import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  InterventoInternalNav,
  ProgressiveCtaSection,
  RelatedInterventiSection,
  SeoCitiesSection,
} from '../../_components'
import {
  getInterventoContentOrNull,
  getInterventoOrNull,
  interventoContentBySlug,
  interventoRequestTips,
} from '../../_content'

export function generateStaticParams() {
  return Object.keys(interventoContentBySlug).map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const intervento = getInterventoOrNull(slug)
  const content = getInterventoContentOrNull(slug)

  if (!intervento || !content) return {}

 return {
  title: `Guida ${intervento.nome.toLowerCase()}: fasi, tempi e cosa sapere prima`,
  description: `Scopri come funziona ${intervento.nome.toLowerCase()}: fasi del lavoro, materiali, errori da evitare e come preparare una richiesta efficace.`,
  
  alternates: {
    canonical: `/interventi/${slug}/guida`,
  },

  openGraph: {
    title: `Guida ${intervento.nome.toLowerCase()}: come funziona davvero`,
    description: `Tutte le fasi di ${intervento.nome.toLowerCase()} spiegate in modo semplice: cosa succede davvero e cosa devi sapere prima.`,
    url: `/interventi/${slug}/guida`,
    type: 'article',
  },
}
}

export default async function InterventoGuidaPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const intervento = getInterventoOrNull(slug)
  const content = getInterventoContentOrNull(slug)

  if (!intervento || !content) {
    notFound()
  }

  const steps = content.guideSteps
  const materials = content.materials
  const mistakes = content.mistakes

  return (
    <div id="top" className="bg-background">
      <section className="bg-muted py-16 sm:py-20">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-7 lg:px-8">
          <div className="max-w-[780px]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-primary">
              Guida intervento
            </p>
            <h1 className="mt-3 text-[34px] font-semibold leading-[1.02] tracking-[-0.05em] text-secondary sm:text-[42px] lg:text-[50px]">
              Come funziona {intervento.nome.toLowerCase()}
            </h1>
            <p className="mt-4 max-w-[680px] text-[16px] leading-[1.7] text-muted-foreground">
              Una guida pratica per capire le fasi reali del lavoro, i materiali che contano e gli errori che fanno perdere tempo o soldi.
            </p>
          </div>
        </div>
      </section>

      <InterventoInternalNav slug={intervento.slug} current="guida" />

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-7 lg:px-8">
          <div className="max-w-[640px]">
            <h2 className="text-[28px] font-semibold tracking-[-0.03em] text-secondary">
              Fasi reali del lavoro
            </h2>
          </div>

          <div className="mt-6 space-y-5">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-[22px] bg-card p-5 shadow-sm ring-1 ring-border/60"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-[760px]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                        {index + 1}
                      </div>
                      <h3 className="text-[16px] font-semibold text-secondary">{step.title}</h3>
                    </div>

                    <p className="mt-4 text-[14px] leading-7 text-muted-foreground">
                      {step.explanation}
                    </p>
                  </div>

                  <div className="w-full max-w-[340px] rounded-[18px] bg-muted p-4">
                    <p className="text-[13px] font-semibold text-secondary">Errori comuni in questa fase</p>
                    <div className="mt-3 space-y-2">
                      {step.errors.map((error) => (
                        <p key={error} className="text-[13px] leading-6 text-muted-foreground">
                          {error}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted py-16 sm:py-20">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-7 lg:px-8">
          <div className="max-w-[640px]">
            <h2 className="text-[28px] font-semibold tracking-[-0.03em] text-secondary">
              Materiali e componenti da chiarire prima
            </h2>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {materials.map((item) => (
              <div
                key={item.label}
                className="rounded-[22px] bg-card p-5 shadow-sm ring-1 ring-border/60"
              >
                <p className="text-[15px] font-semibold text-secondary">{item.label}</p>
                <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                  {item.note}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted py-16 sm:py-20">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-7 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="text-[28px] font-semibold tracking-[-0.03em] text-secondary">
                Errori da evitare
              </h2>
              <div className="mt-6 space-y-4">
                {mistakes.map((item) => (
                  <div
                    key={item}
                    className="rounded-[22px] bg-card p-5 shadow-sm ring-1 ring-border/60"
                  >
                    <p className="text-[14px] leading-7 text-muted-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-[28px] font-semibold tracking-[-0.03em] text-secondary">
                Come preparare la richiesta
              </h2>
              <div className="mt-6 space-y-4">
                {interventoRequestTips.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-[22px] bg-card p-5 shadow-sm ring-1 ring-border/60"
                  >
                    <p className="text-[15px] font-semibold text-secondary">{item.title}</p>
                    <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <SeoCitiesSection slug={intervento.slug} />
      <RelatedInterventiSection currentSlug={intervento.slug} />
      <ProgressiveCtaSection slug={intervento.slug} nome={intervento.nome} current="guida" />
    </div>
  )
}
