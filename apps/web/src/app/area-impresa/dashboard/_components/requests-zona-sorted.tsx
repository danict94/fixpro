'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  Clock,
  MapPin,
  Users,
  Zap,
} from 'lucide-react'
import { formatRequestDisplayTitle, formatRequestPublishedLabel } from '@fixpro/shared'

interface Request {
  id: string
  title: string
  interventoNome: string | null
  categoriaNome: string
  settoreNome: string
  city: string | null
  province: string | null
  urgency: string | null
  creditCost: number | null
  createdAt: Date
  approvedAt: Date | null
  already_purchased: number
  buyer_count: number
  maxBuyers: number | null
}

interface RequestsZonaSortedProps {
  requests: Request[]
  urgencyLabel: Record<string, string>
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}g fa`
  if (hours > 0) return `${hours}h fa`
  if (minutes > 0) return `${minutes}m fa`
  return 'Ora'
}

export function RequestsZonaSorted({ requests }: RequestsZonaSortedProps) {
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')

  const sorted = [...requests].sort((a, b) => {
    if (sortOrder === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }

    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })

  return (
    <>
      <div className="flex w-full flex-col gap-4 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[22px] font-semibold leading-tight tracking-[-0.02em] text-secondary">
            Richieste nella tua zona
          </h2>

          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Opportunità compatibili con la tua area.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <div className="relative">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
              className="h-10 w-full cursor-pointer appearance-none rounded-full border border-primary/15 bg-white px-4 pr-10 text-sm font-medium text-secondary transition hover:bg-muted/50 sm:w-auto"
            >
              <option value="newest">Più recenti</option>
              <option value="oldest">Meno recenti</option>
            </select>

            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>

          <Link
            href="/area-impresa/richieste"
            className="inline-flex h-10 items-center justify-center gap-1 rounded-full px-2 text-sm font-semibold text-primary transition hover:text-primary/80"
          >
            Vedi tutte
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      </div>

      <div className="border-t-2 border-primary/35" />

      <div className="mt-4 divide-y divide-primary/10">
        {sorted.map((r) => {
          const isPurchased = r.already_purchased > 0
          const isClosed =
            !isPurchased && r.maxBuyers !== null && r.buyer_count >= r.maxBuyers

          const displayTitle = formatRequestDisplayTitle({
            title: r.title,
            interventoNome: r.interventoNome,
            city: r.city,
            province: r.province,
          })

          const publishedAt = r.approvedAt ?? r.createdAt

          const locationLabel =
            [r.city, r.province].filter(Boolean).join(', ') || 'Zona non specificata'

          return (
            <Link
              key={r.id}
              href={isClosed ? '#' : `/area-impresa/richieste/${r.id}`}
              className={isClosed ? 'pointer-events-none block' : 'block'}
            >
              <article
                className={`group relative grid gap-4 py-5 pl-5 pr-1 transition-colors sm:grid-cols-[1fr_210px] sm:pr-3 ${
                  isClosed ? 'opacity-60' : 'hover:bg-muted/25'
                }`}
              >
                <span
                  className={`absolute left-0 top-5 h-[calc(100%-2.5rem)] w-[3px] rounded-full ${
                    isPurchased ? 'bg-success' : 'bg-foreground'
                  }`}
                />

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      {r.categoriaNome || r.settoreNome}
                    </span>

                    {r.settoreNome && r.categoriaNome && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-primary/20" />

                        <span className="text-xs font-medium text-muted-foreground">
                          {r.settoreNome}
                        </span>
                      </>
                    )}
                  </div>

                  <h3 className="mt-2 line-clamp-1 text-base font-semibold tracking-tight text-secondary sm:text-[17px]">
                    {displayTitle}
                  </h3>

                  <p className="mt-2 line-clamp-2 max-w-4xl text-sm leading-6 text-muted-foreground">
                    Richiesta disponibile con dettagli aggiornati e contatto acquistabile.
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                    <span className="inline-flex min-w-0 items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.9} />
                      <span className="truncate">{locationLabel}</span>
                    </span>

                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 shrink-0" strokeWidth={1.9} />
                      <span>{formatTimeAgo(r.createdAt)}</span>
                    </span>

                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0" strokeWidth={1.9} />
                      <span>{formatRequestPublishedLabel(publishedAt)}</span>
                    </span>

                    {r.maxBuyers !== null && (
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 shrink-0" strokeWidth={1.9} />
                        <span>
                          {r.buyer_count}/{r.maxBuyers} acquistate
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-center">
                  <div className="text-left sm:text-right">
                    {isPurchased ? (
                      <>
                        <p className="text-sm font-semibold text-success">Sbloccata</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Dettagli cliente disponibili
                        </p>
                      </>
                    ) : r.creditCost !== null ? (
                      <>
                        <p className="inline-flex items-center gap-1 text-sm font-semibold text-secondary sm:justify-end">
                          <Zap className="h-4 w-4 text-secondary" strokeWidth={2} />
                          {r.creditCost} crediti
                        </p>

                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Costo contatto
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-secondary">
                          Disponibile
                        </p>

                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Costo non definito
                        </p>
                      </>
                    )}

                    {isClosed && (
                      <p className="mt-1 text-xs font-medium text-muted-foreground">
                        Richiesta chiusa
                      </p>
                    )}
                  </div>

                  {isPurchased ? (
                    <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-success/10 px-3.5 py-2 text-xs font-semibold text-success">
                      Vedi dettagli
                    </span>
                  ) : isClosed ? (
                    <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-muted px-3.5 py-2 text-xs font-semibold text-muted-foreground">
                      Chiusa
                    </span>
                  ) : (
                    <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-secondary px-3.5 py-2 text-xs font-semibold text-secondary-foreground transition duration-150 hover:bg-secondary/90">
                      Acquista
                    </span>
                  )}
                </div>
              </article>
            </Link>
          )
        })}
      </div>
    </>
  )
}