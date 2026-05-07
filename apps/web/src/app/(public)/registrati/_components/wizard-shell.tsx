'use client'

import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle, cn } from '@fixpro/ui'
import { STEPS } from './wizard-constants'
import type { Role } from './wizard-types'

interface WizardShellProps {
  role: Role
  step: number
  formStep: number
  onBack: () => void
  children: ReactNode
}

const FORM_STEPS: Record<Role, string[]> = {
  CLIENT: ['Dati', 'Sicurezza', 'Conferma'],
  COMPANY: ['Dati', 'Dati azienda', 'Conferma'],
}

export function WizardShell({ role, step, formStep, onBack, children }: WizardShellProps) {
  const progressSteps = step === 0 ? FORM_STEPS[role] : STEPS
  const currentProgressStep = step === 0 ? formStep : step

  return (
    <div className="space-y-4">
      <Card className="surface-card overflow-hidden border-0 shadow-none">
        <CardHeader className="space-y-5 px-6 py-6 sm:px-8">
          <button
            type="button"
            onClick={onBack}
            className="secondary-link w-fit text-sm"
            aria-label="Cambia tipo account"
          >
            {'<-'} Indietro
          </button>

          <div className="space-y-2 text-center">
            <CardTitle className="text-secondary text-2xl font-semibold sm:text-[30px]">
              {role === 'CLIENT' ? 'Registrati come cliente' : 'Registrati come impresa'}
            </CardTitle>

            <p className="muted-copy mx-auto max-w-[620px] text-sm leading-6">
              {role === 'CLIENT'
                ? "Completa i dati, verifica il telefono e attiva l'account."
                : "Pochi dati ora: categoria professionale e zona. I servizi specifici li completi dopo l'accesso."}
            </p>
          </div>
        </CardHeader>
      </Card>

      <Card className="surface-card border-0 shadow-none">
        <CardContent className="px-4 py-4">
          <RegistrationProgress steps={progressSteps} current={currentProgressStep} />
        </CardContent>
      </Card>

      <Card key={step} className="surface-card border-0 shadow-none">
        <CardContent className="px-6 py-6 sm:px-8 sm:py-8">{children}</CardContent>
      </Card>
    </div>
  )
}

function RegistrationProgress({ steps, current }: { steps: string[]; current: number }) {
  return (
    <nav aria-label="Progressione registrazione" className="w-full">
      <ol className="flex items-start">
        {steps.map((label, index) => {
          const isCompleted = index < current
          const isActive = index === current
          const isLast = index === steps.length - 1

          return (
            <li
              key={label}
              className={cn('flex min-w-0 items-start', isLast ? 'shrink-0' : 'flex-1')}
            >
              <div className="flex w-[72px] shrink-0 flex-col items-center gap-1.5 text-center sm:w-28">
                <span
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full border bg-background text-sm font-semibold transition duration-200',
                    isCompleted && 'border-primary text-primary',
                    isActive && 'border-primary text-primary ring-4 ring-primary/10',
                    !isCompleted && !isActive && 'border-border text-muted-foreground',
                  )}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {index + 1}
                </span>

                <span
                  className={cn(
                    'text-[11px] leading-tight font-medium sm:text-xs',
                    isActive || isCompleted ? 'text-secondary' : 'text-muted-foreground',
                  )}
                >
                  {label}
                </span>
              </div>

              {!isLast && (
                <div className="relative mt-[18px] h-px flex-1 overflow-hidden bg-border">
                  <div
                    className={cn(
                      'h-px bg-primary transition-all duration-300',
                      index < current ? 'w-full' : 'w-0',
                    )}
                  />
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
