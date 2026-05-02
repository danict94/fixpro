import { Star } from 'lucide-react'
import { interventiBySlug } from '@/lib/taxonomy/interventi'

const reviewItems = [
  {
    slug: 'perdita-acqua',
    quote:
      'Ho descritto il problema e ho ricevuto una risposta chiara. Intervento rapido, lavoro pulito e spiegazioni comprensibili.',
    name: 'Marco R.',
    city: 'Roma',
    initials: 'MR',
  },
  {
    slug: 'rifacimento-bagno',
    quote:
      'Mi ha aiutato a capire cosa serviva davvero prima del preventivo. Tempi rispettati e comunicazione sempre chiara.',
    name: 'Laura B.',
    city: 'Milano',
    initials: 'LB',
  },
  {
    slug: 'tinteggiatura-casa',
    quote:
      'Preventivo chiaro, risultato uniforme e casa lasciata in ordine. È stato semplice confrontare la proposta.',
    name: 'Elena F.',
    city: 'Torino',
    initials: 'EF',
  },
] as const

const resolvedReviewItems = reviewItems.flatMap((item) => {
  const intervento = interventiBySlug[item.slug]

  if (!intervento) {
    return []
  }

  return [
    {
      ...item,
      intervento: intervento.nome,
    },
  ]
})

function ReviewStars() {
  return (
    <div className="flex gap-1 text-emerald-500" aria-label="Valutazione 5 su 5">
      <Star className="h-3.5 w-3.5 fill-current stroke-current" />
      <Star className="h-3.5 w-3.5 fill-current stroke-current" />
      <Star className="h-3.5 w-3.5 fill-current stroke-current" />
      <Star className="h-3.5 w-3.5 fill-current stroke-current" />
      <Star className="h-3.5 w-3.5 fill-current stroke-current" />
    </div>
  )
}

function ReviewCard({
  intervento,
  quote,
  name,
  city,
  initials,
}: {
  intervento: string
  quote: string
  name: string
  city: string
  initials: string
}) {
  return (
    <article className="relative h-full rounded-[28px] bg-white/80 p-5 ring-1 ring-border/60 backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_18px_45px_rgba(15,23,42,0.07)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-foreground text-[13px] font-semibold text-background">
            {initials}
          </div>

          <div>
            <p className="text-[14px] font-semibold leading-5 text-secondary">
              {name}
            </p>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              {city}
            </p>
          </div>
        </div>

        <ReviewStars />
      </div>

      <p className="mt-5 text-[15px] leading-7 text-secondary">
        “{quote}”
      </p>

      <div className="mt-5 flex items-center justify-between gap-4 border-t border-border/70 pt-4">
        <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          {intervento}
        </p>

        <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
          Verificata
        </span>
      </div>
    </article>
  )
}

export function HomeReviewsSection() {
  return (
    <section className="relative overflow-hidden bg-muted py-16 sm:py-20 lg:py-24">
      <div
        className="pointer-events-none absolute left-[-120px] top-20 h-72 w-72 rounded-full bg-primary/5 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-7 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-end lg:gap-12">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-primary">
              Recensioni
            </p>

            <h2 className="mt-3 max-w-[420px] text-[32px] font-semibold leading-[1.08] tracking-[-0.04em] text-secondary sm:text-[40px]">
              Esperienze più vicine alla realtà.
            </h2>

            <p className="mt-4 max-w-[440px] text-[15px] leading-7 text-muted-foreground">
              Non solo stelle: conta capire se il professionista comunica bene,
              rispetta i tempi e lascia il lavoro in ordine.
            </p>

            <div className="mt-7 flex items-center gap-3">
              <div className="flex -space-x-2">
                {resolvedReviewItems.map((item) => (
                  <div
                    key={item.initials}
                    className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-background bg-foreground text-[11px] font-semibold text-background"
                  >
                    {item.initials}
                  </div>
                ))}
              </div>

              <p className="text-[13px] font-medium text-muted-foreground">
                Clienti che hanno confrontato lavori, tempi e preventivi.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {resolvedReviewItems.map((item) => (
              <ReviewCard
                key={`${item.name}-${item.slug}`}
                intervento={item.intervento}
                quote={item.quote}
                name={item.name}
                city={item.city}
                initials={item.initials}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
