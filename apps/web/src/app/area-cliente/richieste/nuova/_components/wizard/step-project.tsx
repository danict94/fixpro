'use client'

import { useId, useMemo, useRef, useState } from 'react'
import type { Dispatch, FormEventHandler, KeyboardEvent, ReactNode, SetStateAction } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@fixpro/ui'

import { CompatibleCategories } from './compatible-categories'
import { renderHighlightedText } from './project-highlight'
import { SelectedProjectSummary } from './selected-project-summary'

import type {
  CategoriaCompatibile,
  DimensionMode,
  Intervento,
  MeasurementType,
  SuggestedServizio,
  WorkType,
  WorkTypeOption,
} from './types'

interface StepProjectProps {
  error: string | null
  onSubmit: FormEventHandler<HTMLFormElement>
  coverageBanner: ReactNode
  selectedIntervento: Intervento | null
  selectedServizioNome?: string | null
  selectedCategoriaNome?: string | null
  suggestedInterventi: Intervento[]
  suggestedServizi: SuggestedServizio[]
  popularInterventi: Intervento[]
  selectedMacroGroupTitle?: string
  searchQuery: string
  setSearchQuery: (value: string) => void
  onSelectIntervento: (interventoId: string) => void
  onSelectServizio: (servizioId: string) => void
  workType: WorkType
  setWorkType: Dispatch<SetStateAction<WorkType>>
  categorieCompatibili: CategoriaCompatibile[]
  description: string
  setDescription: Dispatch<SetStateAction<string>>
  dimensionMode: DimensionMode
  surfaceMq: string
  setSurfaceMq: Dispatch<SetStateAction<string>>
  measurementType: MeasurementType
  setMeasurementType: Dispatch<SetStateAction<MeasurementType>>
  quantity: string
  setQuantity: Dispatch<SetStateAction<string>>
  WORK_TYPE_OPTIONS: WorkTypeOption[]
}

