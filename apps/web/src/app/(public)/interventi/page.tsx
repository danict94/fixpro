import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { homeInterventi } from '@fixpro/shared'

export const metadata: Metadata = {
  title: 'Guide, costi e lavori di casa | FixPro',
  description:
    'Scopri come si eseguono i lavori, quanto costano e trova il professionista giusto su FixPro.',
}

const costCards = [
  { slug: 'rifacimento-bagno', label: 'Rifacimento bagno' },
  { slug: 'tinteggiatura-casa', label: 'Tinteggiatura casa' },
  { slug: 'installazione-climatizzatore', label: 'Installazione climatizzatore' },
] as const

const guideCards = [
  { slug: 'rifacimento-bagno', label: 'Guida bagno' },
  { slug: 'tinteggiatura-casa', label: 'Guida pittura' },
  { slug: 'ristrutturazione-appartamento', label: 'Guida ristrutturazione' },
] as const

const cityLinks = [
  { slug: 'rifacimento-bagno', city: 'milano', label: 'Milano' },
  { slug: 'rifacimento-bagno', city: 'roma', label: 'Roma' },
  { slug: 'tinteggiatura-casa', city: 'torino', label: 'Torino' },
] as const

export default function InterventiHubPage() {
  return (
    <div className="bg-background">
      <section className="bg-[#F6F7FB] py-16 sm:py-20">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-7 lg:px-8">
          <div className="max-w-[780px]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-primary">
              Interventi
            </p>

            <h1 className="mt-3 text-[34px] font-semibold leading-[1.02] tracking-[-0.05em] text-secondary sm:text-[42px] lg:text-[50px]">
              Guide, costi e lavori di casa
            </h1>

            <p className="mt-4 max-w-[680px] text-[16px] leading-[1.7] text-muted-foreground">
              Scopri come si eseguono i lavori, quanto costano e trova il professionista giusto.
            </p>

            <div className="mt-6">
              <Link
                href="/richiesta"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/90"
              >
                Richiedi un preventivo
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-7 lg:px-8">
          <div className="max-w-[640px]">
            <h2 className="text-[30px] font-semibold leading-[1.1] tracking-[-0.035em] text-secondary sm:text-[36px]">
              Interventi da esplorare
            </h2>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {homeInterventi.map((item) => (
              <Link
                key={item.slug}
                href={`/interventi/${item.slug}`}
                className="rounded-[22px] bg-white p-5 shadow-sm ring-1 ring-border/60 transition hover:shadow-md"
              >
                <p className="text-[15px] font-semibold text-secondary">{item.nome}</p>

                <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                  {item.descrizione}
                </p>

                <div className="mt-4 inline-flex items-center gap-2 text-[13px] font-semibold text-primary">
                  Apri la scheda completa
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F6F7FB] py-16 sm:py-20">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-7 lg:px-8">
          <div className="max-w-[640px]">
            <h2 className="text-[30px] font-semibold leading-[1.1] tracking-[-0.035em] text-secondary sm:text-[36px]">
              Quanto costano i lavori?
            </h2>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {costCards.map((item) => (
              <Link
                key={item.slug}
                href={`/interventi/${item.slug}/costo`}
                className="rounded-[22px] bg-white p-5 shadow-sm ring-1 ring-border/60 transition hover:shadow-md"
              >
                <p className="text-[15px] font-semibold text-secondary">{item.label}</p>
                <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                  Range realistici, voci di costo e fattori che cambiano il preventivo.
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-7 lg:px-8">
          <div className="max-w-[640px]">
            <h2 className="text-[30px] font-semibold leading-[1.1] tracking-[-0.035em] text-secondary sm:text-[36px]">
              Come si eseguono i lavori
            </h2>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {guideCards.map((item) => (
              <Link
                key={item.slug}
                href={`/interventi/${item.slug}/guida`}
                className="rounded-[22px] bg-white p-5 shadow-sm ring-1 ring-border/60 transition hover:shadow-md"
              >
                <p className="text-[15px] font-semibold text-secondary">{item.label}</p>
                <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                  Fasi, errori da evitare e consigli pratici per preparare bene la richiesta.
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F6F7FB] py-16 sm:py-20">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-7 lg:px-8">
          <div className="max-w-[640px]">
            <h2 className="text-[30px] font-semibold leading-[1.1] tracking-[-0.035em] text-secondary sm:text-[36px]">
              Servizi nella tua zona
            </h2>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {cityLinks.map((item) => (
              <Link
                key={`${item.slug}-${item.city}`}
                href={`/interventi/${item.slug}/${item.city}`}
                className="rounded-[22px] bg-white p-5 shadow-sm ring-1 ring-border/60 transition hover:shadow-md"
              >
                <p className="text-[15px] font-semibold text-secondary">{item.label}</p>
                <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                  Prezzi locali, contesto del lavoro e richieste simili gia presenti sulla piattaforma.
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-7 lg:px-8">
          <div className="rounded-[28px] bg-[#F4F3FF] px-6 py-8 text-center sm:px-8 sm:py-10">
            <h2 className="text-[30px] font-semibold leading-[1.1] tracking-[-0.035em] text-secondary sm:text-[36px]">
              Richiedi preventivi gratuiti
            </h2>
            <p className="mx-auto mt-4 max-w-[620px] text-[15px] leading-[1.65] text-muted-foreground">
              Quando hai capito costi, fasi e priorita, invia la tua richiesta e confronta risposte piu utili dai professionisti disponibili.
            </p>
            <div className="mt-6">
              <Link
                href="/richiesta"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/90"
              >
                Richiedi preventivi gratuiti
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
