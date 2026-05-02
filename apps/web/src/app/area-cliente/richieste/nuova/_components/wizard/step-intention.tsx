'use client'

import type { Dispatch, FormEventHandler, SetStateAction } from 'react'
import { Button } from '@fixpro/ui'

interface StepIntentionProps {
  error: string | null
  onSubmit: FormEventHandler<HTMLFormElement>
  intention: 'YES' | 'MAYBE' | 'INFO_ONLY' | ''
  setIntention: Dispatch<SetStateAction<'YES' | 'MAYBE' | 'INFO_ONLY' | ''>>
}

export function StepIntention({
  error,
  onSubmit,
  intention,
  setIntention,
}: StepIntentionProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="surface-section space-y-5 px-5 py-5 sm:px-6">
        <div>
          <p className="text-sm font-semibold text-secondary">Qual è il tuo obiettivo?</p>
          <p className="muted-copy mt-1 text-sm">
            Ci aiuta a far capire ai professionisti quanto sei vicino alla decisione.
          </p>
        </div>
        <div className="space-y-2">
          {([
            { value: 'YES', label: 'Sì, dopo aver confrontato i professionisti' },
            { value: 'MAYBE', label: 'Non ne sono ancora sicuro/a, dipende dalle informazioni che ottengo' },
            { value: 'INFO_ONLY', label: 'No, cerco solo informazioni' },
          ] as const).map(({ value, label }) => (
            <label
              key={value}
              className={`flex cursor-pointer items-start gap-3 rounded-[18px] border px-4 py-3 text-sm transition-all duration-150
                ${intention === value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-secondary hover:border-primary/50'
                }`}
            >
              <input
                type="radio"
                name="intention"
                value={value}
                checked={intention === value}
                onChange={() => setIntention(value)}
                className="sr-only"
              />
              <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-150 ${intention === value ? 'border-primary' : 'border-muted-foreground'}`}>
                {intention === value && <span className="h-2 w-2 rounded-full bg-primary" />}
              </span>
              {label}
            </label>
          ))}
        </div>
      </div>

      {error && <p className="rounded-[18px] border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger" role="alert">{error}</p>}
      <Button type="submit" className="primary-pill h-11 w-full text-sm font-semibold">Continua</Button>
    </form>
  )
}
