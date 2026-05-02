import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

function WhyTextBlock({
  title,
  text,
}: {
  title: string
  text: string
}) {
  return (
    <div className="border-l-[3px] border-emerald-400 pl-4">
      <h3 className="max-w-[420px] text-[24px] font-semibold leading-[1.15] tracking-[-0.035em] text-secondary sm:text-[28px]">
        {title}
      </h3>

      <p className="mt-3 max-w-[500px] text-[14px] leading-7 text-muted-foreground">
        {text}
      </p>
    </div>
  )
}

export function HomeKnowledgeSection() {
  return (
    <section className="relative overflow-hidden bg-background py-16 sm:py-20 lg:py-24">
      <div
        className="pointer-events-none absolute right-[-180px] top-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-7 lg:px-8">
        <div className="mx-auto max-w-[820px] text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-primary">
            Perché scegliere FixPro
          </p>

          <h2 className="mt-4 text-[34px] font-semibold leading-[1.05] tracking-[-0.045em] text-secondary sm:text-[44px] lg:text-[50px]">
            Una richiesta più chiara, una scelta più semplice.
          </h2>

          <p className="mx-auto mt-5 max-w-[760px] text-[15px] leading-7 text-muted-foreground">
            Che siano piccoli interventi, ristrutturazioni o lavori urgenti,
            FixPro ti aiuta a pubblicare una richiesta, ricevere risposte e
            confrontare professionisti in modo più ordinato.
          </p>
        </div>

        <div className="mt-16 grid gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-16">
          <div className="space-y-10">
            <WhyTextBlock
              title="Trova professionisti disponibili"
              text="Pubblica gratuitamente la tua richiesta e indica il tipo di lavoro, la città e i dettagli principali. I professionisti interessati possono valutare meglio cosa ti serve e rispondere in modo più preciso."
            />

            <WhyTextBlock
              title="Scegli con chi metterti in contatto"
              text="Confronta le risposte ricevute, guarda i profili, i servizi offerti, la zona coperta e le recensioni. Così puoi decidere con più consapevolezza chi contattare."
            />

            <WhyTextBlock
              title="Gestisci il lavoro con più tranquillità"
              text="Avere informazioni chiare prima di iniziare ti aiuta a valutare tempi, disponibilità, metodo di lavoro e dettagli del preventivo, senza scegliere solo in base al prezzo."
            />

            <Link
              href="/interventi"
              className="inline-flex items-center gap-2 text-[13px] font-semibold text-secondary underline decoration-border underline-offset-4 transition hover:text-primary"
            >
              Scopri come funzionano richieste e profili
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="relative mx-auto w-full max-w-[560px]">
            <div
              className="pointer-events-none absolute inset-8 rounded-full bg-emerald-400/10 blur-3xl"
              aria-hidden="true"
            />

            <div className="relative aspect-[5/4] w-full">
              <Image
                src="/images/home/why-fixpro.webp"
                alt="Anteprima FixPro con richiesta e professionisti disponibili"
                fill
                className="object-contain object-center"
                sizes="(min-width: 1024px) 560px, 100vw"
              />
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <h3 className="text-[28px] font-semibold leading-[1.12] tracking-[-0.035em] text-secondary sm:text-[34px]">
            Vuoi trovare un professionista?
          </h3>

          <Link
            href="/richiesta"
            className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary/90"
          >
            Invia la richiesta
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}