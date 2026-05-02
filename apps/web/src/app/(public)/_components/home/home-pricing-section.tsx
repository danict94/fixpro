import Link from 'next/link'
import { interventiBySlug } from '@/lib/taxonomy/interventi'

const pricingItems = [
  {
    slug: 'rifacimento-bagno',
    range: '2.500 - 8.000 euro',
    note: 'Dipende da metratura, impianti e livello delle finiture.',
  },
  {
    slug: 'tinteggiatura-casa',
    range: '500 - 2.000 euro',
    note: 'Pesano superficie, stato delle pareti e numero di ambienti.',
  },
  {
    slug: 'installazione-climatizzatore',
    range: '300 - 1.200 euro',
    note: "Cambiano marca, potenza e complessita dell'installazione.",
  },
  {
    slug: 'trasloco-appartamento',
    range: '400 - 2.500 euro',
    note: 'Incidono volume, distanza, piano e servizi aggiuntivi.',
  },
] as const

const resolvedPricingItems = pricingItems.flatMap((item) => {
  const intervento = interventiBySlug[item.slug]

  if (!intervento) {
    return []
  }

  return [
    {
      ...item,
      title: intervento.nome,
    },
  ]
})

function PricingCard({
  title,
  range,
  note,
}: {
  title: string
  range: string
  note: string
}) {
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-border/60">
      <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">
        Preventivi ricevuti
      </span>

      <p className="mt-4 text-[15px] font-semibold text-secondary">{title}</p>

      <p className="mt-3 text-[22px] font-semibold tracking-[-0.03em] text-primary">
        {range}
      </p>

      <p className="mt-3 text-[13px] leading-6 text-muted-foreground">{note}</p>
    </div>
  )
}

export function HomePricingSection() {
  return (
    <section className="bg-background py-16 sm:py-20">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-7 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-14">
          <div className="max-w-[520px]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-primary">
              Prezzi indicativi
            </p>

            <h2 className="mt-3 text-[30px] font-semibold leading-[1.1] tracking-[-0.035em] text-secondary sm:text-[36px]">
              Quanto puo costare il tuo lavoro?
            </h2>

            <p className="mt-4 text-[15px] leading-[1.65] text-muted-foreground">
              I prezzi variano in base a dimensioni, materiali e complessita. Qui trovi alcune indicazioni reali.
            </p>

            <Link
              href="/richiesta"
              className="mt-6 inline-flex items-center gap-2 text-[14px] font-semibold text-primary"
            >
              Richiedi un preventivo
            </Link>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {resolvedPricingItems.map((item) => (
              <PricingCard
                key={item.slug}
                title={item.title}
                range={item.range}
                note={item.note}
              />
            ))}
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            Ricevi preventivi personalizzati per il tuo caso specifico
          </p>
        </div>
      </div>
    </section>
  )
}
