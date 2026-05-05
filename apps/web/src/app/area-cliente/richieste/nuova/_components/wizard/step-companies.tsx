'use client'

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

  return (
    <div className="space-y-4">
      <h2 className="text-secondary text-lg font-semibold">
        Scegli un professionista (opzionale)
      </h2>

      <p className="text-muted-foreground text-sm">
        Puoi inviare la richiesta a tutti oppure selezionare un professionista specifico.
      </p>

      {isLoading && <p className="text-sm">Caricamento aziende...</p>}

      {!isLoading && companies.length === 0 && (
        <p className="text-muted-foreground text-sm">
          Nessuna azienda trovata per questa richiesta. Continuerai nel marketplace.
        </p>
      )}

      <div className="space-y-3">
        {companies.map((company: CompanyPreview) => {
          const isSelected = selectedCompanyId === company.id

          return (
            <button
              key={company.id}
              type="button"
              onClick={() => {
                setSelectedCompanyId(isSelected ? null : company.id)
              }}
              className={`w-full rounded-xl border p-4 text-left transition ${
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-primary/40'
              }`}
            >
              <div className="flex justify-between gap-4">
                <div>
                  <p className="text-secondary font-semibold">
                    {company.ragioneSociale}
                  </p>

                  <p className="text-muted-foreground text-xs">
                    {company.city ?? 'Zona non indicata'}
                    {company.province ? ` (${company.province})` : ''}
                  </p>
                </div>

                {company.showcaseTier && (
                  <span className="text-primary text-xs font-semibold">
                    {company.showcaseTier}
                  </span>
                )}
              </div>

              {company.avgRating !== null && (
                <p className="mt-2 text-xs">
                  Valutazione {company.avgRating} ({company.reviewCount} recensioni)
                </p>
              )}

              {company.distanceKm !== null && company.distanceKm !== undefined && (
                <p className="text-muted-foreground mt-1 text-[11px]">
                  {company.distanceKm.toFixed(1)} km di distanza
                </p>
              )}
            </button>
          )
        })}
      </div>

      <div className="pt-4">
        <button
          type="button"
          onClick={onSubmit}
          className="primary-pill px-5 py-3 text-sm font-semibold"
        >
          Continua
        </button>
      </div>
    </div>
  )
}