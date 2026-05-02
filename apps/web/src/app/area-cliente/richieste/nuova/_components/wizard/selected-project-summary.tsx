'use client'

import type { Intervento } from './types'

interface SelectedProjectSummaryProps {
  selectedIntervento: Intervento | null
  selectedServizioNome?: string | null
  selectedCategoriaNome?: string | null
}

export function SelectedProjectSummary({
  selectedIntervento,
  selectedServizioNome,
  selectedCategoriaNome,
}: SelectedProjectSummaryProps) {
  if (!selectedIntervento && !selectedServizioNome) {
    return null
  }

  return (
    <div className="space-y-3">
      {selectedIntervento && (
        <div className="rounded-[22px] border border-primary/20 bg-primary/5 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">
            Hai selezionato
          </p>
          <p className="mt-1 text-base font-semibold text-secondary">
            {selectedIntervento.nome}
          </p>
          {selectedIntervento.descrizione && (
            <p className="muted-copy mt-2 text-sm leading-6">
              {selectedIntervento.descrizione}
            </p>
          )}
        </div>
      )}

      {selectedServizioNome && (
        <div className="rounded-[22px] border border-primary/20 bg-primary/5 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">
            Servizio selezionato
          </p>
          <p className="mt-1 text-base font-semibold text-secondary">
            {selectedServizioNome}
          </p>

          {selectedCategoriaNome && (
            <p className="muted-copy mt-2 text-sm leading-6">
              Professionista:{' '}
              <span className="font-medium text-secondary">{selectedCategoriaNome}</span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}