'use client'

import { CheckCircle2 } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'

type CompanyPreview = {
  id: string
  slug: string
  ragioneSociale: string
  city: string | null
  province: string | null
  avgRating: number | null
  reviewCount: number
  showcaseTier: string | null
  distanceKm?: number | null
}

type StepCompaniesProps = {
  interventoId: string
  categoriaId: string
  lat: number | null
  lng: number | null
  province: string
  selectedCompanyId: string | null
  setSelectedCompanyId: (id: string | null) => void
  onSubmit: () => void
}

export function StepCompanies({
  interventoId,
  categoriaId,
  lat,
  lng,
  province,
  selectedCompanyId,
  setSelectedCompanyId,
  onSubmit,
}: StepCompaniesProps) {
  const { data, isLoading } = trpc.matching.previewCompanies.useQuery(
    {
      interventoId,
      categoriaId: categoriaId || undefined,
      province: province || undefined,
      lat: lat ?? undefined,
      lng: lng ?? undefined,
    },
    {
      enabled: Boolean(interventoId),
    },
  )

  const companies: CompanyPreview[] = data ?? []
  const selectedCompany = companies.find((company) => company.id === selectedCompanyId) ?? null

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h2 className="text-secondary text-lg font-semibold">
          Scegli un professionista
        </h2>

        <p className="text-muted-foreground text-sm leading-relaxed">
          Puoi selezionare una delle imprese disponibili oppure continuare nel marketplace.
        </p>
      </div>

      {selectedCompany && (
        <div className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 stroke-primary" strokeWidth={2} />
            <p className="text-sm font-medium text-secondary">
              Hai selezionato {selectedCompany.ragioneSociale}
            </p>
          </div>
        </div>
      )}

      {isLoading && (
        <p className="text-muted-foreground text-sm">
          Caricamento aziende...
        </p>
      )}

      {!isLoading && companies.length === 0 && (
        <p className="text-muted-foreground text-sm">
          Nessuna azienda trovata per questa richiesta. Continuerai nel marketplace.
        </p>
      )}

      <div className="space-y-3">
        {companies.map((company) => {
          const isSelected = selectedCompanyId === company.id

          return (
            <button
              key={company.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setSelectedCompanyId(isSelected ? null : company.id)}
              className={`w-full rounded-xl border p-4 text-left transition ${
                isSelected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                  : 'border-border bg-background hover:border-primary/40 hover:bg-muted/30'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-secondary font-semibold">
                      {company.ragioneSociale}
                    </p>

                    {isSelected && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                        Selezionata
                      </span>
                    )}
                  </div>

                  <p className="text-muted-foreground text-xs">
                    {company.city ?? 'Zona non indicata'}
                    {company.province ? ` (${company.province})` : ''}
                  </p>
                </div>

                {company.showcaseTier && (
                  <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    {company.showcaseTier}
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {company.avgRating !== null && (
                  <span>
                    Valutazione {company.avgRating} · {company.reviewCount} recensioni
                  </span>
                )}

                {company.distanceKm !== null && company.distanceKm !== undefined && (
                  <span>
                    {company.distanceKm.toFixed(1)} km
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onSubmit}
          className="primary-pill px-5 py-3 text-sm font-semibold"
        >
          {selectedCompany
            ? `Continua con ${selectedCompany.ragioneSociale}`
            : 'Continua nel marketplace'}
        </button>

        {selectedCompany && (
          <button
            type="button"
            onClick={() => setSelectedCompanyId(null)}
            className="text-muted-foreground text-sm font-medium hover:text-secondary"
          >
            Rimuovi selezione
          </button>
        )}
      </div>
    </div>
  )
}