export function StepProject({
  error,
  onSubmit,
  coverageBanner,
  selectedIntervento,
  selectedServizioNome,
  selectedCategoriaNome,
  suggestedInterventi,
  suggestedServizi,
  popularInterventi,
  selectedMacroGroupTitle,
  searchQuery,
  setSearchQuery,
  onSelectIntervento,
  onSelectServizio,
  workType,
  setWorkType,
  categorieCompatibili,
  description,
  setDescription,
  dimensionMode,
  surfaceMq,
  setSurfaceMq,
  measurementType,
  setMeasurementType,
  quantity,
  setQuantity,
  WORK_TYPE_OPTIONS,
}: StepProjectProps) {
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const listboxId = useId()

  const hasSelectedProject = Boolean(selectedIntervento || selectedServizioNome)
  const showPopularFallback = searchQuery.trim() === '' && !hasSelectedProject
  const showSuggestions = searchQuery.trim().length > 0 && !hasSelectedProject
  const showNoResults =
    showSuggestions && suggestedInterventi.length === 0 && suggestedServizi.length === 0

  const suggestionItems = useMemo(
    () => [
      ...suggestedInterventi.map((intervento) => ({
        type: 'intervento' as const,
        id: intervento.id,
      })),
      ...suggestedServizi.map((servizio) => ({
        type: 'servizio' as const,
        id: servizio.id,
      })),
    ],
    [suggestedInterventi, suggestedServizi],
  )

  const activeSuggestionIndexSafe =
    suggestionItems.length > 0 ? Math.min(activeSuggestionIndex, suggestionItems.length - 1) : 0

  const activeSuggestion = suggestionItems[activeSuggestionIndexSafe] ?? null

  function selectActiveSuggestion() {
    if (!activeSuggestion) {
      const firstIntervento = suggestedInterventi[0]
      const firstServizio = suggestedServizi[0]

      if (firstIntervento) {
        onSelectIntervento(firstIntervento.id)
        return
      }

      if (firstServizio) {
        onSelectServizio(firstServizio.id)
      }

      return
    }

    if (activeSuggestion.type === 'intervento') {
      onSelectIntervento(activeSuggestion.id)
      return
    }

    onSelectServizio(activeSuggestion.id)
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!showSuggestions || suggestionItems.length === 0) {
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveSuggestionIndex((current) => (current + 1) % suggestionItems.length)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveSuggestionIndex((current) =>
        current === 0 ? suggestionItems.length - 1 : current - 1,
      )
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      selectActiveSuggestion()
      return
    }

    if (event.key === 'Escape') {
      setActiveSuggestionIndex(0)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {coverageBanner}

      <div className="surface-section space-y-5 px-5 py-5 sm:px-6">
        <div>
          <p className="text-sm font-semibold text-secondary">
            {selectedMacroGroupTitle && !hasSelectedProject
              ? 'Scegli il tipo di intervento'
              : 'Che tipo di lavoro devi affidare?'}
          </p>
          <p className="muted-copy mt-1 text-sm">
            {selectedMacroGroupTitle && !hasSelectedProject
              ? `Stai partendo da ${selectedMacroGroupTitle}. Seleziona l'intervento più vicino alla tua esigenza.`
              : 'Cerca il lavoro che ti serve e poi aggiungi i dettagli utili per ricevere risposte pertinenti.'}
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="intervento-search" className="text-sm font-medium text-secondary">
            Di cosa hai bisogno? <span className="text-danger">*</span>
          </label>

          <div className="relative">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id="intervento-search"
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Es. rifacimento bagno, perdita acqua, imbiancare casa..."
              className="flex h-12 w-full rounded-2xl border border-border bg-white pl-11 pr-4 text-sm text-secondary placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              autoComplete="off"
              role="combobox"
              aria-expanded={showSuggestions}
              aria-controls={showSuggestions ? listboxId : undefined}
              aria-activedescendant={
                activeSuggestion
                  ? `${activeSuggestion.type}-suggestion-${activeSuggestion.id}`
                  : undefined
              }
            />
          </div>

          <p className="muted-copy text-xs">
            Cerca per nome del lavoro, problema da risolvere o modo in cui lo descriveresti tu.
          </p>
        </div>

        {showSuggestions && (
          <div className="space-y-2">
            {!showNoResults ? (
              <div
                id={listboxId}
                role="listbox"
                className="space-y-2 rounded-[24px] border border-border bg-white p-3"
              >
                {suggestedInterventi.map((intervento, index) => {
                  const selected =
                    activeSuggestion?.type === 'intervento' && activeSuggestion.id === intervento.id

                  return (
                    <button
                      key={intervento.id}
                      id={`intervento-suggestion-${intervento.id}`}
                      type="button"
                      onClick={() => onSelectIntervento(intervento.id)}
                      onMouseEnter={() => setActiveSuggestionIndex(index)}
                      role="option"
                      aria-selected={selected}
                      className={`w-full rounded-[18px] border px-4 py-3 text-left transition ${
                        selected
                          ? 'border-primary/30 bg-primary/5'
                          : 'border-transparent bg-[#F6F7FB] hover:-translate-y-0.5 hover:border-primary/20 hover:bg-primary/5'
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-secondary">
                          {renderHighlightedText(intervento.nome, searchQuery)}
                        </p>
                        <span className="rounded-full bg-secondary/10 px-2.5 py-1 text-[11px] font-semibold text-secondary">
                          Intervento
                        </span>
                      </div>
                      <p className="muted-copy mt-1 line-clamp-2 text-xs leading-5">
                        {intervento.descrizione ?? 'Intervento disponibile su FixPro.'}
                      </p>
                    </button>
                  )
                })}

                {suggestedServizi.map((servizio, serviceIndex) => {
                  const index = suggestedInterventi.length + serviceIndex
                  const selected =
                    activeSuggestion?.type === 'servizio' && activeSuggestion.id === servizio.id

                  return (
                    <button
                      key={`servizio-${servizio.id}`}
                      id={`servizio-suggestion-${servizio.id}`}
                      type="button"
                      onClick={() => onSelectServizio(servizio.id)}
                      onMouseEnter={() => setActiveSuggestionIndex(index)}
                      role="option"
                      aria-selected={selected}
                      className={`w-full rounded-[18px] border px-4 py-3 text-left transition ${
                        selected
                          ? 'border-primary/30 bg-primary/5'
                          : 'border-transparent bg-[#F6F7FB] hover:-translate-y-0.5 hover:border-primary/20 hover:bg-primary/5'
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-secondary">
                          {renderHighlightedText(servizio.nome, searchQuery)}
                        </p>
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                          Servizio
                        </span>
                      </div>
                      <p className="muted-copy mt-1 line-clamp-2 text-xs leading-5">
                        {servizio.descrizione ??
                          `Servizio disponibile per ${servizio.categoriaNome}.`}
                      </p>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-[18px] border border-border bg-muted/40 px-4 py-4">
                <p className="text-sm font-semibold text-secondary">Non trovi quello che cerchi?</p>
                <p className="muted-copy mt-1 text-sm">
                  Prova con una parola più semplice oppure torna ai lavori più richiesti per
                  scegliere quello più vicino.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    inputRef.current?.focus()
                  }}
                  className="mt-3 text-sm font-semibold text-primary"
                >
                  Continua con descrizione libera
                </button>
              </div>
            )}
          </div>
        )}

        {showPopularFallback && (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-secondary">
                {selectedMacroGroupTitle
                  ? `Interventi disponibili per ${selectedMacroGroupTitle}`
                  : 'Oppure scegli tra i più richiesti'}
              </p>
              <p className="muted-copy mt-1 text-xs">
                {selectedMacroGroupTitle
                  ? 'Scegli una voce per continuare con una richiesta già orientata.'
                  : 'Seleziona uno dei lavori più frequenti per partire più velocemente.'}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {popularInterventi.map((intervento) => (
                <button
                  key={intervento.id}
                  type="button"
                  onClick={() => onSelectIntervento(intervento.id)}
                  className="rounded-[20px] border border-border bg-white px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-primary/20 hover:bg-primary/5"
                >
                  <p className="text-sm font-semibold text-secondary">{intervento.nome}</p>
                  <p className="muted-copy mt-1 line-clamp-2 text-xs leading-5">
                    {intervento.descrizione ?? 'Intervento disponibile su FixPro.'}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {hasSelectedProject && (
          <div className="space-y-5">
            <SelectedProjectSummary
              selectedIntervento={selectedIntervento}
              selectedServizioNome={selectedServizioNome}
              selectedCategoriaNome={selectedCategoriaNome}
            />

            <div className="surface-card border-0 px-5 py-5 shadow-none">
              <div className="mb-3">
                <p className="text-sm font-semibold text-secondary">
                  Come vuoi affrontare il lavoro?
                </p>
                <p className="muted-copy mt-1 text-sm">
                  Aiutaci a capire se cerchi un intervento mirato, una gestione completa o se
                  preferisci essere guidato.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {WORK_TYPE_OPTIONS.map(({ value, title, description, icon: Icon }) => {
                  const selected = workType === value

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setWorkType(value)}
                      className={`group flex w-full items-start gap-3 rounded-[22px] border p-4 text-left transition-all duration-200 ${
                        selected
                          ? 'scale-[1.01] border-primary bg-primary/10'
                          : 'border-border bg-white hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5'
                      }`}
                      aria-pressed={selected}
                    >
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors ${
                          selected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-primary/10 text-primary group-hover:bg-primary/15'
                        }`}
                      >
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-secondary">{title}</p>
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                              selected
                                ? 'border-primary bg-primary/10'
                                : 'border-muted-foreground/40'
                            }`}
                          >
                            {selected && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                          </span>
                        </div>
                        <p className="muted-copy mt-1 text-sm">{description}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <CompatibleCategories
              categorieCompatibili={categorieCompatibili}
              selectedCategoriaNome={selectedCategoriaNome}
            />

            <div className="space-y-1.5">
              <label htmlFor="description" className="text-sm font-medium text-secondary">
                Descrizione del lavoro <span className="text-danger">*</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Descrivi il lavoro nel dettaglio: cosa va fatto, stato attuale, materiali, accessibilità, tempistiche preferite..."
                maxLength={2000}
                rows={5}
                className="flex w-full resize-none rounded-2xl border border-border bg-white px-4 py-3 text-sm text-secondary placeholder:text-muted-foreground transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <p className="muted-copy text-right text-xs">{description.length}/2000</p>
            </div>

            {dimensionMode !== 'none' && (
              <div className="space-y-4 rounded-[22px] border border-border bg-white px-5 py-5">
                <div>
                  <p className="text-sm font-semibold text-secondary">
                    Dimensioni del lavoro, facoltativo ma consigliato
                  </p>
                  <p className="muted-copy mt-1 text-sm">
                    Indicando dimensioni o quantità aiuti i professionisti a darti risposte più
                    precise.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="surface-mq" className="text-sm font-medium text-secondary">
                      Superficie stimata
                    </label>
                    <input
                      id="surface-mq"
                      type="number"
                      min="0"
                      inputMode="decimal"
                      value={surfaceMq}
                      onChange={(event) => setSurfaceMq(event.target.value)}
                      placeholder="Es. 5, 20, 80"
                      className="flex h-11 w-full rounded-2xl border border-border bg-white px-4 py-2 text-sm text-secondary placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>

                  {dimensionMode === 'surface-and-quantity' && (
                    <div className="space-y-1.5">
                      <label
                        htmlFor="measurement-type"
                        className="text-sm font-medium text-secondary"
                      >
                        Tipo misura quantità
                      </label>
                      <select
                        id="measurement-type"
                        value={measurementType}
                        onChange={(event) =>
                          setMeasurementType(event.target.value as MeasurementType)
                        }
                        className="flex h-11 w-full rounded-2xl border border-border bg-white px-4 py-2 text-sm text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="mq">mq</option>
                        <option value="lineare">lineare</option>
                        <option value="elementi">elementi</option>
                      </select>
                    </div>
                  )}
                </div>

                {dimensionMode === 'surface-and-quantity' && (
                  <div className="space-y-1.5">
                    <label htmlFor="quantity" className="text-sm font-medium text-secondary">
                      Quantità stimata
                    </label>
                    <input
                      id="quantity"
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={quantity}
                      onChange={(event) => setQuantity(event.target.value)}
                      placeholder="Es. 1, 3, 10"
                      className="flex h-11 w-full rounded-2xl border border-border bg-white px-4 py-2 text-sm text-secondary placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <p
          className="rounded-[18px] border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger"
          role="alert"
        >
          {error}
        </p>
      )}

      <Button type="submit" className="primary-pill h-11 w-full text-sm font-semibold">
        Continua
      </Button>
    </form>
  )
}