import * as React from 'react'
import { Check } from 'lucide-react'
import { cn } from '../lib/cn'

export interface StepIndicatorProps {
  steps: string[]
  /** Indice dello step corrente (0-based) */
  current: number
  className?: string
}

export function StepIndicator({ steps, current, className }: StepIndicatorProps) {
  return (
    <nav aria-label="Progressione registrazione" className={cn('w-full', className)}>
      <ol className="flex items-center justify-between">
        {steps.map((label, i) => {
          const isCompleted = i < current
          const isActive = i === current
          const isLast = i === steps.length - 1

          return (
            <li key={label} className={cn('flex flex-1 items-center', !isLast && 'after:content-[""] after:flex-1 after:border-t after:border-border after:mx-2 sm:after:mx-4')}>
              <div className="flex flex-col items-center gap-1.5">
                {/* Cerchio con numero o check */}
                <span
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors duration-150',
                    isCompleted && 'bg-primary text-primary-foreground',
                    isActive && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                    !isCompleted && !isActive && 'bg-muted text-muted-foreground',
                  )}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </span>

                {/* Label step */}
                <span
                  className={cn(
                    'hidden sm:block text-xs font-medium text-center whitespace-nowrap',
                    isActive ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {label}
                </span>
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
