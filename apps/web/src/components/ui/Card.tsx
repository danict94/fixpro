import * as React from 'react'
import { Card as BaseCard, cn } from '@fixpro/ui'

export type CardProps = React.HTMLAttributes<HTMLDivElement>

export function Card({ className, ...props }: CardProps) {
  return (
    <BaseCard
      className={cn(
        'rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm transition-all duration-150 hover:shadow-md',
        className,
      )}
      {...props}
    />
  )
}
