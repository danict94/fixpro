'use client'

import Link from 'next/link'
import {
  CheckCircle2, XCircle, ExternalLink,
  Building2, Crown, Sparkles,
} from 'lucide-react'
import { Badge } from '@fixpro/ui'

interface TabPanoramicaProps {
  ragioneSociale: string
  partitaIva: string | null
  slug: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'
  verified: boolean
  isShowcaseActive: boolean
  showcaseTier: string | null
  categoryCount: number
  city: string | null
  description: string | null
  phone: string | null
  logoUrl: string | null
  galleryCount: number
}

function StatusBadge({ status }: { status: TabPanoramicaProps['status'] }) {
  switch (status) {
    case 'APPROVED': return <Badge className="border-success/30 bg-success/10 text-success">Approvata</Badge>
    case 'PENDING': return <Badge className="border-warning/30 bg-warning/10 text-warning">In attesa</Badge>
    case 'REJECTED': return <Badge className="border-destructive/30 bg-destructive/10 text-destructive">Rifiutata</Badge>
    case 'SUSPENDED': return <Badge className="border-border bg-muted text-muted-foreground">Sospesa</Badge>
  }
}

function ShowcaseBadge({ isActive, tier }: { isActive: boolean; tier: string | null }) {
  if (!isActive) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        <Sparkles className="mr-1 h-3 w-3" strokeWidth={2} />
        Vetrina non attiva
      </Badge>
    )
  }

  if (tier === 'PRO') {
    return (
      <Badge className="border-primary/30 bg-primary/10 text-primary">
        <Crown className="mr-1 h-3 w-3 fill-primary stroke-none" />
        Vetrina Pro
      </Badge>
    )
  }

  return (
    <Badge className="border-primary/30 bg-primary/10 text-primary">
      <Sparkles className="mr-1 h-3 w-3" strokeWidth={2} />
      Vetrina {tier === 'PLUS' ? 'Plus' : 'Base'}
    </Badge>
  )
}

export function TabPanoramica({
  ragioneSociale,
  partitaIva,
  slug,
  status,
  verified,
  isShowcaseActive,
  showcaseTier,
  categoryCount,
  city,
  description,
  phone,
  logoUrl,
  galleryCount,
}: TabPanoramicaProps) {
  const items: { label: string; done: boolean; hint?: string }[] = [
    { label: 'Almeno una categoria di competenza', done: categoryCount > 0, hint: 'Vai alla tab Categorie' },
    { label: 'Città di copertura impostata', done: !!city, hint: 'Vai alla tab Zone servite' },
    { label: 'Descrizione attività presente', done: !!description, hint: 'Vai alla tab Dati attività' },
    { label: 'Numero aziendale inserito', done: !!phone, hint: 'Vai alla tab Dati attività' },
    { label: 'Logo caricato', done: !!logoUrl, hint: 'Vai alla tab Media' },
    { label: "Almeno un'immagine nel portfolio", done: galleryCount > 0, hint: 'Vai alla tab Media' },
  ]

  const completed = items.filter((i) => i.done).length
  const pct = Math.round((completed / items.length) * 100)

  return (
    <div className="space-y-6">
      <section className="surface-section flex flex-wrap items-start justify-between gap-4 px-5 py-5 sm:px-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-secondary">{ragioneSociale}</h2>
            {verified && (
              <span title="Impresa verificata">
                <CheckCircle2 className="h-5 w-5 shrink-0 stroke-success" strokeWidth={2} />
              </span>
            )}
          </div>
          {partitaIva && (
            <p className="mt-0.5 text-sm text-muted-foreground">P.IVA {partitaIva}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={status} />
            <ShowcaseBadge isActive={isShowcaseActive} tier={showcaseTier} />
          </div>
        </div>
        <Link
          href={`/impresa/${slug}`}
          target="_blank"
          className="secondary-link inline-flex shrink-0 items-center gap-1.5 text-sm"
        >
          <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.9} />
          Vedi profilo pubblico
        </Link>
      </section>

      <section className="surface-card px-5 py-5 sm:px-6">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-4 w-4 stroke-primary" strokeWidth={1.9} />
            </div>
            <div>
              <p className="text-sm font-semibold text-secondary">Completezza profilo</p>
              <p className="text-xs text-muted-foreground">{completed}/{items.length} voci completate</p>
            </div>
          </div>
          <span className="text-2xl font-bold text-primary">{pct}%</span>
        </div>

        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>

        <ul className="mt-4 space-y-2.5">
          {items.map((item) => (
            <li key={item.label} className="flex items-center gap-2.5 rounded-[18px] bg-[#F6F7FB] px-3 py-2.5">
              {item.done
                ? <CheckCircle2 className="h-4 w-4 shrink-0 stroke-success" strokeWidth={2} />
                : <XCircle className="h-4 w-4 shrink-0 stroke-muted-foreground" strokeWidth={1.8} />
              }
              <span className={`text-sm ${item.done ? 'text-secondary' : 'text-muted-foreground'}`}>
                {item.label}
              </span>
              {!item.done && item.hint && (
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">{'->'} {item.hint}</span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
