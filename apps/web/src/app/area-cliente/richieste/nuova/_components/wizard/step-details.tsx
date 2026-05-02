'use client'

import type { Dispatch, FormEventHandler, SetStateAction } from 'react'
import { Briefcase, Home } from 'lucide-react'
import { Button } from '@fixpro/ui'

interface StepDetailsProps {
  error: string | null
  onSubmit: FormEventHandler<HTMLFormElement>
  propertyType: 'RESIDENTIAL' | 'COMMERCIAL' | ''
  setPropertyType: Dispatch<SetStateAction<'RESIDENTIAL' | 'COMMERCIAL' | ''>>
  urgency: 'WITHIN_1_MONTH' | 'WITHIN_3_MONTHS' | 'WITHIN_6_MONTHS' | 'NO_PREFERENCE' | ''
  setUrgency: Dispatch<SetStateAction<'WITHIN_1_MONTH' | 'WITHIN_3_MONTHS' | 'WITHIN_6_MONTHS' | 'NO_PREFERENCE' | ''>>
}

export function StepDetails({
  error,
  onSubmit,
  propertyType,
  setPropertyType,
  urgency,
  setUrgency,
}: StepDetailsProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="surface-section space-y-5 px-5 py-5 sm:px-6">
        <div>
          <p className="text-sm font-semibold text-secondary">Dettagli utili per le imprese</p>
          <p className="muted-copy mt-1 text-sm">
            Specifica il contesto del lavoro e quando vorresti iniziare.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-secondary">Tipo di proprietà <span className="text-danger">*</span></p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {([
              { value: 'RESIDENTIAL', label: 'Abitazione privata', icon: Home },
              { value: 'COMMERCIAL', label: 'Spazio commerciale', icon: Briefcase },
            ] as const).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setPropertyType(value)}
                className={`flex flex-col items-center gap-2 rounded-[22px] border px-4 py-5 text-sm font-medium transition-all duration-150
                  ${propertyType === value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-white text-muted-foreground hover:border-primary/50 hover:text-secondary'
                  }`}
              >
                <Icon className="h-6 w-6" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-secondary">Data inizio lavori <span className="text-danger">*</span></p>
          <div className="space-y-2">
            {([
              { value: 'WITHIN_1_MONTH', label: 'Entro 1 mese' },
              { value: 'WITHIN_3_MONTHS', label: 'Entro 1-3 mesi' },
              { value: 'WITHIN_6_MONTHS', label: 'Entro 3-6 mesi' },
              { value: 'NO_PREFERENCE', label: 'Nessuna preferenza' },
            ] as const).map(({ value, label }) => (
              <label
                key={value}
                className={`flex cursor-pointer items-center gap-3 rounded-[18px] border px-4 py-3 text-sm transition-all duration-150
                  ${urgency === value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-secondary hover:border-primary/50'
                  }`}
              >
                <input
                  type="radio"
                  name="urgency"
                  value={value}
                  checked={urgency === value}
                  onChange={() => setUrgency(value)}
                  className="sr-only"
                />
                <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-150 ${urgency === value ? 'border-primary' : 'border-muted-foreground'}`}>
                  {urgency === value && <span className="h-2 w-2 rounded-full bg-primary" />}
                </span>
                {label}
              </label>
            ))}
          </div>
        </div>
      </div>

      {error && <p className="rounded-[18px] border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger" role="alert">{error}</p>}
      <Button type="submit" className="primary-pill h-11 w-full text-sm font-semibold">Continua</Button>
    </form>
  )
}
