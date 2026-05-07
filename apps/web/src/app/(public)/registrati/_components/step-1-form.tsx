'use client'

import { useEffect, useMemo, useState, type FormEvent, type MouseEvent, type ReactNode } from 'react'
import { Check, Search, X } from 'lucide-react'
import {
  AddressAutocomplete,
  Button,
  Input,
  cn,
  type AddressResult,
} from '@fixpro/ui'
import { MAX_ONBOARDING_CATEGORIES } from './wizard-constants'
import { buildSuggestions } from './profession-suggestions'
import type { Role, SelectedCategoria } from './wizard-types'
import { normalizePhone } from './wizard-utils'

interface Step1Props {
  role: Role
  allCategories: SelectedCategoria[]
  selectedCategories: SelectedCategoria[]
  categoriaIds: string[]
  city: string
  radiusKm: number
  mapsApiKey: string
  onToggleCategory: (categoriaId: string) => void
  nome: string
  onNome: (v: string) => void
  cognome: string
  onCognome: (v: string) => void
  email: string
  onEmail: (v: string) => void
  telefono: string
  onTelefono: (v: string) => void
  password: string
  onPassword: (v: string) => void
  confermaPassword: string
  onConfermaPassword: (v: string) => void
  ragioneSociale: string
  onRagioneSociale: (v: string) => void
  partitaIva: string
  onPartitaIva: (v: string) => void
  onCity: (value: string) => void
  onRadiusKm: (value: number) => void
  onAddressSelect: (result: AddressResult) => void
  error: string | null
  loading: boolean
  onSubmit: (e: FormEvent) => void
  onFormStepChange?: (step: number) => void
}

