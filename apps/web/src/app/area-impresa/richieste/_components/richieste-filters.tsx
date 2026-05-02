'use client'

import { useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { CircleHelp, Compass, Search, Target, X } from 'lucide-react'
import { AddressAutocomplete, Button, Input, cn } from '@fixpro/ui'

type ServizioOption = {
  id: string
  nome: string
}

type CategoriaOption = {
  id: string
  nome: string
  settoreId: string
  servizi: ServizioOption[]
}

type SettoreOption = {
  id: string
  nome: string
  categorie: CategoriaOption[]
}

type InterventoOption = {
  id: string
  nome: string
  matchingCategorie: {
    categoriaId: string
    priorita: number
    isPrimary: boolean
  }[]
  matchingServizi: {
    servizioId: string
  }[]
}

const MODE_HINT: Record<'matching' | 'explore', string> = {
  matching: 'Mostra prima le richieste più vicine alle tue preferenze attuali.',
  explore: 'Esplora liberamente tutte le richieste disponibili usando i filtri scelti.',
}

interface RichiesteFiltersProps {
  settori: SettoreOption[]
  interventi: InterventoOption[]
  initialQ: string
  initialCity: string
  initialLat?: number
  initialLng?: number
  initialSectorId: string
  initialInterventoId: string
  initialCategoriaId: string
  initialServizioId: string
  initialMode: 'matching' | 'explore'
}

export function RichiesteFilters({
  settori,
  interventi,
  initialQ,
  initialCity,
  initialLat,
  initialLng,
  initialSectorId,
  initialInterventoId,
  initialCategoriaId,
  initialServizioId,
  initialMode,
}: RichiesteFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()

  const [q, setQ] = useState(initialQ)
  const [city, setCity] = useState(initialCity)
  const [lat, setLat] = useState<number | undefined>(initialLat)
  const [lng, setLng] = useState<number | undefined>(initialLng)
  const [sectorId, setSectorId] = useState(initialSectorId)
  const [interventoId, setInterventoId] = useState(initialInterventoId)
  const [categoriaId, setCategoriaId] = useState(initialCategoriaId)
  const [servizioId, setServizioId] = useState(initialServizioId)
  const [mode, setMode] = useState<'matching' | 'explore'>(initialMode)
  const [autocompleteKey, setAutocompleteKey] = useState(0)

  const categorieById = useMemo(
    () =>
      new Map(
        settori.flatMap((settore) =>
          settore.categorie.map((categoria) => [categoria.id, categoria] as const),
        ),
      ),
    [settori],
  )

  const selectedSector = useMemo(
    () => settori.find((settore) => settore.id === sectorId),
    [sectorId, settori],
  )
  const selectedIntervento = useMemo(
    () => interventi.find((intervento) => intervento.id === interventoId),
    [interventi, interventoId],
  )

  const availableCategorie = useMemo(() => {
    if (selectedIntervento) {
      return selectedIntervento.matchingCategorie
        .map((matching) => {
          const categoria = categorieById.get(matching.categoriaId)
          return categoria
            ? { ...categoria, isPrimary: matching.isPrimary, priorita: matching.priorita }
            : null
        })
        .filter(
          (
            categoria,
          ): categoria is CategoriaOption & { isPrimary: boolean; priorita: number } =>
            categoria !== null && (!sectorId || categoria.settoreId === sectorId),
        )
        .sort((left, right) => {
          if (Number(right.isPrimary) !== Number(left.isPrimary)) {
            return Number(right.isPrimary) - Number(left.isPrimary)
          }
          if (left.priorita !== right.priorita) {
            return left.priorita - right.priorita
          }
          return left.nome.localeCompare(right.nome, 'it')
        })
    }

    const categorie = sectorId
      ? settori.find((settore) => settore.id === sectorId)?.categorie ?? []
      : settori.flatMap((settore) => settore.categorie)

    return [...categorie].sort((left, right) => left.nome.localeCompare(right.nome, 'it'))
  }, [categorieById, sectorId, selectedIntervento, settori])

  const availableServizi = useMemo(() => {
    const selectedCategoria = availableCategorie.find((categoria) => categoria.id === categoriaId)
    const allowedServiceIds = new Set(
      selectedIntervento?.matchingServizi.map((matching) => matching.servizioId) ?? [],
    )

    if (selectedCategoria) {
      return selectedCategoria.servizi
        .filter((servizio) => !selectedIntervento || allowedServiceIds.has(servizio.id))
        .map((servizio) => ({
          id: servizio.id,
          nome: servizio.nome,
        }))
    }

    if (!selectedIntervento) {
      return []
    }

    const seen = new Set<string>()
    return availableCategorie
      .flatMap((categoria) =>
        categoria.servizi
          .filter((servizio) => allowedServiceIds.has(servizio.id))
          .map((servizio) => ({
            id: servizio.id,
            nome: `${servizio.nome} - ${categoria.nome}`,
          })),
      )
      .filter((servizio) => {
        if (seen.has(servizio.id)) return false
        seen.add(servizio.id)
        return true
      })
  }, [availableCategorie, categoriaId, selectedIntervento])

  const selectedCategoria = useMemo(
    () => availableCategorie.find((categoria) => categoria.id === categoriaId),
    [availableCategorie, categoriaId],
  )
  const selectedServizio = useMemo(
    () => availableServizi.find((servizio) => servizio.id === servizioId),
    [availableServizi, servizioId],
  )

  function syncDependentFilters(next: {
    nextSectorId?: string
    nextInterventoId?: string
    nextCategoriaId?: string
    nextServizioId?: string
  }) {
    const nextSectorValue = next.nextSectorId ?? sectorId
    const nextInterventoValue = next.nextInterventoId ?? interventoId
    let nextCategoriaValue = next.nextCategoriaId ?? categoriaId
    let nextServizioValue = next.nextServizioId ?? servizioId

    const nextSelectedIntervento = interventi.find((intervento) => intervento.id === nextInterventoValue)
    const nextAvailableCategorie = nextSelectedIntervento
      ? nextSelectedIntervento.matchingCategorie
          .map((matching) => {
            const categoria = categorieById.get(matching.categoriaId)
            return categoria
              ? { ...categoria, isPrimary: matching.isPrimary, priorita: matching.priorita }
              : null
          })
          .filter(
            (
              categoria,
            ): categoria is CategoriaOption & { isPrimary: boolean; priorita: number } =>
              categoria !== null && (!nextSectorValue || categoria.settoreId === nextSectorValue),
          )
      : nextSectorValue
        ? settori.find((settore) => settore.id === nextSectorValue)?.categorie ?? []
        : settori.flatMap((settore) => settore.categorie)

    if (
      nextCategoriaValue &&
      !nextAvailableCategorie.some((categoria) => categoria.id === nextCategoriaValue)
    ) {
      nextCategoriaValue = ''
      nextServizioValue = ''
    }

    const nextSelectedCategoria = nextAvailableCategorie.find(
      (categoria) => categoria.id === nextCategoriaValue,
    )
    const allowedServiceIds = new Set(
      nextSelectedIntervento?.matchingServizi.map((matching) => matching.servizioId) ?? [],
    )
    const nextAvailableServizioIds = nextSelectedCategoria
      ? nextSelectedCategoria.servizi
          .filter((servizio) => !nextSelectedIntervento || allowedServiceIds.has(servizio.id))
          .map((servizio) => servizio.id)
      : nextSelectedIntervento
        ? nextAvailableCategorie.flatMap((categoria) =>
            categoria.servizi
              .filter((servizio) => allowedServiceIds.has(servizio.id))
              .map((servizio) => servizio.id),
          )
        : []

    if (nextServizioValue && !nextAvailableServizioIds.includes(nextServizioValue)) {
      nextServizioValue = ''
    }

    setSectorId(nextSectorValue)
    setInterventoId(nextInterventoValue)
    setCategoriaId(nextCategoriaValue)
    setServizioId(nextServizioValue)

    return {
      sectorId: nextSectorValue,
      interventoId: nextInterventoValue,
      categoriaId: nextCategoriaValue,
      servizioId: nextServizioValue,
    }
  }

  function pushFilters(next: {
    q?: string
    city?: string
    lat?: number
    lng?: number
    sectorId?: string
    interventoId?: string
    categoriaId?: string
    servizioId?: string
    mode?: 'matching' | 'explore'
  }) {
    const params = new URLSearchParams()

    const qValue = next.q?.trim()
    const cityValue = next.city?.trim()
    const sectorValue = next.sectorId?.trim()
    const interventoValue = next.interventoId?.trim()
    const categoriaValue = next.categoriaId?.trim()
    const servizioValue = next.servizioId?.trim()
    const modeValue = next.mode ?? 'matching'

    if (qValue) params.set('q', qValue)
    if (cityValue) params.set('city', cityValue)
    if (typeof next.lat === 'number') params.set('lat', String(next.lat))
    if (typeof next.lng === 'number') params.set('lng', String(next.lng))
    if (sectorValue) params.set('sectorId', sectorValue)
    if (interventoValue) params.set('interventoId', interventoValue)
    if (categoriaValue) params.set('categoriaId', categoriaValue)
    if (servizioValue) params.set('servizioId', servizioValue)
    if (modeValue !== 'matching') params.set('mode', modeValue)

    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    pushFilters({ q, city, lat, lng, sectorId, interventoId, categoriaId, servizioId, mode })
  }

  function clearCity() {
    setCity('')
    setLat(undefined)
    setLng(undefined)
    setAutocompleteKey((value) => value + 1)
    pushFilters({
      q,
      city: '',
      lat: undefined,
      lng: undefined,
      sectorId,
      interventoId,
      categoriaId,
      servizioId,
      mode,
    })
  }

  function clearQuery() {
    setQ('')
    pushFilters({ q: '', city, lat, lng, sectorId, interventoId, categoriaId, servizioId, mode })
  }

  function clearSector() {
    const nextFilters = syncDependentFilters({ nextSectorId: '' })
    pushFilters({
      q,
      city,
      lat,
      lng,
      sectorId: nextFilters.sectorId,
      interventoId: nextFilters.interventoId,
      categoriaId: nextFilters.categoriaId,
      servizioId: nextFilters.servizioId,
      mode,
    })
  }

  function clearIntervento() {
    const nextFilters = syncDependentFilters({
      nextInterventoId: '',
      nextCategoriaId: '',
      nextServizioId: '',
    })
    pushFilters({
      q,
      city,
      lat,
      lng,
      sectorId,
      interventoId: nextFilters.interventoId,
      categoriaId: nextFilters.categoriaId,
      servizioId: nextFilters.servizioId,
      mode,
    })
  }

  function clearCategoria() {
    const nextFilters = syncDependentFilters({ nextCategoriaId: '', nextServizioId: '' })
    pushFilters({
      q,
      city,
      lat,
      lng,
      sectorId,
      interventoId: nextFilters.interventoId,
      categoriaId: nextFilters.categoriaId,
      servizioId: nextFilters.servizioId,
      mode,
    })
  }

  function clearServizio() {
    setServizioId('')
    pushFilters({
      q,
      city,
      lat,
      lng,
      sectorId,
      interventoId,
      categoriaId,
      servizioId: '',
      mode,
    })
  }

  function resetMode() {
    setMode('matching')
    pushFilters({
      q,
      city,
      lat,
      lng,
      sectorId,
      interventoId,
      categoriaId,
      servizioId,
      mode: 'matching',
    })
  }

  function resetAll() {
    setQ('')
    setCity('')
    setLat(undefined)
    setLng(undefined)
    setSectorId('')
    setInterventoId('')
    setCategoriaId('')
    setServizioId('')
    setMode('matching')
    setAutocompleteKey((value) => value + 1)
    router.push(pathname)
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Ricerca avanzata richieste</p>
          <p className="text-xs text-muted-foreground">
            Parti dall&apos;intervento e usa categoria e servizio come affinamento, mantenendo zona e modalità di ricerca.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-border bg-muted p-1">
            <button
              type="button"
              onClick={() => setMode('matching')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                mode === 'matching'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Target className="h-3.5 w-3.5" strokeWidth={2} />
              Matching
            </button>
            <button
              type="button"
              onClick={() => setMode('explore')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                mode === 'explore'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Compass className="h-3.5 w-3.5" strokeWidth={2} />
              Explore
            </button>
          </div>

          <div className="group relative">
            <button
              type="button"
              aria-label="Info modalità ricerca"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <CircleHelp className="h-4 w-4" strokeWidth={2} />
            </button>

            <div className="pointer-events-none absolute right-0 top-10 z-20 w-64 rounded-xl border border-border bg-background p-3 text-xs leading-5 text-muted-foreground opacity-0 shadow-card transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
              <p className="font-medium text-foreground">
                {mode === 'matching' ? 'Matching' : 'Explore'}
              </p>
              <p className="mt-1">{MODE_HINT[mode]}</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1.2fr)_minmax(220px,1fr)]">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="richieste-q">
              Ricerca
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 stroke-muted-foreground" strokeWidth={2} />
              <Input
                id="richieste-q"
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="Cosa cerchi? es. bagno ristrutturazione"
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Luogo
            </label>
            {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
              <AddressAutocomplete
                key={`${initialCity}-${autocompleteKey}`}
                apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                defaultValue={city}
                placeholder="Cerca città o indirizzo"
                onAddressChange={(result) => {
                  setCity(result.city || result.formattedAddress)
                  setLat(result.lat ?? undefined)
                  setLng(result.lng ?? undefined)
                }}
              />
            ) : (
              <Input
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="Cerca città"
              />
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="richieste-intervento">
              Intervento
            </label>
            <select
              id="richieste-intervento"
              value={interventoId}
              onChange={(event) =>
                syncDependentFilters({
                  nextInterventoId: event.target.value,
                  nextCategoriaId: categoriaId,
                  nextServizioId: servizioId,
                })
              }
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Tutti gli interventi</option>
              {interventi.map((intervento) => (
                <option key={intervento.id} value={intervento.id}>
                  {intervento.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-3 xl:grid-cols-[minmax(180px,0.8fr)_minmax(220px,1fr)_minmax(220px,1fr)_auto]">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="richieste-sector">
              Settore
            </label>
            <select
              id="richieste-sector"
              value={sectorId}
              onChange={(event) =>
                syncDependentFilters({
                  nextSectorId: event.target.value,
                  nextCategoriaId: categoriaId,
                  nextServizioId: servizioId,
                })
              }
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Tutti i settori</option>
              {settori.map((settore) => (
                <option key={settore.id} value={settore.id}>
                  {settore.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="richieste-categoria">
              Categoria
            </label>
            <select
              id="richieste-categoria"
              value={categoriaId}
              onChange={(event) =>
                syncDependentFilters({
                  nextCategoriaId: event.target.value,
                  nextServizioId: servizioId,
                })
              }
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">
                {selectedIntervento ? 'Tutte le categorie compatibili' : 'Tutte le categorie'}
              </option>
              {availableCategorie.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="richieste-servizio">
              Servizio
            </label>
            <select
              id="richieste-servizio"
              value={servizioId}
              onChange={(event) => setServizioId(event.target.value)}
              disabled={!selectedIntervento && !categoriaId}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">
                {selectedCategoria
                  ? 'Tutti i servizi della categoria'
                  : selectedIntervento
                    ? 'Tutti i servizi compatibili'
                    : 'Seleziona prima un intervento o una categoria'}
              </option>
              {availableServizi.map((servizio) => (
                <option key={servizio.id} value={servizio.id}>
                  {servizio.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <Button type="submit" className="min-w-28">
              Applica
            </Button>
            <Button type="button" variant="secondary" onClick={resetAll}>
              Reset
            </Button>
          </div>
        </div>
      </form>

      {(q || city || sectorId || interventoId || categoriaId || servizioId || mode === 'explore') && (
        <div className="flex flex-wrap gap-2">
          {q && (
            <button
              type="button"
              onClick={clearQuery}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-foreground"
            >
              q: {q}
              <X className="h-3 w-3" strokeWidth={2} />
            </button>
          )}

          {city && (
            <button
              type="button"
              onClick={clearCity}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-foreground"
            >
              città: {city}
              <X className="h-3 w-3" strokeWidth={2} />
            </button>
          )}

          {selectedSector && (
            <button
              type="button"
              onClick={clearSector}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-foreground"
            >
              settore: {selectedSector.nome}
              <X className="h-3 w-3" strokeWidth={2} />
            </button>
          )}

          {selectedIntervento && (
            <button
              type="button"
              onClick={clearIntervento}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-foreground"
            >
              intervento: {selectedIntervento.nome}
              <X className="h-3 w-3" strokeWidth={2} />
            </button>
          )}

          {selectedCategoria && (
            <button
              type="button"
              onClick={clearCategoria}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-foreground"
            >
              categoria: {selectedCategoria.nome}
              <X className="h-3 w-3" strokeWidth={2} />
            </button>
          )}

          {selectedServizio && (
            <button
              type="button"
              onClick={clearServizio}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-foreground"
            >
              servizio: {selectedServizio.nome}
              <X className="h-3 w-3" strokeWidth={2} />
            </button>
          )}

          {mode === 'explore' && (
            <button
              type="button"
              onClick={resetMode}
              className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
            >
              explore libera
              <X className="h-3 w-3" strokeWidth={2} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
