'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { Button, Input, cn } from '@fixpro/ui'
import { trpc } from '@/lib/trpc/client'
import type { api } from '@/lib/trpc/server'

type Settori = Awaited<ReturnType<typeof api.taxonomy.getSettori>>
type Settore = Settori[number]
type Categoria = Settore['categorie'][number]
type Servizio = Categoria['servizi'][number]

type CategoriaConSettore = Categoria & {
  settoreId: string
  settoreNome: string
}

type CategoriaSuggestion = CategoriaConSettore & {
  score: number
  reason: string
  interventi: string[]
}

interface Props {
  settori: Settori
  selectedCategoriaIds: string[]
  selectedServizioIds: string[]
}

const POPULAR_CATEGORY_SLUGS = [
  'impresa-edile',
  'muratore',
  'idraulico',
  'elettricista',
  'termoidraulico',
  'imbianchino',
  'fabbro',
  'geometra',
  'architetto',
  'traslocatore',
]

const QUERY_SYNONYMS: Record<string, string[]> = {
  bagno: ['bagno', 'sanitari', 'doccia', 'piastrelle bagno', 'ristrutturazione bagno'],
  bagni: ['bagno', 'sanitari', 'doccia', 'piastrelle bagno', 'ristrutturazione bagno'],
  cucina: ['cucina', 'lavastoviglie', 'piastrelle cucina', 'impianto cucina'],
  cucine: ['cucina', 'lavastoviglie', 'piastrelle cucina', 'impianto cucina'],
  caldaia: ['caldaia', 'termoidraulico', 'riscaldamento'],
  caldaie: ['caldaia', 'termoidraulico', 'riscaldamento'],
  condizionatore: ['climatizzatore', 'condizionatore', 'aria condizionata'],
  clima: ['climatizzatore', 'condizionatore', 'aria condizionata'],
  facciata: ['facciata', 'intonaci', 'cappotto', 'rasatura facciata'],
  facciate: ['facciata', 'intonaci', 'cappotto', 'rasatura facciata'],
  cappotto: ['cappotto termico', 'isolamento facciata', 'coibentazione'],
  balcone: ['balcone', 'balconi', 'frontalini', 'ringhiere'],
  balconi: ['balcone', 'balconi', 'frontalini', 'ringhiere'],
  terrazzo: ['terrazzo', 'impermeabilizzazione', 'guaina'],
  tetto: ['tetto', 'coperture', 'grondaie'],
  serratura: ['serratura', 'fabbro', 'porta'],
  serrature: ['serratura', 'fabbro', 'porta'],
  infissi: ['infissi', 'finestre', 'serramenti', 'vetro'],
  serramenti: ['infissi', 'finestre', 'serramenti', 'vetro'],
  trasloco: ['trasloco', 'traslocatore', 'sgombero'],
  traslochi: ['trasloco', 'traslocatore', 'sgombero'],
  giardino: ['giardino', 'giardiniere', 'potatura', 'irrigazione'],
  giardini: ['giardino', 'giardiniere', 'potatura', 'irrigazione'],
  piscina: ['piscina', 'piscine', 'impresa piscine', 'realizzazione piscina'],
  piscine: ['piscina', 'piscine', 'impresa piscine', 'realizzazione piscina'],
  cartongesso: ['cartongesso', 'cartongessista', 'controsoffitto', 'parete in cartongesso'],
}

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values))
}

function buildShortList(values: string[], max = 3): string {
  const clean = unique(values.map((value) => value.trim()).filter(Boolean))

  if (clean.length === 0) return ''
  if (clean.length <= max) return clean.join(', ')

  return `${clean.slice(0, max).join(', ')} +${clean.length - max}`
}

function buildAllCategories(settori: Settori): CategoriaConSettore[] {
  return settori.flatMap((settore) =>
    settore.categorie.map((categoria) => ({
      ...categoria,
      settoreId: settore.id,
      settoreNome: settore.nome,
    })),
  )
}

function toCategoriaConSettore(
  settore: Settore,
  categoria: Categoria,
): CategoriaConSettore {
  return {
    ...categoria,
    settoreId: settore.id,
    settoreNome: settore.nome,
  }
}

