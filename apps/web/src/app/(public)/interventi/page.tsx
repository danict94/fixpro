import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { homeInterventi } from '@fixpro/shared'
import { SectionShell } from '../_components/section-shell'

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

function CardLink({
  href,
  title,
  description,
  action,
}: {
  href: string
  title: string
  description: string
  action?: string
}) {
  return (
    <Link
      href={href}
      className="rounded-[22px] bg-card p-5 shadow-sm ring-1 ring-border/60 transition hover:shadow-md"
    >
      <p className="text-[15px] font-semibold text-secondary">{title}</p>

      <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
        {description}
      </p>

      {action ? (
        <div className="mt-4 inline-flex items-center gap-2 text-[13px] font-semibold text-primary">
          {action}
          <ArrowRight className="h-4 w-4" strokeWidth={2} />
        </div>
      ) : null}
    </Link>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-[640px]">
      <h2 className="text-[30px] font-semibold leading-[1.1] tracking-[-0.035em] text-secondary sm:text-[36px]">
        {children}
      </h2>
    </div>
  )
}

export default function InterventiHubPage() {
  return (
    <div className="bg-background">
      <SectionShell tone="muted" spacing="md">
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
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              Richiedi un preventivo
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </SectionShell>

      <SectionShell spacing="md">
        <SectionTitle>Interventi da esplorare</SectionTitle>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {homeInterventi.map((item) => (
            <CardLink
              key={item.slug}
              href={`/interventi/${item.slug}`}
              title={item.nome}
              description={item.descrizione}
              action="Apri la scheda completa"
            />
          ))}
        </div>
      </SectionShell>

      <SectionShell tone="muted" spacing="md">
        <SectionTitle>Quanto costano i lavori?</SectionTitle>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {costCards.map((item) => (
            <CardLink
              key={item.slug}
              href={`/interventi/${item.slug}/costo`}
              title={item.label}
              description="Range realistici, voci di costo e fattori che cambiano il preventivo."
            />
          ))}
        </div>
      </SectionShell>

      <SectionShell spacing="md">
        <SectionTitle>Come si eseguono i lavori</SectionTitle>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {guideCards.map((item) => (
            <CardLink
              key={item.slug}
              href={`/interventi/${item.slug}/guida`}
              title={item.label}
              description="Fasi, errori da evitare e consigli pratici per preparare bene la richiesta."
            />
          ))}
        </div>
      </SectionShell>

      <SectionShell tone="muted" spacing="md">
        <SectionTitle>Servizi nella tua zona</SectionTitle>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {cityLinks.map((item) => (
            <CardLink
              key={`${item.slug}-${item.city}`}
              href={`/interventi/${item.slug}/${item.city}`}
              title={item.label}
              description="Prezzi locali, contesto del lavoro e richieste simili gia presenti sulla piattaforma."
            />
          ))}
        </div>
      </SectionShell>

      <SectionShell spacing="md">
        <div className="rounded-[28px] bg-primary-soft px-6 py-8 text-center sm:px-8 sm:py-10">
          <h2 className="text-[30px] font-semibold leading-[1.1] tracking-[-0.035em] text-secondary sm:text-[36px]">
            Richiedi preventivi gratuiti
          </h2>

          <p className="mx-auto mt-4 max-w-[620px] text-[15px] leading-[1.65] text-muted-foreground">
            Quando hai capito costi, fasi e priorita, invia la tua richiesta e confronta risposte
            piu utili dai professionisti disponibili.
          </p>

          <div className="mt-6">
            <Link
              href="/richiesta"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              Richiedi preventivi gratuiti
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </SectionShell>
    </div>
  )
}