export function Step1Form({
  role,
  allCategories,
  selectedCategories,
  categoriaIds,
  city,
  radiusKm,
  mapsApiKey,
  onToggleCategory,
  nome,
  onNome,
  cognome,
  onCognome,
  email,
  onEmail,
  telefono,
  onTelefono,
  password,
  onPassword,
  confermaPassword,
  onConfermaPassword,
  ragioneSociale,
  onRagioneSociale,
  partitaIva,
  onPartitaIva,
  onCity,
  onRadiusKm,
  onAddressSelect,
  error,
  loading,
  onSubmit,
  onFormStepChange,
}: Step1Props) {
  const [formStep, setFormStep] = useState(0)
  const [professionQuery, setProfessionQuery] = useState('')
  const [professionFocused, setProfessionFocused] = useState(false)

  const totalFormSteps = 3
  const isCompany = role === 'COMPANY'
  const isLastFormStep = formStep === totalFormSteps - 1
  const phaseLabel = `Fase ${formStep + 1} di ${totalFormSteps}`

  const showSuggestions = role === 'COMPANY' && (professionFocused || professionQuery.trim().length > 0)

  const suggestions = useMemo(
    () =>
      buildSuggestions({
        query: professionQuery,
        categories: allCategories,
        selectedIds: categoriaIds,
      }),
    [allCategories, categoriaIds, professionQuery],
  )

  const accountReady =
    nome.trim().length > 0 &&
    cognome.trim().length > 0 &&
    email.trim().length > 0 &&
    telefono.trim().length > 0

  const companyStepReady =
    ragioneSociale.trim().length > 0 &&
    partitaIva.trim().length > 0 &&
    city.trim().length > 0 &&
    categoriaIds.length > 0

  const securityReady = password.trim().length > 0 && confermaPassword.trim().length > 0

  const canContinue =
    formStep === 0 ? accountReady : formStep === 1 ? (isCompany ? companyStepReady : securityReady) : true

  const canSubmit = isCompany ? securityReady : accountReady && securityReady

  useEffect(() => {
    onFormStepChange?.(formStep)
  }, [formStep, onFormStepChange])

  function handlePreviousStep() {
    setFormStep((current) => Math.max(current - 1, 0))
  }

  function handleNextStep(event: MouseEvent<HTMLButtonElement>) {
    if (!event.currentTarget.form?.reportValidity()) return
    if (!canContinue) return

    setFormStep((current) => Math.min(current + 1, totalFormSteps - 1))
  }

  function handleSuggestionClick(categoriaId: string) {
    onToggleCategory(categoriaId)

    if (categoriaIds.length + 1 >= MAX_ONBOARDING_CATEGORIES && !categoriaIds.includes(categoriaId)) {
      setProfessionFocused(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 pb-24">
      {formStep === 0 && (
        <section className="rounded-[24px] border border-border bg-card p-4 sm:p-5">
          <SectionHeader
            title="Account"
            description="Dati essenziali per creare e verificare il profilo."
            stepLabel={phaseLabel}
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Nome" htmlFor="nome">
              <Input
                id="nome"
                value={nome}
                onChange={(event) => onNome(event.target.value)}
                required
                placeholder="Mario"
                className="h-10 rounded-full"
              />
            </Field>

            <Field label="Cognome" htmlFor="cognome">
              <Input
                id="cognome"
                value={cognome}
                onChange={(event) => onCognome(event.target.value)}
                required
                placeholder="Rossi"
                className="h-10 rounded-full"
              />
            </Field>

            <Field label="Email" htmlFor="email" className="sm:col-span-2">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => onEmail(event.target.value)}
                required
                placeholder="mario@esempio.it"
                autoComplete="email"
                className="h-10 rounded-full"
              />
            </Field>

            <Field label="Telefono" htmlFor="telefono" className="sm:col-span-2">
              <Input
                id="telefono"
                type="tel"
                value={telefono}
                onChange={(event) => onTelefono(event.target.value)}
                required
                placeholder="333 1234567"
                autoComplete="tel"
                className="h-10 rounded-full"
              />
              <p className="muted-copy text-xs">
                {telefono.replace(/[\s\-().]/g, '').length >= 4 ? (
                  <>
                    Verrà usato:{' '}
                    <span className="font-medium text-secondary">{normalizePhone(telefono)}</span>
                  </>
                ) : (
                  'Puoi inserire il numero con o senza prefisso.'
                )}
              </p>
            </Field>
          </div>
        </section>
      )}

      {isCompany && formStep === 1 && (
        <section className="rounded-[24px] border border-border bg-card p-4 sm:p-5">
          <SectionHeader
            title="Dati azienda"
            description="Profilo professionale, zona di lavoro e categorie per ricevere richieste pertinenti."
            stepLabel={phaseLabel}
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Ragione sociale" htmlFor="ragioneSociale">
              <Input
                id="ragioneSociale"
                value={ragioneSociale}
                onChange={(event) => onRagioneSociale(event.target.value)}
                required
                placeholder="Rossi Impianti S.r.l."
                className="h-10 rounded-full"
              />
            </Field>

            <Field label="Partita IVA" htmlFor="partitaIva">
              <Input
                id="partitaIva"
                value={partitaIva}
                onChange={(event) => onPartitaIva(event.target.value.replace(/\D/g, '').slice(0, 11))}
                required
                placeholder="12345678901"
                maxLength={11}
                inputMode="numeric"
                className="h-10 rounded-full"
              />
            </Field>

            <Field label="Zona di lavoro" className="sm:col-span-2">
              {mapsApiKey ? (
                <AddressAutocomplete
                  id="work-area"
                  apiKey={mapsApiKey}
                  placeholder="Cerca città o indirizzo operativo"
                  onAddressChange={onAddressSelect}
                />
              ) : (
                <Input
                  value={city}
                  onChange={(event) => onCity(event.target.value)}
                  placeholder="Inserisci la tua città operativa"
                  className="h-10 rounded-full"
                />
              )}
              <p className="muted-copy text-xs">
                {city ? `Riceverai richieste a partire da ${city}.` : 'Scegli la località operativa.'}
              </p>
            </Field>

            <div className="space-y-2 sm:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-secondary">Raggio di copertura</label>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  {radiusKm} km
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={200}
                step={5}
                value={radiusKm}
                onChange={(event) => onRadiusKm(Number(event.target.value))}
                className="w-full accent-primary"
              />
            </div>
          </div>

          <div className="mt-4 border-t border-border pt-4">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-secondary">Di cosa ti occupi?</h3>
                <p className="muted-copy mt-1 text-xs sm:text-sm">
                  Scrivi un mestiere o i lavori che fai. I servizi specifici li completi dopo il primo accesso.
                </p>
              </div>
              <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {categoriaIds.length}/{MAX_ONBOARDING_CATEGORIES} categorie
              </span>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={professionQuery}
                onFocus={() => setProfessionFocused(true)}
                onBlur={() => {
                  window.setTimeout(() => setProfessionFocused(false), 140)
                }}
                onChange={(event) => setProfessionQuery(event.target.value)}
                placeholder="Es. muratore, caldaie, bagni, infissi, traslochi..."
                className="h-10 rounded-full pl-10 pr-10"
                role="combobox"
                aria-expanded={showSuggestions}
                aria-controls="profession-suggestions"
                aria-autocomplete="list"
              />
              {professionQuery && (
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => setProfessionQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-secondary"
                  aria-label="Pulisci ricerca"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {showSuggestions && (
              <div
                id="profession-suggestions"
                role="listbox"
                className="mt-2 max-h-[220px] overflow-y-auto rounded-[16px] border border-border bg-background p-1.5 shadow-sm"
              >
                <p className="px-2 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {professionQuery.trim() ? 'Suggerimenti' : 'Professioni più cercate'}
                </p>

                {suggestions.length > 0 ? (
                  <div className="space-y-1">
                    {suggestions.map((categoria) => {
                      const selected = categoriaIds.includes(categoria.id)
                      const disabled = !selected && categoriaIds.length >= MAX_ONBOARDING_CATEGORIES

                      return (
                        <button
                          key={categoria.id}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          disabled={disabled}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => handleSuggestionClick(categoria.id)}
                          className={cn(
                            'flex w-full items-start gap-2 rounded-[12px] px-2.5 py-2 text-left transition-colors',
                            selected ? 'bg-primary/10' : 'hover:bg-primary/5',
                            disabled && 'cursor-not-allowed opacity-50 hover:bg-transparent',
                          )}
                        >
                          <span
                            className={cn(
                              'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                              selected
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-muted-foreground/30 bg-card',
                            )}
                          >
                            {selected && <Check className="h-3 w-3" />}
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                              <span className="truncate text-sm font-medium text-secondary">{categoria.nome}</span>
                              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                {categoria.settoreNome}
                              </span>
                            </span>
                            <span className="mt-0.5 block line-clamp-1 text-xs text-muted-foreground">
                              {categoria.reason}
                            </span>
                            {categoria.preview.length > 0 && (
                              <span className="mt-1 hidden flex-wrap gap-1 sm:flex">
                                {categoria.preview.slice(0, 2).map((servizio) => (
                                  <span
                                    key={servizio}
                                    className="rounded-full bg-muted/70 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                                  >
                                    {servizio}
                                  </span>
                                ))}
                              </span>
                            )}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="rounded-[12px] border border-dashed p-3 text-center text-sm text-muted-foreground">
                    Nessun suggerimento trovato. Prova con un mestiere o un lavoro diverso.
                  </div>
                )}
              </div>
            )}

            {selectedCategories.length > 0 && (
              <div className="mt-3 rounded-[14px] bg-muted/60 p-2.5">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Categorie scelte
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCategories.map((categoria) => (
                    <button
                      key={categoria.id}
                      type="button"
                      onClick={() => onToggleCategory(categoria.id)}
                      className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1 text-xs font-medium text-secondary ring-1 ring-border hover:bg-muted"
                    >
                      {categoria.nome}
                      <X className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {((isCompany && formStep === 2) || (!isCompany && formStep === 1)) && (
        <section className="rounded-[24px] border border-border bg-card p-4 sm:p-5">
          <SectionHeader
            title={isCompany ? 'Conferma' : 'Sicurezza'}
            description="Crea una password sicura per completare la registrazione."
            stepLabel={phaseLabel}
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Password" htmlFor="password">
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => onPassword(event.target.value)}
                required
                placeholder="Minimo 8 caratteri"
                autoComplete="new-password"
                className="h-10 rounded-full"
              />
            </Field>

            <Field label="Conferma password" htmlFor="confermaPassword">
              <Input
                id="confermaPassword"
                type="password"
                value={confermaPassword}
                onChange={(event) => onConfermaPassword(event.target.value)}
                required
                placeholder="Ripeti la password"
                autoComplete="new-password"
                className="h-10 rounded-full"
              />
            </Field>
          </div>
        </section>
      )}

      {!isCompany && formStep === 2 && (
        <section className="rounded-[24px] border border-border bg-card p-4 sm:p-5">
          <SectionHeader
            title="Conferma"
            description="Controlla i dati principali e continua con la verifica del telefono."
            stepLabel={phaseLabel}
          />

          <div className="feature-panel px-5 py-5">
            <p className="text-sm font-semibold text-secondary">Registrazione cliente pronta.</p>
            <div className="mt-3 space-y-1 text-sm">
              <p className="muted-copy">
                Nome:{' '}
                <span className="font-medium text-secondary">
                  {nome.trim()} {cognome.trim()}
                </span>
              </p>
              <p className="muted-copy">
                Email: <span className="font-medium text-secondary">{email}</span>
              </p>
              <p className="muted-copy">
                Telefono: <span className="font-medium text-secondary">{normalizePhone(telefono)}</span>
              </p>
            </div>
          </div>
        </section>
      )}

      {error && (
        <div className="rounded-[18px] border border-danger/20 bg-danger/10 px-4 py-3">
          <p className="text-sm font-medium text-danger" role="alert">
            {error}
          </p>
        </div>
      )}

      <div className="sticky bottom-4 z-20 rounded-[24px] border border-border bg-background/95 p-3 shadow-lg backdrop-blur">
        <div className={cn('grid gap-3', formStep > 0 && 'grid-cols-[auto_1fr]')}>
          {formStep > 0 && (
            <Button
              type="button"
              onClick={handlePreviousStep}
              className="rounded-full border border-border bg-card px-5 py-3 text-secondary shadow-none hover:bg-muted"
            >
              Indietro
            </Button>
          )}

          {isLastFormStep ? (
            <Button type="submit" className="primary-pill w-full px-5 py-3" disabled={loading || !canSubmit}>
              {loading ? 'Registrazione in corso...' : 'Continua'}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleNextStep}
              className="primary-pill w-full px-5 py-3"
              disabled={!canContinue}
            >
              Continua
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}

function SectionHeader({
  title,
  description,
  stepLabel,
}: {
  title: string
  description: string
  stepLabel: string
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 className="text-base font-semibold text-secondary">{title}</h3>
        <p className="muted-copy mt-1 text-sm">{description}</p>
      </div>
      <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
        {stepLabel}
      </span>
    </div>
  )
}

function Field({
  label,
  htmlFor,
  className,
  children,
}: {
  label: string
  htmlFor?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-secondary">
        {label}
      </label>
      {children}
    </div>
  )
}
