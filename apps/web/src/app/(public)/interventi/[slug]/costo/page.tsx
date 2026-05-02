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
  interventoCostFactors,
} from '../../_content'

const euroFormatter = new Intl.NumberFormat('it-IT')

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
    title: `${intervento.nome}: prezzi e costi reali | FixPro`,
    description: `Scopri prezzi, voci di costo e variabili reali per ${intervento.nome.toLowerCase()}.`,
  }
}

export default async function InterventoCostoPage({
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

  const pricing = content.price
  const breakdown = content.detailedCosts
  const examples = content.realExamples
  const faq = content.faq

  return (
    <div id="top" className="bg-background">
      <section className="bg-[#F6F7FB] py-16 sm:py-20">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-7 lg:px-8">
          <div className="max-w-[780px]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-primary">
              Costo intervento
            </p>
            <h1 className="mt-3 text-[34px] font-semibold leading-[1.02] tracking-[-0.05em] text-secondary sm:text-[42px] lg:text-[50px]">
              Quanto costa {intervento.nome.toLowerCase()}
            </h1>
            <p className="mt-4 max-w-[680px] text-[16px] leading-[1.7] text-muted-foreground">
              Qui trovi una stima concreta: totale realistico, voci che pesano davvero sul preventivo, esempi di casi simili e risposte ai dubbi piu comuni.
            </p>
          </div>
        </div>
      </section>

      <InterventoInternalNav slug={intervento.slug} current="costo" />

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-7 lg:px-8">
          <div className="rounded-[24px] bg-white p-6 shadow-sm ring-1 ring-border/60">
            <p className="text-[14px] font-semibold text-secondary">Range totale realistico</p>
            <p className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-primary">
              {pricing?.range ?? 'Preventivo su richiesta'}
            </p>
            <p className="mt-3 max-w-[720px] text-[14px] leading-7 text-muted-foreground">
              {pricing?.note ?? 'Il costo cambia in base alle caratteristiche del lavoro richiesto.'}
            </p>
          </div>

          <div className="mt-12">
            <h2 className="text-[28px] font-semibold tracking-[-0.03em] text-secondary">
              Voci che compongono il preventivo
            </h2>

            <div className="mt-6 space-y-4">
              {breakdown.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[22px] bg-white p-5 shadow-sm ring-1 ring-border/60"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <p className="text-[15px] font-semibold text-secondary">{item.label}</p>
                    <p className="text-[15px] font-semibold text-primary">
                      {`${euroFormatter.format(item.min)} - ${euroFormatter.format(item.max)} euro`}
                    </p>
                  </div>
                  <p className="mt-3 text-[13px] leading-6 text-muted-foreground">
                    {item.note}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12">
            <h2 className="text-[28px] font-semibold tracking-[-0.03em] text-secondary">
              Fattori che cambiano il preventivo
            </h2>

            <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {interventoCostFactors.map((factor) => (
                <div
                  key={factor.title}
                  className="rounded-[22px] bg-white p-5 shadow-sm ring-1 ring-border/60"
                >
                  <p className="text-[15px] font-semibold text-secondary">{factor.title}</p>
                  <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                    {factor.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12">
            <h2 className="text-[28px] font-semibold tracking-[-0.03em] text-secondary">
              Esempi di spesa
            </h2>

            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              {examples.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[22px] bg-white p-5 shadow-sm ring-1 ring-border/60"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-[15px] font-semibold text-secondary">{item.title}</p>
                      <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <p className="text-[15px] font-semibold text-primary">{item.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F6F7FB] py-16 sm:py-20">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-7 lg:px-8">
          <div className="max-w-[640px]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-primary">
              FAQ
            </p>
            <h2 className="mt-3 text-[30px] font-semibold leading-[1.1] tracking-[-0.035em] text-secondary sm:text-[36px]">
              Domande frequenti
            </h2>
          </div>

          <div className="mt-10 space-y-4">
            {faq.map((item) => (
              <div
                key={item.question}
                className="rounded-[22px] bg-white p-5 shadow-sm ring-1 ring-border/60"
              >
                <h3 className="text-[16px] font-semibold text-secondary">{item.question}</h3>
                <p className="mt-3 text-[14px] leading-7 text-muted-foreground">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SeoCitiesSection slug={intervento.slug} />
      <RelatedInterventiSection currentSlug={intervento.slug} />
      <ProgressiveCtaSection slug={intervento.slug} nome={intervento.nome} current="costo" />
    </div>
  )
}