function getCategoriaServices(categoria: Categoria): Servizio[] {
  return categoria.servizi ?? []
}

function getSuggestionReason(
  categoria: CategoriaConSettore,
  interventi: string[],
): string {
  if (interventi.length > 0) {
    return `Riceverai: ${buildShortList(interventi, 3)}`
  }

  const services = getCategoriaServices(categoria).map((servizio) => servizio.nome)

  if (services.length > 0) {
    return `Servizi: ${buildShortList(services, 3)}`
  }

  return categoria.settoreNome
}

function buildSuggestions({
  query,
  categories,
  selectedIds,
  interventiByCategoria,
}: {
  query: string
  categories: CategoriaConSettore[]
  selectedIds: Set<string>
  interventiByCategoria: Record<string, string[]>
}): CategoriaSuggestion[] {
  const normalizedQuery = normalizeSearchText(query)

  if (!normalizedQuery) {
    return []
  }

  const queryTerms = unique([
    normalizedQuery,
    ...(QUERY_SYNONYMS[normalizedQuery] ?? []).map(normalizeSearchText),
  ])

  return categories
    .map((categoria) => {
      const name = normalizeSearchText(categoria.nome)
      const slug = normalizeSearchText(categoria.slug)
      const settore = normalizeSearchText(categoria.settoreNome)
      const services = getCategoriaServices(categoria).map((servizio) =>
        normalizeSearchText(servizio.nome),
      )
      const interventi = interventiByCategoria[categoria.id] ?? []
      const normalizedInterventi = interventi.map(normalizeSearchText)

      let score = 0

      for (const term of queryTerms) {
        if (name === term || slug === term) score += 120
        if (name.includes(term) || term.includes(name)) score += 90

        if (
          services.some(
            (servizio) => servizio.includes(term) || term.includes(servizio),
          )
        ) {
          score += 68
        }

        if (
          normalizedInterventi.some(
            (intervento) => intervento.includes(term) || term.includes(intervento),
          )
        ) {
          score += 82
        }

        if (settore.includes(term)) score += 25
      }

      if (POPULAR_CATEGORY_SLUGS.includes(categoria.slug)) score += 8
      if (selectedIds.has(categoria.id)) score += 20

      return {
        ...categoria,
        score,
        reason: getSuggestionReason(categoria, interventi),
        interventi,
      }
    })
    .filter((categoria) => categoria.score > 0)
    .sort((a, b) => b.score - a.score || a.nome.localeCompare(b.nome))
    .slice(0, 10)
}

