import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import {
  Zap,
  MapPin,
  CheckCircle,
  Clock,
  Users,
  Ruler,
  Bath,
  Layers3,
  SlidersHorizontal,
  Search,
} from 'lucide-react'
import {
  parseRequestDescription,
  isSurfaceMetaItem,
  isQuantityMetaItem,
  isBathroomContext,
  formatRequestDisplayTitle,
  formatRequestPublishedLabel,
} from '@fixpro/shared'
import { auth } from '@/lib/auth'
import { api } from '@/lib/trpc/server'
import { Badge } from '@fixpro/ui'
import { RichiestaCardLink } from './_components/richiesta-card-link'
import { RichiesteFilters } from './_components/richieste-filters'

function renderMetaBadge(item: { label: string; value: string }, interventoNome: string | null) {
  const Icon = isSurfaceMetaItem(item)
    ? Ruler
    : isQuantityMetaItem(item) && isBathroomContext(`${interventoNome ?? ''} ${item.value}`)
      ? Bath
      : Layers3

  return (
    <span
      key={`${item.label}-${item.value}`}
      className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-secondary"
    >
      <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.9} />
      {item.value}
    </span>
  )
}

type SearchParams = Promise<{
  q?: string
  city?: string
  lat?: string
  lng?: string
  sectorId?: string
  interventoId?: string
  categoriaId?: string
  servizioId?: string
  mode?: string
}>

