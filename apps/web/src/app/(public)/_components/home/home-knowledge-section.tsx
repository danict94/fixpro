import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { SectionShell } from './section-shell'
import { SectionIntro } from './section-intro'

function WhyTextBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="border-primary border-l-[3px] pl-4">
      <h3 className="text-secondary max-w-[420px] text-[19px] leading-[1.18] font-semibold sm:text-[21px]">
        {title}
      </h3>

      <p className="text-muted-foreground mt-2 max-w-[500px] text-[13px] leading-6">{text}</p>
    </div>
  )
}

export function HomeKnowledgeSection() {
  return (
    <SectionShell tone="default" spacing="md">
      <div className="grid gap-8 lg:grid-cols-[0.96fr_1.04fr] lg:items-center lg:gap-12">
        <div>
          <SectionIntro
            eyebrow="Perché scegliere FixPro"
            title="Una richiesta più chiara, una scelta più semplice."
            description="Che siano piccoli interventi, ristrutturazioni o lavori urgenti, FixPro aiuta a pubblicare una richiesta, ricevere risposte e confrontare professionisti in modo più ordinato."
          />

          <div className="mt-8 space-y-6">
            <WhyTextBlock
              title="Trova professionisti disponibili"
              text="Pubblica gratuitamente la tua richiesta e indica tipo di lavoro, città e dettagli principali. I professionisti interessati possono rispondere in modo più preciso."
            />

            <WhyTextBlock
              title="Scegli con chi metterti in contatto"
              text="Confronta risposte, profili, servizi offerti, zona coperta e recensioni prima di decidere chi contattare."
            />

            <WhyTextBlock
              title="Gestisci il lavoro con più tranquillità"
              text="Informazioni chiare aiutano a valutare tempi, disponibilità, metodo di lavoro e dettagli del preventivo, senza scegliere solo in base al prezzo."
            />
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/richiesta"
              className="bg-primary hover:bg-primary/90 inline-flex w-fit items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold text-white transition"
            >
              Invia la richiesta
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/interventi"
              className="text-primary hover:text-primary/80 inline-flex w-fit items-center gap-2 text-[13px] font-semibold transition"
            >
              Scopri guide e interventi
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[460px] lg:max-w-[500px]">
          <div className="relative aspect-[5/4] w-full">
            <Image
              src="/images/home/why-fixpro.webp"
              alt="Anteprima FixPro con richiesta e professionisti disponibili"
              fill
              className="object-contain object-center"
              sizes="(min-width: 1024px) 500px, 100vw"
            />
          </div>
        </div>
      </div>
    </SectionShell>
  )
}