export function TabCategorie({
  settori,
  selectedCategoriaIds,
  selectedServizioIds,
}: Props) {
  const router = useRouter()

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(selectedCategoriaIds),
  )
  const [selectedServices, setSelectedServices] = useState<Set<string>>(
    () => new Set(selectedServizioIds),
  )
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [expandedSectorIds, setExpandedSectorIds] = useState<string[]>([])
  const [expandedBrowseCategoryIds, setExpandedBrowseCategoryIds] = useState<string[]>([])
  const [expandedServiceCategoryIds, setExpandedServiceCategoryIds] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const { data: interventi } = trpc.taxonomy.getInterventi.useQuery()

  const interventiByCategoria = useMemo(() => {
    const map: Record<string, string[]> = {}

    for (const intervento of interventi ?? []) {
      for (const matching of intervento.matchingCategorie) {
        const names = map[matching.categoriaId] ?? []
        names.push(intervento.nome)
        map[matching.categoriaId] = names
      }
    }

    return map
  }, [interventi])

  const allCategories = useMemo(() => buildAllCategories(settori), [settori])

  const selectedCategories = useMemo(() => {
    return allCategories.filter((categoria) => selectedIds.has(categoria.id))
  }, [allCategories, selectedIds])

  const selectedServicesByCategory = useMemo(() => {
    const map = new Map<string, string[]>()

    for (const categoria of allCategories) {
      const ids = getCategoriaServices(categoria)
        .filter((servizio) => selectedServices.has(servizio.id))
        .map((servizio) => servizio.id)

      map.set(categoria.id, ids)
    }

    return map
  }, [allCategories, selectedServices])

  const totalServicesForSelectedCategories = useMemo(() => {
    return selectedCategories.reduce(
      (sum, categoria) => sum + getCategoriaServices(categoria).length,
      0,
    )
  }, [selectedCategories])

  const suggestions = useMemo(
    () =>
      buildSuggestions({
        query,
        categories: allCategories,
        selectedIds,
        interventiByCategoria,
      }),
    [allCategories, interventiByCategoria, query, selectedIds],
  )

  const showSuggestions = focused && query.trim().length > 0

  const update = trpc.company.updateCategories.useMutation({
    onSuccess: () => router.refresh(),
    onError: (e) => setError(e.message),
  })

  function ensureCategoriaSelected(categoria: CategoriaConSettore) {
    setSelectedIds((prev) => {
      if (prev.has(categoria.id)) return prev

      const next = new Set(prev)
      next.add(categoria.id)
      return next
    })
  }

  function toggleCategoria(categoria: CategoriaConSettore) {
    setError(null)

    setSelectedIds((prev) => {
      const next = new Set(prev)
      const wasSelected = next.has(categoria.id)

      if (wasSelected) {
        next.delete(categoria.id)

        setSelectedServices((prevServices) => {
          const nextServices = new Set(prevServices)
          for (const servizio of getCategoriaServices(categoria)) {
            nextServices.delete(servizio.id)
          }
          return nextServices
        })

        setExpandedServiceCategoryIds((current) =>
          current.filter((id) => id !== categoria.id),
        )
      } else {
        next.add(categoria.id)

        setExpandedServiceCategoryIds((current) =>
          current.includes(categoria.id) ? current : [...current, categoria.id],
        )
      }

      return next
    })
  }

  function removeCategoria(categoria: CategoriaConSettore) {
    if (!selectedIds.has(categoria.id)) return
    toggleCategoria(categoria)
  }

 function toggleService(id: string) {
  setError(null)

  setSelectedServices((prev) => {
    const next = new Set(prev)

    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }

    return next
  })
}

  function toggleServiceForCategoria(categoria: CategoriaConSettore, servizioId: string) {
    setError(null)
    ensureCategoriaSelected(categoria)
    toggleService(servizioId)
  }

  function selectAllServices(categoria: CategoriaConSettore) {
    setError(null)
    ensureCategoriaSelected(categoria)

    setSelectedServices((prev) => {
      const next = new Set(prev)
      for (const servizio of getCategoriaServices(categoria)) {
        next.add(servizio.id)
      }
      return next
    })
  }

  function clearCategoryServices(categoria: CategoriaConSettore) {
    setError(null)

    setSelectedServices((prev) => {
      const next = new Set(prev)
      for (const servizio of getCategoriaServices(categoria)) {
        next.delete(servizio.id)
      }
      return next
    })
  }

  function toggleServiceAccordion(categoriaId: string) {
    setExpandedServiceCategoryIds((current) =>
      current.includes(categoriaId)
        ? current.filter((id) => id !== categoriaId)
        : [...current, categoriaId],
    )
  }

  function toggleSectorAccordion(settoreId: string) {
    setExpandedSectorIds((current) =>
      current.includes(settoreId)
        ? current.filter((id) => id !== settoreId)
        : [...current, settoreId],
    )
  }

  function toggleBrowseCategory(categoriaId: string) {
    setExpandedBrowseCategoryIds((current) =>
      current.includes(categoriaId)
        ? current.filter((id) => id !== categoriaId)
        : [...current, categoriaId],
    )
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (selectedIds.size === 0) {
      setError('Seleziona almeno una categoria')
      return
    }

    update.mutate({
      categoriaIds: Array.from(selectedIds),
      servizioIds: Array.from(selectedServices),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <section className="rounded-[24px] border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Profilo impresa
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-secondary">
              Competenze e servizi
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Seleziona le categorie che rappresentano la tua attività. I servizi
              sono opzionali e servono solo a rendere il matching più preciso.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary">
              {selectedIds.size} categorie
            </span>
            <span className="rounded-full bg-muted px-3 py-1 font-medium text-muted-foreground">
              {selectedServices.size}/{totalServicesForSelectedCategories} servizi
            </span>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-secondary">
            Cerca rapidamente
          </h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Scrivi un mestiere o un lavoro, ad esempio bagno, caldaia, infissi,
            piscina, cartongesso.
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={query}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              window.setTimeout(() => setFocused(false), 140)
            }}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Es. bagno, caldaia, rubinetto, facciata, infissi..."
            className="h-11 rounded-full pl-10 pr-10"
            role="combobox"
            aria-expanded={showSuggestions}
            aria-controls="company-category-suggestions"
            aria-autocomplete="list"
          />

          {query ? (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-secondary"
              aria-label="Pulisci ricerca"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}

          {showSuggestions ? (
            <div
              id="company-category-suggestions"
              role="listbox"
              className="absolute left-0 right-0 top-full z-30 mt-2 max-h-[380px] overflow-y-auto rounded-[20px] border border-border bg-background p-2 shadow-xl"
            >
              <p className="px-2 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Suggerimenti
              </p>

              {suggestions.length > 0 ? (
                <div className="space-y-1.5">
                  {suggestions.map((categoria) => {
                    const selected = selectedIds.has(categoria.id)
                    const selectedServiceCount =
                      selectedServicesByCategory.get(categoria.id)?.length ?? 0

                    return (
                      <button
                        key={categoria.id}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => toggleCategoria(categoria)}
                        className={cn(
                          'flex w-full items-start gap-3 rounded-[16px] px-3 py-3 text-left transition-colors',
                          selected ? 'bg-primary/10' : 'hover:bg-primary/5',
                        )}
                      >
                        <SelectionDot selected={selected} />

                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-secondary">
                              {categoria.nome}
                            </span>
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                              {categoria.settoreNome}
                            </span>
                            {selectedServiceCount > 0 ? (
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                                {selectedServiceCount} servizi
                              </span>
                            ) : null}
                          </span>

                          <span className="mt-1 block line-clamp-1 text-xs text-muted-foreground">
                            {categoria.reason}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="rounded-[16px] border border-dashed p-4 text-center text-sm text-muted-foreground">
                  Nessuna categoria trovata. Prova con un altro termine oppure
                  sfoglia i settori qui sotto.
                </div>
              )}
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-[24px] border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-secondary">
            Sfoglia categorie e servizi
          </h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Apri un settore, seleziona le categorie che rappresentano la tua
            attività e poi scegli solo i servizi che offri davvero. Le categorie
            bastano già per ricevere richieste compatibili.
          </p>
        </div>

        <div className="space-y-2">
          {settori.map((settore) => {
            const isSectorExpanded = expandedSectorIds.includes(settore.id)
            const selectedInSector = settore.categorie.filter((categoria) =>
              selectedIds.has(categoria.id),
            ).length
            const sectorPanelId = `browse-sector-${settore.id}`

            return (
              <div
                key={settore.id}
                className="overflow-hidden rounded-[18px] border border-border bg-background"
              >
                <button
                  type="button"
                  onClick={() => toggleSectorAccordion(settore.id)}
                  aria-expanded={isSectorExpanded}
                  aria-controls={sectorPanelId}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-secondary">{settore.nome}</p>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                        {settore.categorie.length} categorie
                      </span>
                      {selectedInSector > 0 ? (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                          {selectedInSector} selezionate
                        </span>
                      ) : null}
                    </div>

                    {settore.descrizione ? (
                      <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                        {settore.descrizione}
                      </p>
                    ) : null}
                  </div>

                  <ChevronDown
                    className={cn(
                      'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                      isSectorExpanded && 'rotate-180',
                    )}
                  />
                </button>

                {isSectorExpanded ? (
                  <div id={sectorPanelId} className="border-t border-border p-3">
                    <div className="space-y-2">
                      {settore.categorie.map((categoriaBase) => {
                        const categoria = toCategoriaConSettore(settore, categoriaBase)
                        const selected = selectedIds.has(categoria.id)
                        const services = getCategoriaServices(categoria)
                        const selectedServiceIds =
                          selectedServicesByCategory.get(categoria.id) ?? []
                        const isCategoryExpanded =
                          expandedBrowseCategoryIds.includes(categoria.id)
                        const categoryPanelId = `browse-category-${categoria.id}`
                        const interventi = interventiByCategoria[categoria.id] ?? []

                        return (
                          <div
                            key={categoria.id}
                            className={cn(
                              'overflow-hidden rounded-[16px] border transition-colors',
                              selected
                                ? 'border-primary/30 bg-primary/5'
                                : 'border-border bg-card',
                            )}
                          >
                            <div className="grid gap-2 px-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                              <button
                                type="button"
                                onClick={() => toggleCategoria(categoria)}
                                className="flex min-w-0 items-start gap-3 text-left"
                              >
                                <SelectionDot selected={selected} />

                                <span className="min-w-0">
                                  <span className="flex flex-wrap items-center gap-2">
                                    <span className="font-medium text-secondary">
                                      {categoria.nome}
                                    </span>

                                    {selected ? (
                                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                                        Selezionata
                                      </span>
                                    ) : null}

                                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                                      {selectedServiceIds.length}/{services.length} servizi
                                    </span>
                                  </span>

                                  <span className="mt-1 block line-clamp-1 text-xs text-muted-foreground">
                                    {interventi.length > 0
                                      ? `Riceverai: ${buildShortList(interventi, 3)}`
                                      : categoria.descrizione ?? categoria.settoreNome}
                                  </span>
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={() => toggleBrowseCategory(categoria.id)}
                                aria-expanded={isCategoryExpanded}
                                aria-controls={categoryPanelId}
                                className="inline-flex w-fit items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-primary/40 hover:text-primary"
                              >
                                Servizi
                                <ChevronDown
                                  className={cn(
                                    'h-3.5 w-3.5 transition-transform',
                                    isCategoryExpanded && 'rotate-180',
                                  )}
                                />
                              </button>
                            </div>

                            {isCategoryExpanded ? (
                              <div
                                id={categoryPanelId}
                                className="border-t border-border px-3 pb-3 pt-3"
                              >
                                {services.length > 0 ? (
                                  <>
                                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                      <p className="text-xs font-medium text-muted-foreground">
                                        I servizi sono opzionali: selezionali solo
                                        se vuoi un matching più preciso.
                                      </p>

                                      <div className="flex gap-2">
                                        <button
                                          type="button"
                                          onClick={() => selectAllServices(categoria)}
                                          className="text-xs font-semibold text-primary hover:underline"
                                        >
                                          Tutti
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => clearCategoryServices(categoria)}
                                          className="text-xs font-semibold text-muted-foreground hover:text-secondary hover:underline"
                                        >
                                          Svuota
                                        </button>
                                      </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                      {services.map((servizio) => {
                                        const active = selectedServices.has(servizio.id)

                                        return (
                                          <button
                                            key={servizio.id}
                                            type="button"
                                            onClick={() =>
                                              toggleServiceForCategoria(
                                                categoria,
                                                servizio.id,
                                              )
                                            }
                                            aria-pressed={active}
                                            className={cn(
                                              'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                                              active
                                                ? 'border-primary bg-primary text-primary-foreground'
                                                : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-secondary',
                                            )}
                                          >
                                            {servizio.nome}
                                          </button>
                                        )
                                      })}
                                    </div>
                                  </>
                                ) : (
                                  <p className="text-sm text-muted-foreground">
                                    Nessun servizio configurabile per questa categoria.
                                  </p>
                                )}
                              </div>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </section>

      {selectedCategories.length > 0 ? (
        <section className="rounded-[24px] border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-secondary">
              Categorie selezionate
            </h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Queste categorie determinano le richieste compatibili che potrai
              ricevere. I servizi selezionati affinano la precisione.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {selectedCategories.map((categoria) => {
              const selectedServiceCount =
                selectedServicesByCategory.get(categoria.id)?.length ?? 0

              return (
                <button
                  key={categoria.id}
                  type="button"
                  onClick={() => removeCategoria(categoria)}
                  className="inline-flex items-center gap-2 rounded-full bg-background px-3 py-1.5 text-xs font-medium text-secondary ring-1 ring-border transition hover:bg-muted"
                >
                  {categoria.nome}
                  {selectedServiceCount > 0 ? (
                    <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                      {selectedServiceCount}
                    </span>
                  ) : null}
                  <X className="h-3 w-3" />
                </button>
              )
            })}
          </div>
        </section>
      ) : (
        <section className="rounded-[24px] border border-dashed border-border bg-card p-6 text-center">
          <p className="text-sm font-medium text-secondary">
            Nessuna categoria selezionata
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cerca sopra oppure apri un settore per scegliere le categorie della
            tua attività.
          </p>
        </section>
      )}

      {selectedCategories.length > 0 ? (
        <section className="rounded-[24px] border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-secondary">
              Riepilogo servizi specifici
            </h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Puoi lasciarli vuoti: riceverai comunque richieste per le categorie
              selezionate.
            </p>
          </div>

          <div className="space-y-2">
            {selectedCategories.map((categoria) => {
              const services = getCategoriaServices(categoria)
              const selectedServiceIds =
                selectedServicesByCategory.get(categoria.id) ?? []
              const isExpanded = expandedServiceCategoryIds.includes(categoria.id)
              const panelId = `company-services-${categoria.id}`

              return (
                <div
                  key={categoria.id}
                  className="overflow-hidden rounded-[18px] border border-border bg-background"
                >
                  <button
                    type="button"
                    onClick={() => toggleServiceAccordion(categoria.id)}
                    aria-expanded={isExpanded}
                    aria-controls={panelId}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-secondary">{categoria.nome}</p>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                          {selectedServiceIds.length}/{services.length} servizi
                        </span>
                      </div>
                    </div>

                    <ChevronDown
                      className={cn(
                        'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                        isExpanded && 'rotate-180',
                      )}
                    />
                  </button>

                  {isExpanded ? (
                    <div id={panelId} className="border-t border-border px-4 pb-4 pt-3">
                      {services.length > 0 ? (
                        <>
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-medium text-muted-foreground">
                              Seleziona solo i servizi che vuoi evidenziare.
                            </p>

                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => selectAllServices(categoria)}
                                className="text-xs font-semibold text-primary hover:underline"
                              >
                                Seleziona tutti
                              </button>
                              <button
                                type="button"
                                onClick={() => clearCategoryServices(categoria)}
                                className="text-xs font-semibold text-muted-foreground hover:text-secondary hover:underline"
                              >
                                Svuota
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {services.map((servizio) => {
                              const active = selectedServices.has(servizio.id)

                              return (
                                <button
                                  key={servizio.id}
                                  type="button"
                                  onClick={() =>
                                    toggleServiceForCategoria(categoria, servizio.id)
                                  }
                                  aria-pressed={active}
                                  className={cn(
                                    'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                                    active
                                      ? 'border-primary bg-primary text-primary-foreground'
                                      : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-secondary',
                                  )}
                                >
                                  {servizio.nome}
                                </button>
                              )
                            })}
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Nessun servizio configurabile per questa categoria.
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </section>
      ) : null}

      {error ? (
        <div className="rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      ) : null}

      <div className="sticky bottom-4 z-10 rounded-[24px] border border-border bg-background/95 p-3 shadow-lg backdrop-blur">
        <Button type="submit" className="w-full" disabled={update.isPending}>
          {update.isPending ? 'Salvataggio...' : 'Salva modifiche'}
        </Button>
      </div>
    </form>
  )
}

function SelectionDot({ selected }: { selected: boolean }) {
  return (
    <span
      className={cn(
        'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
        selected
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-muted-foreground/30 bg-card',
      )}
    >
      {selected ? <Check className="h-3.5 w-3.5" /> : null}
    </span>
  )
}