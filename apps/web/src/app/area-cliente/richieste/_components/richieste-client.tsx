'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  PlusCircle,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Zap,
  Archive,
  Star,
  Sparkles,
  Users,
} from 'lucide-react'
import { parseRequestDescription } from '@fixpro/shared'
import { Badge, Button, Card, CardContent, cn } from '@fixpro/ui'
import { ReviewForm } from './review-form'

const STATUS_CONFIG = {
  DRAFT: {
    label: 'Bozza',
    variant: 'secondary',
    icon: FileText,
    iconBg: 'bg-muted',
    iconStroke: 'stroke-muted-foreground',
  },
  PENDING: {
    label: 'In attesa',
    variant: 'warning',
    icon: Clock,
    iconBg: 'bg-warning/10',
    iconStroke: 'stroke-warning',
  },
  APPROVED: {
    label: 'Approvata',
    variant: 'success',
    icon: CheckCircle,
    iconBg: 'bg-success/10',
    iconStroke: 'stroke-success',
  },
  REJECTED: {
    label: 'Rifiutata',
    variant: 'destructive',
    icon: XCircle,
    iconBg: 'bg-destructive/10',
    iconStroke: 'stroke-destructive',
  },
  FULFILLED: {
    label: 'Completata',
    variant: 'success',
    icon: Zap,
    iconBg: 'bg-success/10',
    iconStroke: 'stroke-success',
  },
  EXPIRED: {
    label: 'Scaduta',
    variant: 'secondary',
    icon: Archive,
    iconBg: 'bg-muted',
    iconStroke: 'stroke-muted-foreground',
  },
} as const

type Purchase = {
  id: string
  company: { id: string; ragioneSociale: string; slug: string | null }
  review: { id: string } | null
}

type Richiesta = {
  id: string
  title: string
  description: string
  status: keyof typeof STATUS_CONFIG
  createdAt: Date | string
  city: string | null
  province: string | null
  categoria: { nome: string; slug: string }
  servizio: { nome: string } | null
  targetCompany: { ragioneSociale: string; slug: string | null } | null
  purchases: Purchase[]
}

export function RichiesteClient({ richieste }: { richieste: Richiesta[] }) {
  const [openReview, setOpenReview] = useState<string | null>(null)
  const [doneReviews, setDoneReviews] = useState<Set<string>>(new Set())

  function handleReviewDone(purchaseId: string) {
    setDoneReviews((prev) => new Set(prev).add(purchaseId))
    setOpenReview(null)
  }

  if (richieste.length === 0) {
    return (
      <section className="feature-panel px-6 py-10 text-center sm:px-8">
        <div className="mx-auto flex max-w-md flex-col items-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white ring-1 ring-border/60">
            <FileText className="h-8 w-8 stroke-primary" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-secondary">Nessuna richiesta inviata</p>
            <p className="muted-copy text-sm leading-6">
              Invia la tua prima richiesta e ricevi i contatti delle imprese più adatte al tuo
              lavoro.
            </p>
          </div>
          <Link href="/area-cliente/richieste/nuova">
            <Button className="primary-pill gap-2 px-5 py-3 text-sm font-semibold">
              <PlusCircle className="h-4 w-4" aria-hidden="true" />
              Invia una richiesta
            </Button>
          </Link>
        </div>
      </section>
    )
  }

  return (
    <div className="space-y-4">
      {richieste.map((r) => {
        const cfg = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.DRAFT
        const Icon = cfg.icon
        const reviewable =
          r.status === 'FULFILLED'
            ? r.purchases.filter((p) => !p.review && !doneReviews.has(p.id))
            : []
        const parsedDescription = parseRequestDescription(r.description)

        return (
          <div key={r.id} className="space-y-3">
            <Card className="surface-card border-0 shadow-none transition-transform duration-150 hover:-translate-y-0.5">
              <CardContent className="px-5 py-5 sm:px-6">
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      'flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
                      cfg.iconBg,
                    )}
                  >
                    <Icon className={cn('h-5 w-5', cfg.iconStroke)} aria-hidden="true" />
                  </div>

                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-base font-semibold text-secondary">{r.title}</p>
                      <Badge
                        variant={
                          cfg.variant as 'secondary' | 'success' | 'warning' | 'destructive'
                        }
                      >
                        {cfg.label}
                      </Badge>
                    </div>

                    <p className="muted-copy line-clamp-2 text-sm leading-6">
                      {parsedDescription.description}
                    </p>

                    {parsedDescription.hasMeta && (
                      <div className="flex flex-wrap items-center gap-2">
                        {parsedDescription.meta.map((item) => (
                          <span
                            key={`${item.label}-${item.value}`}
                            className="rounded-full border border-border bg-white px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
                          >
                            {item.value}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-0.5 text-xs text-muted-foreground">
                      <span>{r.categoria.nome}</span>
                      {r.servizio && (
                        <>
                          <span>·</span>
                          <span>{r.servizio.nome}</span>
                        </>
                      )}
                      {r.city && (
                        <>
                          <span>·</span>
                          <span>
                            {r.city}
                            {r.province ? ` (${r.province})` : ''}
                          </span>
                        </>
                      )}
                      <span>·</span>
                      <span>
                        {new Date(r.createdAt).toLocaleDateString('it-IT', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {r.targetCompany ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary">
                          <Sparkles className="h-3 w-3 shrink-0" strokeWidth={2} />
                          Diretta a{' '}
                          {r.targetCompany.slug ? (
                            <Link
                              href={`/impresa/${r.targetCompany.slug}`}
                              className="underline underline-offset-2 hover:text-primary/80"
                            >
                              {r.targetCompany.ragioneSociale}
                            </Link>
                          ) : (
                            r.targetCompany.ragioneSociale
                          )}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-2.5 py-1 text-xs text-muted-foreground">
                          <Users className="h-3 w-3 shrink-0" strokeWidth={1.9} />
                          Inviata a più professionisti
                        </span>
                      )}

                      {r.purchases.length > 0 && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-success/25 bg-success/5 px-2.5 py-1 text-xs font-medium text-success">
                          <CheckCircle className="h-3 w-3 shrink-0" strokeWidth={2} />
                          {r.purchases.length === 1
                            ? `${r.purchases[0]!.company.ragioneSociale} ha risposto`
                            : `${r.purchases.length} professionisti hanno risposto`}
                        </span>
                      )}
                    </div>

                    {reviewable.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {reviewable.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setOpenReview(openReview === p.id ? null : p.id)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/5 px-3 py-2 text-xs font-medium text-warning transition-colors hover:bg-warning/10"
                          >
                            <Star className="h-3.5 w-3.5 fill-warning stroke-none" />
                            Recensisci {p.company.ragioneSociale}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {reviewable.map((p) =>
              openReview === p.id ? (
                <ReviewForm
                  key={p.id}
                  purchaseId={p.id}
                  companyName={p.company.ragioneSociale}
                  onDone={() => handleReviewDone(p.id)}
                />
              ) : null,
            )}
          </div>
        )
      })}
    </div>
  )
}
