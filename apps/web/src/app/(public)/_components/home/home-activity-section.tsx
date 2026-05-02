import Link from 'next/link'
import { ArrowRight, Clock, MapPin } from 'lucide-react'
import { interventiBySlug } from '@/lib/taxonomy/interventi'

const activityItems = [
  {
    slug: 'tinteggiatura-casa',
    city: 'Milano',
    publishedAt: 'Pubblicata oggi',
    message:
      'Dovrei ritinteggiare casa prima del trasloco. L’appartamento è di circa 70 mq, pareti in buono stato. Gradirei un preventivo.',
    detail: 'Appartamento · 70 mq circa',
  },
  {
    slug: 'perdita-acqua',
    city: 'Roma',
    publishedAt: 'Pubblicata 30 min fa',
    message:
      'Ho una perdita sotto il lavello della cucina. Vorrei capire se serve sostituire il sifone o intervenire sui raccordi.',
    detail: 'Intervento urgente · Cucina',
  },
  {
    slug: 'rifacimento-bagno',
    city: 'Torino',
    publishedAt: 'Pubblicata ieri',
    message:
      'Vorrei rifare un bagno piccolo, sostituendo sanitari, piastrelle e box doccia. Cerco una valutazione indicativa dei costi.',
    detail: 'Bagno piccolo · Sopralluogo',
  },
  {
    slug: 'installazione-climatizzatore',
    city: 'Bologna',
    publishedAt: 'Pubblicata questa settimana',
    message:
      'Cerco un tecnico per installare un climatizzatore già acquistato. L’unità esterna andrebbe posizionata sul balcone.',
    detail: 'Installazione · Climatizzatore',
  },
] as const

const resolvedActivityItems = activityItems.flatMap((item) => {
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

function RequestPreview({
  title,
  city,
  publishedAt,
  message,
  detail,
}: {
  title: string
  city: string
  publishedAt: string
  message: string
  detail: string
}) {
  return (
    <article className="rounded-[26px] bg-white p-5 shadow-sm ring-1 ring-border/60 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(15,23,42,0.07)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-primary">
            Richiesta pubblicata
          </p>

          <h3 className="mt-2 text-[17px] font-semibold leading-6 text-secondary">
            {title} - {city}
          </h3>
        </div>

        <span className="inline-flex w-fit rounded-full bg-[#F6F7FB] px-3 py-1 text-[11px] font-semibold text-muted-foreground ring-1 ring-border/60">
          Nuova
        </span>
      </div>

      <p className="mt-4 text-[14px] leading-7 text-secondary">
        “{message}”
      </p>

      <div className="mt-5 flex flex-col gap-2 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-emerald-500" />
            {city}
          </span>

          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-primary" />
            {publishedAt}
          </span>
        </div>

        <p className="text-[12px] font-medium text-muted-foreground">
          {detail}
        </p>
      </div>
    </article>
  )
}

export function HomeActivitySection() {
  return (
    <section className="relative overflow-hidden bg-background py-16 sm:py-20 lg:py-24">
      <div
        className="pointer-events-none absolute left-[-140px] top-20 h-80 w-80 rounded-full bg-primary/5 blur-3xl"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute bottom-[-120px] right-[-120px] h-96 w-96 rounded-full bg-sky-400/5 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-7 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[620px]">
            <div className="mb-6 h-1 w-16 rounded-full bg-primary" />

            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-primary">
              Richieste recenti
            </p>

            <h2 className="mt-4 text-[34px] font-semibold leading-[1.05] tracking-[-0.045em] text-secondary sm:text-[42px] lg:text-[48px]">
              Cosa chiedono gli utenti su FixPro.
            </h2>
          </div>

          <div className="max-w-[460px]">
            <p className="text-[15px] leading-[1.75] text-muted-foreground">
              Esempi di richieste pubblicate per mostrare come descrivere il
              lavoro, indicare la città e ricevere risposte più chiare.
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/richiesta"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background transition hover:bg-foreground/90"
              >
                Pubblica una richiesta
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/interventi"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-white px-5 py-3 text-sm font-semibold text-secondary transition hover:bg-background"
              >
                Esplora interventi
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          {resolvedActivityItems.map((item) => (
            <RequestPreview
              key={`${item.slug}-${item.city}`}
              title={item.title}
              city={item.city}
              publishedAt={item.publishedAt}
              message={item.message}
              detail={item.detail}
            />
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-2 border-t border-border/70 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] leading-6 text-muted-foreground">
            Le richieste mostrate sono esempi rappresentativi e servono a
            spiegare come funziona la pubblicazione.
          </p>

          <Link
            href="/richiesta"
            className="text-[13px] font-semibold text-primary transition hover:text-primary/80"
          >
            Crea la tua richiesta
          </Link>
        </div>
      </div>
    </section>
  )
}