export default async function RichiestePage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/accedi')

  const params = await searchParams

  const filters = {
    q: params.q?.trim() || undefined,
    city: params.city?.trim() || undefined,
    lat: params.lat ? Number(params.lat) : undefined,
    lng: params.lng ? Number(params.lng) : undefined,
    sectorId: params.sectorId?.trim() || undefined,
    interventoId: params.interventoId?.trim() || undefined,
    categoriaId: params.categoriaId?.trim() || undefined,
    servizioId: params.servizioId?.trim() || undefined,
    mode: params.mode === 'explore' ? ('explore' as const) : ('matching' as const),
  }

  const [richiesteRaw, settori, interventi] = await Promise.all([
    api.requests.listAvailable(filters),
    api.taxonomy.getSettori(),
    api.taxonomy.getInterventi(),
  ])

  const richieste = [
    ...richiesteRaw
      .filter((richiesta) => richiesta.isTargeted)
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      ),
    ...richiesteRaw
      .filter((richiesta) => !richiesta.isTargeted)
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      ),
  ]

  const interventiById = new Map(interventi.map((intervento) => [intervento.id, intervento.nome]))

  const targetedCount = richieste.filter((richiesta) => richiesta.isTargeted).length
  const purchasedCount = richieste.filter((richiesta) => richiesta.purchased).length
  const activeFiltersCount = [
    filters.q,
    filters.city,
    filters.sectorId,
    filters.interventoId,
    filters.categoriaId,
    filters.servizioId,
    filters.mode === 'explore' ? filters.mode : undefined,
  ].filter(Boolean).length

  return (
    <div className="bg-white py-10 sm:py-12 lg:py-14">
      <div className="mx-auto w-full max-w-[1120px] px-5 sm:px-7 lg:px-8">
        <header className="pb-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-[760px]">
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-primary">
                Area impresa
              </p>

              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-secondary sm:text-3xl">
                Richieste disponibili
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                {filters.mode === 'explore'
                  ? 'Esplora le opportunità disponibili e usa i filtri per trovare richieste interessanti anche fuori dal matching principale.'
                  : 'Visualizza prima le richieste più compatibili con il tuo profilo e affina i risultati con i filtri disponibili.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="font-semibold text-secondary">
                {richieste.length} {richieste.length === 1 ? 'richiesta' : 'richieste'}
              </span>

              <span className="h-1 w-1 rounded-full bg-border" />

              <span className="text-muted-foreground">
                {targetedCount} {targetedCount === 1 ? 'diretta' : 'dirette'}
              </span>

              <span className="h-1 w-1 rounded-full bg-border" />

              <span className="text-muted-foreground">
                {purchasedCount} {purchasedCount === 1 ? 'acquistata' : 'acquistate'}
              </span>
            </div>
          </div>
        </header>

        <main className="bg-white">
          <section className="py-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
                  <Search className="h-4.5 w-4.5" strokeWidth={2} />
                </div>

                <div>
                  <h2 className="text-base font-semibold tracking-tight text-secondary">
                    Filtri
                  </h2>

                  <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                    Restringi i risultati per zona, settore, categoria, servizio o intervento.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="w-fit rounded-full px-3 py-1 text-xs">
                  {filters.mode === 'explore' ? 'Esplora tutto' : 'Solo compatibili'}
                </Badge>

                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="w-fit rounded-full px-3 py-1 text-xs">
                    <SlidersHorizontal className="mr-1 h-3 w-3" strokeWidth={2} />
                    {activeFiltersCount}{' '}
                    {activeFiltersCount === 1 ? 'filtro attivo' : 'filtri attivi'}
                  </Badge>
                )}
              </div>
            </div>

            <div className="mt-4">
              <RichiesteFilters
                settori={settori.map((settore) => ({
                  id: settore.id,
                  nome: settore.nome,
                  categorie: settore.categorie.map((categoria) => ({
                    id: categoria.id,
                    nome: categoria.nome,
                    settoreId: settore.id,
                    servizi: categoria.servizi.map((servizio) => ({
                      id: servizio.id,
                      nome: servizio.nome,
                    })),
                  })),
                }))}
                interventi={interventi.map((intervento) => ({
                  id: intervento.id,
                  nome: intervento.nome,
                  matchingCategorie: intervento.matchingCategorie.map((matching) => ({
                    categoriaId: matching.categoriaId,
                    priorita: matching.priorita,
                    isPrimary: matching.isPrimary,
                  })),
                  matchingServizi: intervento.matchingServizi.map((matching) => ({
                    servizioId: matching.servizioId,
                  })),
                }))}
                initialQ={filters.q ?? ''}
                initialCity={filters.city ?? ''}
                initialLat={filters.lat}
                initialLng={filters.lng}
                initialSectorId={filters.sectorId ?? ''}
                initialInterventoId={filters.interventoId ?? ''}
                initialCategoriaId={filters.categoriaId ?? ''}
                initialServizioId={filters.servizioId ?? ''}
                initialMode={filters.mode}
              />
            </div>
          </section>

          <div className="border-t-2 border-primary/35" />

          <section className="py-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-base font-semibold tracking-tight text-secondary">
                  Richieste
                </h2>

                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Opportunità disponibili in formato compatto.
                </p>
              </div>

              <p className="text-sm font-medium text-muted-foreground">
                {richieste.length}{' '}
                {richieste.length === 1 ? 'risultato disponibile' : 'risultati disponibili'}
              </p>
            </div>

            {richieste.length === 0 ? (
              <div className="mt-6 flex flex-col items-center justify-center bg-muted/20 px-6 py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white ring-1 ring-primary/10">
                  <Zap className="h-6 w-6 stroke-primary" strokeWidth={1.7} />
                </div>

                <h3 className="mt-4 text-base font-semibold tracking-tight text-secondary">
                  Nessuna richiesta trovata
                </h3>

                <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  Prova a cambiare modalità, rimuovere un filtro o ampliare l&apos;area di ricerca.
                </p>
              </div>
            ) : (
              <div className="mt-4 divide-y divide-primary/10">
                {richieste.map((richiesta) => {
                  const isPurchased = richiesta.purchased
                  const buyerCount = Number(richiesta.buyer_count)
                  const isClosed =
                    !isPurchased &&
                    richiesta.maxBuyers !== null &&
                    buyerCount >= richiesta.maxBuyers

                  const interventoNome = richiesta.interventoId
                    ? richiesta.interventoNome ?? interventiById.get(richiesta.interventoId) ?? null
                    : null

                  const displayTitle = formatRequestDisplayTitle({
                    title: richiesta.title,
                    interventoNome,
                    city: richiesta.city,
                    province: richiesta.province,
                  })

                  const publishedAt = richiesta.approvedAt ?? richiesta.createdAt

                  const parsedDescription = parseRequestDescription(richiesta.description)
                  const descriptionText =
                    parsedDescription.description || 'Descrizione non specificata.'

                  const locationLabel =
                    [richiesta.city, richiesta.province].filter(Boolean).join(', ') ||
                    'Zona non specificata'

                  return (
                    <RichiestaCardLink
                      key={richiesta.id}
                      href={`/area-impresa/richieste/${richiesta.id}`}
                      disabled={isClosed}
                    >
                      <article
                        className={`group relative grid gap-4 py-5 pl-5 pr-1 transition-colors sm:grid-cols-[1fr_230px] sm:pr-3 ${
                          isClosed ? 'opacity-60' : 'hover:bg-muted/25'
                        }`}
                      >
                        <span
                          className={`absolute left-0 top-5 h-[calc(100%-2.5rem)] w-[3px] rounded-full ${
                            isPurchased ? 'bg-success' : 'bg-foreground'
                          }`}
                        />

                        <div className="min-w-0">
                          <h3 className="line-clamp-1 text-base font-semibold tracking-tight text-secondary sm:text-[17px]">
                            {displayTitle}
                          </h3>

                          <p className="mt-2 line-clamp-2 max-w-4xl text-sm leading-6 text-muted-foreground">
                            {descriptionText}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {parsedDescription.hasMeta ? (
                              parsedDescription.meta.map((item) =>
                                renderMetaBadge(item, interventoNome),
                              )
                            ) : (
                              <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                                Dimensioni non specificate
                              </span>
                            )}
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                            <span className="inline-flex min-w-0 items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.9} />
                              <span className="truncate">{locationLabel}</span>
                            </span>

                            <span className="inline-flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 shrink-0" strokeWidth={1.9} />
                              <span>{formatRequestPublishedLabel(publishedAt)}</span>
                            </span>

                            {richiesta.maxBuyers !== null && (
                              <span className="inline-flex items-center gap-1.5">
                                <Users className="h-3.5 w-3.5 shrink-0" strokeWidth={1.9} />
                                <span>
                                  {buyerCount}/{richiesta.maxBuyers} imprese
                                </span>
                              </span>
                            )}

                            <span className="inline-flex items-center gap-1.5">
                              <CheckCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={1.9} />
                              <span>Cliente verificato</span>
                            </span>

                            <span className="rounded-full bg-muted px-2.5 py-1 font-medium text-secondary">
                              {richiesta.categoriaNome}
                            </span>

                            <span className="rounded-full bg-muted px-2.5 py-1 font-medium text-muted-foreground">
                              {richiesta.settoreNome}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-center">
                          <div className="text-left sm:text-right">
                            {isPurchased ? (
                              <>
                                <p className="text-sm font-semibold text-success">
                                  Sbloccata
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  Dettagli cliente disponibili
                                </p>
                              </>
                            ) : richiesta.oneTimePriceCents !== null ? (
                              <>
                                <p className="text-sm font-semibold text-secondary">
                                  EUR{' '}
                                  {(richiesta.oneTimePriceCents / 100)
                                    .toFixed(2)
                                    .replace('.', ',')}
                                </p>

                                {richiesta.creditCost !== null && (
                                  <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground sm:justify-end">
                                    oppure{' '}
                                    <Zap className="h-3.5 w-3.5 text-secondary" />{' '}
                                    {richiesta.creditCost} crediti
                                  </p>
                                )}
                              </>
                            ) : richiesta.creditCost !== null ? (
                              <>
                                <p className="inline-flex items-center gap-1 text-sm font-semibold text-secondary sm:justify-end">
                                  <Zap className="h-4 w-4 text-secondary" strokeWidth={2} />
                                  {richiesta.creditCost} crediti
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
                                  Apri dettagli
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
                            <span className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-success/10 px-3.5 py-2 text-xs font-semibold text-success">
                              <CheckCircle className="h-3.5 w-3.5" strokeWidth={2} />
                              Vedi dettagli
                            </span>
                          ) : isClosed ? (
                            <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-muted px-3.5 py-2 text-xs font-semibold text-muted-foreground">
                              Chiusa
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="inline-flex shrink-0 items-center justify-center rounded-full bg-secondary px-3.5 py-2 text-xs font-semibold text-secondary-foreground transition duration-150 hover:bg-secondary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                              disabled={isClosed}
                            >
                              Acquista
                            </button>
                          )}
                        </div>
                      </article>
                    </RichiestaCardLink>
                  )
                })}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}